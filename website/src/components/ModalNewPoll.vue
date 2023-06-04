<script setup lang="ts">
import { ref, defineProps } from "vue"
import { Contract } from "koilib";
import Alert from "./Alert.vue"
import { PollContractClass } from "../interfaces"

const props = defineProps({
  contract: Contract
});

const emit = defineEmits(["close"]);

let title = ref("");
let summary = ref("");
let url = ref("");
let endDate = ref(
  new Date(Date.now() + 14 * 86400_000)
    .toISOString()
    .slice(0, -14)
);
let alertData = ref({
  type: "",
  show: false,
  message: "",
});

async function create() {
  try {
    const contract = props.contract as PollContractClass;
    const account = contract.signer!.getAddress();
    const manaAvailable = await contract.provider!.getAccountRc(account);
    const rcLimit = Math.min(10_0000_0000, Number(manaAvailable)).toString();

    const { transaction } = await contract.functions.createPoll({
      title: title.value,
      summary: summary.value,
      url: url.value,
      creator: account,
      start_date: Date.now().toString(),
      end_date: new Date(endDate.value).getTime().toString(),
      tiers: [
        { value: `100000${"0".repeat(8)}` }, // 100k VHP
        { value: `10000${"0".repeat(8)}` }, // 10k VHP
        { value: `1000${"0".repeat(8)}` }, // 1k VHP
        { value: `100${"0".repeat(8)}` }, // 100 VHP
        { value: `0${"0".repeat(8)}` }, // 0 VHP
      ]
    }, { rcLimit });
    alertData.value = {
      type: "info",
      show: true,
      message: `Transaction submitted. Waiting to be mined`,
    }
    if (!transaction) throw new Error("Error submitting the transaction");
    await transaction.wait();
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
        <div class="title">Create Poll</div>
        <div class="group">
          <div class="field">Title</div>
          <input v-model="title" type="text"/>
        </div>
        <div class="group">
          <div class="field">Summary</div>
          <input v-model="summary" type="text"/>
        </div>
        <div class="group">
          <div class="field">URL</div>
          <input v-model="url" type="text"/>
        </div>
        <div class="group">
          <div class="field">End Date</div>
          <input v-model="endDate" type="text"/>
        </div>
        <div class="buttons">
          <button @click="create">Create</button>
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

}

.field {

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