<script setup lang="ts">
  import { ref, defineProps } from "vue";
  const version = ref(import.meta.env.VITE_WEBSITE_VERSION);

  const props = defineProps({
    nomargin: Boolean,
  });
</script>

<template>
  <div class="footer" :class="{ margin: !nomargin }">
    <div class="logo"><img src="/koinosbox.svg" alt="koinosbox"></div>
    <div class="name">Koinos Box {{version}} by <a href="https://github.com/sponsors/joticajulian">@joticajulian</a></div>
  </div>
</template>

<style scoped>

.footer{
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2em 0em;
  background: black;
}

.margin {
  margin-top: 4em;
}

.logo {
  display: flex;
}

.logo img {
  width: 1.5em;
}

.name {
  color: white;
  margin-left: 1em;
}
</style>    