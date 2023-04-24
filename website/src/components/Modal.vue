<script setup lang="ts">
import { ref, defineProps} from "vue"
import { Contract, utils } from "koilib";
import * as kondor from "kondor-js"
import Alert from "./Alert.vue"
import { NftCard, NftContractClass } from "../interfaces"

const props = defineProps({
  nft: NftCard,
  contract: Contract
});

const emit = defineEmits(["close"]);

let recommendedBid = Number(props.nft!.bidAmount.replace("KOIN","").trim());
console.log(props.nft)
if (props.nft!.status === "started") {
  recommendedBid *= 1.01;
}

let bidAmount = ref(recommendedBid);
let alertData = ref({
  type: "",
  show: false,
  message: "",
});

async function bid() {
  try {
    const accounts = await kondor.getAccounts() as unknown as { name: string; address: string}[];
    const signer = kondor.getSigner(accounts[0].address, { network: "harbinger" });
    const contract = props.contract as NftContractClass;
    contract.signer = signer;
    const { transaction } = await contract.functions.bid({
      account: signer.getAddress(),
      token_id: props.nft!.tokenId,
      koin_amount: utils.parseUnits(bidAmount.value.toFixed(8), 8),
      credit_amount: "0",
    });
    emit("close");
  } catch (error) {
    alertData.value = {
      type: "danger",
      show: true,
      message: (error as Error).message,
    };
    throw error;
  }
}

</script>

<template>
  <div class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">
        <div class="name">{{ $props.nft!.name }}</div>
        <input v-model="bidAmount" type="number"/>
        <div class="buttons">
          <button @click="bid">Bid</button>
          <button class="modal-default-button" @click="$emit('close')">Cancel</button>
        </div>
      </div>
      <Alert
        :data="alertData"
        @close="alertData.show = false"
      />
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 20em;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.name {
  text-transform: capitalize;
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 0.5em;
}

input {
  padding: 0.5em;
  border-radius: 0.4em;
  width: 100%;
  margin-bottom: 2em;
  box-sizing: border-box;
}

.buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>