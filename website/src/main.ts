import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import NFTList from './views/NFTList.vue'
import NFT from './views/NFT.vue'
import PollList from './views/PollList.vue'
import Poll from './views/Poll.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: 'kondor-nft' },
    { path: '/polls', name: 'Poll-List', component: PollList },
    { path: '/polls/:id', name: 'Poll', component: Poll },
    { path: '/kondor-nft', name: 'Kondor-NFT-List', component: NFTList },
    { path: '/kondor-nft/:id', name: 'Kondor-NFT', component: NFT }
  ],
})

createApp(App)
  .use(router)
  .mount('#app')
