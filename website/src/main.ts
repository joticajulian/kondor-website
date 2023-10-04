import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import LandingPage from './views/LandingPage.vue'
import NFTList from './views/NFTList.vue'
import NFT from './views/NFT.vue'
import PollList from './views/PollList.vue'
import Poll from './views/Poll.vue'
import JgaPool from './views/JgaPool.vue'
import JgaPoolGov from './views/JgaPoolGov.vue'
import JgaPoolProposal from './views/JgaPoolProposal.vue'
import Nicknames from './views/nicknames/index.vue'
import UpdateName from './views/nicknames/UpdateName.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'LandingPage', component: LandingPage },
    { path: '/polls', name: 'Poll-List', component: PollList },
    { path: '/polls/:id', name: 'Poll', component: Poll },
    { path: '/kondor-nft', name: 'Kondor-NFT-List', component: NFTList },
    { path: '/kondor-nft/:id', name: 'Kondor-NFT', component: NFT },
    { path: '/jgapool', name: 'Jga-Pool', component: JgaPool },
    { path: '/jgapool/gov', name: 'Jga-Pool-Gov-List', component: JgaPoolGov },
    { path: '/jgapool/gov/:id', name: 'Jga-Pool-Proposal', component: JgaPoolProposal },
    { path: '/nicknames', name: 'Nicknames', component: Nicknames },
    { path: '/nicknames/update', name: 'Nicknames-update', component: UpdateName },
  ],
})

createApp(App)
  .use(router)
  .mount('#app')
