import { System, Storage, Protobuf, Token, authority } from "@koinos/sdk-as";
import { auctionnft } from "./proto/auctionnft";
import { NftContract } from "./NftContract";
import { common, nft } from "@koinosbox/contracts";

export const AUCTION_PERIOD: u64 = 7 * 24 * 60 * 60 * 1000;
// export const AUCTION_PERIOD: u64 = 60 * 60 * 1000;

export class AuctionNftContract extends NftContract {
  auctions: Storage.Map<Uint8Array, auctionnft.auction> = new Storage.Map(
    this.contractId,
    200,
    auctionnft.auction.decode,
    auctionnft.auction.encode,
    null
  );

  credits: Storage.Map<Uint8Array, common.uint64> = new Storage.Map(
    this.contractId,
    201,
    common.uint64.decode,
    common.uint64.encode,
    () => new common.uint64(0)
  );

  reentrantLocked: Storage.Obj<common.boole> = new Storage.Obj(
    this.contractId,
    900,
    common.boole.decode,
    common.boole.encode,
    () => new common.boole(false)
  );

  reentrantLock(): void {
    const reentrantLocked = this.reentrantLocked.get()!;
    System.require(reentrantLocked.value == false, "no reentrant");
    this.reentrantLocked.put(new common.boole(true));
  }

  reentrantUnlock(): void {
    this.reentrantLocked.put(new common.boole(false));
  }

  /**
   * Create a new auction for a token id
   * @external
   */
  createAuction(args: auctionnft.bid): void {
    const isAuthorized = System.checkAuthority(
      authority.authorization_type.contract_call,
      this.owner().value!
    );
    System.require(isAuthorized, "not authorized by the owner");
    // check if the token is already minted
    const tokenOwner = this.tokenOwners.get(args.token_id!)!;
    System.require(!tokenOwner.value, "token already minted");

    // check the auction and bid period
    const auctionToken = this.auctions.get(args.token_id!);
    System.require(!auctionToken, "this token is already listed for auction");
    const now = System.getHeadInfo().head_block_time;
    const auct = new auctionnft.auction(
      new auctionnft.bid(
        null,
        args.token_id,
        args.koin_amount,
        args.credit_amount
      ),
      now,
      false,
      false
    );
    this.auctions.put(args.token_id!, auct);
    System.event(
      "auctionnft.auction",
      Protobuf.encode<auctionnft.auction>(auct, auctionnft.auction.encode),
      []
    );
  }

  /**
   * Get the last bid of a token id
   * @external
   * @readonly
   */
  getAuction(args: nft.token): auctionnft.auction {
    const auct = this.auctions.get(args.token_id!);
    if (!auct) return new auctionnft.auction();
    return auct;
  }

  /**
   * List paginated auctions
   * @external
   * @readonly
   */
  listAuctions(args: common.list_args): auctionnft.auctions {
    const direction = args.descending
      ? Storage.Direction.Descending
      : Storage.Direction.Ascending;
    const auctions = this.auctions.getManyValues(
      args.start ? args.start! : new Uint8Array(0),
      args.limit,
      direction
    );
    return new auctionnft.auctions(auctions);
  }

  /**
   * Submit a new bid
   * @external
   */
  bid(args: auctionnft.bid): void {
    this.reentrantLock();

    // check the auction and bid period
    const auctionToken = this.auctions.get(args.token_id!);
    System.require(auctionToken, "this token is not listed for auction");
    const auct = auctionToken!;
    System.require(!auct.sold, "this token was sold");
    const now = System.getHeadInfo().head_block_time;
    if (auct.started) {
      System.require(now >= auct.time_bid, "time internal error");
      System.require(
        now - auct.time_bid < AUCTION_PERIOD,
        "the auction period has ended for this token"
      );
    }

    // check user credit
    const userCredit = this.credits.get(args.account!)!;
    System.require(
      userCredit.value >= args.credit_amount,
      "insufficient credit"
    );

    // check min bid
    const lastBid = auct.bid!.koin_amount + auct.bid!.credit_amount;
    const newBid = args.koin_amount + args.credit_amount;
    const minBid = auct.started ? lastBid + lastBid / 100 : lastBid;
    System.require(newBid >= minBid, `the bid must be at least ${minBid}`);

    // substract user credit
    userCredit.value -= args.credit_amount;
    this.credits.put(args.account!, userCredit);

    // get the koins
    const koin = new Token(System.getContractAddress("koin"));
    if (args.koin_amount > 0) {
      const transferStatus = koin.transfer(
        args.account!,
        this.contractId,
        args.koin_amount
      );
      System.require(
        transferStatus == true,
        "the transfer of koins was rejected"
      );
    }

    const impacted = [args.account!];

    // return the credit and koins to the previous bidder
    if (auct.bid!.account) {
      const user2Credit = this.credits.get(auct.bid!.account!)!;
      user2Credit.value += auct.bid!.credit_amount;
      this.credits.put(auct.bid!.account!, user2Credit);
      if (auct.bid!.koin_amount > 0) {
        const transferStatus = koin.transfer(
          this.contractId,
          auct.bid!.account!,
          auct.bid!.koin_amount
        );
        System.require(
          transferStatus == true,
          "the transfer to return koins was rejected"
        );
      }
      impacted.push(auct.bid!.account!);
    }

    // update auction
    const auctionUpdated = new auctionnft.auction(args, now, true, false);
    this.auctions.put(args.token_id!, auctionUpdated);
    System.event(
      "auctionnft.auction",
      Protobuf.encode<auctionnft.auction>(
        auctionUpdated,
        auctionnft.auction.encode
      ),
      impacted
    );
    this.reentrantUnlock();
  }

  /**
   * Claim the NFT token
   * @external
   */
  claimToken(args: nft.token): void {
    // check the auction and bid period
    const auctionToken = this.auctions.get(args.token_id!);
    System.require(auctionToken, "this token is not listed for auction");
    const auct = auctionToken!;
    System.require(auct.started, "this auction has not started");
    System.require(!auct.sold, "this token was claimed");
    const now = System.getHeadInfo().head_block_time;
    System.require(now >= auct.time_bid, "time internal error");
    System.require(
      now - auct.time_bid >= AUCTION_PERIOD,
      "the auction period has not ended for this token"
    );
    this._mint(new nft.mint_args(auct.bid!.account, args.token_id!));
    auct.sold = true;
    this.auctions.put(args.token_id!, auct);
  }

  /**
   * Add credit to an user
   * @external
   */
  addCredit(args: auctionnft.userKoin): void {
    const isAuthorized = System.checkAuthority(
      authority.authorization_type.contract_call,
      this.owner().value!
    );
    System.require(isAuthorized, "not authorized by the owner");
    const userCredit = this.credits.get(args.account!)!;
    System.require(
      userCredit.value <= u64.MAX_VALUE - args.amount,
      "amount overflow"
    );
    userCredit.value += args.amount;
    this.credits.put(args.account!, userCredit);
  }

  /**
   * Get user credit
   * @external
   * @readonly
   */
  getCredit(args: common.address): common.uint64 {
    return this.credits.get(args.value!)!;
  }
}
