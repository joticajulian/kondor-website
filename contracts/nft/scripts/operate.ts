import { Signer, Contract, Provider } from "koilib";
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
  const user1 = Signer.fromWif(network.accounts.user1.privateKey);
  const user2 = Signer.fromWif(network.accounts.user2.privateKey);

  user1.provider = provider;
  user2.provider = provider;
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

  /* const { result } = await contract.functions.owner_of({ token_id: "0x12345678" });
  console.log(result);
  return; */

  /* const { receipt, transaction } =
    await contract.functions.set_approval_for_all(
      {
        approver_address: user1.address,
        operator_address: user2.address,
        approved: false,
      },
      {
        rcLimit: "10000000000",
      }
    ); */
  const { receipt, transaction } = await contract.functions.addCredit(
    {
      account: user1.address,
      amount: "10",
    },
    {
      rcLimit: "10000000000",
    }
  );
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await transaction.wait("byBlock", 60000);
  console.log(
    `Transaction mined in block number ${blockNumber} (${networkName})`
  );
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
