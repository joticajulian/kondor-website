<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as abi from '../assets/pollcontract-abi.json'
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import Alert from "../components/Alert.vue"
import { PollCard, VoteCard, PollContractClass } from "../interfaces"

const percentage = (num: bigint, den: bigint): string => {
  if (den === BigInt(0)) return "0.00%";
  return `${(Number(num * BigInt(100_00) / den) / 100).toFixed(2)}%`;
};

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const pollId = Number(useRouter().currentRoute.value.params.id as string);

const bpNames: {
  [x: string]: string
} = import.meta.env.VITE_BP_NAMES
  ? JSON.parse(import.meta.env.VITE_BP_NAMES)
  : {};

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const pollContractId = ref(import.meta.env.VITE_POLL_CONTRACT_ID);
const pobContractId = import.meta.env.VITE_POB_CONTRACT_ID;
const network = import.meta.env.VITE_NETWORK;
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: pollContractId.value,
  provider,
  abi,
}) as PollContractClass);

const account = ref("");
const blockProducer = ref("");
const nodeOperator = ref("");
const vhpProducing = ref("");
const polls = ref([] as PollCard[]);
const yesVotes = ref([] as VoteCard[]);
const noVotes = ref([] as VoteCard[]);

watch(blockProducer, async (newValue) => {
  getNodeOperator(newValue);
  getVotesByUser(newValue);
  window.localStorage.setItem("block_producer", newValue);
});

onMounted(() => {
  const bp = window.localStorage.getItem("block_producer");
  if (bp) {
    blockProducer.value = bp;
  }

  getPolls().then(() => { if (bp) getVotesByUser(bp) });
  getVhpProducing().then(getVotesByPoll);
});

async function getVhpProducing() {
  const pobContract = new Contract({
    id: pobContractId,
    provider,
  });
  await pobContract.fetchAbi();
  pobContract.abi!.methods.get_public_key.entry_point = 0x96634f68;
  pobContract.abi!.methods.get_public_key.read_only = true;
  pobContract.abi!.methods.get_metadata.entry_point = 0xfcf7a68f;
  pobContract.abi!.methods.get_metadata.read_only = true;
  
  try {
    const { result } = await pobContract.functions.get_metadata({});
    if (result) {
      const difficulty = BigInt(`0x${utils.toHexString(utils.decodeBase64url(result.value.difficulty))}`);
      const prod = difficulty / BigInt(300); // pobConsensusParams.target_block_interval / pobConsensusParams.quantum_length
      vhpProducing.value = utils.formatUnits(prod.toString(), 8);
    } else {
      vhpProducing.value = "0";
    }
  } catch (error) {
    console.error(error);
  }
}

async function getNodeOperator(bp: string) {
  const pobContract = new Contract({
    id: pobContractId,
    provider,
  });
  await pobContract.fetchAbi();
  pobContract.abi!.methods.get_public_key.entry_point = 0x96634f68;
  pobContract.abi!.methods.get_public_key.read_only = true;
  pobContract.abi!.methods.get_metadata.entry_point = 0xfcf7a68f;
  pobContract.abi!.methods.get_metadata.read_only = true;
  try {
    const { result } = await pobContract.functions.get_public_key<{ value: string; }>({
      producer: bp,
    });
    const address = utils.bitcoinAddress(utils.decodeBase64url(result!.value));
    nodeOperator.value = `Node operator: ${address}`;
  } catch (error) {
    nodeOperator.value = (error as Error).message;
  }
}

// prerequisite: getVhpProducing
async function getVotesByPoll() {
  yesVotes.value = [];
  noVotes.value = [];
  const vhpProd = BigInt(utils.parseUnits(vhpProducing.value, 8));
  for (let tierId = 1; tierId <= 5; tierId += 1) {
    try {
      const { result } = await contract.value.functions.getVotesByPoll({
        poll_id: pollId,
        tier_id: tierId,
        start: "",
        limit: 1000,
        direction: 0,
      });
      result?.vhp_votes.forEach(vote => {
        const voteParsed: VoteCard = {
          ...vote,
          vhpParsed: utils.formatUnits(vote.vhp, 8),
          votePercentage: percentage(BigInt(vote.vhp), vhpProd),
          bpName: bpNames[vote.voter] ?? "",
        };
        switch(vote.vote) {
          case 1: {
            yesVotes.value.push(voteParsed);
            break;
          }
          case 2: {
            noVotes.value.push(voteParsed);
            break;
          }
          default:
            break;
        }
      });
    } catch (error) {
      console.error(`Error in tier ${tierId}`);
      console.error(error);
    }
  }
}

// prerequisite: getPolls
async function getVotesByUser(bp: string) {
  let userVotes: {
    vhp_votes: {
        voter: string;
        vote: number;
        vhp: string;
    }[];
  };
  try {
    const { result } = await contract.value.functions.getVotesByUser({
      voter: bp,
      poll_start: polls.value[0].id,
      poll_end: polls.value[polls.value.length - 1].id,
    });
    if (!result) throw new Error("");
    userVotes = result;
  } catch(error) {
    userVotes = {
      vhp_votes: polls.value.map(() => ({
        voter: "",
        vote: 0,
        vhp: "0",
      }))
    }
    console.error((error as Error).message);
  }
  polls.value.forEach((poll, i) => {
    switch (userVotes.vhp_votes[i].vote) {
      case undefined:
      case 0: {
        poll.yes_class = { "voted-yes": false };
        poll.no_class = { "voted-no": false };
        break;
      }
      case 1: {
        poll.yes_class = { "voted-yes": true };
        poll.no_class = { "voted-no": false };
        poll.yes_button_text = "Voted YES ✔️";
        break;
      }
      case 2: {
        poll.yes_class = { "voted-yes": false };
        poll.no_class = { "voted-no": true };
        poll.no_button_text = "Voted NO ❌";
        break;
      }
      default:
        throw new Error(`invalid vote #${i}: ${userVotes.vhp_votes[i].vote}`);
    }
  });
}

async function getPolls() {
  const { result } = await contract.value.functions.getPolls({
    start: pollId,
    limit: 1,
    direction: 0,
  });
  if (!result) return;
  polls.value = result.polls.map(poll => {
    const yesVotes = BigInt(poll.yes_vhp_votes ?? "0");
    const totalVotes = BigInt(poll.total_vhp_votes ?? "0");
    const vhpProd = poll.vhp_producing.reduce<bigint>((t,v) => t + BigInt(v ?? "0"), BigInt(0)) / BigInt(5);
    const noVotes = BigInt(totalVotes - yesVotes);

    const pollCard: PollCard = {
      ...poll,
      yes_percentage: percentage(yesVotes, totalVotes),
      no_percentage: percentage(noVotes, totalVotes),
      yes_vhp: utils.formatUnits(yesVotes.toString(),8),
      no_vhp: utils.formatUnits(noVotes.toString(),8),
      yes_button_text: "Vote YES ✔️",
      no_button_text: "Vote NO ❌",
      yes_class: {"voted-yes": false},
      no_class: {"voted-no": false},
      participation: percentage(totalVotes, vhpProd),
      start_date: new Date(Number(poll.params.start_date)).toISOString().slice(0,-14),
      end_date: new Date(Number(poll.params.end_date)).toISOString().slice(0,-14),
      ended: Date.now() > Number(poll.params.end_date),
    };
    return pollCard;
  });
}

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

async function vote(pollId: number, vote: number) {
  try {
    if(!account.value) throw new Error("Connect your wallet");
    const manaAvailable = await contract.value.provider!.getAccountRc(account.value);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const { transaction } = await contract.value.functions.vote({
      poll_id: pollId,
      voter: blockProducer.value,
      vote
    }, { rcLimit });
    alertData.value = {
      type: "info",
      show: true,
      message: `Transaction submitted. Waiting to be mined`,
    }
    if (!transaction) throw new Error("Error submitting the transaction");
    await transaction.wait();
    alertData.value = {
      type: "success",
      show: true,
      message: `Transaction mined.`,
    }
    await getPolls();
  } catch (error) {
    alertData.value = {
      type: "error",
      show: true,
      message: (error as Error).message
    }
  }
}

</script>

<template>
  <div>
    <HeaderProject
      title="Polls"
      url-path="/polls"
      @signer="setSigner"
    />
    <div class="all-polls">
      <div class="user-data">
        <div class="group">
          <label for="producer">Block producer</label>
          <input type="text" v-model="blockProducer">
          <span class="node-operator">{{ nodeOperator }}</span>
        </div>
      </div>
      <div class="vhp-producing">
        Active block producers: {{ vhpProducing }} VHP
      </div>
      <div v-for="(poll, i) in polls" :key="'poll'+i" class="poll-card">
        <div class="title">{{ poll.params.title }}</div>
        <div class="summary">{{ poll.params.summary }}</div>
        <a :href="poll.params.url">{{ poll.params.url }}</a>
        <div class="creator">created by {{ poll.params.creator }}</div>
        <div class="dates">
          From {{ poll.start_date }}
          to {{ poll.end_date }}
        </div>
        <div class="votes">
          <div class="yes">YES ✔️ {{ poll.yes_percentage }} ({{ poll.yes_vhp }} VHP)</div>
          <div class="no">NO ❌ {{ poll.no_percentage }} ({{ poll.no_vhp }} VHP)</div>
          <div class="participation">Participation {{ poll.participation }}</div>
        </div>
        <div class="buttons">
          <button v-if="!poll.ended" @click="vote(poll.id, 1)" :class="poll.yes_class">{{ poll.yes_button_text }}</button>
          <button v-if="!poll.ended" @click="vote(poll.id, 2)" :class="poll.no_class">{{ poll.no_button_text }}</button>
          <!-- <button @click="$router.push('/polls/'+(poll.id ?? 0))">View VOTES 🗳️</button> -->
        </div>
      </div>
    </div>
    <div class="all-votes">
      <div class="yes-votes">
        <h1>YES votes</h1>
        <div v-for="(vote, i) in yesVotes" :key="'vote'+i" class="vote-card">
          <div class="voter">{{ vote.voter }}</div>
          <div class="voter">{{ vote.bpName }}</div>
          <div class="vhp">{{ vote.vhpParsed }} VHP ({{ vote.votePercentage }})</div>
        </div>
      </div>
      <div class="no-votes">
        <h1>NO votes</h1>
        <div v-for="(vote, i) in noVotes" :key="'vote'+i" class="vote-card">
          <div class="voter">{{ vote.voter }}</div>
          <div class="voter">{{ vote.bpName }}</div>
          <div class="vhp">{{ vote.vhpParsed }} VHP ({{ vote.votePercentage }})</div>
        </div>
      </div>
    </div>
    <FootProject/>
    <Alert
      :data="alertData"
      @close="alertData.show = false"
    />
  </div>
</template>

<style scoped>
.slogan{

}
.description{
  margin: auto;
  width: 50%;
  min-width: 17em;
  color: black;
}

.create {
  display: flex;
  justify-content: center;
}
.all-polls {
  padding-top: 3em;
  margin: auto;
  width: 70%;
  min-width: 17em;
}

.all-polls input {
  margin-bottom: 0;
}

.all-polls .node-operator {
  font-size: 0.7em;
}

.all-polls .vhp-producing {
  margin-top: 1em;
  font-weight: bold;
}

.poll-card {
  color: black;
  margin: 2em 0em;
  background: #f3f3f3;
  padding: 2em;
  border-radius: 1em;
}

.title {
  font-size: 1.5em;
}

.summary{

}

.creator{
  font-size: 0.7em;
}

.dates{

}

.votes{

}

.yes{

}

.no{

}

.voted-yes {
  background: #54c854;
}

.voted-no {
  background: #ff6363;
}

.participation{

}

.buttons {
  margin-top: 1em;
}

.buttons button{
  margin-right: 1em;
  margin-bottom: 0.5em;
}

.all-votes {
  display: flex;
  padding-top: 3em;
  margin: auto;
  width: 70%;
  min-width: 17em;
  justify-content: space-between;
}

@media only screen and (max-width: 600px) {
  .all-votes {
    flex-direction: column;
  }
}

.all-votes h1 {
  font-size: 1.5em;  
}

.vote-card {
  margin-bottom: 1em;
  display: flex;
  flex-direction: column;
  align-items: end;
}

.voter {
  font-size: 0.7em;
}
</style>