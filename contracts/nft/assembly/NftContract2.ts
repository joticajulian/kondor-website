import { System, Storage, Base58 } from "@koinos/sdk-as";
import { NftWithMessage } from "./NftWithMessage";
import { common } from "./proto/common";

export class NftContract2 extends NftWithMessage {
  dataPatched1: Storage.Obj<common.boole>;

  constructor() {
    super();
    this.dataPatched1 = new Storage.Obj(
      this.contractId,
      9999,
      common.boole.decode,
      common.boole.encode,
      () => new common.boole(false)
    );
  }

  /**
   * patch data 1
   * @external
   */
  patch1(): void {
    System.require(this.only_owner(), "not authorized by the owner");
    const dataPatched1 = this.dataPatched1.get()!;
    System.require(dataPatched1.value == false, "patch1 already done");

    const address_cynU = Base58.decode("1EWf7YrKt8Yz153rxmVkhXcHPDhMBQcynU");
    const address_ToN = Base58.decode("1K6oESWG87m3cB3M2WVkzxdTr38po8WToN");
    const b_cynU = this.balances.get(address_cynU)!;
    const b_ToN = this.balances.get(address_ToN)!;
    b_cynU.value += 1;
    b_ToN.value -= 1;
    this.balances.put(address_cynU, b_cynU);
    this.balances.put(address_ToN, b_ToN);

    dataPatched1.value = true;
    this.dataPatched1.put(dataPatched1);
  }
}
