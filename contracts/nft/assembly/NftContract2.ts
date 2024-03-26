import {
  System,
  Storage,
  Protobuf,
  StringBytes,
  authority,
} from "@koinos/sdk-as";
import { common, nft } from "@koinosbox/contracts";
import { NftWithMessage } from "./NftWithMessage";

export class NftContract2 extends NftWithMessage {
  dataPatches: Storage.Map<Uint8Array, common.boole> = new Storage.Map(
    this.contractId,
    9999,
    common.boole.decode,
    common.boole.encode,
    () => new common.boole(false)
  );

  /**
   * patch data
   * @external
   */
  patch(args: common.uint32): void {
    const isAuthorized = System.checkAuthority(
      authority.authorization_type.contract_call,
      this.owner().value!
    );
    System.require(isAuthorized, "not authorized by the owner");
    const key = Protobuf.encode<common.uint32>(args, common.uint32.encode);
    const dataPatch = this.dataPatches.get(key)!;
    System.require(dataPatch.value == false, "patch already done");

    switch (args.value) {
      /* case 1: {
        // change Rusia to Russia
        const tokenId1 = StringBytes.stringToBytes("Rusia");
        const tokenId2 = StringBytes.stringToBytes("Russia");
        const auct = this.auctions.get(tokenId1)!;
        this.auctions.put(tokenId2, auct);
        this.auctions.remove(tokenId1);
        break;
      }
      case 2: {
        // change Rusia to Russia fix 2
        const tokenId = StringBytes.stringToBytes("Russia");
        const auct = this.auctions.get(tokenId)!;
        auct.bid!.token_id = tokenId;
        this.auctions.put(tokenId, auct);
        break;
      } */
      case 3: {
        const MAX_TOKEN_ID_LENGTH = 32;
        const tokens = this.get_tokens(
          new nft.get_tokens_args(new Uint8Array(0), 100, false)
        );
        for (let i = 0; i < tokens.token_ids.length; i += 1) {
          const tokenId = tokens.token_ids[i];
          const key = new Uint8Array(26 + MAX_TOKEN_ID_LENGTH);
          const account = this.owner_of(new nft.token(tokenId)).value!;
          key.set(account, 0);
          key[25] = tokenId.length;
          key.set(tokenId, 26);
          this.tokenOwnerPairs.put(key, new common.boole(true));
        }
        System.log(
          `token owner pairs have been updated. Total nfts updated: ${tokens.token_ids.length}`
        );
        break;
      }
      default: {
        System.fail(`patch logic #${args.value} not implemented`);
      }
    }

    dataPatch.value = true;
    this.dataPatches.put(key, dataPatch);
  }
}
