<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Contract, Provider, utils } from 'koilib'
import * as abi from '../../../contracts/build/nftcontract-abi.json'
import { Auctions } from "../../../contracts/build/nftcontractTypes"
import * as kondor from "kondor-js";
import HeaderProject from "../components/HeaderProject.vue"

const ONE_WEEK = 7 * 24 * 3600 * 1000;

function hexToUtf8(hex: string) {
  const buffer = utils.toUint8Array(hex.slice(2));
  return new TextDecoder().decode(buffer);
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
  "Angola",
  "test_x4",
  "Algeria",
];

const nfts = ref(nftNames.map(name => ({
  image: `/nfts/${name.replaceAll(" ","_")}-Kondor.png`,
  name,
  alt: name,
  onChain: false,
  started: false,
  sold: false,
  bidAccount: "",
  bidAmount: "",
  bidTime: "",
  bidRemainingTime: "",
  status: "",
  interval: setInterval(() => {}, 3600_000),
  classTime: {},
  classInfo: {},
  classCard: { offchain: true } as { [x: string]: boolean},
})));

nfts.value.forEach(nft => {
  if (["Colombia", "United States", "United Kingdom", "Rebel Alliance"].includes(nft.name)) {
    nft.classInfo = { "special-info": true }
    nft.classCard = { "special-card": true, offchain: true }
  }
});    

onMounted(async () => {
  const provider = new Provider(["http://harbinger-api.koinos.io"]);
  const contract = new Contract({
    id: "1LrqPKYNpUK4B5b4W1gnpeRmLqjai3i7hP",
    provider,
    abi,
  });
  const { result: auctions } = await contract.functions.listAuctions<Auctions>({
    start: "",
    limit: 20,
    direction: 0,
  });
  //console.log(JSON.stringify(auctions,null,2));
  auctions!.value.forEach(auction => {
    const nft = nfts.value.find(n => n.name === hexToUtf8(auction.bid.token_id));
    if (!nft) return;console.log(nft.name);
    nft.onChain = true;
    nft.classCard.offchain = false;
    const timeBid = Number(auction.time_bid);
    nft.bidTime = new Date(timeBid).toISOString();
    nft.bidAmount = `${utils.formatUnits(auction.bid.koin_amount, 8)} KOIN`;
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
})
</script>

<template>
  <div>
    <HeaderProject/>
    <div class="all-nfts">
      <div v-for="(nft, i) in nfts" :key="'nft'+i" class="nft-card" :class="nft.classCard">
        <div class="image">
          <img :src="nft.image" :alt="nft.alt">
        </div>
        <div class="info" :class="nft.classInfo">
          <div class="name">{{ nft.name }}</div>
          <div class="amount">{{ nft.bidAmount }}</div>
          <div v-if="nft.bidAccount" class="account">bidder</div>
          <div class="account">{{ nft.bidAccount }}</div>
          <div v-if="nft.status === 'started'" class="time" :class="nft.classTime">{{ nft.bidRemainingTime }}</div>
          <div v-if="nft.status === 'sold'" class="sold">SOLD</div>
          <button v-if="nft.onChain && nft.status !== 'sold'" class="button">BID</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.all-nfts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}
.nft-card {
  width: 15em;
  display: flex;
  flex-direction: column;
  padding: 0.5em;
  margin: 0 0 1em 0em;
}

.special-card {
  width: 20em;
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
  margin-top: 0.5em;
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