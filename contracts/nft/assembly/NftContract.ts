import { Arrays, System, authority, Storage, Protobuf } from "@koinos/sdk-as";
import { nft } from "./proto/nft";
import { common } from "./proto/common";
import { Ownable } from "./Ownable";

export const ONE_HUNDRED_PERCENT: u64 = 10000;

export class NftContract extends Ownable {
  callArgs: System.getArgumentsReturn | null;

  _name: string = "Kondor";
  _symbol: string = "KONDOR";
  _uri: string = "";

  supply: Storage.Obj<common.uint64>;

  _royalties: Storage.Obj<nft.royalties>;

  balances: Storage.Map<Uint8Array, common.uint64>;

  tokenOwners: Storage.Map<Uint8Array, common.address>;

  tokenApprovals: Storage.Map<Uint8Array, common.address>;

  operatorApprovals: Storage.Map<Uint8Array, common.boole>;

  ownerContracts: Storage.Map<Uint8Array, common.boole>;

  constructor() {
    super();
    this.supply = new Storage.Obj(
      this.contractId,
      1,
      common.uint64.decode,
      common.uint64.encode,
      () => new common.uint64(0)
    );
    this._royalties = new Storage.Obj(
      this.contractId,
      2,
      nft.royalties.decode,
      nft.royalties.encode,
      () => new nft.royalties()
    );

    this.balances = new Storage.Map(
      this.contractId,
      3,
      common.uint64.decode,
      common.uint64.encode,
      () => new common.uint64(0)
    );

    this.tokenOwners = new Storage.Map(
      this.contractId,
      4,
      common.address.decode,
      common.address.encode,
      () => new common.address()
    );

    this.tokenApprovals = new Storage.Map(
      this.contractId,
      5,
      common.address.decode,
      common.address.encode,
      () => new common.address()
    );

    this.operatorApprovals = new Storage.Map(
      this.contractId,
      6,
      common.boole.decode,
      common.boole.encode,
      () => new common.boole(false)
    );

    this.ownerContracts = new Storage.Map(
      this.contractId,
      7,
      common.boole.decode,
      common.boole.encode,
      () => new common.boole(false)
    );
  }

  /**
   * Get name of the NFT
   * @external
   * @readonly
   */
  name(): common.str {
    return new common.str(this._name);
  }

  /**
   * Get the symbol of the NFT
   * @external
   * @readonly
   */
  symbol(): common.str {
    return new common.str(this._symbol);
  }

  /**
   * Get URI of the NFT
   * @external
   * @readonly
   */
  uri(): common.str {
    return new common.str(this._uri);
  }

  /**
   * Get name, symbol and decimals
   * @external
   * @readonly
   */
  get_info(): nft.info {
    return new nft.info(this._name, this._symbol, this._uri);
  }

  /**
   * Get total supply
   * @external
   * @readonly
   */
  total_supply(): common.uint64 {
    return this.supply.get()!;
  }

  /**
   * Get royalties
   * @external
   * @readonly
   */
   royalties(): nft.royalties {
    return this._royalties.get()!;
  }

  /**
   * Set royalties
   * @external
   * @event collections.royalties_event nft.royalties
   */
  set_royalties(args: nft.royalties): void {
    System.require(this.only_owner(), "not authorized by the owner");
    const impacted: Uint8Array[] = [];
    let totalPercentage: u64 = 0;
    for (let i = 0; i < args.value.length; i += 1) {
      totalPercentage += args.value[i].percentage;
      impacted.push(args.value[i].address!)
      System.require(
        args.value[i].percentage <= ONE_HUNDRED_PERCENT &&
        totalPercentage <= ONE_HUNDRED_PERCENT,
        "the percentages for royalties exceeded 100%"
      );
    }
    this._royalties.put(args);
    System.event("collections.royalties_event", this.callArgs!.args, impacted);
  }

  /**
   * Get balance of an account
   * @external
   * @readonly
   */
  balance_of(args: nft.balance_of_args): common.uint64 {
    return this.balances.get(args.owner!)!;
  }

  /**
   * Get the owner of a token
   * @external
   * @readonly
   */
  owner_of(args: nft.token): common.address {
    return this.tokenOwners.get(args.token_id!)!;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  /**
   * Check if an account is approved to operate a token ID
   * @external
   * @readonly
   */
  get_approved(args: nft.token): common.address {
    return this.tokenApprovals.get(args.token_id!)!;
  }

  /**
   * Check if an account is approved to operate all tokens
   * owned by other account
   * @external
   * @readonly
   */
  is_approved_for_all(args: nft.is_approved_for_all_args): common.boole {
    const key = new Uint8Array(50);
    key.set(args.owner!, 0);
    key.set(args.operator!, 25);
    return this.operatorApprovals.get(key)!;
  }

  /**
   * Internal function to validate the authority of an operation.
   * This function replaces the koinos native function called
   * "System.requireAuthority()". And it introduces new features to
   * increase the security of the contract.
   * 
   * Why is this needed? let's take a look to the logic of
   * System.requireAuthority():
   * 
   * - If the user has a smart contract wallet (and if it was
   *   tagged to resolve contract calls) then that contract is called.
   * - Otherwise the system will check if the transaction was signed
   *   by the user. This second point is risky because the flow of contract
   *   calls could be: A -> B -> C -> D. The user approved the operation
   *   in "A", but he doesn't know what will happen in B, C, or D and his
   *   signature is still in the transaction. Then some malicious contract
   *   in the middle could take advantage of this point to steal the assets.
   * 
   * What changed in this check_authority function? It implements approvals
   * and checks who is the caller:
   * 
   * - If the user has a smart contract wallet (and if it was
   *   tagged to resolve contract calls) then that contract is called.
   * - If there is a caller (that is, if this operation was not triggered
   *   by the user itself but by some contract in the middle) it checks if
   *   this caller is approved by the user to perform this operation. Otherwise
   *   the transaction is rejected.
   * - If there is NO caller (that is, if this operation appears in the list
   *   of operation in the transaction, not called by some contract in the
   *   middle) then the contract will check if the transaction was signed
   *   by the user, or if it was signed by account approved by the user.
   * 
   * Note 1: The approvals are granted by the user by using "approve" and
   * "set_approva_for_all" functions.
   * 
   * Note 2: Currently there is no a system call to check if a contract has
   * a smart contract wallet or not. Then as a temporal solution, the user has
   * to call "set_authority_contract" to define that he uses a smart contract
   * wallet.
   */
  check_authority(account: Uint8Array, acceptOperators: boolean, acceptApprovals: boolean, token_id: Uint8Array): boolean {
    const caller = System.getCaller();

    // check if the account has a contract
    if (this.ownerContracts.get(account)!.value == true) {
      System.log("Account contract called to resolve the authority");
      const result = System.call(account, 0, Protobuf.encode(new authority.authorize_arguments(authority.authorization_type.contract_call, new authority.call_data(this.contractId, this.callArgs!.entry_point, caller.caller, this.callArgs!.args)), authority.authorize_arguments.encode));
      System.require(result.code != 0, "todo");
      return Protobuf.decode<common.boole>(result.res.object!, common.boole.decode).value;
    }

    const key = new Uint8Array(50);
    let approvedAddress: Uint8Array;

    // check if there is a caller (smart contract in the middle)
    if (caller.caller && caller.caller!.length > 0) {
      // check if the account is the caller
      if (Arrays.equal(account, caller.caller)) return true;

      if (acceptOperators) {
        // check if the caller is approved for all
        key.set(account, 0);
        key.set(caller.caller!, 25);
        if (this.operatorApprovals.get(key)!.value == true) return true;
      }
    
      if(acceptApprovals) {
        // check if the caller is approved
        approvedAddress = this.tokenApprovals.get(token_id)!.account!;
        if (Arrays.equal(approvedAddress, caller.caller)) {
          // clear temporal approval
          this.tokenApprovals.remove(token_id);
          return true;
        }
      }

      // the transaction has a caller but this caller is not
      // authorized, then the operation is rejected.
      return false;
    }

    // the account doesn't have a smart contract and there is no
    // caller, then the authority relies only in the signatures

    // check the signatures
    const signers = this.getSigners();
    for (let i = 0; i < signers.length; i += 1) {
      // check if the account is the signer
      if (Arrays.equal(account, signers[i])) return true;

      if (acceptOperators) {
        // check if the signer is approved for all
        key.set(signers[i], 25);
        if (this.operatorApprovals.get(key)!.value == true) return true;
      }

      if (acceptApprovals) {
        // check if the signer is approved
        if (Arrays.equal(approvedAddress, signers[i])) {
          // clear temporal approval
          this.tokenApprovals.remove(token_id);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Function to define if the user has a smart contract wallet or not
   * to resolve the authority when making transfers or burns. This contract
   * replaces allowances and signatures.
   * @external
   * @event set_authority_contract nft.set_authority_contract_args
   */
  set_authority_contract(args: nft.set_authority_contract_args):void {
    const isAuthorized = this.check_authority(args.account!, false, false, new Uint8Array(0));
    System.require(isAuthorized, "set_authority_contract operation not authorized");

    // test a call

    this.ownerContracts.put(args.account!, new common.boole(args.enabled));

    System.event(
      "set_authority_contract",
      this.callArgs!.args,
      [args.account!]
    )
  }

  /**
   * Grant permissions to other account to manage a specific Token owned
   * by the user. The user must approve only the accounts he trust.
   * @external
   * @event collections.token_approval_event nft.approve_args
   */
  approve(args: nft.approve_args): void {
    const approver = args.approver_address!;
    const to = args.to!;
    const tokenId = args.token_id!;

    const tokenOwner = this.tokenOwners.get(tokenId)!;
    System.require(Arrays.equal(tokenOwner.account, approver), "approver is not the owner");

    const isAuthorized = this.check_authority(approver, true, false, new Uint8Array(0));
    System.require(isAuthorized, "approval operation not authorized");

    this.tokenApprovals.put(tokenId, new common.address(to));
    
    const impacted = [to, approver];
    System.event(
      "collections.token_approval_event",
      this.callArgs!.args,
      impacted
    );
  }

  /**
   * Grant permissions to other account to manage all Tokens owned
   * by the user. The user must approve only the accounts he trust.
   * @external
   * @event collections.operator_approval_event nft.set_approval_for_all_args
   */
  set_approval_for_all(args: nft.set_approval_for_all_args): void {
    const approver = args.approver_address!;
    const operator = args.operator_address!;
    const approved = args.approved;

    const isAuthorized = this.check_authority(approver, false, false, new Uint8Array(0));
    System.require(isAuthorized, "set_approval_for_all operation not authorized");

    const key = new Uint8Array(50);
    key.set(approver, 0);
    key.set(operator, 25);
    this.operatorApprovals.put(key, new common.boole(approved));

    const impacted = [operator, approver];
    System.event(
      "collections.operator_approval_event",
      this.callArgs!.args,
      impacted
    );
  }

  /**
   * Transfer NFT
   * @external
   * @event collections.transfer_event nft.transfer_args
   */
  transfer(args: nft.transfer_args): void {
    const from = args.from!;
    const to = args.to!;
    const tokenId = args.token_id!;

    const tokenOwner = this.tokenOwners.get(tokenId)!;
    System.require(Arrays.equal(tokenOwner.account, from), "from is not the owner");

    const isAuthorized = this.check_authority(from, true, true, tokenId);
    System.require(isAuthorized, "transfer not authorized");

    tokenOwner.account = to;

    let fromBalance = this.balances.get(from)!;
    fromBalance.value -= 1;
    this.balances.put(from, fromBalance);

    let toBalance = this.balances.get(to)!;
    toBalance.value += 1;
    this.balances.put(to, toBalance);

    const impacted = [to, from];
    System.event("collections.transfer_event", this.callArgs!.args, impacted);
  }

  /**
   * Mint NFT
   * @external
   * @event collections.mint_event nft.mint_args
   */
  mint(args: nft.mint_args): void {
    System.require(this.only_owner(), "not authorized by the owner");

    this.tokenOwners.put(args.token_id!, new common.address(args.to!));

    const balance = this.balances.get(args.to!)!;
    const supply = this.supply.get()!;
    System.require(supply.value <= u64.MAX_VALUE - 1, "Mint would overflow supply");
    balance.value += 1;
    supply.value += 1;
    this.balances.put(args.to!, balance);
    this.supply.put(supply);

    System.event(
      "collections.mint_event", this.callArgs!.args, [args.to!]
    );
  }

  /**
   * Set royalties
   * @external
   * @event collections.royalties_event nft.royalties
   */
  burn(args: nft.burn_args): void {
    System.require(false, "function not implemented");
  }
}
