<script setup lang="ts">
import { ref, defineProps, onMounted, watch} from "vue"
import { Contract, utils } from "koilib";
import Alert from "./Alert.vue"
import { NftCard, NftContractClass } from "../interfaces"

const props = defineProps({
  nft: NftCard,
  contract: Contract
});

const emit = defineEmits(["close"]);

let recommendedBid = Number(props.nft!.bidAmount.replace("KOIN","").trim());
if (props.nft!.status === "started") {
  recommendedBid *= 1.01;
}

let bidAmount = ref(recommendedBid);
let creditUsed = ref("");
let alertData = ref({
  type: "",
  show: false,
  message: "",
});
const credit = ref("");

watch(bidAmount, () => { updateCreditAmount(); })

onMounted(async () => {
  const contract = props.contract as NftContractClass;
  const account = contract.signer!.getAddress();
  const { result } = await contract.functions.getCredit({ account });
  credit.value = result!.value;
  updateCreditAmount();
})

function updateCreditAmount() {
  if (!credit.value) {
    creditUsed.value = "";
    return;
  }
  const bid = Number(utils.parseUnits(bidAmount.value.toFixed(8), 8));
  const cred = credit.value ? Number(credit.value) : 0;
  let credUsed = 0;
  if (bid >= cred) credUsed = cred;
  else credUsed = bid;
  creditUsed.value = utils.formatUnits(credUsed.toString(),8);
}

async function bid() {
  try {
    const contract = props.contract as NftContractClass;
    const account = contract.signer!.getAddress();
    const { result: credit } = await contract.functions.getCredit({ account });

    let bid = Number(utils.parseUnits(bidAmount.value.toFixed(8), 8));
    let cred = 0;
    if (credit && credit.value) cred = Number(credit.value);
    let credUsed = bid >= cred ? cred : bid;
    
    const { transaction } = await contract.functions.bid({
      account,
      token_id: props.nft!.tokenId,
      koin_amount: (bid - credUsed).toString(),
      credit_amount: credUsed.toString(),
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
        <div v-if="creditUsed" class="credit">A discount of {{ creditUsed }} KOIN will be applied</div>
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

.credit {
  color: blue;
  padding: 0.3em;
  background: #a1aff3;
  margin-bottom: 1em;
  margin-top: -1em;
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