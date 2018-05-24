/**
 * @module models/draw
 */

/** Dependencies */
const mongoose = require('mongoose');

/** Schema */
const Schema = mongoose.Schema;
const transactionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  n_scrypt: [{
    type: String,
    required: true,
  }],
}, { timestamps: true });

/** Exports */
module.exports = mongoose.model('transaction', transactionSchema);
