const request = require('request');
const token = process.env.TELEGRAM_TOKEN;

function reportNewTransaction(transaction) {
  send(`👍 ${transaction.senderId} sent ${transaction.amount / 100000000} btc`);
}

function reportWinner(winner, draw) {
  const amountWon = Math.floor(draw.prize * 0.6);
  const distributedPrize = Math.floor(draw.prize * 0.2);
  const totalTickets = draw.wallets.reduce((acc, val) => acc + val.numberOfTxs, 0);
  const distribution = draw.wallets
    .filter(w => w.address !== winner.address)
    .reduce((acc, val) => {
      const percentOfDist = val.numberOfTxs / totalTickets;
      const distAmount = Math.floor(distributedPrize * percentOfDist);
      return `${acc}\n${val.address}: ${distAmount}`;
    }, '');
  send(`🔥 ${winner.address} won ${amountWon / 100000000} btc, ${Math.floor(draw.prize * 0.2) / 100000000} btc of revenue\n\nDistribution: ${distribution}`);
}

function reportNoParticipants() {
  send('🐷 No participants today');
}

function send(text) {
  request(`https://api.telegram.org/bot${token}/sendMessage?chat_id=76104711&text=${encodeURIComponent(text)}`);
}

module.exports = {
  reportNewTransaction,
  reportWinner,
  reportNoParticipants,
};
