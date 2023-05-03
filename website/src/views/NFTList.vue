<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Contract, Provider, utils } from 'koilib'
import * as kondor from "kondor-js"
import * as abi from '../../../contracts/build/nftcontract-abi.json'
import { Auctions, Auction } from "../../../contracts/build/nftcontractTypes"
import HeaderProject from "../components/HeaderProject.vue"
import Modal from "../components/Modal.vue"
import { NftCard, NftContractClass } from "../interfaces"

const ONE_WEEK = 7 * 24 * 3600 * 1000;

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

const nftNames = [
  "Afghanistan",
  "Algeria",
  "United States",
  "test_x1",
  "Angola",
  "Angola",
  "test_x2",
  "Angola",
  "test_x3",
  "test_x5",
  "test_x6",
  "test_x7",
  "test_x8",
  "test_x9",
  "test_x10",
  "test_x11",
  "test_x12",
  "Angola",
  "test_x4",
  "Algeria",
];

const nftToBuy = ref({} as NftCard);
const showModal = ref(false);
const account = ref("");
const credit = ref("");
const provider = new Provider(["http://harbinger-api.koinos.io"]);
const contract = ref(new Contract({
  id: "1LrqPKYNpUK4B5b4W1gnpeRmLqjai3i7hP",
  provider,
  abi,
}) as NftContractClass)

const nfts = ref(nftNames.map(name => {
  const nft = new NftCard();
  nft.image = `/nfts/${name.replaceAll(" ","_")}-Kondor.png`;
  nft.name = name;
  nft.alt = name;
  nft.classCard = { offchain: true };

  if (["Colombia", "United States", "United Kingdom", "Rebel Alliance"].includes(nft.name)) {
    nft.classInfo = { "special-info": true }
    nft.classCard = { "special-card": true, offchain: true };
  }

  return nft;
}));   

onMounted(async () => {
  const { result: auctions } = await contract.value.functions.listAuctions<Auctions>({
    start: "",
    limit: 20,
    direction: 0,
  });
  auctions!.value.forEach(auction => {
    const nft = nfts.value.find(n => n.name === hexToUtf8(auction.bid.token_id));
    if (!nft) return;
    nft.onChain = true;
    nft.tokenId = auction.bid.token_id;
    nft.classCard.offchain = false;
    const timeBid = Number(auction.time_bid);
    nft.bidTime = new Date(timeBid).toISOString();
    const koinAmount = auction.bid.koin_amount ? Number(auction.bid.koin_amount) : 0;
    const creditAmount = auction.bid.credit_amount ? Number(auction.bid.credit_amount) : 0;
    nft.bidAmount = `${utils.formatUnits((koinAmount+creditAmount).toString(), 8)} KOIN`;
    nft.bidAccount = auction.bid.account;
    if (auction.started) {
      if (auction.sold) {
        nft.status = "sold";
      } else {
        nft.status = "started";
        clearInterval(nft.interval);
        nft.interval = setInterval(() => {
          const remainingTime = timeBid + ONE_WEEK - Date.now();
          if (remainingTime < 3600_000) nft.classTime = { "time-red": true };
          else if (remainingTime < 24 * 3600_000) nft.classTime = { "time-orange": true };
          else nft.classTime = { "time-blue": true };
          nft.bidRemainingTime = deltaTimeToString(remainingTime);
        }, 1000);
      }
    } else {
      nft.bidRemainingTime = "available";
      nft.classTime = { "time-blue": true };
    }
  });    
});

function bidNft(nft: NftCard) {
  nftToBuy.value = nft;
  showModal.value = true;
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
      :nft="nftToBuy"
      @close="showModal = false"
    />
    <div v-if="credit" class="credit">Good news! You have a discount of&nbsp;<span>{{ credit }} KOIN</span>&nbsp;in any NFT 🥳</div>
    <div class="all-nfts">
      <div v-for="(nft, i) in nfts" :key="'nft'+i" class="nft-card" :class="nft.classCard">
        <router-link :to="'/kondor-nft/'+nft.name.replaceAll(' ','_')" class="image">
          <img :src="nft.image" :alt="nft.alt">
        </router-link>
        <div class="info" :class="nft.classInfo">
          <div class="name">{{ nft.name }}</div>
          <div class="amount">{{ nft.bidAmount }}</div>
          <div v-if="nft.bidAccount" class="account">bidder</div>
          <div class="account">{{ nft.bidAccount }}</div>
          <div v-if="nft.status === 'started'" class="time" :class="nft.classTime">{{ nft.bidRemainingTime }}</div>
          <div v-if="nft.status === 'sold'" class="sold">SOLD</div>
          <button 
            v-if="nft.onChain && nft.status !== 'sold'"
            class="button"
            @click="bidNft(nft)"
          >BID</button>
        </div>
      </div>
    </div>
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

.all-nfts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding-top: 3em;
}
.nft-card {
  width: 15em;
  display: flex;
  flex-direction: column;
  padding: 0.5em;
  margin: 0 0 1em 0em;
}

.special-card {
  width: 25em;
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