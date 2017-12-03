// Startup Procedure
console.log("== Starting NodeJS Server ==");
console.log("Require: path");
var path = require('path');
console.log("Require: express");
var express = require('express');

var exphbs = require('express-handlebars', {defaultLayout: 'main'});
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;


console.log("Initializing express...");
var app = express();
var port = process.env.PORT || 3000;

//mongodb varibles
var mongoHost = process.env.MONGO_HOST;
var mongoPort = process.env.MONGO_PORT || 27017;
var mongoUser = process.env.MONGO_USER;
var mongoPassword = process.env.MONGO_PASSWORD;
var mongoDBName = process.env.MONGO_DB;

var mongoURL = 'mongodb://' + mongoUser + ':' + mongoPassword +
  '@' + mongoHost + ':' + mongoPort + '/' + mongoDBName;

var mongoConnection = null;


  
// Set handlebars as rendering engine
console.log("Set rendering engine...");
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
console.log("Done!");

// Serve static files from public
app.use(express.static('public'));

app.get('/', function (req, res, next) {
  res.status('200').render("index");
});

app.get('*', function (req, res) {
  res.status(404).render("404");
});

app.listen(port, function () {
  console.log("== Server is listening on port", port, "==");
});

MongoClient.connect(mongoURL, function (err, connection) {
  if (err) {
    throw err;
  }
  mongoConnection = connection;
  app.listen(port, function () {
    console.log("== Server listening on port:", port);
  });
});
