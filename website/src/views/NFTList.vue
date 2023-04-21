<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Contract, Provider } from 'koilib'
import * as abi from './abi.json'
import * as kondor from "kondor-js";
import HeaderProject from "../components/HeaderProject.vue"

onMounted(async () => {
    console.log("on mount");
    const provider = new Provider(["http://harbinger-api.koinos.io"]);
    const contract = new Contract({
      id: "",
      provider,
      abi,
    });
    const info = await contract.functions.get_info();
    console.log(info);
})

const nfts = ref([{
  image: "/nfts/Afghanistan-Kondor.png",
  name: "Afghanistan",
  alt: "Afghanistan"
},{
  image: "/nfts/Algeria-Kondor.png",
  name: "Algeria",
  alt: "Algeria"
},{
  image: "/nfts/Angola-Kondor.png",
  name: "Angola",
  alt: "Angola"
},{
  image: "/nfts/Angola-Kondor.png",
  name: "Angola",
  alt: "Angola"
},{
  image: "/nfts/Angola-Kondor.png",
  name: "Angola",
  alt: "Angola"
},{
  image: "/nfts/Angola-Kondor.png",
  name: "Angola",
  alt: "Angola"
}])
</script>

<template>
  <div>
    <HeaderProject/>
    <div class="all-nfts">
      <div v-for="(nft, i) in nfts" :key="'nft'+i" class="nft-card">
        <div class="image">
          <img :src="nft.image" :alt="nft.alt">
        </div>
        <div class="info"></div>
        <button>view</button>
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

.nft-card:hover {
  background: #e6e6e6;
}

.nft-card .image {
  width: 100%;
}

.nft-card .image img {
  width: inherit;
}
</style>