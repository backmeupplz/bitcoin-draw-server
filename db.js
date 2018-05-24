/**
 * Mongo DB manager – used for all the requests to database
 */

const format = require('date-format');

/** Get schemas **/
const {
  Draw,
  Transaction,
  Wallet,
} = require('./models');

function getLatestDraw() {
  return Draw.findOne().sort({ createdAt: -1 })
    .then((draw) => {
      if (!draw) {
        const newDraw = new Draw();
        return newDraw.save();
      }
      return draw;
    });
}

function getLatestPopulatedDraw() {
  return Draw.findOne().sort({ createdAt: -1 })
    .populate('transactions wallets')
    .then((draw) => {
      if (!draw) {
        const newDraw = new Draw();
        return newDraw.save();
      }
      return draw;
    });
}

function getLatestTransactions() {
  return Draw.findOne().sort({ createdAt: -1 })
  .populate('transactions')
    .then((draw) => {
      if (!draw) {
        const newDraw = new Draw();
        return newDraw.save();
      }
      return draw;
    })
    .then(draw => draw.transactions);
}

function saveTransactions(txs) {
  return Transaction.create(txs);
}

function findWallet(address) {
  return Wallet.findOne({ address })
    .then((wallet) => {
      if (!wallet) {
        const dbwallet = new Wallet({ address });
        return dbwallet.save();
      }
      return wallet;
    });
}

function voidAllTickets() {
  return new Promise((resolve, reject) => {
    Wallet.updateMany({}, { numberOfTxs: 0 }, { multi: true }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function getTransaction(id) {
  return Transaction.findOne({ id });
}

function createNewDraw() {
  const draw = new Draw();
  return draw.save();
}

/** Data points */

function getParticipators(query) {
  return Draw.findOne().sort({ createdAt: -1 })
    .populate('wallets')
    .then((draw) => {
      if (!draw) {
        return [];
      }
      return draw.wallets;
    })
    .then(wallets =>
      wallets
        .filter(w => w.numberOfTxs > 0)
        .filter(w => (query || (query && query.length > 0)) ? w.address.includes(query) : true)
        .slice(0, 10)
        .map(w => ({
          address: w.address,
          numberOfTxs: w.numberOfTxs,
        })));
}

function getWinners(query) {
  if (query && query.length > 0) {
    return Draw.find({ winner: { $exists: true } })
      .sort({ createdAt: -1 })
      .populate('winner')
      .then(draws =>
        draws
          .filter(d => (query || (query && query.length > 0)) ? d.winner.address.includes(query) : true)
          .map(d => ({
            address: d.winner.address,
            prize: parseFloat(((d.prize * 0.6) / 100000000).toFixed(8)),
            date: format('dd/MM/yy', d.createdAt),
          })));
  }
  return Draw.find({ winner: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('winner')
    .then(draws =>
      draws
        .map(d => ({
          address: d.winner.address,
          prize: parseFloat(((d.prize * 0.6) / 100000000).toFixed(8)),
          date: format('dd/MM/yy', d.createdAt),
        })));
}

/** Exports */
module.exports = {
  getLatestDraw,
  getLatestTransactions,
  saveTransactions,
  findWallet,
  getLatestPopulatedDraw,
  voidAllTickets,
  createNewDraw,
  getTransaction,
  getParticipators,
  getWinners,
};
