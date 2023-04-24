import { Contract } from "koilib";
import { CallContractOptions, ContractTransactionOptions, OperationJson, TransactionJsonWait, TransactionReceipt } from "koilib/lib/interface";

export class NftCard {
  image = "";
  name = "";
  alt = "";
  tokenId = "";
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
  }
}