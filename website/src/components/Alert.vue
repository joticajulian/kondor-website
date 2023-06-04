<script setup lang="ts">
import { defineProps} from "vue"

defineProps<{
  data: {
    type: String,
    message: String,
    show: Boolean,
  }
}>();

</script>

<template>
  <div
    class="alert"
    :class="{
      success: data.type === 'success',
      error: data.type === 'error',
      info: data.type === 'info',
      show: data.show,
    }"
  >
    <div class="message">
      {{ data.message }}
    </div>
    <div
      class="close"
      @click="$emit('close')"
    >
      x
    </div>
  </div>
</template>

<style scoped>
.alert {
  position: fixed;
  bottom: -150px;
  margin: 0px 12px 15px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  padding: 8px 20px;
  text-align: left;
  transition: all 0.3s;
  font-family: "Inter" sans-serif !important;
  background: #292929;
  color: #f7d4d4;
}

.show {
  bottom: 30px;
}
.close {
  padding: 1em 0 1em 1em;
  cursor: pointer;
  font-size: 1.5em;
}
.message {
  padding: 2em 0;
}
.error {
  border-bottom: 3px solid red;
}
.info {
  border-bottom: 3px solid orange;
}
.success {
  border-bottom: 3px solid greenyellow;
}
</style>