module.exports = {
  class: "NftContract",
  proto: ["./proto/nft.proto", "./proto/common.proto"],
  files: ["./NftContract.ts", "./Ownable.ts"],
  sourceDir: "./assembly",
  buildDir: "./build",
  koinosProtoDir: "../node_modules/koinos-precompiler-as/koinos-proto",
};
