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
    <div class="brand">
      <div class="logo"><img src="/koinosbox.svg" alt="koinosbox"></div>
      <router-link to="/kondor-nft" class="project">Kondor NFTs</router-link>
    </div>
    <button @click="connect">{{account ? account : "Connect"}}</button>
  </div>
</template>

<style scoped>

.header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 65%, rgba(223,223,223,1) 100%);
}

.brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  margin-right: 1.5em;
}

.logo img {
  width: 2em;
}

.project {
  font-size: 2em;
  font-weight: bold;
}

.logo-koinos img {
  width: 3em;
}

@media only screen and (max-width: 600px) {
  .project {
    font-size: 1.2em;
  }
}
</style>    