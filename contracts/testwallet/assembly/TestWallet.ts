import {
  Arrays,
  System,
  Storage,
  Protobuf,
  value,
  Crypto,
  authority,
  Base58,
} from "@koinos/sdk-as";
import { wallet } from "./proto/wallet";

export const AUTHORIZE_CONTRACT_CALL_ENTRY_POINT = 0x10e5820f; // authorize_contract_call
export const TRANSFER_ENTRY_POINT = 0x27f576ca;
export const SET_AUTHORITY_CONTRACT_ENTRY_POINT = 0x052a4dbf;

export class TestWallet {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array;

  transferApproval: Storage.Obj<wallet.transfer_approval>;

  constructor() {
    this.contractId = System.getContractId();
    this.transferApproval = new Storage.Obj(
      this.contractId,
      1,
      wallet.transfer_approval.decode,
      wallet.transfer_approval.encode,
      null
    );
  }

  getSigners(): Array<Uint8Array> {
    const sigBytes =
      System.getTransactionField("signatures")!.message_value!.value!;
    const signatures = Protobuf.decode<value.list_type>(
      sigBytes,
      value.list_type.decode
    );
    const txId = System.getTransactionField("id")!.bytes_value!;

    const signers: Array<Uint8Array> = [];
    for (let i = 0; i < signatures.values.length; i++) {
      const publicKey = System.recoverPublicKey(
        signatures.values[i].bytes_value!,
        txId
      );
      const address = Crypto.addressFromPublicKey(publicKey!);
      signers.push(address);
    }
    return signers;
  }

  only_owner(): boolean {
    const signers = this.getSigners();
    for (let i = 0; i < signers.length; i += 1) {
      if (Arrays.equal(signers[i], this.contractId)) return true;
    }
    return false;
  }

  /**
   * Approve transfer of an NFT
   * @external
   */
  approve_transfer(args: wallet.transfer_approval): void {
    System.require(
      this.only_owner(),
      "approve_transfer not authorized by the owner"
    );
    this.transferApproval.put(args);
  }

  /**
   * Get current approval
   * @external
   * @readonly
   */
  get_approval(): wallet.transfer_approval {
    const transferApproval = this.transferApproval.get();
    if (!transferApproval) return new wallet.transfer_approval();
    return transferApproval;
  }

  /**
   * Remove approval
   * @external
   */
  remove_approval(): void {
    System.require(
      this.only_owner(),
      "remove_approval not authorized by the owner"
    );
    this.transferApproval.remove();
  }

  /**
   * Authorize contract call
   * @external
   */
  authorize_contract_call(
    args: authority.authorize_arguments
  ): authority.authorize_result {
    if (args.type != authority.authorization_type.contract_call) {
      System.log("type is not contract call");
      return new authority.authorize_result(false);
    }
    if (!args.call) {
      System.log("call arguments not defined");
      return new authority.authorize_result(false);
    }
    switch (args.call!.entry_point) {
      case TRANSFER_ENTRY_POINT: {
        if (!args.call!.data) {
          System.log("call data not defined");
          return new authority.authorize_result(false);
        }
        const caller = System.getCaller();
        const transferApproval = this.transferApproval.get();
        if (!transferApproval) {
          System.log("no transfer approval defined");
          return new authority.authorize_result(false);
        }
        if (!caller || !caller.caller) {
          System.log("caller not defined");
          return new authority.authorize_result(false);
        }
        if (!Arrays.equal(caller.caller, transferApproval.contract_id)) {
          System.log(
            `invalid caller. Received ${Base58.encode(
              caller.caller!
            )}. Expected ${Base58.encode(transferApproval.contract_id!)}`
          );
          return new authority.authorize_result(false);
        }
        const transferArgs = Protobuf.decode<wallet.transfer_args>(
          args.call!.data!,
          wallet.transfer_args.decode
        );
        if (!Arrays.equal(this.contractId, transferArgs.from)) {
          System.log(
            `invalid from. Received ${Base58.encode(
              transferArgs.from!
            )}. Expected ${Base58.encode(this.contractId)}`
          );
          return new authority.authorize_result(false);
        }
        if (!Arrays.equal(transferApproval.to, transferArgs.to)) {
          System.log(
            `invalid to. Received ${Base58.encode(
              transferArgs.to!
            )}. Expected ${Base58.encode(transferApproval.to!)}`
          );
          return new authority.authorize_result(false);
        }
        if (!Arrays.equal(transferApproval.token_id, transferArgs.token_id)) {
          System.log(
            `invalid token_id. Received ${Base58.encode(
              transferArgs.token_id!
            )}. Expected ${Base58.encode(transferApproval.token_id!)}`
          );
          return new authority.authorize_result(false);
        }
        this.transferApproval.remove();
        return new authority.authorize_result(true);
      }
      case SET_AUTHORITY_CONTRACT_ENTRY_POINT: {
        return new authority.authorize_result(true);
      }
      default: {
        System.log(`invalid entry point ${args.call!.entry_point}`);
        return new authority.authorize_result(false);
      }
    }
  }
}
