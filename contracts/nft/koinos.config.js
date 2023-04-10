const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

module.exports = {
  class: "NftContract2",
  proto: ["./proto/nft.proto", "./proto/common.proto"],
  files: ["./NftContract.ts", "./NftContract2.ts", "./Ownable.ts"],
  sourceDir: "./assembly",
  buildDir: "./build",
  koinosProtoDir: "../node_modules/koinos-precompiler-as/koinos-proto",
  networks: {
    harbinger: {
      rpcNodes: [
        "https://harbinger-api.koinos.io",
        "https://testnet.koinosblocks.com",
      ],
      accounts: {
        manaSharer: {
          privateKey: process.env.HARBINGER_MANA_SHARER_PRIVATE_KEY,
        },
        contract: {
          privateKey: process.env.HARBINGER_NFT_CONTRACT_PRIVATE_KEY,
          id: process.env.HARBINGER_NFT_CONTRACT_ID,
        },
        contractOwner: {
          privateKey: process.env.HARBINGER_NFT_OWNER_PRIVATE_KEY,
        },
      },
    },
    mainnet: {
      rpcNodes: ["https://api.koinos.io", "https://api.koinosblocks.com"],
      accounts: {
        manaSharer: {
          privateKey: process.env.MAINNET_MANA_SHARER_PRIVATE_KEY,
        },
        contract: {
          privateKey: process.env.MAINNET_NFT_CONTRACT_PRIVATE_KEY,
          id: process.env.MAINNET_NFT_CONTRACT_ID,
        },
        contractOwner: {
          privateKey: process.env.MAINNET_NFT_OWNER_PRIVATE_KEY,
        },
      },
    },
  },
};
