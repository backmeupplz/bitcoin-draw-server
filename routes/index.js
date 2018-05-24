const express = require('express');
const db = require('../db');
const request = require('request');

const router = express.Router();
const apikey = '3b3aZE2wiiokLZ1lMB7hRO8ZlglL3ORs';

/** Getting initial statistics data */
router.get('/data', (req, res, next) => {
  const key = req.get('key');
  if (key !== apikey) {
    res.send({ success: false });
    return;
  }

  db.getParticipators()
    .then(participators =>
      db.getWinners()
        .then(winners =>
          getPrize()
            .then(prize =>
              getUSD(prize)
                .then(usd => ({ usd, prize, participators, winners })))))
    .then(object => res.send(object))
    .catch(err => next(err));
});

/** Get participating wallets for today's lottery with search */
router.get('/participators', (req, res, next) => {
  const key = req.get('key');
  if (key !== apikey) {
    res.send({ success: false });
    return;
  }

  const query = req.query.query;
  db.getParticipators(query)
    .then((participators) => {
      res.send(participators);
    })
    .catch(err => next(err));
});

/** Get winners with search */
router.get('/winners', (req, res, next) => {
  const key = req.get('key');
  if (key !== apikey) {
    res.send({ success: false });
    return;
  }

  const query = req.query.query;
  db.getWinners(query)
    .then((winners) => {
      res.send(winners);
    })
    .catch(err => next(err));
});

function getPrize() {
  return db.getLatestDraw()
    .then(draw => parseFloat((draw.prize / 100000000).toFixed(8)));
}

function getUSD(satoshi) {
  return new Promise((resolve, reject) => {
    const tickerURL = 'https://blockchain.info/ticker';
    request(tickerURL, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (body) {
        try {
          const price = JSON.parse(body).USD.last;
          resolve((price * satoshi).toFixed(2));
        } catch (err) {
          reject(new Error('Something went wrong when getting transaction'));
        }
      } else {
        reject(new Error('Something went wrong when getting transaction'));
      }
    });
  });
}

module.exports = router;
