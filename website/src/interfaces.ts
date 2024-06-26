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

export interface TokenContractClass extends Contract {
  functions: {
    transfer: <T = {}>(
        args?: {
          from: string;
          to: string;
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
  vhp_producing: string[];
  last_update: string;
};

export interface PollCard extends PollData {
  yes_percentage: string;
  no_percentage: string;
  yes_vhp: string;
  no_vhp: string;
  yes_class: { "voted-yes": boolean };
  no_class: { "voted-no": boolean };
  yes_button_text: string;
  no_button_text: string;
  participation: string;
  start_date: string;
  end_date: string;
  ended: boolean;
}

export interface Vote {
  voter: string;
  vote: number;
  vhp: string;
}

export interface VoteCard extends Vote {
  vhpParsed: string;
  votePercentage: string;
  bpName: string;
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

    getVotesByPoll: <T = {
      vhp_votes: Vote[];
    }>(
        args?: {
          poll_id: number;
          tier_id: number;
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

    getVotesByUser: <T = {
        vhp_votes: Vote[];
      }>(
        args?: {
          voter: string;
          poll_start: number;
          poll_end: number;
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

export class UserPoolData {
  koin: {
    pool1: bigint;
    pool2: bigint;
    wallet: bigint;
  } = { pool1: BigInt(0), pool2: BigInt(0), wallet: BigInt(0)};
  vhp: {
    pool1: bigint;
    pool2: bigint;
    wallet: bigint;
  } = { pool1: BigInt(0), pool2: BigInt(0), wallet: BigInt(0)};
  vapor: {
    pool1: bigint;
    pool2: bigint;
    wallet: bigint;
  } = { pool1: BigInt(0), pool2: BigInt(0), wallet: BigInt(0)};
}

export interface FogataContractClass extends Contract {
  functions: {
    stake: <T = {}>(
        args?: {
          account: string;
          koin_amount: string;
          vhp_amount: string;        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    unstake: <T = {}>(
        args?: {
          account: string;
          koin_amount: string;
          vhp_amount: string;        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;

    set_collect_koin_preferences: <T = {}>(
        args?: {
          account: string;
          all_after_virtual: string;
          percentage_koin: string;        },
        opts?: CallContractOptions
      ) => Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }>;
  }
}

export interface NicknamesContractClass extends Contract {
  functions: {
    verify_valid_name: <T = {
      value: string;
    }>(
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

    owner_of: <T = {
      value: string;
    }>(
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

    metadata_of: <T = {
      value: string;
    }>(
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

    get_address: <T = {
      value: string;
      permanent_address: boolean;
      address_modifiable_only_by_governance: boolean;
    }>(
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

    get_tokens_by_address: <T = {
      token_ids: string[];
    }>(
      args?: {
        address: string;
        start: string;
        limit: number;
        direction?: number;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    get_tokens_by_owner: <T = {
      token_ids: string[];
    }>(
      args?: {
        owner: string;
        start: string;
        limit: number;
        direction?: number;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    get_main_token: <T = {
      token_id: string;
    }>(
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

    set_metadata: <T = {}>(
      args?: {
        token_id: string;
        metadata: string;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    set_main_token: <T = {}>(
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

    set_extended_metadata: <T = {}>(
      args?: {
        token_id: string;
        permanent_address?: boolean;
        address_modifiable_only_by_governance?: boolean;
        other?: string;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    set_address: <T = {}>(
      args?: {
        token_id: string;
        address: string;
        gov_proposal_update?: boolean;
      },
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
    }>;

    mint: <T = {}>(
      args?: {
        to: string;
        token_id: string;
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