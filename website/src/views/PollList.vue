<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as abi from '../../../contracts/build/pollcontract-abi.json'
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import ModalNewPoll from "../components/ModalNewPoll.vue"
import Alert from "../components/Alert.vue"
import { PollCard, PollContractClass } from "../interfaces"

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const pollContractId = import.meta.env.VITE_POLL_CONTRACT_ID;
const pobContractId = import.meta.env.VITE_POB_CONTRACT_ID;
const network = import.meta.env.VITE_NETWORK;
const showModalNewPoll = ref(false);
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: pollContractId,
  provider,
  abi,
}) as PollContractClass);

const account = ref("");
const blockProducer = ref("");
const nodeOperator = ref("");
const polls = ref([] as PollCard[]);

watch(blockProducer, async (newValue) => {
  getNodeOperator(newValue);
  // TODO: get votes of block producer
});

onMounted(getPolls);

async function getNodeOperator(bp: string) {
  const pobContract = new Contract({
    id: pobContractId,
    provider,
  });
  await pobContract.fetchAbi();
  pobContract.abi!.methods.get_public_key.entry_point = 0x96634f68;
  pobContract.abi!.methods.get_public_key.read_only = true;
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
      <div class="user-data">
        <div class="group">
          <label for="producer">Block producer</label>
          <input type="text" v-model="blockProducer">
          <span class="node-operator">{{ nodeOperator }}</span>
        </div>
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
          <button v-if="!poll.ended" @click="vote(poll.id, 1)">Vote YES ✔️</button>
          <button v-if="!poll.ended" @click="vote(poll.id, 2)">Vote NO ❌</button>
          <button @click="$router.push('/polls/'+(poll.id ?? 0))">View VOTES 🗳️</button>
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
.participation{

}

.buttons {
  margin-top: 1em;
}

.buttons button{
  margin-right: 1em;
}
</style>