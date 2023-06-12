<script setup lang="ts">
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
</script>

<template>
  <div>
    <HeaderProject
      title="Koinos Box"
    />
    <div class="all-projects">
      <router-link to="/kondor-nft" class="project-card">
        <img src="/kondor-nfts.svg">
        <div class="title">Kondor NFTs</div>
      </router-link>
      <router-link to="/polls" class="project-card">
        <img src="/poll.png">
        <div class="title">Polls</div>
      </router-link>
    </div>
    <FootProject/>
  </div>
</template>

<style scoped>
.all-projects {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding-top: 3em;
}

.all-projects a {
  
}

.project-card {
  width: 100%;
  max-width: 25em;
  text-align: center;
  margin: 2em;
}

.all-projects img {
  width: inherit;
}

.title {
  font-size: 2em;
}
</style>
