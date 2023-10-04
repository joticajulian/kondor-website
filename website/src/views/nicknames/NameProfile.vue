<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as nicknamesAbi from "@koinosbox/contracts/assembly/nicknames/nicknames-abi.json"
import HeaderProject from "../../components/HeaderProject.vue"
import FootProject from "../../components/FootProject.vue"
import Alert from "../../components/Alert.vue"
import { NicknamesContractClass } from "../../interfaces"

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const owner = ref("");
const image = ref("");
const imageRender = computed(() => {
  return image.value || "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg";
});
const background = ref("");
const bio = ref("");
const location = ref("");
const website = ref("");
const email = ref("");
const twitter = ref("");
const telegram = ref("");
const discord = ref("");
const github = ref("");

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const nicknamesContractId = ref(import.meta.env.VITE_NICKNAMES_CONTRACT_ID);
const network = import.meta.env.VITE_NETWORK;
const provider = new Provider(rpcNodes);
const contract = ref(new Contract({
  id: nicknamesContractId.value,
  provider,
  abi: nicknamesAbi,
}) as NicknamesContractClass);

const router = useRouter();
const name = router.currentRoute.value.params.id as string;
const account = ref("");

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

onMounted(async () => {
  try {
    if (!name.startsWith("@")) throw new Error("The nickname must start with @");
    const tokenId = `0x${utils.toHexString(new TextEncoder().encode(name.slice(1)))}`;
    const { result: resultOwner } = await contract.value.functions.owner_of({
      token_id: tokenId,
    });
    owner.value = resultOwner?.account || "not registered";

    const { result: resultMetadata } = await contract.value.functions.metadata_of({
      token_id: tokenId,
    });
    const metadata = JSON.parse(resultMetadata?.value || "{}") as {
      image: string;
      background: string;
      bio: string;
      location: string;
      website: string;
      email: string;
      twitter: string;
      telegram: string;
      discord: string;
      github: string;
    }
    image.value = metadata.image;
    background.value = metadata.background;
    bio.value = metadata.bio;
    location.value = metadata.location;
    website.value = metadata.website;
    email.value = metadata.email;
    twitter.value = metadata.twitter;
    telegram.value = metadata.telegram;
    discord.value = metadata.discord;
    github.value = metadata.github;
  } catch (error) {
    alertData.value = {
      type: "error",
      show: true,
      message: (error as Error).message
    }
  }
});
</script>

<template>
  <div>
    <HeaderProject
      title="Nicknames"
      url-path="/nicknames"
      @signer="setSigner"
    />
    <div class="nick-container">
      <div class="image">
        <img :src="image">
      </div>
      <div class="content">
        <div class="title-name">
          <div class="nickname">{{ name }}</div>
          <div class="address">{{ owner }}</div>
        </div>
        <div class="data">
          <div class="bio">{{ bio }}</div>
          <div class="location">{{ location }}</div>
          <div class="website">{{ website }}</div>
          <div class="email">{{ email }}</div>
          <div class="twitter">{{ twitter }}</div>
          <div class="telegram">{{ telegram }}</div>
          <div class="discord">{{ discord }}</div>
          <div class="github">{{ github }}</div>
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

</style>