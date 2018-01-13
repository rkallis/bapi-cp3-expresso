const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const errorhandler = require('errorhandler');
const apiRouter = require('./api/api');

// Database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Server
const app = express();
const PORT = process.env.PORT || 4000;

//Router generic use
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// All calls starting with /api will be routed to apiRouter (api.js)
app.use('/api', apiRouter);



//Server start
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
