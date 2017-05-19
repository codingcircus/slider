const 
  express = require('express'),
  path = require('path'),
  sassMiddleware = require('node-sass-middleware');

let app = express();

app.use(sassMiddleware({
  src: path.join(__dirname, 'sass'),
  dest: path.join(__dirname, 'public'),
  outputStyle: 'compressed',
}))


app.use(express.static('public'));
app.use(express.static('node_modules'));

let server = app.listen(3003, '0.0.0.0', () => {
  console.log(`API listening on http://${server.address().address}:${server.address().port}`);
});
