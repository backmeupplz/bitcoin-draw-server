const express = require('express');

const router = express.Router();

let logic;

/** Getting initial statistics data */
router.get('/run-6G4eUPA5SKE7U6F32TQ9MTGv7i2405q0', (req, res, next) => {
  logic.runLottery();
  res.send({ success: true });
});

module.exports = (newLogic) => {
  logic = newLogic;
  return router;
};
