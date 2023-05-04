import { System, Storage } from "@koinos/sdk-as";
import { common } from "./proto/common";
import { nft } from "./proto/nft";
import { nftmessage } from "./proto/nftmessage";
import { AuctionNftContract } from "./AuctionNftContract";

export class NftWithMessage extends AuctionNftContract {
  ownerMessages: Storage.Map<Uint8Array, common.str>;

  constructor() {
    super();

    this.ownerMessages = new Storage.Map(
      this.contractId,
      300,
      common.str.decode,
      common.str.encode,
      () => new common.str("")
    );
  }

  /**
   * Define a message to the world for a specific NFT
   * @external
   */
  setOwnerMessage(args: nftmessage.onwer_message): void {
    let account: Uint8Array;
    const tokenOwner = this.owner_of(new nft.token(args.token_id!));
    if (tokenOwner.account) {
      account = tokenOwner.account!;
    } else {
      const auctionToken = this.auctions.get(args.token_id!);
      System.require(auctionToken, "this token is not listed for auction");
      System.require(auctionToken!.started, "no bidder, this auction has not started");
      System.require(auctionToken!.bid, "internal error: no bid in auction");
      System.require(auctionToken!.bid!.account!, "internal error: no bidder");
      account = auctionToken!.bid!.account!;
    }

    const isAuthorized = this.check_authority(
      account,
      false,
      false,
      new Uint8Array(0)
    );
    System.require(isAuthorized, "set owner message operation not authorized");

    this.ownerMessages.put(args.token_id!, new common.str(args.message));
  }

  /**
   * Get the message defined in a NFT by the owner
   * @external
   * @readonly
   */
  getOwnerMessage(args: nft.token): common.str {
    return this.ownerMessages.get(args.token_id!)!;
  }
}
