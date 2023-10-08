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
const websiteRender = computed(() => {
  return website.value.startsWith("http") ? website.value : `https://${website.value}`;
});
const twitterRender = computed(() => twitter.value && twitter.value.startsWith("http") ? twitter.value : `https://twitter.com/${twitter.value}`);
const githubRender = computed(() => github.value && github.value.startsWith("http") ? github.value : `https://github.com/${github.value}`);
const discordRender = computed(() => discord.value && discord.value.startsWith("http") ? discord.value : `https://discord.com/users/${discord.value}`);
const telegramRender = computed(() => telegram.value && telegram.value.startsWith("http") ? telegram.value : `https://t.me/${telegram.value}`);

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
const tokenId = `0x${utils.toHexString(new TextEncoder().encode(name.slice(1)))}`;
const account = ref("");

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

onMounted(async () => {
  try {
    if (!name.startsWith("@")) throw new Error("The nickname must start with @");
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

function update() {
  router.push({
    path: "/nicknames/update",
    query: { name: name.replace("@", ""), "newName": "false" }
  });
}
</script>

<template>
  <div class="page" :style="`background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 1)), url(${background});`">
    <HeaderProject
      title="Nicknames"
      url-path="/nicknames"
      @signer="setSigner"
      @disconnect="account = ''"
    />
    <div class="nick-container">
      <div class="image">
        <img :src="imageRender">
      </div>
      <div class="content">
        <div class="content-box">
          <div class="title-name">
            <div class="nickname">{{ name }}</div>
            <div class="address">{{ owner }}</div>
            <div class="block-explorers">
              <a class="blockexplorer" :href="`https://koinosblocks.com/address/${owner}`" target="_blank">koinosblocks</a>
              <a class="blockexplorer" :href="`https://koiner.app/addresses/${owner}`" target="_blank">koiner</a>
            </div>
          </div>
          <div class="data">
            <div v-if="bio" class="bio">{{ bio }}</div>
            <div v-if="location" class="location"><font-awesome-icon icon="fa-solid fa-location-dot" /> {{ location }}</div>
            <a v-if="website" :href="websiteRender" class="website" target="_blank">{{ website }}</a>
            <div v-if="email" class="email">{{ email }}</div>
            <div class="brands">
              <a v-if="twitter" :href="twitterRender" target="_blank" class="brand-icon"><font-awesome-icon icon="fa-brands fa-twitter" /></a>
              <a v-if="telegram" :href="telegramRender" target="_blank" class="brand-icon"><font-awesome-icon icon="fa-brands fa-telegram" /></a>
              <a v-if="discord" :href="discordRender" target="_blank" class="brand-icon"><font-awesome-icon icon="fa-brands fa-discord" /></a>
              <a v-if="github" :href="githubRender" target="_blank" class="brand-icon"><font-awesome-icon icon="fa-brands fa-github" /></a>
            </div>
            <button v-if="account === owner" @click="update">Update</button>
          </div>
        </div>
        <div class="token-id">Token ID: {{ tokenId }}</div>
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
.nick-container {
  display: flex;
  width: 80%;
  margin: auto;
  margin-top: 3em;
  min-height: calc(100vh - 16.5em);
}

.token-id {
  text-align: center;
  color: gray;
  font-size: 0.7em;
}

.image {
  width: 15em;
  line-height: 0;
  margin-right: 2em;
}

.image img {
  width: inherit;
  border-radius: 20%;
  box-shadow: 0em 0em 2em white;
}

.nickname {
  font-size: 3em;
  word-break: break-all;
  font-weight: bold;
}

.address {
  font-weight: bold;
}

.block-explorers {
  display: flex;
  justify-content: end;
  margin-top: 0.2em;
}

.blockexplorer {
  margin-left: 0.5em;
  font-size: 0.8em;
  font-weight: unset;
  color: white;
  background-color: blueviolet;
  border-radius: 8px;
  padding: 0.2em 0.7em;
}

.content-box {
  background: #ffffffd1;
  border-radius: 2em;
  padding: 2em;
}

.data button {
  margin-top: 2em;
}

.bio {
  margin: 1em 0;
}

.location, .email {
  text-align: end;
}

.website {
  display: flex;
  justify-content: end;
}

.brands {
  margin-top:1em;
  text-align: center;
}

.brand-icon {
  font-size: 2em;
  margin: 1em 0.2em;
}

@media only screen and (max-width: 800px) {
  .nick-container {
    flex-direction: column;
    align-items: center;
  }

  .title-name {
    text-align: center;
  }

  .image {
    margin-right: 0;
    margin-bottom: 3em;
  }

  .address {
    font-size: 0.8em;
  }
}
</style>