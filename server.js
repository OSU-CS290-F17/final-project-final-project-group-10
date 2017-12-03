var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars', {defaultLayout: 'main'});
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
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
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(bodyParser.json());

// Serve static files from public
app.use(express.static('public'));

// Serve handlebars templates
app.get('index.html', function(req, res) {
  res.status(200).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.get('*', function (req, res) {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, function () {
  console.log("== Server is listening on port", port);
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
