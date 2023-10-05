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
let timer: NodeJS.Timeout;

watch(name, async (newValue) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    checkName(newValue);
  }, 300);
});

const nameUpdated = computed(() => {
  return name.value.startsWith("@") ? name.value : `@${name.value}`;
});

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

async function checkName(input: string) {
  if (!input) {
    nameError.value = "";
    return false;
  }

  try {
    const value = input.startsWith("@") ? input.slice(1) : input;
    const { result } = await contract.value.functions.verify_valid_name({ value });
    nameError.value = result?.value || "";
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
    if (alreadyExist.value) nameError.value = "";
    else nameError.value = jsonMessage.error;

    if (nameError.value.includes("reserved for the owner of kap://")) {
      return true;
    }
    return false;
  }
}

async function create() {
  try {
    const valid = await checkName(name.value);
    if (valid) router.push({
      path: "/nicknames/update",
      query: { name: name.value.replace("@", ""), "newName": "true" }
    });
  } catch (error) {
    nameError.value = (error as Error).message;
  }
}

</script>

<template>
  <div>
    <HeaderProject
      title="Nicknames"
      url-path="/nicknames"
      @signer="setSigner"
    />
    <div class="nick-container">
      <div class="title">
        Nicknames
      </div>
      <div class="form">
        <input type="text" v-model="name" @keyup.enter="create()">
        <button @click="create()">Create</button>
      </div>
      <div class="name-error">{{ nameError }}</div>
      <div v-if="alreadyExist" class="card-name">
        <div class="image"></div>
        <div class="name-content">
          <div class="nickname">{{ nameUpdated }}</div>
          <button @click="$router.push(`/nicknames/${nameUpdated}`)">view</button>
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
.nick-container {
  width: 80%;
  margin: auto;
  height: calc(100vh - 13.5em);
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

.form {
  display: flex;
  align-content: center;
}

.form input {
  margin-right: 1em;
  margin-bottom: 0;
}

.form button {
  /* height: 2em; */
  /* padding: 0; */
}

.name-error {
  margin-top:0.5em;
  height: 1.2em;
}

@media only screen and (max-width: 600px) {
  .form {
    flex-direction: column;
  }

  .form input {
    margin-bottom: 1em;
  }
}
</style>