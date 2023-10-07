<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Contract, Provider, Signer, utils } from 'koilib'
import * as nicknamesAbi from "@koinosbox/contracts/assembly/nicknames/nicknames-abi.json"
import HeaderProject from "../../components/HeaderProject.vue"
import FootProject from "../../components/FootProject.vue"
import Alert from "../../components/Alert.vue"
import { NicknamesContractClass, TokenContractClass } from "../../interfaces"

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const classNotification = ref({
  error: false,
  success: false,
});

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
const account = ref("");
const name = ref("");
const nameError = ref("");
const alreadyExist = ref(false);
const loading = ref(false);
let timer: NodeJS.Timeout;

watch(name, async (newValue) => {
  loading.value = true;
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    checkName(newValue);
  }, 300);
});

function notify(type: "error" | "success" | "empty", message?: string) {
  switch (type) {
    case "error": {
      classNotification.value = {
        error: true,
        success: false,
      };
      nameError.value = message || "";
      break;
    }
    case "success": {
      classNotification.value = {
        error: false,
        success: true,
      };
      nameError.value = message || "";
      break;
    }
    case "empty": {
      classNotification.value = {
        error: false,
        success: false,
      };
      nameError.value = "";
      break;
    }
  }
  loading.value = false;
}

const nameUpdated = computed(() => {
  return name.value.startsWith("@") ? name.value : `@${name.value}`;
});

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

async function checkName(input: string) {
  if (!input) {
    notify("empty");
    return false;
  }

  try {
    const value = input.startsWith("@") ? input.slice(1) : input;
    const { result } = await contract.value.functions.verify_valid_name({ value });
    notify("success", result?.value);
    return true;
  } catch (error) {
    const { message } = error as Error;
    let jsonMessage = { error: message };
    try {
      jsonMessage = JSON.parse(message);
    } catch {
      // empty
    }
    alreadyExist.value = jsonMessage.error.includes("already exist");
    if (alreadyExist.value) {
      notify("empty");
      return false;
    }
    
    if (jsonMessage.error.includes("reserved for the owner of kap://")) {
      notify("success", jsonMessage.error);
      return true;
    }
    
    notify("error", jsonMessage.error);
    return false;
  }
}

async function create() {
  try {
    const valid = await checkName(name.value);
    if (alreadyExist.value) {
      router.push(`/nicknames/@${name.value.replace("@", "")}`);
    }
    if (valid) router.push({
      path: "/nicknames/update",
      query: { name: name.value.replace("@", ""), "newName": "true" }
    });
  } catch (error) {
    nameError.value = (error as Error).message;
  }
}

async function donate(value: number) {
  try {
    if(!account.value) throw new Error("Connect your wallet");

    const koin = new Contract({
      id: import.meta.env.VITE_KOIN_CONTRACT_ID,
      provider,
      signer: contract.value.signer as Signer,
      abi: utils.tokenAbi,
    }) as TokenContractClass;
  
    const manaAvailable = await koin.provider!.getAccountRc(account.value);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const { transaction } = await koin.functions.transfer({
      from: account.value,
      to: "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe",
      value: `${value}00000000`,
    }, { rcLimit });console.log(`${value}00000000`);

    alertData.value = {
      type: "info",
      show: true,
      message: `Donation submitted. Waiting to be mined`,
    }
    if (!transaction) throw new Error("Error submitting the transaction");
    await transaction.wait();
    alertData.value = {
      type: "success",
      show: true,
      message: `Thanks for your contribution!`,
    }
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
      title="Nicknames"
      url-path="/nicknames"
      @signer="setSigner"
      @disconnect="account = ''"
    />
    <div class="nick-container">
      <div class="title">
        <img src="/nicknames_logo_bright.svg">
      </div>
      <div class="form">
        <input type="text" v-model="name" @keyup.enter="create()">
        <button @click="create()">
          <span v-if="loading" class="loader"></span>
          <span v-else>{{ alreadyExist ? "view" : "create" }}</span>
        </button>
      </div>
      <div class="name-error" :class="classNotification">{{ nameError }}</div>
      <!--<div v-if="alreadyExist" class="card-name">
        <div class="image"></div>
        <div class="name-content">
          <div class="nickname">{{ nameUpdated }}</div>
          <button @click="$router.push(`/nicknames/${nameUpdated}`)">view</button>
        </div>
      </div>-->
    </div>
    <div class="donations">
      <button @click="donate(10)" class="donation d10">Donate 10 KOIN</button>
      <button @click="donate(30)" class="donation d30">Donate 30 KOIN</button>
      <button @click="donate(100)" class="donation d100">Donate 100 KOIN</button>
    </div>
    <FootProject :nomargin="true"/>
    <Alert
      :data="alertData"
      @close="alertData.show = false"
    />
  </div>
</template>

<style scoped>

.donations {
  display: flex;
  justify-content: end;
}

.donation {
  font-size: 0.6em;
  margin-left: 0.5em;
}

.d10 {
  background-color: #dbdbdb;
}

.d30 {
  background-color: #0e254fc7;
  color: white;
}

.d100 {
  background-color: rgb(248 116 163 / 81%);
  color: white;
  margin-right: 2em;
}

.nick-container {
  width: 80%;
  max-width: 40em;
  margin: auto;
  height: calc(100vh - 10.5em);
  align-items: center;
  vertical-align: middle;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  text-align: center;
  font-size: 3.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.title img {
  width: 80%;
  max-width: 40em;
}

.form {
  display: flex;
  align-content: center;
  width: 100%;
  justify-content: center;
}

.form input {
  margin-right: 1em;
  margin-bottom: 0;
  /* width: 60%; */
  font-size: 1em;
}

.name-error {
  margin-top: 1em;
  height: 2.5em;
  padding: 0.5em 1em;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
}

.error {
  background-color: rgb(253, 205, 205);
  color:red;
}

.success {
  background-color: rgb(205, 253, 209);
  color: green;
}

@media only screen and (max-width: 600px) {
  .form {
    flex-direction: column;
  }

  .form input {
    width: 100%;
    margin-right: 0;
    margin-bottom: 1em;
  }
}
</style>