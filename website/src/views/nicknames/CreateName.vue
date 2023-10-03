<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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

const account = ref("");
const name = ref("");
const nameError = ref("");
const alreadyExist = ref(false);

watch(name, async (newValue) => {
  checkName(newValue);
});

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  contract.value.signer = signer;
}

async function checkName(input: string) {
  if (!input) {
    nameError.value = "";
    return;
  }

  try {
    const value = input.startsWith("@") ? input.slice(1) : input;
    const { result } = await contract.value.functions.verify_valid_name({ value });
    nameError.value = result?.value || "";
  } catch (error) {
    const { message } = error as Error;
    let jsonMessage = { error: message };
    try {
      jsonMessage = JSON.parse(message);
    } catch {
      // empty
    }
    nameError.value = jsonMessage.error;
  }
}

async function create() {
  try {
    await contract.value.functions.verify_valid_name({ value: name.value });
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
        <input type="text" v-model="name">
        <button @click="create()">Create</button>
      </div>
      <div class="name-error">{{ nameError }}</div>
      <div v-if="alreadyExist" class="card-name">
        <div class="image"></div>
        <div class="name-content">
          <div class="nickname">@jga</div>
          <button @click="$router.push('/nicknames/@jga')">view</button>
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