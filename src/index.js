import Web3 from "web3";
import Watcher from "./watcher";

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

const watcher = new Watcher(web3);
watcher.listen();
