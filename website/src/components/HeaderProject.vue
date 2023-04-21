<script setup lang="ts">
</script>

<template>
  <div class="header">
    <div class="logo"><img src="/koinosbox.svg" alt="koinosbox"></div>
    <div class="project">Kondor NFTs</div>
    <div class="logo-koinos"><img src="/koinos.svg" alt="koinos"></div>
  </div>
</template>

<style scoped>
.header{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo img {
  width: 3em;
}

.project {
  font-size: 3.2em;
  font-weight: bold;
}

.logo-koinos img {
  width: 3em;
}

@media only screen and (max-width: 600px) {
  .project {
    font-size: 2em;
  }
}
</style>    