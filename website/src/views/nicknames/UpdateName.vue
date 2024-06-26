<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as nicknamesAbi from "./nicknames-abi.json"
import HeaderProject from "../../components/HeaderProject.vue"
import FootProject from "../../components/FootProject.vue"
import ModalQuestion from "../../components/ModalQuestion.vue"
import Alert from "../../components/Alert.vue"
import { NicknamesContractClass } from "../../interfaces"

let alertData = ref({
  type: "",
  show: false,
  message: "",
});
const showModalQuestion = ref(false);
const messagePermanentAddress = ref("");
const responseQuestion = ref("");
const permanentAddress = ref(false);

const image = ref("");
const imageRender = computed(() => {
  return image.value || "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg";
});
const oldAddress = ref("");
const address = ref("");
const oldTypeAddress = ref("");
const typeAddress = ref("");
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
const { name, newName } = router.currentRoute.value.query as { name: string; newName: string; };
const account = ref("");

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

onMounted(async () => {
  try {
    const tokenId = `0x${utils.toHexString(new TextEncoder().encode(name))}`;
    const { result: resultMetadata } = await contract.value.functions.metadata_of({
      token_id: tokenId,
    });

    try {
      const { result: resultAddress } = await contract.value.functions.get_address({ value: name });
      oldAddress.value = resultAddress?.value || "";
      address.value = resultAddress?.value || "";
      if (resultAddress?.address_modifiable_only_by_governance) {
        permanentAddress.value = true;
        oldTypeAddress.value = "modifiablegov";
      } else if(resultAddress?.permanent_address) {
        permanentAddress.value = true;
        oldTypeAddress.value = "permanent";
      } else {
        permanentAddress.value = false;
        oldTypeAddress.value = "nopermanent";
      }
      typeAddress.value = oldTypeAddress.value;
    } catch(error) {
      oldAddress.value = "";
      address.value = "";
    }

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
    };
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

async function register() {
  try {
    if(!account.value) throw new Error("Connect your wallet");
    const manaAvailable = await contract.value.provider!.getAccountRc(account.value);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const tokenId = `0x${utils.toHexString(new TextEncoder().encode(name))}`;

    const previousOperations = [];
    if (newName === "true") {
      const { operation: mint } = await contract.value.functions.mint({
        to: account.value,
        token_id: tokenId,
      }, { onlyOperation: true });
      previousOperations.push(mint);
    }

    if (oldAddress.value !== address.value ) {
      if(!utils.isChecksumAddress(address.value)) {
        throw new Error(`Invalid pointing address ${address.value}`);
      }
      const { operation } = await contract.value.functions.set_address({
        token_id: tokenId,
        address: address.value,
      }, { onlyOperation: true });
      previousOperations.push(operation);
    }

    if (oldTypeAddress.value !== typeAddress.value && typeAddress.value !== "nopermanent") {
      showModalQuestion.value = true;
      messagePermanentAddress.value = typeAddress.value === "permanent"
        ? `The link between nickname @${name} and address ${address.value.slice(0,5)}...${address.value.slice(-5)} will be sealed permanently, and it will not be possible to change it in the future. Do you want to continue? (you can still update the metadata, like image, etc).`
        : `The link between nickname @${name} and address ${address.value.slice(0,5)}...${address.value.slice(-5)} will be sealed and it will not be possible to change it in the future except by Koinos Governance. Do you want to continue? (you can still update the metadata, like image, etc).`;
      responseQuestion.value = "";
      const result = await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!responseQuestion.value) return;
          resolve(responseQuestion.value);
          clearInterval(interval);
        }, 30)
      });
      showModalQuestion.value = false;
      if (result !== "accept") return;

      const { operation: extendedMetadata } = await contract.value.functions.set_extended_metadata({
        token_id: tokenId,
        permanent_address: typeAddress.value === "permanent",
        address_modifiable_only_by_governance: typeAddress.value === "modifiablegov",
      }, { onlyOperation: true });
      previousOperations.push(extendedMetadata);
    }

    const { transaction } = await contract.value.functions.set_metadata({
      token_id: tokenId,
      metadata: JSON.stringify({
        ...(image.value && { image: image.value }),
        ...(background.value && { background: background.value }),
        ...(bio.value && { bio: bio.value }),
        ...(location.value && { location: location.value }),
        ...(website.value && { website: website.value }),
        ...(email.value && { email: email.value }),
        ...(twitter.value && { twitter: twitter.value }),
        ...(telegram.value && { telegram: telegram.value }),
        ...(discord.value && { discord: discord.value }),
        ...(github.value && { github: github.value }),
      }),
    }, { rcLimit, previousOperations });

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
    <ModalQuestion 
      v-if="showModalQuestion"
      title="Permanent address"
      :subtitle="messagePermanentAddress"
      @accept="responseQuestion = 'accept'"
      @cancel="responseQuestion = 'cancel'"
    />
    <div class="nick-container">
      <div class="image">
        <img :src="imageRender">
      </div>
      <div class="content">
        <div class="title-name">
          <div class="nickname">@{{ name }}</div>
          <div class="address">{{ account }}</div>
        </div>
        <div class="form">
          <p>All fields are OPTIONAL</p>
          <div class="group">
            <label for="">Pointing address</label>
            <input type="text" v-model="address" :disabled="permanentAddress">
          </div>
          <div class="group">
            <div class="item">
              <input type="radio" value="nopermanent" v-model="typeAddress" :disabled="permanentAddress">
              <label for="">Not permanent</label>
            </div>
            <div class="item">
              <input type="radio" value="modifiablegov" v-model="typeAddress" :disabled="permanentAddress">
              <label for="">Address modifiable by governance</label>
            </div>
            <div class="item">
              <input type="radio" value="permanent" v-model="typeAddress" :disabled="permanentAddress">
              <label for="">Permanent address</label>
            </div>
          </div>
          <div class="group">
            <label for="">Image URL <span class="small">(use a service like <a href="https://postimages.org/" target="_blank">PostImages</a> to upload the image)</span></label>
            <input type="text" v-model="image">
          </div>
          <div class="group">
            <label for="">Background URL</label>
            <input type="text" v-model="background">
          </div>
          <div class="group">
            <label for="">Short bio</label>
            <input type="text" v-model="bio">
          </div>
          <div class="group">
            <label for="">Location</label>
            <input type="text" v-model="location">
          </div>
          <div class="group">
            <label for="">Website</label>
            <input type="text" v-model="website">
          </div>
          <div class="group">
            <label for="">e-mail</label>
            <input type="text" v-model="email">
          </div>
          <div class="group">
            <label for="">Twitter</label>
            <input type="text" v-model="twitter">
          </div>
          <div class="group">
            <label for="">Telegram</label>
            <input type="text" v-model="telegram">
          </div>
          <div class="group">
            <label for="">Discord</label>
            <input type="text" v-model="discord">
          </div>
          <div class="group">
            <label for="">Github</label>
            <input type="text" v-model="github">
          </div>
          <button @click="register()">{{ newName === "true" ? "Register" : "Update"}}</button>
          <button @click="router.back()" style="margin-left: 1em;">Cancel</button>
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

input {
  margin: 0;
}

.nick-container {
  display: flex;
  width: 80%;
  margin: auto;
  margin-top: 3em;
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

.content {
  background: #ffffffd1;
  border-radius: 2em;
  padding: 2em;
}

.small {
  font-size: 0.7em;
}

.group {
  margin-bottom: 1rem;
}

.item {
  display: flex;
  align-items: baseline;
}

.item input {
  width: 2rem;
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