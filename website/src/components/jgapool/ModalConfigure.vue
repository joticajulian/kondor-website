<script setup lang="ts">
import { ref, defineProps } from "vue"
import { Contract, utils, Transaction, Signer } from "koilib";
import Alert from "../Alert.vue"
import { FogataContractClass, UserPoolData } from "../../interfaces"

const props = defineProps({
  contract1: Contract,
  contract2: Contract,
  userData: UserPoolData,
});

const emit = defineEmits(["close"]);

const vhpUser = props.userData!.vhp;
const koinUser = props.userData!.koin;
const virtual1 = vhpUser.pool1 + koinUser.pool1;
const virtual2 = vhpUser.pool2 + koinUser.pool2;
const totalVirtual = virtual1 + virtual2 > BigInt(0)
  ? virtual1 + virtual2
  : BigInt(1);
const initialPercentageSponsors = virtual1 * BigInt(100) / totalVirtual;

let reburnSelection = ref("reburn-all");
let keepVirtual = ref("0.00000000");
let reburnPercentage = ref("0%");
let percentageSponsors = ref(initialPercentageSponsors.toString());


let alertData = ref({
  type: "",
  show: false,
  message: "",
});

async function set() {
  try {
    const contract1 = props.contract1 as FogataContractClass;
    const contract2 = props.contract2 as FogataContractClass;
    const account = contract1.signer!.getAddress();
    const manaAvailable = await contract1.provider!.getAccountRc(account);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const tx = new Transaction({
      signer: contract1.signer as Signer,
      provider: contract1.provider,
      options: { rcLimit }
    });

    // reburn configuration

    let allAfterVirtual1: string;
    let allAfterVirtual2: string;
    let percentageKoin: string;

    switch (reburnSelection.value) {
      case "reburn-keep-virtual": {
        allAfterVirtual1 = (BigInt(utils.parseUnits(keepVirtual.value, 8)) * virtual1 / totalVirtual).toString();
        allAfterVirtual2 = (BigInt(utils.parseUnits(keepVirtual.value, 8)) * virtual2 / totalVirtual).toString();
        percentageKoin = "0";
        break;
      }
      case "reburn-percentage": {
        allAfterVirtual1 = "0";
        allAfterVirtual2 = "0";
        percentageKoin = utils.parseUnits(reburnPercentage.value.replace("%","").trim(), 3);
      }
      default: {
        // reburn-all
        allAfterVirtual1 = "0";
        allAfterVirtual2 = "0";
        percentageKoin = "0";
        break;
      }      
    }

    await tx.pushOperation(contract1.functions.set_collect_koin_preferences, {
      account,
      all_after_virtual: allAfterVirtual1,
      percentage_koin: percentageKoin,
    });
    await tx.pushOperation(contract2.functions.set_collect_koin_preferences, {
      account,
      all_after_virtual: allAfterVirtual2,
      percentage_koin: percentageKoin,
    });

    // percentage sponsors configuration

    if (initialPercentageSponsors !== BigInt(percentageSponsors.value)) {
      const newVirtual1 = totalVirtual * BigInt(percentageSponsors.value) / BigInt(100);
      // const newVirtual2 = totalVirtual - newVirtual1;

      if (newVirtual1 > virtual1) {
        // move from pool#2 to pool#1
        const deltaVirtual = newVirtual1 - virtual1;
        const vhpToMove = deltaVirtual > vhpUser.pool2 ? vhpUser.pool2 : deltaVirtual;
        const koinToMove = deltaVirtual - vhpToMove;
        const params = {
          account,
          koin_amount: koinToMove.toString(),
          vhp_amount: vhpToMove.toString(),
        };
        await tx.pushOperation(contract2.functions.unstake, params);
        await tx.pushOperation(contract1.functions.stake, params);
      } else {
        // move from pool#1 to pool#2
        const deltaVirtual = virtual1 - newVirtual1;
        const vhpToMove = deltaVirtual > vhpUser.pool1 ? vhpUser.pool1 : deltaVirtual;
        const koinToMove = deltaVirtual - vhpToMove;
        const params = {
          account,
          koin_amount: koinToMove.toString(),
          vhp_amount: vhpToMove.toString(),
        };
        await tx.pushOperation(contract1.functions.unstake, params);
        await tx.pushOperation(contract2.functions.stake, params);
      }
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
        <div class="title">Configuration</div>
        <div class="group">
          <div class="field">Contribution to <a href="https://peakd.com/@jga/fogata" target="_blank">Sponsors Program</a></div>
          <input v-model="percentageSponsors" type="range" min="0" max="100" class="slider"/>
        </div>
        <div>{{ percentageSponsors }}%</div>
        <p>
          New koins minted are reburned daily to maximize rewards.
          Configure how much KOIN you want to receive before burning them
        </p>
        <div class="group-radio">
          <input v-model="reburnSelection" id="one" value="reburn-all" type="radio"/>
          <div class="field">Reburn all</div>
        </div>
        <div class="group-radio">
          <input v-model="reburnSelection" id="two" value="reburn-keep-virtual" type="radio"/>
          <div>
            <div class="field">Reburn to keep a specific VHP+KOIN above certain value and transfer the rest</div>
            <input v-model="keepVirtual" type="text"/>
          </div>
        </div>
        <div class="group-radio">
          <input v-model="reburnSelection" id="two" value="reburn-percentage" type="radio"/>
          <div>
            <div class="field">Reburn a specific percentage and transfer the rest</div>
            <input v-model="reburnPercentage" type="text"/>
          </div>
        </div>
        <div class="buttons">
          <button @click="set">Set</button>
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
  max-height: 400px;
  overflow-y: scroll;
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

.group-radio {
  width: 100%;
  display: flex;
  align-items: baseline;
}

.field {

}

input, textarea {
  padding: 0.5em;
  border-radius: 0.4em;
  margin-bottom: 0.8em;
  box-sizing: border-box;
  border-width: thin;
  font-family: sans-serif;
}

input[type="text"] {
  width: 100%;
}

input[type="radio"] {
  width: auto;
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