import { System, Storage, Base58, Protobuf, StringBytes } from "@koinos/sdk-as";
import { NftWithMessage } from "./NftWithMessage";
import { common } from "./proto/common";

export class NftContract2 extends NftWithMessage {
  dataPatches: Storage.Map<Uint8Array, common.boole>;

  constructor() {
    super();
    this.dataPatches = new Storage.Map(
      this.contractId,
      9999,
      common.boole.decode,
      common.boole.encode,
      () => new common.boole(false)
    );
  }

  /**
   * patch data
   * @external
   */
  patch(args: common.uint32): void {
    System.require(this.only_owner(), "not authorized by the owner");
    const key = Protobuf.encode<common.uint32>(args, common.uint32.encode);
    const dataPatch = this.dataPatches.get(key)!;
    System.require(dataPatch.value == false, "patch already done");

    switch (args.value) {
      case 1: {
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
      }
      default: {
        System.fail(`patch logic #${args.value} not implemented`);
      }
    }

    dataPatch.value = true;
    this.dataPatches.put(key, dataPatch);
  }
}
