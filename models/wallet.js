/**
 * @module models/wallet
 */

/** Dependencies */
const mongoose = require('mongoose');

/** Schema */
const Schema = mongoose.Schema;
const walletSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  numberOfTxs: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

/** Exports */
module.exports = mongoose.model('wallet', walletSchema);
