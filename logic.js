/**
 * Logic of the server
 */

const later = require('later');
const bitcoin = require('./bitcoin');
const db = require('./db');
const request = require('request');
const reporter = require('./reporter');

const ee = bitcoin.ee;

/** Run lottery */
function startRunningLottery() {
  const sched = later.parse.text('at 11:59am');
  later.setInterval(runLottery, sched);
}

function runLottery() {
  generateWinner()
    .then(({ draw, winner }) => {
      bitcoin.sendBitcoins(draw, winner);
      return db.voidAllTickets()
        .then(() => {
          draw.winner = winner;
          return draw.save()
            .then(() => db.createNewDraw());
        });
    })
    .catch(err => console.info(err.message));
}

function generateWinner() {
  return new Promise((resolve, reject) => {
    const p = db.getLatestPopulatedDraw()
      .then((draw) => {
        if (draw.wallets.length <= 0) {
          reporter.reportNoParticipants();
          reject(new Error(`No participants on ${new Date()}`));
          p.cancel();
        }
        const totalTickets = draw.wallets.map(w => w.numberOfTxs)
          .reduce((acc, cur) => acc + cur);
        return random(totalTickets)
          .then(winnerNumber => ({ draw, winnerNumber }));
      })
      .then(({ draw, winnerNumber }) => {
        let i = 0;
        let winner;
        draw.wallets.some((wallet) => {
          const first = i;
          i += wallet.numberOfTxs;
          const second = i;
          if (winnerNumber >= first && winnerNumber < second) {
            winner = wallet;
            return true;
          }
          return false;
        });
        resolve({ draw, winner });
      })
      .catch(reject);
  });
}

function random(number) {
  return new Promise((resolve, reject) => {
    const url = `https://www.random.org/integers/?num=1&min=1&max=${number}&col=1&base=10&format=plain&rnd=new`;
    request(url, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (body) {
        resolve(parseInt(body, 10));
      } else {
        reject(new Error('Something went wrong when getting transaction'));
      }
    });
  });
}

/** Add transactions */
ee.on('newTransactions', (transactions) => {
  db.getLatestDraw()
    .then(draw =>
      Promise.reduce(transactions,
        (idraw, transaction) =>
          addTransactionToDraw(transaction, idraw), draw))
    .catch(/** todo: handle error */);
});

function addTransactionToDraw(transaction, draw) {
  return new Promise((resolve, reject) => {
    if (!draw.transactions.includes(transaction._id)) {
      draw.transactions.push(transaction._id);
    }
    draw.prize += transaction.amount;
    return db.findWallet(transaction.senderId)
      .then((wallet) => {
        wallet.numberOfTxs += Math.floor(transaction.amount / 10000);
        return wallet.save()
          .then((dbwallet) => {
            reporter.reportNewTransaction(transaction);
            if (draw.wallets.map(v => String(v)).includes(String(dbwallet._id))) {
              return draw;
            }
            draw.wallets.push(dbwallet._id);
            return draw.save();
          });
      })
      .then(resolve)
      .catch(reject);
  });
}

bitcoin.startObserving();

module.exports = {
  startRunningLottery,
  runLottery,
};
