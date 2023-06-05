import { Contract } from "koilib";
import { CallContractOptions, ContractTransactionOptions, OperationJson, TransactionJsonWait, TransactionReceipt } from "koilib/lib/interface";

export interface Bid {
  account: string;
  token_id: string;
  koin_amount: string;
  credit_amount: string;
}

export interface Auction {
  bid: Bid;
  time_bid: string;
  started: boolean;
  sold: boolean;
}

export interface Auctions {
  value: Auction[];
}

export class NftCard {
  image = "";
  thumbnail = "";
  name = "";
  alt = "";
  description = "";
  tokenId = "";
  owner = "";
  ownerMessage = "";
  onChain = false;
  bidAccount = ""
  bidAmount = ""
  bidTime = ""
  bidRemainingTime = ""
  status = ""
  special = false;
  interval = setInterval(() => {}, 3600_000);
  classTime: { [x: string]: boolean} = {};
  classInfo: { [x: string]: boolean} = {};
  classCard: { [x: string]: boolean} = {};
}

export interface NftContractClass extends Contract {
  functions: {
    bid: <T = {}>(
        args?: {
          account: string;
          token_id: string;
          koin_amount: string;
          credit_amount: string;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    claimToken: <T = {}>(
        args?: {
          token_id: string;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    owner_of: <T = { account: string }>(
        args?: {
          token_id: string;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    getCredit: <T = { value: string }>(
        args?: {
          account: string;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;
    
    listAuctions: <T = Auctions>(
        args?: {
          start: string;
          limit: number;
          direction: number;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    getAuction: <T = Auction>(
        args?: {
          token_id: string;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    getOwnerMessage: <T = { value: string; }>(
      args?: {
        token_id: string;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    setOwnerMessage: <T = {}>(
      args?: {
        token_id: string;
        message: string;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;
  }
}