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
  const accountWithFunds = Signer.fromWif(
    network.accounts.manaSharer.privateKey
  );
  const contractAccount = Signer.fromWif(network.accounts.contract.privateKey);
  accountWithFunds.provider = provider;
  contractAccount.provider = provider;

  const contract = new Contract({
    id: contractAccount.address,
    signer: contractAccount,
    provider,
    abi,
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

  const specialNames = [
    "Colombia",
    // "Rebel Alliance",
    "United Kingdom",
    "United States",
  ];

  const tokenNames = [
    "Afghanistan",
    "Algeria",
    "Angola",
    "Argentina",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bangladesh",
    "Belarus",
    "Belgium",
    "Benin",
    "Bolivia",
    "Brazil",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Chad",
    "Chile",
    "China",
    "Croatia",
    "Cuba",
    "Czech Republic",
    "Denmark",
    "Dominican Republic",
    "DR Congo",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Ethiopia",
    "Finland",
    "France",
    "Germany",
    "Ghana",
    "Greece",
    "Guatemala",
    "Guinea",
    "Haiti",
    "Honduras",
    "Hong Kong",
    "Hungary",
    "India",
    "Indonesia",
    "Iraq",
    "Iran",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Mali",
    "Mexico",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Nepal",
    "Netherlands",
    "Niger",
    "Nigeria",
    "North Korea",
    "Norway",
    "Pakistan",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Rusia",
    "Rwanda",
    "Saudi Arabia",
    "Senegal",
    "Singapore",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Tunisia",
    "Turkey",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "Uruguay",
    "Uzbekistan",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  for (let i = 0; i < specialNames.length; i += 1) {
    await tx.pushOperation(contract.functions.createAuction, {
      token_id: `0x${Buffer.from(specialNames[i]).toString("hex")}`,
      koin_amount: "50000000000",
    });
  }

  for (let i = 0; i < tokenNames.length; i += 1) {
    await tx.pushOperation(contract.functions.createAuction, {
      token_id: `0x${Buffer.from(tokenNames[i]).toString("hex")}`,
      koin_amount: "30000000000",
    });
  }

  const receipt = await tx.send();
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await tx.wait("byBlock", 60000);
  console.log(
    `New auctions created in contract ${contractAccount.address} (block number ${blockNumber} - ${networkName})`
  );
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
