import { Contract } from "koilib";
import { CallContractOptions, ContractTransactionOptions, OperationJson, TransactionJsonWait, TransactionReceipt } from "koilib/lib/interface";
import { Auctions, Auction } from "../../contracts/build/nftcontractTypes"

export class NftCard {
  image = "";
  name = "";
  alt = "";
  description = "";
  tokenId = "";
  owner = "";
  onChain = false;
  bidAccount = ""
  bidAmount = ""
  bidTime = ""
  bidRemainingTime = ""
  status = ""
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
          value: string;
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
          value: string;
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