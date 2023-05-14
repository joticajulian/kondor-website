<script setup lang="ts">
  import { ref } from "vue";
  const version = ref(import.meta.env.VITE_WEBSITE_VERSION);
</script>

<template>
  <div class="footer">
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
  margin-top: 4em;
  background: black;
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