<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as abi from '../../../contracts/build/pollcontract-abi.json'
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import ModalNewPoll from "../components/ModalNewPoll.vue"
import { PollCard, PollContractClass } from "../interfaces"

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const pollContractId = import.meta.env.VITE_POLL_CONTRACT_ID;
const network = import.meta.env.VITE_NETWORK;
const showModalNewPoll = ref(false);
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: pollContractId,
  provider,
  abi,
}) as PollContractClass);

const account = ref("");
const polls = ref([] as PollCard[]);

onMounted(async () => {
  const { result } = await contract.value.functions.getPolls({
    start: 0,
    limit: 100,
    direction: 0,
  });
  if (!result) return;
  polls.value = result.polls.map(poll => {
    const yesVotes = BigInt(poll.yes_vhp_votes ?? "0");
    const totalVotes = BigInt(poll.total_vhp_votes ?? "0");
    const totalSupply = BigInt(poll.total_vhp_supply ?? "0");
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
      participation: percentage(totalVotes, totalSupply),
      start_date: new Date(Number(poll.params.start_date)).toISOString().slice(0,-14),
      end_date: new Date(Number(poll.params.end_date)).toISOString().slice(0,-14),
    };
    return pollCard;
  });
});

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

</script>

<template>
  <div>
    <HeaderProject
      @signer="setSigner"
    />
    <ModalNewPoll
      v-if="showModalNewPoll"
      :contract="contract"
      @close="showModalNewPoll = false"
    />
    <div class="slogan">Koinos Polls</div>
    <div class="description">
      <p>
        One of the features of Koinos Blockchain is the ability to perform
        upgrades without hardforks. These upgrades are controlled by the governance
        system which is managed by the community in a decentralized way.
      </p>
      <p>
        The mission of Koinos Polls is to have a platform where the community can
        get consensus around specific topics related to governance before submitting
        the proposal in the governance system or developing code.
      </p>
      <p>
        The votes are counted in the same way as the governance system:
        1 VHP = 1 vote 🗳️. That is, the more VHP you have the more votes
        you have in the poll.
      </p>
    </div>
    <div class="create">
      <button @click="showModalNewPoll = true">New Poll</button>
    </div>
    <div class="all-polls">
      <div v-for="(poll, i) in polls" :key="'poll'+i" class="poll-card">
        <router-link :to="'/polls/'+(poll.id ?? 0)" class="title">{{ poll.params.title }}</router-link>
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
      </div>
    </div>
    <FootProject/>
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
    
}
.all_polls {
  padding-top: 3em;
}

.poll-card {
  width: 100%;
  color: black;
  margin: 2em 3em;
}

.title {
  font-size: 1.5em;
}

.summary{

}

.creator{
  font-size: 0.8em;
}

.dates{

}

.votes{

}

.yes{

}

.no{

}
.participation{

}
</style>