import Escrow from "./escrow";
import abi from "./abi";
import config from "./config";

export default class Watcher {
  constructor(web3) {
    this.web3 = web3;
    this.builder = this.web3.eth.contract(abi.Builder).at(config.builder)
  }

  listen() {
    for (let i = 0; i < this.builder.contractsLength(); i++) {
      this.wath(this.builder.contracts(i));
    }
    this.builder.Builded({}, (e, r) => {
      if (!e) {
        this.wath(r.args.instance);
      }
    });
  }

  wath(address) {
    console.log('Watch address:', address);
    const escrow = new Escrow(this.web3, this.builder, address);
    escrow.watch();
  }
}
