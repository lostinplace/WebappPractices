var express = require('express'),
  app = express();

app.use(express.compress());
app.use(express.static(__dirname));
app.use('/', function(req, res, next){
  res.sendfile('presentation.html');
});
app.listen(process.env.PORT || 3000);