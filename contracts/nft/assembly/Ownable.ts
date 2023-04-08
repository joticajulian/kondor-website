import {
  System,
  Storage,
  authority,
  Arrays,
  Protobuf,
  value,
  Crypto,
} from "@koinos/sdk-as";
import { common } from "./proto/common";
import { nft } from "./proto/nft";

// make sure to not use this id in the contract childs
const OWNER_SPACE_ID = 100;

export class Ownable {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array;
  _owner: Storage.Obj<common.address>;

  constructor() {
    this.contractId = System.getContractId();
    this._owner = new Storage.Obj(
      this.contractId,
      OWNER_SPACE_ID,
      common.address.decode,
      common.address.encode,
      null
    );
  }

  // TODO: add this function to the SDK
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
    const owner = this._owner.get();
    if (!owner) {
      // any account can take the ownership at the beginning.
      // This means that the ownership must be set just
      // after the contract is uploaded
      return true;
    }

    /**
     * if the owner is the contract itself then check the
     * signatures (do not call System.checkAuthority to
     * avoid an infitine loop in case the contract has overriden
     * the authorize function)
     */
    if (Arrays.equal(owner.account, this.contractId)) {
      const signers = this.getSigners();
      for (let i = 0; i < signers.length; i += 1) {
        if (Arrays.equal(signers[i], this.contractId)) return true;
      }
      return false;
    }

    // call the authority of the owner
    return System.checkAuthority(
      authority.authorization_type.contract_call,
      owner.account!,
      this.callArgs!.args
    );
  }

  /**
   * Set owner
   * @external
   * @event collections.owner_event common.address
   */
  transfer_ownership(newOwner: common.address): void {
    System.require(this.only_owner(), "not authorized by the owner");
    const owner = this.owner();
    this._owner.put(newOwner);

    // event
    const ownerEvent = new nft.owner_event(owner.account!, newOwner.account!);
    const impacted = [owner.account!, newOwner.account!];

    System.event(
      "collections.owner_event",
      Protobuf.encode(ownerEvent, nft.owner_event.encode),
      impacted
    );
  }

  /**
   * Get owner
   * @external
   * @readonly
   */
  owner(): common.address {
    const owner = this._owner.get();
    if (!owner) return new common.address();
    return owner;
  }
}
