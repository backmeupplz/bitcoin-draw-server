const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '/.env'),
});
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
global.Promise = require('bluebird');

global.Promise.config({ cancellation: true });

/** Setup mongoose */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.BTC_DB_URL);

/** Setup app */
const app = express();
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* Logic */
const logic = require('./logic');

logic.startRunningLottery();

/** Setup rootes */
const routes = require('./routes/index');
const admin = require('./routes/admin')(logic);

app.use('/', routes);
app.use('/admin/', admin);

/* Error handlers */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status);
  res.send({
    status,
    message: err.message,
  });
});

/** Exports */
module.exports = app;
