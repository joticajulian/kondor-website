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

  // TODO: fill
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

  /**
   * Authority function to share mana
   * @external
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    // TODO: set mana limit

    // share mana with everyone
    if (args.type == authority.authorization_type.transaction_application) {
      return new authority.authorize_result(true);
    }

    System.log("authorization must be for transaction_application");
    return new authority.authorize_result(false);
  }
}
