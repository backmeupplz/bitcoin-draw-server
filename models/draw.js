/**
 * @module models/draw
 */

/** Dependencies */
const mongoose = require('mongoose');

/** Schema */
const Schema = mongoose.Schema;
const drawSchema = new Schema({
  prize: {
    type: Number,
    required: true,
    default: 0,
  },
  transactions: [{
    type: Schema.ObjectId,
    ref: 'transaction',
    required: true,
    default: [],
  }],
  wallets: [{
    type: Schema.ObjectId,
    ref: 'wallet',
    required: true,
    default: [],
  }],
  winner: {
    type: Schema.ObjectId,
    ref: 'wallet',
  },
}, { timestamps: true });

/** Exports */
module.exports = mongoose.model('draw', drawSchema);
