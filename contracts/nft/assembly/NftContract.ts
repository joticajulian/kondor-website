import { System, authority, Storage } from "@koinos/sdk-as";
import { Nft, nft, common } from "@koinosbox/contracts";

export class NftContract extends Nft {
  _name: string = "Kondor NFTs";
  _symbol: string = "KONDOR";
  _uri: string = "https://kondor-nft-api-w6enmqacja-uc.a.run.app/kondor-nfts";

  supply: Storage.Obj<common.uint64> = new Storage.Obj(
    this.contractId,
    1,
    common.uint64.decode,
    common.uint64.encode,
    () => new common.uint64(0)
  );

  balances: Storage.Map<Uint8Array, common.uint64> = new Storage.Map(
    this.contractId,
    3,
    common.uint64.decode,
    common.uint64.encode,
    () => new common.uint64(0)
  );

  _royalties: Storage.Obj<nft.royalties> = new Storage.Obj(
    this.contractId,
    2,
    nft.royalties.decode,
    nft.royalties.encode,
    () => new nft.royalties()
  );

  tokenOwners: Storage.Map<Uint8Array, common.address> = new Storage.Map(
    this.contractId,
    4,
    common.address.decode,
    common.address.encode,
    () => new common.address()
  );

  tokenOwnerPairs: Storage.Map<Uint8Array, common.boole> = new Storage.Map(
    this.contractId,
    8,
    common.boole.decode,
    common.boole.encode,
    () => new common.boole(false)
  );

  /*
  tokenMetadata: Storage.Map<Uint8Array, common.str> = new Storage.Map(
    this.contractId,
    TOKEN_METADATA_SPACE_ID,
    common.str.decode,
    common.str.encode,
    () => new common.str("")
  );
  */

  tokenApprovals: Storage.Map<Uint8Array, common.address> = new Storage.Map(
    this.contractId,
    5,
    common.address.decode,
    common.address.encode,
    () => new common.address()
  );

  operatorApprovals: Storage.Map<Uint8Array, common.boole> = new Storage.Map(
    this.contractId,
    6,
    common.boole.decode,
    common.boole.encode,
    () => new common.boole(false)
  );

  collectionOwner: Storage.Obj<common.address> = new Storage.Obj(
    this.contractId,
    100,
    common.address.decode,
    common.address.encode
  );

  rcLimit: Storage.Obj<common.uint64> = new Storage.Obj(
    this.contractId,
    50,
    common.uint64.decode,
    common.uint64.encode,
    () => new common.uint64(1000000000)
  );

  /**
   * Set rc limit for mana sharing
   * @external
   */
  set_rc_limit(args: common.uint64): void {
    const isAuthorized = System.checkAuthority(
      authority.authorization_type.contract_call,
      this.owner().value!
    );
    System.require(isAuthorized, "not authorized by the owner");
    this.rcLimit.put(args);
  }

  /**
   * Get rc limit for mana sharing
   * @external
   * @readonly
   */
  get_rc_limit(): common.uint64 {
    return this.rcLimit.get()!;
  }

  formatMana(value: u64): string {
    let mana = `${value}`;
    if (mana.length <= 8) return "0." + "0".repeat(8 - mana.length) + mana;
    if (mana.endsWith("00000000")) return mana.slice(0, mana.length - 8);
    let integer = mana.slice(0, mana.length - 8);
    let decimals = mana.slice(mana.length - 8);
    while (decimals.slice(decimals.length - 1) == "0") {
      decimals = decimals.slice(0, decimals.length - 1);
    }
    return `${integer}.${decimals}`;
  }

  /**
   * Authority function to share mana
   * @external
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    // share mana with everyone
    if (args.type == authority.authorization_type.transaction_application) {
      const txRcLimit =
        System.getTransactionField("header.rc_limit")!.uint64_value;
      const rcLimit = this.rcLimit.get()!.value;
      if (txRcLimit > rcLimit) {
        System.fail(
          `set max mana to a value inferior to ${this.formatMana(rcLimit)}`
        );
      }
      return new authority.authorize_result(true);
    }

    System.log("authorization must be for transaction_application");
    return new authority.authorize_result(false);
  }
}
