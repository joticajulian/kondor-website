<script setup lang="ts">
import { ref, defineProps } from "vue"
import { Contract, utils } from "koilib";
import Alert from "../Alert.vue"
import { FogataContractClass, UserPoolData } from "../../interfaces"
import { TransactionJsonWait } from "koilib/lib/interface";

const props = defineProps({
  contract1: Contract,
  contract2: Contract,
  userData: UserPoolData,
});

const emit = defineEmits(["close"]);

let koinToDeposit = ref("0.00000000");
let vhpToDeposit = ref("0.00000000");
let alertData = ref({
  type: "",
  show: false,
  message: "",
});

async function deposit() {
  try {
    const contract1 = props.contract1 as FogataContractClass;
    const contract2 = props.contract2 as FogataContractClass;
    const account = contract1.signer!.getAddress();
    const manaAvailable = await contract1.provider!.getAccountRc(account);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const koinToDepositValue = BigInt(utils.parseUnits(koinToDeposit.value, 8));
    const vhpToDepositValue = BigInt(utils.parseUnits(vhpToDeposit.value, 8));
    const vhpUser = props.userData!.vhp;
    let koinToDepositC2Value = koinToDepositValue;
    let vhpToDepositC2Value = vhpToDepositValue;
    if (vhpUser.pool1 + vhpUser.pool2 > BigInt(0)) {
      koinToDepositC2Value = koinToDepositValue * vhpUser.pool2 / (vhpUser.pool1 + vhpUser.pool2);
      vhpToDepositC2Value = vhpToDepositValue * vhpUser.pool2 / (vhpUser.pool1 + vhpUser.pool2);
    }
    const koinToDepositC1Value = koinToDepositValue - koinToDepositC2Value;
    const vhpToDepositC1Value = vhpToDepositValue - vhpToDepositC2Value;
    let tx: TransactionJsonWait;
    if ((koinToDepositC1Value > BigInt(0) || vhpToDepositC1Value > BigInt(0)) && 
        (koinToDepositC2Value > BigInt(0) || vhpToDepositC2Value > BigInt(0))) {
      const { operation: op1 } = await contract1.functions.stake({
        account,
        koin_amount: koinToDepositC1Value.toString(),
        vhp_amount: vhpToDepositC1Value.toString(),
      }, { onlyOperation: true });

      const { transaction } = await contract2.functions.stake({
        account,
        koin_amount: koinToDepositC2Value.toString(),
        vhp_amount: vhpToDepositC2Value.toString(),
      }, { rcLimit, previousOperations: [op1] });
      tx = transaction!;
    } else if (koinToDepositC1Value > BigInt(0) || vhpToDepositC1Value > BigInt(0)) {
      const { transaction } = await contract1.functions.stake({
        account,
        koin_amount: koinToDepositC1Value.toString(),
        vhp_amount: vhpToDepositC1Value.toString(),
      }, { rcLimit });
      tx = transaction!;
    } else {
      const { transaction } = await contract2.functions.stake({
        account,
        koin_amount: koinToDepositC2Value.toString(),
        vhp_amount: vhpToDepositC2Value.toString(),
      }, { rcLimit });
      tx = transaction!;
    }

    alertData.value = {
      type: "info",
      show: true,
      message: `Transaction submitted. Waiting to be mined`,
    }
    if (!tx) throw new Error("Error submitting the transaction");
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
        <div class="title">Deposit</div>
        <div class="group">
          <div class="field">KOIN</div>
          <input v-model="koinToDeposit" type="text"/>
        </div>
        <div class="group">
          <div class="field">VHP</div>
          <input v-model="vhpToDeposit" type="text"/>
        </div>
        <div class="buttons">
          <button @click="deposit">Deposit</button>
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