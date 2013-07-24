var express = require('express');
var app = express();
app.use(express.logger());
var fs = require('fs');

app.get('/', function(request, response) {
  var fn = "index.html"
  var fb = fs.readFileSync(fn);

  response.send(fb.toString('utf8'));
  //response.send('Hello World2!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
