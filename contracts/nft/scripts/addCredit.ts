import { Signer, Contract, Provider, Transaction } from "koilib";
import { TransactionJson } from "koilib/lib/interface";
import abi from "../build/nftcontract2-abi.json";
import koinosConfig from "../koinos.config.js";

const [inputNetworkName] = process.argv.slice(2);

async function main() {
  const networkName = inputNetworkName || "harbinger";
  const network = koinosConfig.networks[networkName];
  if (!network) throw new Error(`network ${networkName} not found`);
  const provider = new Provider(network.rpcNodes);
  const contractAccount = Signer.fromWif(network.accounts.contract.privateKey);
  const accountWithFunds = Signer.fromWif(
    network.accounts.manaSharer.privateKey
  );
  contractAccount.provider = provider;
  accountWithFunds.provider = provider;

  if (!network.accounts.contract.id) throw new Error("contract id not defined");
  const contract = new Contract({
    id: network.accounts.contract.id,
    abi,
    signer: contractAccount,
    provider,
    options: {
      payer: accountWithFunds.address,
      beforeSend: async (tx: TransactionJson) => {
        await accountWithFunds.signTransaction(tx);
      },
    },
  });

  const tx = new Transaction({
    signer: contractAccount,
    provider,
    options: {
      payer: accountWithFunds.address,
      rcLimit: "10000000000",
      beforeSend: async (tx: TransactionJson) => {
        await accountWithFunds.signTransaction(tx);
      },
    },
  });

  const credits = JSON.parse(network.credits) as {
    account: string;
    amount: string;
  }[];

  for (let i = 0; i < credits.length; i += 1 ) {
    await tx.pushOperation(contract.functions.addCredit, credits[i]);
  }

  const receipt = await tx.send();
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await tx.wait("byBlock", 60000);
  console.log(
    `New credits added in contract ${contractAccount.address} (block number ${blockNumber} - ${networkName})`
  );
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
