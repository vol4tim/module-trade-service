import abi from "./abi";
import config from "./config";

const STATUS_SIGNED    = 2; // покупатель подписал
const STATUS_SENT      = 4; // товар отправлен
const STATUS_RECEIVED  = 5; // товар получен
const STATUS_COMPLETED = 6; // договор выполнен

export default class Escrow {
  constructor(web3, builder, address) {
    this.web3 = web3;
    this.builder = builder;
    this.address = address;
    this.contract = this.web3.eth.contract(abi.Escrow).at(address);
  }

  lockedFunds() {
    const tx = this.contract.lockedFunds({ from: config.bank, gas: 300000 });
    console.log('[Отправлена транзакция] О блокировке средств tx = '+ tx);
  }

  received() {
    const tx = this.contract.received({ from: config.logist, gas: 300000 });
    console.log('[Отправлена транзакция] О получении товара tx = '+ tx);
  }

  complete() {
    const tx = this.contract.complete({ from: config.bank, gas: 300000 });
    console.log('[Отправлена транзакция] О завершении договора tx = '+ tx);
  }

  unwatch() {
    const tx = this.builder.removeContract(this.address, { from: config.bank, gas: 300000 });
    console.log('[Отправлена транзакция] О заершеннии наблюдения за контрактом tx = '+ tx);
  }

  watch() {
    switch(Number(this.contract.status().toString())) {
      case STATUS_SIGNED:
        this.lockedFunds();
        break;
      case STATUS_SENT:
        this.received();
        break;
      case STATUS_RECEIVED:
        this.complete();
        break;
      case STATUS_COMPLETED:
        this.unwatch();
        break;
      default:
        console.log('Ожидается ивент');
    }

    const signedEvent = this.contract.Signed({}, (e, r) => {
      if (!e) {
        console.log('[Новое событие в контракте] покупатель подписал договор');

        this.lockedFunds();
        signedEvent.stopWatching();
        // банк блокирует средства на карте покупателя
        // чуть погодя нужно отправить транзакцию от банка
      }
    });
    const sentEvent = this.contract.Sent({}, (e, r) => {
      if (!e) {
        console.log('[Новое событие в контракте] товар отправлен. трек номер №', r.args.trackNum);

        this.received();
        sentEvent.stopWatching();
        // логист начинает следить за трек номером и если товар получен то отправляем транзакцию
        // чуть погодя нужно отправить транзакцию от логиста
      }
    });
    const receivedEvent = this.contract.Received({}, (e, r) => {
      if (!e) {
        console.log('[Новое событие в контракте] товар получен покупателем');

        this.complete();
        receivedEvent.stopWatching();
        // банк оплачивает по договору продавцу и отправляет транзакцию
        // чуть погодя нужно отправить транзакцию от банка
      }
    });
    const completedEvent = this.contract.Completed({}, (e, r) => {
      if (!e) {
        console.log('[Новое событие в контракте] договор выполнен');

        this.unwatch();
        completedEvent.stopWatching();
        // удаляем контракт из наблюдаемых
      }
    });
  }
}
