<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, utils } from 'koilib'
import * as kondor from "kondor-js"
import * as abi from '../../../contracts/build/nftcontract-abi.json'
import { Auctions, Auction } from "../../../contracts/build/nftcontractTypes"
import HeaderProject from "../components/HeaderProject.vue"
import Alert from "../components/Alert.vue"
import Modal from "../components/Modal.vue"
import { NftCard, NftContractClass } from "../interfaces"

const ONE_WEEK = 5*60_000;// 7 * 24 * 3600 * 1000;

function hexToUtf8(hex: string) {
  const buffer = utils.toUint8Array(hex.slice(2));
  return new TextDecoder().decode(buffer);
}

function utf8ToHex(utf8: string) {
  const buffer = new TextEncoder().encode(utf8);
  return `0x${utils.toHexString(buffer)}`;
}

function deltaTimeToString(milliseconds: number) {
  if (Number.isNaN(milliseconds)) return "";

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds <= 0) return "auction ended";

  let interval = seconds / 86400;
  if (interval > 2) return "auction ends in " + Math.floor(interval) + " days";

  interval = seconds / 3600;
  if (interval > 2) return "auction ends in " + Math.floor(interval) + " hours";

  interval = seconds / 60;
  if (interval > 2) return "auction ends in " + Math.floor(interval) + " minutes";

  interval = seconds;  
  return "auction ends in " + interval + " seconds";
}

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const nftContractId = import.meta.env.VITE_NFT_CONTRACT_ID;
const name = useRouter().currentRoute.value.params.id as string;
const showModal = ref(false);
const account = ref("");
const credit = ref("");
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: nftContractId,
  provider,
  abi,
}) as NftContractClass);

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const nft = ref({
  image: `/nfts/${name}-Kondor.png`,
  name: name.replaceAll("_", " "),
  alt: name,
  classCard: { offchain: true},
  tokenId: utf8ToHex(name),
} as unknown as NftCard);

if (["Colombia", "United States", "United Kingdom", "Rebel Alliance"].includes(nft.value.name)) {
  nft.value.classInfo = { "special-info": true }
  nft.value.classCard = { "special-card": true, offchain: false };
  if (nft.value.name === "United States") {
    nft.value.description = `"The black and gold Kondor is otorgued to United States due the invaluable contribution of Koinos Group for creating the Koinos Blockchain. For this reason this token is one of the most important NFTs in the Kondor collection." JGA`
  }
}

onMounted(async () => {
  const { result: auction } = await contract.value.functions.getAuction({ 
    value: nft.value.tokenId,
  });
  if (!auction) throw new Error("auction not found");
  nft.value.onChain = true;
  nft.value.classCard.offchain = false;
  const timeBid = Number(auction.time_bid);
  nft.value.bidTime = new Date(timeBid).toISOString();
  const koinAmount = auction.bid.koin_amount ? Number(auction.bid.koin_amount) : 0;
  const creditAmount = auction.bid.credit_amount ? Number(auction.bid.credit_amount) : 0;
  nft.value.bidAmount = `${utils.formatUnits((koinAmount+creditAmount).toString(), 8)} KOIN`;
  nft.value.bidAccount = auction.bid.account;
  if (auction.started) {
    if (auction.sold) {
      nft.value.status = "sold";
      console.log(contract.value.functions);
      const { result: onwerToken } = await contract.value.functions.owner_of({ token_id: nft.value.tokenId });
      nft.value.owner = onwerToken ? onwerToken.account : "unknown owner";
    } else {
      nft.value.status = "started";
      clearInterval(nft.value.interval);
      const fnInterval = () => {
        const remainingTime = timeBid + ONE_WEEK - Date.now();
        if (remainingTime <= 0) nft.value.status = "readyToClaim";
        else if (remainingTime < 3600_000) nft.value.classTime = { "time-red": true };
        else if (remainingTime < 24 * 3600_000) nft.value.classTime = { "time-orange": true };
        else nft.value.classTime = { "time-blue": true };
        nft.value.bidRemainingTime = deltaTimeToString(remainingTime);
      };
      fnInterval();
      nft.value.interval = setInterval(fnInterval, 1000);
    }
  } else {
    nft.value.bidRemainingTime = "available";
    nft.value.classTime = { "time-blue": true };
  }    
});

function bidNft() {
  showModal.value = true;
}

async function claimNft() {
  try {
    const account = contract.value.signer!.getAddress();
    const manaAvailable = await contract.value.provider!.getAccountRc(account);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();
    const { transaction } = await contract.value.functions.claimToken({ value: nft.value.tokenId }, { rcLimit });
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
      message: `Transaction mined. Wait some seconds and refresh the page`,
    }
  } catch (error) {
    alertData.value = {
      type: "danger",
      show: true,
      message: (error as Error).message,
    };
    throw error;
  }
}

async function setAccount(address: string) {
  account.value = address;
  contract.value.signer = kondor.getSigner(address, { network: "harbinger" });
  const { result } = await contract.value.functions.getCredit({ account: address });
  if (result && result.value) credit.value = utils.formatUnits(result.value, 8);
  else credit.value = "";
}
</script>

<template>
  <div>
    <HeaderProject
      @account="setAccount"
    />
    <Modal 
      v-if="showModal"
      :contract="contract"
      :nft="nft"
      @close="showModal = false"
    />
    <div v-if="credit" class="credit">Good news! You have a discount of&nbsp;<span>{{ credit }} KOIN</span>&nbsp;in any NFT 🥳</div>
    <div class="nft-card" :class="nft.classCard">
      <router-link :to="'/kondor-nft/'+nft.name.toLowerCase().replaceAll(' ','_')" class="image">
        <img :src="nft.image" :alt="nft.alt">
      </router-link>
      <div class="info" :class="nft.classInfo">
        <div class="name">{{ nft.name }}</div>
        <div v-if="nft.description" class="description">{{ nft.description }}</div>
        <div v-if="nft.status !== 'sold'" class="amount">{{ nft.bidAmount }}</div>
        <div v-if="nft.bidAccount && nft.status !== 'sold'" class="account">bidder</div>
        <div v-if= "nft.owner" class="owner">{{ nft.owner }}</div>
        <div v-else class="account">{{ nft.bidAccount }}</div>
        <div v-if="nft.status === 'started'" class="time" :class="nft.classTime">{{ nft.bidRemainingTime }}</div>
        <button 
          v-if="nft.onChain && nft.status !== 'sold' && nft.status !== 'readyToClaim'"
          class="button"
          @click="bidNft()"
        >BID</button>
        <button 
          v-if="nft.onChain && nft.status === 'readyToClaim'"
          class="button"
          @click="claimNft()"
        >CLAIM</button>
      </div>
    </div>
    <Alert
      :data="alertData"
      @close="alertData.show = false"
    />
  </div>
</template>

<style scoped>
.credit {
  display: flex;
  justify-content: center;
  font-size: 1.2em;
  margin: 0.5em;
  color: blue;
  padding: 0.3em;
  background: #a1aff3;
}

.credit span {
  font-weight: bold;
}

.nft-card {
  width: 100%;
  max-width: 35em;
  display: flex;
  flex-direction: column;
  padding: 0.5em;
  margin: auto;
  margin-top: 3em;
}

.special-card {
  /* width: 25em; */
}

.offchain {
  opacity: 0.5;
}

.nft-card:hover {
  background: #e6e6e6;
}

.nft-card:hover .special-info {
  background: linear-gradient(180deg, #6d6d6d, #39edff);
}

.nft-card .image {
  width: 100%;
  line-height: 0;
}

.nft-card .image img {
  width: inherit;
}

.info {
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  padding: 1em;
  background: linear-gradient(180deg, #6d6d6d, #363636);
  color: white;
}

.special-info {
  background: linear-gradient(180deg, #6d6d6d, #6ab4ff);
}

.info .name {
  margin: auto;
  font-weight: bold;
  margin-bottom: 0.5em;
  text-transform: uppercase;
}

.info .description {
  font-style: italic;
}

.info .owner {
  margin: auto;
  font-size: 1.2em;
}

.info .account {
  word-wrap: break-word;
  font-size: 0.6em;
  display: flex;
  justify-content: end;
}

.info .amount {
  display: flex;
  justify-content: end;
}

.info .time {
  font-size: 0.8em;
  display: flex;
  justify-content: center;
  color: white;
  margin: 0.5em 0 1em 0;
  border-radius: 0.5em;
}

.time-blue {
  background: #538bd1;
}

.time-orange {
  background: #eb9f50;
}

.time-red {
  background: #eb5050;
}

.sold {
  font-size: 1.2em;
  display: flex;
  justify-content: center;
  color: red;
  margin-top: 0.5em;
  border: solid;
}
</style>