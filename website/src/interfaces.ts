import { Contract } from "koilib";
import { CallContractOptions, ContractTransactionOptions, OperationJson, TransactionJsonWait, TransactionReceipt } from "koilib/lib/interface";
import { Auctions, Auction } from "../../contracts/build/nftcontractTypes"

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

export interface PollParams {
  title: string;
  summary: string;
  url: string;
  creator: string;
  start_date: string;
  end_date: string;
  tiers: { value: string; }[];
};

export interface PollData {
  id: number;
  params: PollParams;
  yes_vhp_votes: string;
  total_vhp_votes: string;
  total_vhp_supply: string;
  last_update: string;
};

export interface PollCard extends PollData {
  yes_percentage: string;
  no_percentage: string;
  yes_vhp: string;
  no_vhp: string;
  participation: string;
  start_date: string;
  end_date: string;
}

export interface PollContractClass extends Contract {
  functions: {
    getPolls: <T = {
      polls: PollData[];
    }>(
        args?: {
          start: number;
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

    createPoll: <T = {}>(
        args?: PollParams,
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    getVotes: <T = {
      vhp_votes: {
        voter: string;
        vote: number;
        vhp: string;
      }[];
    }>(
        args?: {
          poll_id: number;
          tier_id: number;
          start: string;
          limit: string;
          direction: number;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    vote: <T = {}>(
        args?: {
          poll_id: number;
          voter: string;
          vote: number;
        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    updateVotes: <T = {}>(
        args?: {
          poll_id: number;
          tier_id: number;
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