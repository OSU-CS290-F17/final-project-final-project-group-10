// Get Time
var d = new Date();
var t = d.getTime();
// Startup Procedure
console.log("== Starting NodeJS Server ==");
console.log("Require: path");
var path = require('path');
console.log("Require: express");
var express = require('express');
console.log("Require: express-handlebars");
var exphbs = require('express-handlebars', {
  defaultLayout: 'main'
});
console.log("Require: body-parser");
var bodyParser = require('body-parser');
console.log("Require: mongodb (MongoClient)");
var MongoClient = require('mongodb').MongoClient;


console.log("Initializing express...");
var app = express();
var port = process.env.PORT || 3000;

// Set MongoDB varibles
console.log("Initializing MongoDB to environment variables...");
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
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

console.log("Initialize bodyParser...");
app.use(bodyParser.json());

// Serve static files from public
app.use(express.static('public'));

app.get('/', function(req, res, next) {
  res.status('200').render("index");
});

app.post('/addImage/', function(req, res, next) {
  var images = mongoConnection.collection('images');

  var photoObj = {
    photoURL: req.body.photoURL,
    id: req.body.id
  };

  images.find({
      _id: req.body.id
    }).toArray(function(err, results) {
        if (err) {
          res.status(500).send("Error fetching image from DB");
        } else if (results.length > 0) {
          images.updateOne({
            _id: req.body.id
          }, {
            $push: {
              images: photoObj
            }
          }, function(err, result) {
            if (err) {
              res.status(500).send("Error fetching image from DB");
            } else {
              res.status(200).render("image-container");
            }
          });
        } else {
          images.insertOne(photoObj, function(err, res) {
            if (err) {
              res.status(500).send("Error fetching image from DB");
            } else {
              res.status(200).render("image-container");
            }
          });
        }
    });
  });

app.get('*', function(req, res) {
  res.status(404).render("404");
});

MongoClient.connect(mongoURL, function(err, connection) {
  console.log("Connecting to database...");
  if (err) {
    console.log("Couldn't connect!");
    throw err;
  }
  mongoConnection = connection;
  app.listen(port, function() {
    d = new Date();
    t = d.getTime() - t;
    console.log("Done! " + t/1000 + " seconds.");
    console.log("== Server listening on port:", port);
  });
});
