<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Contract, Provider, utils } from 'koilib'
import * as kondor from "kondor-js"
import * as abi from '../assets/nftcontract-abi.json'
import { Auctions } from "../../../contracts/build/nftcontractTypes"
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import Modal from "../components/Modal.vue"
import { NftCard, NftContractClass } from "../interfaces"

const auctionPeriod = Number(import.meta.env.VITE_AUCTION_PERIOD);

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
  "Colombia",
  "United Kingdom",
  "United States",
  "Rebel Alliance",
  "Afghanistan",
  "Algeria",
  "Angola",
  "Argentina",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Benin",
  "Bolivia",
  "Brazil",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Croatia",
  "Cuba",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Guinea",
  "Haiti",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "India",
  "Indonesia",
  "Iraq",
  "Iran",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Mali",
  "Mexico",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "Niger",
  "Nigeria",
  "North Korea",
  "Norway",
  "Pakistan",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Singapore",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const nftContractId = import.meta.env.VITE_NFT_CONTRACT_ID;
const network = import.meta.env.VITE_NETWORK;
const nftToBuy = ref({} as NftCard);
const showModal = ref(false);
const account = ref("");
const credit = ref("");
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: nftContractId,
  provider,
  abi,
}) as NftContractClass)

const nfts = ref(nftNames.map(name => {
  const nft = new NftCard();
  nft.image = `/nfts/${name.replaceAll(" ","-")}-Kondor.png`;
  nft.thumbnail = `/nfts-thumbnail/${name.replaceAll(" ","-")}-Kondor.jpg`;
  nft.name = name;
  nft.alt = name;
  nft.classCard = { offchain: true };
  nft.status = "notStarted";

  if (["Colombia", "United States", "United Kingdom", "Rebel Alliance"].includes(nft.name)) {
    nft.classInfo = { "special-info": true }
    nft.classCard = { "special-card": true, offchain: true };
    nft.special = true;
  }

  return nft;
}));

const nftsSpecial = ref(nfts.value.splice(0, 4));

onMounted(async () => {
  const { result: auctions } = await contract.value.functions.listAuctions<Auctions>({
    start: "",
    limit: 200,
    direction: 0,
  });
  auctions!.value.forEach(auction => {
    let nft = nfts.value.find(n => n.name === hexToUtf8(auction.bid.token_id));
    if (!nft) {
      nft = nftsSpecial.value.find(n => n.name === hexToUtf8(auction.bid.token_id));
      if (!nft) return;
    };
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
          const remainingTime = timeBid + auctionPeriod - Date.now();
          if (remainingTime < 3600_000) nft!.classTime = { "time-red": true };
          else if (remainingTime < 24 * 3600_000) nft!.classTime = { "time-orange": true };
          else nft!.classTime = { "time-blue": true };
          nft!.bidRemainingTime = deltaTimeToString(remainingTime);
        }, 1000);
      }
    } else {
      nft.bidRemainingTime = "available";
      nft.classTime = { "time-blue": true };
    }
  });
  
  nfts.value.sort((a,b) => {
    const bidA = Number(a.bidAmount.replace(" KOIN",""));
    const bidB = Number(b.bidAmount.replace(" KOIN",""));
    const actionA = a.status !== "notStarted";
    const actionB = b.status !== "notStarted";
    if (actionA) {
      if (actionB) {
        if (bidA !== bidB) return bidB - bidA;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
      return -1;
    }
    if (actionB) {
      return 1;
    }

    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
});

function bidNft(nft: NftCard) {
  nftToBuy.value = nft;
  showModal.value = true;
}

async function setAccount(address: string) {
  account.value = address;
  contract.value.signer = kondor.getSigner(address, { network });
  const { result } = await contract.value.functions.getCredit({ account: address });
  if (result && result.value) credit.value = utils.formatUnits(result.value, 8);
  else credit.value = "";
}

async function disconnect() {
  account.value = "";
  contract.value.signer = undefined;
  credit.value = "";
}

</script>

<template>
  <div>
    <HeaderProject
      @account="setAccount"
      @disconnect="disconnect"
    />
    <Modal 
      v-if="showModal"
      :contract="contract"
      :nft="nftToBuy"
      @close="showModal = false"
    />
    <div v-if="credit" class="credit">Good news! You have a discount of&nbsp;<span>{{ credit }} KOIN</span>&nbsp;in any NFT 🥳</div>
    <div class="slogan">Koinos blockchain spanning the World!</div>
    <div class="description-collection">
      <h1>Kondor NFTs</h1>
      <p>We are recharging batteries 🔋 to continue the development of <a href="https://chrome.google.com/webstore/detail/kondor/ghipkefkpgkladckmlmdnadmcchefhjl">Kondor Wallet</a>. Help us to reach this goal by buying one of these NFTs.</p>
      <p>We are continuosly contributing to Koinos Blockchain in many topics with our great experience in the
        development of smart contracts.
        With this collection we are also proposing a new standard for NFTs, which increases the security of the tokens 🔒. Read more on <a href="https://github.com/joticajulian/kondor-website/tree/main/contracts">Kondor NFT Contract</a>.</p>
      <h1>Auction</h1>
      <p>Each NFT is minted through auctions with a period of 7 days. For each new bid the period is extended to give time to other members to react.
        Once the NFT is minted it will be listed in <a :href="`https://kollection.app/collection/${nftContractId}`">Kollection</a>.
      </p>
      <h1>Promote yourself</h1>
      <p>By buying one of these NFTs you will also be able to store a message on it, which will be integrated in the future in the
        Kondor Wallet. This means you could use it to promote yourself or your projects in Kondor 🔥. <br> <span class="small">Note:
          This is an experimental feature subject to change or removal depending on the security or funding of the wallet.
        </span>
      </p>

    </div>
    <div class="all-nfts">
      <div v-for="(nft, i) in nftsSpecial" :key="'nft'+i" class="nft-card" :class="nft.classCard">
        <div :class="{'body-nft-card': !nft.special, 'body-nft-card-special': nft.special}">
          <router-link :to="'/kondor-nft/'+nft.name.replaceAll(' ','-')" class="image">
            <img :src="nft.thumbnail" :alt="nft.alt">
          </router-link>
          <div class="info" :class="nft.classInfo">
            <div class="name">{{ nft.name }}</div>
            <div class="amount">{{ nft.bidAmount }}</div>
            <div v-if="nft.bidAccount" class="account">bidder</div>
            <div class="account">{{ nft.bidAccount }}</div>
            <div v-if="nft.status === 'started'" class="time" :class="nft.classTime">{{ nft.bidRemainingTime }}</div>
            <div v-if="nft.status === 'sold'" class="sold">SOLD</div>
            <!-- <button 
              v-if="nft.onChain && nft.status !== 'sold'"
              class="button"
              @click="bidNft(nft)"
            >BID</button> -->
          </div>
        </div>
      </div>
    </div>
    <div class="all-nfts">
      <div v-for="(nft, i) in nfts" :key="'nft'+i" class="nft-card" :class="nft.classCard">
        <div :class="{'body-nft-card': !nft.special, 'body-nft-card-special': nft.special}">
          <router-link :to="'/kondor-nft/'+nft.name.replaceAll(' ','-')" class="image">
            <img :src="nft.thumbnail" :alt="nft.alt">
          </router-link>
          <div class="info" :class="nft.classInfo">
            <div class="name">{{ nft.name }}</div>
            <div class="amount">{{ nft.bidAmount }}</div>
            <div v-if="nft.bidAccount" class="account">bidder</div>
            <div class="account">{{ nft.bidAccount }}</div>
            <div v-if="nft.status === 'started'" class="time" :class="nft.classTime">{{ nft.bidRemainingTime }}</div>
            <div v-if="nft.status === 'sold'" class="sold">SOLD</div>
            <!-- <button 
              v-if="nft.onChain && nft.status !== 'sold'"
              class="button"
              @click="bidNft(nft)"
            >BID</button> -->
          </div>
        </div>
      </div>
    </div>
    <FootProject/>
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

.slogan {
  display: flex;
  justify-content: center;
  font-size: 5em;
  margin: 0.5em;
  text-align: center;
  font-style: italic;
  font-weight: bold;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
}

.description-collection {
  margin: auto;
  width: 50%;
  min-width: 17em;
  color: black;
}

.description-collection h1 {
  font-size: 1.3em;
}

.description-collection .small {
  font-size: 0.7em;
}

@keyframes gradient {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
}

@media only screen and (max-width: 600px) {
  .slogan {
    font-size: 3em;
  }

  .nft-card {
    width: 15em !important;
  }

  .nft-card.special-card {
    width: 20em !important;
  }
}

.all-nfts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding-top: 3em;
}
.nft-card {
  width: 17em;
}

.body-nft-card {
  display: flex;
  flex-direction: column;
  padding: 0.5em;
  margin: 0 0 1em 0em;
}

.body-nft-card-special {
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

.body-nft-card:hover {
  background: #e6e6e6;
}

.body-nft-card-special:hover {
  background: #fff6a1;
}

.nft-card:hover .special-info {
  background: linear-gradient(180deg, #231e22, #39edff);
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
  background: linear-gradient(180deg, #231e22, #6ab4ff);
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