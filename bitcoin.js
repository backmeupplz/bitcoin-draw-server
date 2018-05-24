/**
 * Wallet: 1BKvGcQXAd4pjQyrg1z7wR9BXhf6YZPMic
 * Private key: L13tj3Cpe5ZM463ivkGLnKa37v3E1BQAYRbgarVpa6m6X2W3Ynr5
 */


const bitcore = require('bitcore-lib');
const request = require('request');
const EventEmitter = require('events');
const db = require('./db');
const reporter = require('./reporter');

const ee = new EventEmitter();

const walletId = process.env.LOTTERY_WALLET;
const revenueWalletId = process.env.REVENUE_WALLET;

const key = new bitcore.PrivateKey(process.env.LOTTERY_PRIVATE_KEY);

const unspentURL = 'http://btc.blockr.io/api/v1/address/unspent/';
const txURL = 'http://btc.blockr.io/api/v1/tx/info/';
const postTxURL = 'http://btc.blockr.io/api/v1/tx/push';

function startObserving() {
  observe();
  setInterval(observe, 2 * 60 * 1000);
}

function observe() {
  getUnspent()
    .then(filterObserved)
    .then(fetchTransactions)
    .then(db.saveTransactions)
    .then(emitTransactions)
    .catch(/** todo: handle error */);
}

function getUnspent() {
  return new Promise((resolve, reject) => {
    request(unspentURL + walletId, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (body) {
        try {
          const transactions = JSON.parse(body).data.unspent
            .filter(tx => tx.confirmations >= 6);
          resolve(transactions);
        } catch (err) {
          reject(new Error('Something went wrong when getting unspent'));
        }
      } else {
        reject(new Error('Something went wrong when getting unspent'));
      }
    });
  });
}

function filterObserved(transactions) {
  return new Promise((resolve, reject) => {
    const promises = [];
    transactions.forEach((tx) => {
      promises.push(db.getTransaction(tx.tx));
    });
    Promise.all(promises)
      .then((txs) => {
        const ids = txs.filter(tx => tx !== null).map(tx => tx.id);
        return transactions
          .filter(transaction => !ids.includes(transaction.tx));
      })
      .then(resolve)
      .catch(reject);
  });
}

function fetchTransactions(transactions) {
  return new Promise((resolve, reject) => {
    const promises = transactions
      .map(tx => getTransaction(tx.tx));
    Promise.all(promises)
      .then(resolve)
      .catch(reject);
  });
}

function getTransaction(transaction) {
  return new Promise((resolve, reject) => {
    request(txURL + transaction, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (body) {
        try {
          const data = JSON.parse(body).data;
          const tx = {};
          tx.id = data.tx;
          tx.time = data.time_utc;
          const filteredVouts = data.vouts
            .filter(vout => vout.address === walletId);
          tx.amount = filteredVouts
            .map(vout => vout.amount)
            .reduce((acc, curr) => acc + curr);
          tx.amount *= 100000000;
          tx.n_scrypt = filteredVouts.map(vout => `${vout.n}:${vout.extras.script}:${vout.amount * 100000000}`);
          tx.senderId = data.trade.vins[0].address;
          resolve(tx);
        } catch (err) {
          reject(new Error('Something went wrong when getting transaction'));
        }
      } else {
        reject(new Error('Something went wrong when getting transaction'));
      }
    });
  });
}

function emitTransactions(transactions) {
  if (transactions && transactions.length > 0) {
    ee.emit('newTransactions', transactions);
  }
}

function sendBitcoins(draw, wallet) {
  const utxos = [];
  draw.transactions.forEach((transaction) => {
    transaction.n_scrypt.forEach((seq) => {
      const params = seq.split(':');
      const n = parseInt(params[0], 10);
      const script = params[1];
      const amount = parseInt(params[2], 10);
      utxos.push({
        txId: transaction.id,
        outputIndex: n,
        address: walletId,
        script,
        satoshis: amount,
      });
    });
  });

  const prizeForWinner = Math.floor(draw.prize * 0.6);
  const distributedPrize = Math.floor(draw.prize * 0.2);
  const totalTickets = draw.wallets.reduce((acc, val) => acc + val.numberOfTxs, 0);

  reporter.reportWinner(wallet, draw);

  let transaction = new bitcore.Transaction()
    .from(utxos)
    .to(wallet.address, prizeForWinner);
  transaction = draw.wallets
    .filter(w => w.address !== wallet.address)
    .reduce((acc, val) => {
      const percentOfDist = val.numberOfTxs / totalTickets;
      const distAmount = Math.floor(distributedPrize * percentOfDist);
      return (distAmount > 5430) ? acc.to(val.address, distAmount) : acc;
    }, transaction);
  transaction = transaction
    .change(revenueWalletId)
    .sign(key);

  postPushTx(transaction.serialize());
}

function postPushTx(hex) {
  const postData = { hex };
  const options = {
    method: 'post',
    body: postData,
    json: true,
    url: postTxURL,
  };
  request(options, (err, res, body) => {
    if (err) {
      console.info(`error posting transaction: ${err.message}`);
    } else {
      console.info('posted transaction:', body);
    }
  });
}

/** Exports */
module.exports = {
  startObserving,
  ee,
  sendBitcoins,
};

