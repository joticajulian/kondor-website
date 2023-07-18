<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Contract, Provider, Signer, utils } from 'koilib'
import HeaderProject from "../components/HeaderProject.vue"
import FootProject from "../components/FootProject.vue"
import Alert from "../components/Alert.vue"
import ModalDeposit from "../components/jgapool/ModalDeposit.vue"
import ModalWithdraw from "../components/jgapool/ModalWithdraw.vue"
import ModalConfigure from "../components/jgapool/ModalConfigure.vue"
import { UserPoolData } from '../interfaces'

let alertData = ref({
  type: "",
  show: false,
  message: "",
});

const rpcNodes = import.meta.env.VITE_RPC_NODES.split(",");
const vhpContractId = import.meta.env.VITE_VHP_CONTRACT_ID;
const koinContractId = import.meta.env.VITE_KOIN_CONTRACT_ID;
const pobContractId = import.meta.env.VITE_POB_CONTRACT_ID;
const vaporContractId = import.meta.env.VITE_VAPOR_CONTRACT_ID;
const jgaPool1Id = import.meta.env.VITE_JGAPOOL_1_ID;
const jgaPool2Id = import.meta.env.VITE_JGAPOOL_2_ID;
const network = import.meta.env.VITE_NETWORK;
const provider = new Provider(rpcNodes);

const account = ref("");
const vhpTotal = ref("");
const koinTotal = ref("");
const numberAccounts = ref("");
const userData = ref({} as UserPoolData);
const userTotalKoin = ref("");
const userKoin = ref("");
const userTotalVhp = ref("");
const userVhp = ref("");
const userTotalVapor = ref("");
const userVapor = ref("");
const userTotalKoinVhp = ref("");
const apy = ref("");
const apyKoin = ref("");
const apySponsors = ref("");
const koinRewards1Year = ref("");
const koinRewards1Month = ref("");
const koinRewards1Day = ref("");
const userVhp1Year = ref("");
const userVhp1Day = ref("");
const sponsors1Day = ref("");
const ratioVapor = ref("");
const vapor1Day = ref("");

const showModalDeposit = ref(false);
const showModalWithdraw = ref(false);
const showModalConfigure = ref(false);

const vhpContract = new Contract({
  id: vhpContractId,
  abi: utils.tokenAbi,
  provider,
});

const koinContract = new Contract({
  id: koinContractId,
  abi: utils.tokenAbi,
  provider,
});

const pobContract = new Contract({
  id: pobContractId,
  provider,
});

const vaporContract = new Contract({
  id: vaporContractId,
  abi: utils.tokenAbi,
  provider,
});

const pool1Contract = new Contract({
  id: jgaPool1Id,
  provider,
});

const pool2Contract = new Contract({
  id: jgaPool2Id,
  provider,
});

onMounted(() => {
  getGlobalValues();
});

async function setupContracts() {
  if(pool1Contract.abi) return;
  const abi = await pool1Contract.fetchAbi();
  pool2Contract.abi = abi;
  pool2Contract.serializer = pool1Contract.serializer;
  pool2Contract.updateFunctionsFromAbi();

  await pobContract.fetchAbi();
  pobContract.abi!.methods.get_metadata.entry_point = 0xfcf7a68f;
  pobContract.abi!.methods.get_metadata.read_only = true;
}

async function getGlobalValues() {
  try {
    let vhpBalance1 = BigInt(0);
    let vhpBalance2 = BigInt(0);
    const { result: r1 } = await vhpContract.functions.balanceOf({
      owner: jgaPool1Id,
    });
    const { result: r2 } = await vhpContract.functions.balanceOf({
      owner: jgaPool2Id,
    });
    
    if (r1) vhpBalance1 = BigInt(r1.value);
    if (r2) vhpBalance2 = BigInt(r2.value);
    
    await setupContracts();
    const { result: r3 } = await pool1Contract.functions.get_pool_state();
    const { result: r4 } = await pool2Contract.functions.get_pool_state();
    const state1 = r3 as { virtual: string; user_count: string; }
    const state2 = r4 as { virtual: string; user_count: string; }

    const koinBalance1 = BigInt(state1.virtual) - vhpBalance1;
    const koinBalance2 = BigInt(state2.virtual) - vhpBalance2;
    
    vhpTotal.value = utils.formatUnits((vhpBalance1 + vhpBalance2).toString(), 8);
    koinTotal.value = utils.formatUnits((koinBalance1 + koinBalance2).toString(), 8);
    numberAccounts.value = state2.user_count;
  } catch (error) {
    console.error(error);
  }
}

function getCurrentRatioVapor() {
  const TIME_1 = BigInt(1677628800000); // Wednesday, March 1, 2023 12:00:00 AM
  const TIME_2 = BigInt(1709251200000); // Friday, March 1, 2024 12:00:00 AM
  const DECAY_PERIOD = BigInt(31622400000); // TIME_2 - TIME_1 = 1 year
  const MAX_MINT_FACTOR = BigInt(2000);
  const now = BigInt(Date.now());
  if (now < TIME_1) return MAX_MINT_FACTOR;
  if (TIME_1 <= now && now <= TIME_2) {
    const dt = now - TIME_1;
    return (MAX_MINT_FACTOR * DECAY_PERIOD - (MAX_MINT_FACTOR - BigInt(100)) * dt) / DECAY_PERIOD;
  }
  return BigInt(100);
}

async function getUserData() {
  const { result: balanceKoinContract } = await koinContract.functions.balanceOf({
    owner: account.value,
  });
  const { result: balanceVhpContract } = await vhpContract.functions.balanceOf({
    owner: account.value,
  });
  const { result: balanceVaporContract } = await vaporContract.functions.balanceOf({
    owner: account.value,
  });
  await setupContracts();
  const { result: balancePool1 } = await pool1Contract.functions.balance_of({
    account: account.value,
  });
  const { result: balancePool2 } = await pool2Contract.functions.balance_of({
    account: account.value,
  });
  const user: UserPoolData = {
    koin: {
      pool1: balancePool1 && balancePool1.koin_amount ? BigInt(balancePool1.koin_amount) : BigInt(0),
      pool2: balancePool2 && balancePool2.koin_amount ? BigInt(balancePool2.koin_amount) : BigInt(0),
      wallet: balanceKoinContract && balanceKoinContract.value ? BigInt(balanceKoinContract.value) : BigInt(0),
    },
    vhp: {
      pool1: balancePool1 && balancePool1.vhp_amount ? BigInt(balancePool1.vhp_amount) : BigInt(0),
      pool2: balancePool2 && balancePool2.vhp_amount ? BigInt(balancePool2.vhp_amount) : BigInt(0),
      wallet: balanceVhpContract && balanceVhpContract.value ? BigInt(balanceVhpContract.value) : BigInt(0),
    },
    vapor: {
      pool1: balancePool1 && balancePool1.vapor_amount ? BigInt(balancePool1.vapor_amount) : BigInt(0),
      pool2: balancePool2 && balancePool2.vapor_amount ? BigInt(balancePool2.vapor_amount) : BigInt(0),
      wallet: balanceVaporContract && balanceVaporContract.value ? BigInt(balanceVaporContract.value) : BigInt(0),
    }
  };
  userData.value = user;

  userTotalKoin.value = utils.formatUnits((user.koin.pool1 + user.koin.pool2 + user.koin.wallet).toString(), 8);
  userKoin.value = utils.formatUnits((user.koin.pool1 + user.koin.pool2).toString(), 8);
  userTotalVhp.value = utils.formatUnits((user.vhp.pool1 + user.vhp.pool2 + user.vhp.wallet).toString(), 8);
  userVhp.value = utils.formatUnits((user.vhp.pool1 + user.vhp.pool2).toString(), 8);
  userTotalVapor.value = utils.formatUnits((user.vapor.pool1 + user.vapor.pool2 + user.vapor.wallet).toString(), 8);
  userVapor.value = utils.formatUnits((user.vapor.pool1 + user.vapor.pool2).toString(), 8);
  userTotalKoinVhp.value = utils.formatUnits((
    user.koin.pool1 + user.koin.pool2 + user.koin.wallet
    + user.vhp.pool1 + user.vhp.pool2 + user.vhp.wallet
  ).toString(), 8);

  const { result: pobMetadata } = await pobContract.functions.get_metadata({});
  const difficulty = BigInt(`0x${utils.toHexString(utils.decodeBase64url(pobMetadata!.value.difficulty))}`);
  const producing = difficulty / BigInt(300); // pobConsensusParams.target_block_interval / pobConsensusParams.quantum_length
  const { result: totalSupplyKoin } = await koinContract.functions.totalSupply();
  const { result: totalSupplyVhp } = await vhpContract.functions.totalSupply();
  const virtualSupply = BigInt(totalSupplyKoin!.value) + BigInt(totalSupplyVhp!.value);

  // 2% of inflation minus %3 fees for the node operator = 2% * (1 - 0.03) = 1.94%
  const apyValue = BigInt(194) * virtualSupply / producing;
  let apyKoinValue = BigInt(0);
  let apySponsorsValue = BigInt(0);
  if (user.koin.pool1 + user.vhp.pool1 + user.koin.pool2 + user.vhp.pool2 > 0) {
    apyKoinValue = apyValue * (user.koin.pool2 + user.vhp.pool2) / (user.koin.pool1 + user.vhp.pool1 + user.koin.pool2 + user.vhp.pool2);
    apySponsorsValue = apyValue * (user.koin.pool1 + user.vhp.pool1) / (user.koin.pool1 + user.vhp.pool1 + user.koin.pool2 + user.vhp.pool2);
  }
  const koinRewards1YearValue = user.vhp.pool2 * apyKoinValue / BigInt(10000);
  const koinRewards1YearSponsorsValue = user.vhp.pool1 * apySponsorsValue / BigInt(10000);
  const koinRewards1MonthValue = koinRewards1YearValue / BigInt(12);
  const koinRewards1DayValue = koinRewards1YearValue / BigInt(365);
  const koinRewards1DaySponsorsValue = koinRewards1YearSponsorsValue / BigInt(365);
  const ratioVaporValue = getCurrentRatioVapor();
  const vapor1DayValue = koinRewards1DaySponsorsValue * ratioVaporValue / BigInt(100);

  // vhp consumed in 1 year is equal to = 50% * virtual supply
  const userVhp1YearValue = (user.vhp.pool1 + user.vhp.pool2) * virtualSupply / ( BigInt(2) * producing );
  const userVhp1DayValue = userVhp1YearValue / BigInt(365);
  apy.value = `${utils.formatUnits(apyValue.toString(), 2)}%`;
  apyKoin.value = `${utils.formatUnits(apyKoinValue.toString(), 2)}%`;
  apySponsors.value = `${utils.formatUnits(apySponsorsValue.toString(), 2)}%`;
  koinRewards1Year.value = utils.formatUnits(koinRewards1YearValue.toString(), 8);
  koinRewards1Month.value = utils.formatUnits(koinRewards1MonthValue.toString(), 8);
  koinRewards1Day.value = utils.formatUnits(koinRewards1DayValue.toString(), 8);
  userVhp1Year.value = utils.formatUnits(userVhp1YearValue.toString(), 8); 
  userVhp1Day.value = utils.formatUnits(userVhp1DayValue.toString(), 8);
  sponsors1Day.value = utils.formatUnits(koinRewards1DaySponsorsValue.toString(), 8);
  ratioVapor.value = utils.formatUnits(ratioVaporValue.toString(), 2);
  vapor1Day.value = utils.formatUnits(vapor1DayValue.toString(), 8);
}

async function setSigner(signer: Signer) {
  account.value = signer.getAddress();
  pool1Contract.signer = signer;
  pool2Contract.signer = signer;
  getUserData();
}

</script>

<template>
  <div>
    <HeaderProject
      title="JGA Pool"
      url-path="/jgapool"
      @signer="setSigner"
    />
    <ModalDeposit
      v-if="showModalDeposit"
      :contract1="pool1Contract"
      :contract2="pool2Contract"
      :userData="userData"
      @close="showModalDeposit = false"
    />
    <ModalWithdraw
      v-if="showModalWithdraw"
      :contract1="pool1Contract"
      :contract2="pool2Contract"
      :userData="userData"
      @close="showModalWithdraw = false"
    />
    <ModalConfigure
      v-if="showModalConfigure"
      :contract1="pool1Contract"
      :contract2="pool2Contract"
      :userData="userData"
      @close="showModalConfigure = false"
    />
    <div class="description">
      <p>JGA Pool is a mining pool for koinos blockchain. You can deposit KOIN
        or VHP. The current APY is {{ apy }}. You can also destinate part of your earnings
        to the Sponsors program which will be used to fund projects in the ecosytem,
        and you decide which projects should be funded.
      </p>
    </div>
    <div class="group-assets">
      <h1>Global Data</h1>
      <div class="data-group">
        <div class="data-row">
          <div class="name">VHP</div>
          <div class="value">{{ vhpTotal }} VHP</div>
        </div>
        <div class="data-row">
          <div class="name">KOIN</div>
          <div class="value">{{ koinTotal }} KOIN</div>
        </div>
        <div class="data-row">
          <div class="name">Users</div>
          <div class="value">{{ numberAccounts }}</div>
        </div>
      </div>
    </div>
    <div class="group-assets">
      <h1>My Data</h1>
      <div class="data-row">
        <div class="name">Account</div>
        <div class="value break">{{ account }}</div>
      </div>
      <div class="data-row">
        <div class="name">KOIN</div>
        <div class="value">{{ userTotalKoin }} KOIN<br> 
        ({{ userKoin }} KOIN in the pool)</div>
      </div>
      <div class="data-row">
        <div class="name">VHP</div>
        <div class="value">{{ userTotalVhp }} VHP<br> 
        ({{ userVhp }} VHP in the pool)</div>
      </div>
      <div class="data-row">
        <div class="name">VAPOR</div>
        <div class="value">{{ userTotalVapor }} VAPOR<br> 
        ({{ userVapor }} VAPOR in the pool)</div>
      </div>
      <div class="data-row">
        <div class="name">Total</div>
        <div class="value">{{ userTotalKoinVhp }} KOIN+VHP<br> 
        {{ userTotalVapor }} VAPOR</div>
      </div>
      <div class="data-row m10">
        <div class="name">APY</div>
        <div class="value">{{ apy }}<br>
          {{ apyKoin }} for the user<br>
          {{ apySponsors }} for the sponsors program
        </div>
      </div>
      <div class="data-row">
        <div class="name">Rewards</div>
        <div class="value">
          {{ koinRewards1Year }} KOIN per year<br>
          {{ koinRewards1Day }} KOIN per month
        </div>
      </div>
      <div class="data-row">
        <div class="name">Sponsors program</div>
        <div class="value">
        {{ sponsors1Day }} KOIN per day<br>
        Current ratio: {{ ratioVapor }} VAPOR : 1 KOIN<br>
        Minting {{ vapor1Day }} VAPOR per day</div>
      </div>
      <div class="buttons">
        <button @click="showModalDeposit = true">Deposit</button>
        <button @click="showModalWithdraw = true">Withdraw</button>
        <button @click="showModalConfigure = true">Configure</button>
        <button @click="$router.push('/jgapool/gov')">Governance</button>
      </div>
    </div>
    <FootProject/>
    <Alert
      :data="alertData"
      @close="alertData.show = false"
    />
  </div>
</template>

<style scoped>
.slogan{

}
.description{
  margin: auto;
  width: 70%;
  min-width: 19em;
  color: black;
}

.group-assets {
  margin: auto;
  width: 70%;
  min-width: 19em;
  color: black;

  background: #ebecda;
  border-radius: 8px;
  padding: 1em;
  box-sizing: border-box;
  margin-bottom: 2em;
}

.group-assets h1 {
  font-size: 1.5em;
  margin-top: 0;
}

.data-group {
  width: 100%;
}

.data-row {
  display: flex;
  flex-direction: row;
  align-items: first baseline;
  margin-bottom: 0.8em;
  border-top-style: solid;
  border-top-width: 1px;
}

.data-row .name {
  flex: 1;
  padding-right: 2em;
}

.data-row .value {
  flex: 3;
}

.data-row .break {
  word-break: break-all;
}

.m10 {
  margin-top: 2em;
}

.buttons {
  margin-top: 1em;
}

.buttons button{
  margin-right: 1em;
  margin-bottom: 0.5em;
}
</style>