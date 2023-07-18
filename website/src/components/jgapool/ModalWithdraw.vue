<script setup lang="ts">
import { ref, defineProps, watch } from "vue"
import { Contract, Transaction, Signer, utils } from "koilib";
import Alert from "../Alert.vue"
import { FogataContractClass, UserPoolData } from "../../interfaces"
import { TransactionJsonWait } from "koilib/lib/interface";

const props = defineProps({
  contract1: Contract,
  contract2: Contract,
  userData: UserPoolData,
});

const emit = defineEmits(["close"]);

let koinToWithdraw = ref("0.00000000");
let vhpToWithdraw = ref("0.00000000");
let koinDescription = ref("");
let vhpDescription = ref("");
let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const vhpUser = props.userData!.vhp;
const koinUser = props.userData!.koin;
const maxKoinPools = koinUser.pool1 + koinUser.pool2;
const maxVhpPools = vhpUser.pool1 + vhpUser.pool2;
let maxBurnkoin = BigInt(0);
koinDescription.value = `Max. ${utils.formatUnits(maxKoinPools.toString(), 8)} KOIN`;
vhpDescription.value = `Max. ${utils.formatUnits(maxVhpPools.toString(), 8)} VHP`;

watch(koinToWithdraw, async (newValue) => {
  await updateMaxValues();
});

updateMaxValues();
async function updateMaxValues() {
  if (maxBurnkoin === BigInt(0)) {
    const burnkoinContractId = "1NsQbH5AhQXgtSNg1ejpFqTi2hmCWz1eQS";
    const manaBurnkoin = await props.contract1!.provider!.getAccountRc(burnkoinContractId);
    maxBurnkoin = BigInt(manaBurnkoin);
  }
  let virtualAvailable = maxVhpPools + maxKoinPools;
  
  const koinToWithdrawValue = BigInt(utils.parseUnits(koinToWithdraw.value, 8));
  let vhpToWithdrawValue = BigInt(utils.parseUnits(vhpToWithdraw.value, 8));

  // calculate max koin available
  if (vhpToWithdrawValue > maxVhpPools) {
    console.log("not enough vhp in the pools");
    vhpToWithdrawValue = maxVhpPools;
  }
  virtualAvailable -= vhpToWithdrawValue;

  const maxKoinAvailable = virtualAvailable > maxKoinPools + maxBurnkoin
    ? maxKoinPools + maxBurnkoin
    : virtualAvailable;
  
  /* koinDescription.value = `Max. ${utils.formatUnits(maxKoinAvailable.toString(), 8)} KOIN (${
    (Number(maxKoinPools)/1e8).toFixed(2)
  } KOIN + ${
    (Number(maxBurnkoin)/1e8).toFixed(2)
  } VHP converted in burnkoin)`; */
  koinDescription.value = `Max. ${utils.formatUnits(maxKoinAvailable.toString(), 8)} KOIN`;

  // calculate max vhp available
  virtualAvailable = maxVhpPools + maxKoinPools - koinToWithdrawValue;
  const maxVhpAvailable = virtualAvailable > maxVhpPools ? maxVhpPools : virtualAvailable;
  vhpDescription.value = `Max. ${utils.formatUnits(maxVhpAvailable.toString(), 8)} VHP`;
}

async function withdraw() {
  try {
    const contract1 = props.contract1 as FogataContractClass;
    const contract2 = props.contract2 as FogataContractClass;
    const account = contract1.signer!.getAddress();
    const manaAvailable = await contract1.provider!.getAccountRc(account);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const burnkoinHelperContract = new Contract({
      id: "1KKEwAU62ZJ9BjaRAqSWKmpjZRGfUyTUaa",
      provider: contract1.provider!,
    });
    await burnkoinHelperContract.fetchAbi();
    

    let koinToWithdrawValue = BigInt(utils.parseUnits(koinToWithdraw.value, 8));
    let vhpToWithdrawValue = BigInt(utils.parseUnits(vhpToWithdraw.value, 8));

    let koinToWithdrawC2Value = BigInt(0);
    if (koinUser.pool2 >= koinToWithdrawValue) {
      koinToWithdrawC2Value = koinToWithdrawValue;
    } else {
      koinToWithdrawC2Value = koinUser.pool2;
    }
    koinToWithdrawValue -= koinToWithdrawC2Value;

    let koinToWithdrawC1Value = BigInt(0);
    if (koinUser.pool1 >= koinToWithdrawValue) {
      koinToWithdrawC1Value = koinToWithdrawValue;
    } else {
      koinToWithdrawC1Value = koinUser.pool1;
    }
    koinToWithdrawValue -= koinToWithdrawC1Value;
    const vhpToSwapInBurnkoin = koinToWithdrawValue;

    vhpToWithdrawValue += vhpToSwapInBurnkoin;

    let vhpToWithdrawC2Value = BigInt(0);
    if (vhpUser.pool2 >= vhpToWithdrawValue) {
      vhpToWithdrawC2Value = vhpToWithdrawValue;
    } else {
      vhpToWithdrawC2Value = vhpUser.pool2;
    }
    vhpToWithdrawValue -= vhpToWithdrawC2Value;

    let vhpToWithdrawC1Value = BigInt(0);
    if (vhpUser.pool1 >= vhpToWithdrawValue) {
      vhpToWithdrawC1Value = vhpToWithdrawValue;
    } else {
      vhpToWithdrawC1Value = vhpUser.pool1;
    }
    vhpToWithdrawValue -= vhpToWithdrawC1Value;

    const tx = new Transaction({
      signer: contract1.signer as Signer,
      provider: contract1.provider,
      options: { rcLimit }
    });

    if (koinToWithdrawC1Value > BigInt(0) || vhpToWithdrawC1Value > BigInt(0)) {
      await tx.pushOperation(contract1.functions.unstake, {
        account,
        koin_amount: koinToWithdrawC1Value.toString(),
        vhp_amount: vhpToWithdrawC1Value.toString(),
      });
    }

    if (koinToWithdrawC2Value > BigInt(0) || vhpToWithdrawC2Value > BigInt(0)) {
      await tx.pushOperation(contract2.functions.unstake, {
        account,
        koin_amount: koinToWithdrawC2Value.toString(),
        vhp_amount: vhpToWithdrawC2Value.toString(),
      });
    }

    if (vhpToSwapInBurnkoin > BigInt(0)) {
      await tx.pushOperation(burnkoinHelperContract.functions.swap, {
        account,
        value: vhpToSwapInBurnkoin.toString(),
        tolerance: "10",
      });
    }

    await tx.sign();
    await tx.send();
    alertData.value = {
      type: "info",
      show: true,
      message: `Transaction submitted. Waiting to be mined`,
    }

    await tx.wait();
    alertData.value = {
      type: "success",
      show: true,
      message: `Transaction mined. Wait some seconds and refresh the page`,
    }
    emit("close");
  } catch (error) {
    alertData.value = {
      type: "error",
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
        <div class="title">Withdraw</div>
        <div class="group">
          <div class="field">KOIN</div>
          <div class="description">{{ koinDescription }}</div>
          <input v-model="koinToWithdraw" type="text"/>
        </div>
        <div class="group">
          <div class="field">VHP</div>
          <div class="description">{{ vhpDescription }}</div>
          <input v-model="vhpToWithdraw" type="text"/>
        </div>
        <div class="buttons">
          <button @click="withdraw">Withdraw</button>
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

.title {
  text-transform: capitalize;
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 0.5em;
}

.group {
  width: 100%;
}

.field {

}

.description {
  font-size: 0.7em;
}

input, textarea {
  padding: 0.5em;
  border-radius: 0.4em;
  width: 100%;
  margin-bottom: 0.8em;
  box-sizing: border-box;
  border-width: thin;
  font-family: sans-serif;
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