var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars', {defaultLayout: 'main'});
var app = express();
var port = process.env.PORT || 3000;

// Set handlebars as rendering engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

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
