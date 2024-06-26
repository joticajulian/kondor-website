<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as nicknamesAbi from "./nicknames-abi.json"
import HeaderProject from "../../components/HeaderProject.vue"
import FootProject from "../../components/FootProject.vue"
import Alert from "../../components/Alert.vue"
import { NicknamesContractClass } from "../../interfaces"

function getName(tokenId: string) {
  return new TextDecoder().decode(utils.toUint8Array(tokenId.slice(2)));
}

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const address = ref("");
const typeAddress = ref("");
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

const otherNames = ref([] as string[]);
const otherNamesOwner = ref([] as string[]);
const mainName = ref("");
const showOtherNamesOwner = ref(false);

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
    const { result: resultAddress } = await contract.value.functions.get_address({
      value: name.slice(1),
    });
    address.value = resultAddress?.value || "not registered";
    if (resultAddress?.address_modifiable_only_by_governance) {
      typeAddress.value = "modifiablegov";
    } else if(resultAddress?.permanent_address) {
      typeAddress.value = "permanent";
    } else {
      typeAddress.value = "nopermanent";
    }

    const { result: resultOwner } = await contract.value.functions.owner_of({
      token_id: tokenId,
    });
    owner.value = resultOwner?.value || "not registered";

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

    const { result: resultMainToken } = await contract.value.functions.get_main_token({
      value: address.value,
    });

    if (resultMainToken && resultMainToken.token_id) {
      mainName.value = getName(resultMainToken.token_id);
    }

    const { result: tokensByOwner } = await contract.value.functions.get_tokens_by_owner({
      owner: owner.value,
      start: "",
      limit: 80,
    });

    const { result: tokensByAddress } = await contract.value.functions.get_tokens_by_address({
      address: address.value,
      start: "",
      limit: 80,
    });

    otherNames.value = tokensByAddress?.token_ids
      .map(t => getName(t))
      .filter(n => n !== mainName.value && n !== name.slice(1))
      .sort()
      || [];

    otherNamesOwner.value = tokensByOwner?.token_ids
      .map(t => getName(t))
      .filter(n => n !== mainName.value && n !== name.slice(1) && !otherNames.value.includes(n))
      .sort()
      || [];

  } catch (error) {
    alertData.value = {
      type: "error",
      show: true,
      message: (error as Error).message
    }
    console.error(error);
  }
});

function update() {
  router.push({
    path: "/nicknames/update",
    query: { name: name.replace("@", ""), "newName": "false" }
  });
}

async function setMainName() {
  try {
    if(!account.value) throw new Error("Connect your wallet");
    const manaAvailable = await contract.value.provider!.getAccountRc(account.value);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const { transaction } = await contract.value.functions.set_main_token({
      token_id: tokenId,
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
    router.push(`/nicknames/@${name}`);
  } catch (error) {
    alertData.value = {
      type: "error",
      show: true,
      message: (error as Error).message
    }
    console.error(error);
  }
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
            <div class="address">{{ address }} 
              <span class="lock" v-if="typeAddress === 'permanent'">🔒</span>
              <span class="lock" v-if="typeAddress === 'modifiablegov'">🔐</span>
            </div>
            <div v-if="owner !== address" class="ownedby">owned by {{ owner }}</div>
            <div class="block-explorers">
              <a class="blockexplorer" :href="`https://koinosblocks.com/address/${address}`" target="_blank">koinosblocks</a>
              <a class="blockexplorer" :href="`https://koiner.app/addresses/${address}`" target="_blank">koiner</a>
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
            <div v-if="otherNames.length > 0 || mainName !== name" class="other-names">
              <h3>Names linked to same address</h3>
              <p>Main name: <a :href="`/nicknames/@${mainName}`">@{{ mainName }}</a></p>
              <p v-if="otherNames.length > 0">
                Other names:
                <span v-for="otherName in otherNames">
                  <a :href="`/nicknames/@${otherName}`">@{{ otherName }}</a>{{ " " }}
                </span>
              </p>
            </div>
            <div v-if="otherNamesOwner.length > 0" class="other-names">
              <h3>Other names of the owner <button @click="showOtherNamesOwner = !showOtherNamesOwner">
                  {{ showOtherNamesOwner ? "hide" : "show" }}
                </button>
              </h3>
              <p v-if="showOtherNamesOwner">
                <span v-for="otherName in otherNamesOwner">
                  <a :href="`/nicknames/@${otherName}`">@{{ otherName }}</a>{{ " " }}
                </span>
              </p>
            </div>
            <button v-if="account === owner" @click="update">Update</button>
            <button v-if="account === address && mainName !== name.slice(1)" @click="setMainName">Set {{ name }} as main name</button>
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

.ownedby {
  font-size: 0.8em;
}

.lock {
  font-size: 1.4rem;
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

.other-names {
  margin-top: 2em;
  font-size: 0.8em;
}

.other-names p, h3 {
  margin: 0;
}

.other-names button {
  padding: 0.1rem 0.8rem;
  margin: 0;
  height: 1.3rem;
  font-size: 0.8rem;
}

button {
  margin-right: 1em;
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