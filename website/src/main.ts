import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import NFTList from './views/NFTList.vue'
import NFT from './views/NFT.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/kondor-nft', name: 'Kondor-NFT-List', component: NFTList },
    { path: '/kondor-nft/:id', name: 'Kondor-NFT', component: NFT }
  ],
})

createApp(App)
  .use(router)
  .mount('#app')
