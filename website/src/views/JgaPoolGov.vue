<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as abi from '../assets/pollcontract-abi.json'
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import Alert from "../components/Alert.vue"
import { PollCard, PollContractClass } from "../interfaces"

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const vhpContractId = import.meta.env.VITE_VHP_CONTRACT_ID;
const jgaPoolGovId = ref(import.meta.env.VITE_JGAPOOL_GOV_ID);
const jgaPool1Id = import.meta.env.VITE_JGAPOOL_1_ID;
const jgaPool2Id = import.meta.env.VITE_JGAPOOL_2_ID;
const network = import.meta.env.VITE_NETWORK;
const provider = new Provider(rpcNodes);
const jgaPoolGovContractUrl = ref(network === "mainnet"
  ? `https://koinosblocks.com/address/${jgaPoolGovId}`
  : `https://harbinger.koinosblocks.com/address/${jgaPoolGovId}`
);
const contract = ref(new Contract({
  id: jgaPoolGovId.value,
  provider,
  abi,
}) as PollContractClass);

const account = ref("");
const vhpTotal = ref("");
const polls = ref([] as PollCard[]);

onMounted(() => {
  getPolls();
  getTotalVhp();
});

async function getTotalVhp() {
  const vhpContract = new Contract({
    id: vhpContractId,
    abi: utils.tokenAbi,
    provider,
  });
  
  try {
    const { result } = await vhpContract.functions.balanceOf({
      owner: jgaPool1Id,
    });
    if (result) {
      vhpTotal.value = utils.formatUnits(result.value, 8);
    } else {
      vhpTotal.value = "0";
    }
  } catch (error) {
    console.error(error);
  }
}

async function getVotesByUser(voter: string) {
  let userVotes: {
    vhp_votes: {
        voter: string;
        vote: number;
        vhp: string;
    }[];
  };
  try {
    const { result } = await contract.value.functions.getVotesByUser({
      voter,
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
    start: 0,
    limit: 100,
    direction: 0,
  });
  if (!result) return;
  polls.value = result.polls.map(poll => {
    const yesVotes = BigInt(poll.yes_vhp_votes ?? "0");
    const totalVotes = BigInt(poll.total_vhp_votes ?? "0");
    const vhpProd = poll.vhp_producing.reduce<bigint>((t,v) => t + BigInt(v ?? "0"), BigInt(0)) / BigInt(5);
    const noVotes = BigInt(totalVotes - yesVotes);

    const percentage = (num: bigint, den: bigint): string => {
      if (den === BigInt(0)) return "0.00%";
      return `${(Number(num * BigInt(100_00) / den) / 100).toFixed(2)}%`;
    };
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
  getVotesByUser(account.value);
}

async function vote(pollId: number, vote: number) {
  try {
    if(!account.value) throw new Error("Connect your wallet");
    const manaAvailable = await contract.value.provider!.getAccountRc(account.value);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const { transaction } = await contract.value.functions.vote({
      poll_id: pollId,
      voter: account.value,
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
      title="JGA Pool"
      url-path="/jgapool"
      @signer="setSigner"
    />
    <div class="description">
      <p>The JGA Pool allows you to participate in the governance of koinos.
        We act as representatives to the group of Koinos Block Producers, who are the
        ones who control the governance. The votes are counted in the same way as
        the governance system: 1 VHP = 1 vote 🗳️
      </p>
      <p>
        Once the participation reaches 60% we will update the vote of our pools.
        If there is no enough participation we reserve the right to decide how to vote.
      </p>
      <!--<p style="word-break: break-all;">
        The gov contract is <a :href="jgaPoolGovContractUrl">{{ jgaPoolGovId }}</a>.
      </p>-->
    </div>
    <div class="all-polls">
      <div class="vhp-producing">
        Total VHP of the mining pool: {{ vhpTotal }} VHP
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
          <button @click="$router.push('/jgapool/gov/'+(poll.id ?? 0))">View VOTES 🗳️</button>
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
</style>