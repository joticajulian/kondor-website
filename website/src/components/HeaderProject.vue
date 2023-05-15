<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as kondor from "kondor-js"
import MyKoinosWallet from '@roamin/my-koinos-wallet-sdk'

const emit = defineEmits(["signer", "disconnect"]);
const account = ref("");
const wallet = ref("");
const showDropdown = ref(false);

onMounted(async () => {
  const userData = window.localStorage.getItem("user");
  if (!userData) return;
  const { wallet: walletName, address } = JSON.parse(userData) as { wallet: string; address: string; };
  account.value = `${address.slice(0,4)}...${address.slice(30)}`;
  wallet.value = walletName;
  if (wallet.value === "kondor") {
    const signer = kondor.getSigner(address, { network: "harbinger" });
    emit("signer", signer);
  } else if (wallet.value === "mkw") {
    const walletConnectorUrl = 'https://my-koinos-wallet.vercel.app/embed/wallet-connector'
    const mkw = new MyKoinosWallet(walletConnectorUrl)
    await mkw.connect();
    const signer = mkw.getSigner(address);
    emit("signer", signer);
  }
});

async function connect() {
  showDropdown.value = !showDropdown.value;
  return;
}

async function disconnect() {
  window.localStorage.removeItem("user");
  account.value = "";
  wallet.value = "";
  showDropdown.value = false;
  emit("disconnect");
}

async function useKondor() {
  const accounts = await kondor.getAccounts() as unknown as {address: string}[];
  if (!accounts || accounts.length === 0) {
    account.value = "";
    return;
  }
  const { address } = accounts[0];
  account.value = `${address.slice(0,4)}...${address.slice(30)}`;
  wallet.value = "kondor";
  window.localStorage.setItem("user", JSON.stringify({
    wallet: "kondor",
    address,
  }));
  const signer = kondor.getSigner(address, { network: "harbinger" });
  emit("signer", signer);
  showDropdown.value = false;
}

async function useMKW() {
  const walletConnectorUrl = 'https://my-koinos-wallet.vercel.app/embed/wallet-connector'

  const mkw = new MyKoinosWallet(walletConnectorUrl)
  await mkw.connect()

  await mkw.requestPermissions({
    'accounts': ['getAccounts'],
    'provider': ['readContract', 'wait'],
    'signer': ['prepareTransaction', 'signAndSendTransaction'],
  });

  const accounts = await mkw.getAccounts()
  const { address } = accounts[0];
  account.value = `${address.slice(0,4)}...${address.slice(30)}`;
  wallet.value = "mkw";
  window.localStorage.setItem("user", JSON.stringify({
    wallet: "mkw",
    address,
  }));
  const signer = mkw.getSigner(address);
  emit("signer", signer);
  showDropdown.value = false;
}
</script>

<template>
  <div class="header">
    <div class="brand">
      <div class="logo"><img src="/koinosbox-white.png" alt="koinosbox"></div>
      <router-link to="/kondor-nft" class="project">Kondor NFTs</router-link>
    </div>
    <button @click="connect">{{account ? account : "Connect"}}</button>
    <div
      v-if="showDropdown"
      class="dropdown-content"
    >
      <div class="dropdown-info">
        Connect wallet
      </div>
      <div class="wallets">
        <div class="wallet" :class="{'selected': wallet === 'kondor'}" @click="useKondor()">
          <div class="image">
            <img src="/kondor-logo.png"/>
          </div>
        </div>
        <div class="wallet" :class="{'selected': wallet === 'mkw'}" @click="useMKW()">
          <div class="image">
            <img src="/mkw-logo.png"/>
          </div>
        </div>
      </div>
      <button class="disconnect" @click="disconnect">Disconnect</button>
    </div>
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

.dropdown-content {
  position: absolute;
  top: 4em;
  right: 1em;
  z-index: 10;
  background: white;
  color: black;
  border-radius: 8px;
  padding: 0.5em 1em;
  box-shadow: 5px 5px 20px #cccccc;
}

.dropdown-info {
  margin-bottom: 0.5em;
}

.wallets {
  display: flex;
  width: 15em;
  justify-content: space-between;
}

.wallet {
  width: 3em;
  height: 3em;
  padding: 2em;
  background: #eeeeee;
  border-radius: 8px;
}

.wallet.selected {
  box-shadow: 0 0 10px #6c7dde;
}

.wallet:hover {
  background: #d4d4d4;
}

.image {
  height: 100%;
  display: flex;
  justify-content: center;
}

.wallet .image img {
  height: inherit;
}

.disconnect {
  margin-top: 0.5em;
}
</style>    