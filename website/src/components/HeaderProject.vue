<script setup lang="ts">
import { ref } from "vue";
import * as kondor from "kondor-js"

const emit = defineEmits(["account"]);
const account = ref("");
async function connect() {
  const accounts = await kondor.getAccounts() as unknown as {address: string}[];
  if (!accounts || accounts.length === 0) {
    account.value = "";
    return;
  }
  const { address } = accounts[0];
  account.value = `${address.slice(0,4)}...${address.slice(30)}`;
  emit("account", address);
}
</script>

<template>
  <div class="header">
    <div class="logo"><img src="/koinosbox.svg" alt="koinosbox"></div>
    <div class="project">Kondor NFTs</div>
    <button @click="connect">{{account ? account : "Connect"}}</button>
  </div>
</template>

<style scoped>
.header{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo img {
  width: 3em;
}

.project {
  font-size: 3.2em;
  font-weight: bold;
}

.logo-koinos img {
  width: 3em;
}

@media only screen and (max-width: 600px) {
  .project {
    font-size: 2em;
  }
}
</style>    