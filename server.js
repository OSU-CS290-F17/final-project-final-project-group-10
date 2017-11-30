// Startup Procedure
console.log("== Starting NodeJS Server ==");
console.log("Require: path");
var path = require('path');
console.log("Require: express");
var express = require('express');
console.log("Require: express-handlebars");
var exphbs = require('express-handlebars');
console.log("Initializing express...");
var app = express();
var port = process.env.PORT || 3000;

// Set handlebars as rendering engine
console.log("Set rendering engine...");
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

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
