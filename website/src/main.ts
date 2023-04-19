import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import NFTList from './views/NFTList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {path: '/kondor-nft', name: 'Kondor-NFT', component: NFTList }
  ],
})

createApp(App)
  .use(router)
  .mount('#app')
