const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require("express");
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors')({
  origin: true
});

// Routers
const indexRouter = require('./routes/index');
const boardRouter = require('./routes/board');

admin.initializeApp();
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/board', boardRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => { 
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const api = functions.https.onRequest(app);

const getList = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var univ = request.query.univ;
    var db = admin.database();

    db.ref('/article/'+univ).once('value', (snapshot) => {
    	return snapshot.val()
    })
    .then((result) => {
      console.log("완료");
      response.status(200).send(result);
      return null;
    })
    .catch((err) => {
      response.status(500).send(err);
      return null;
    });
  });
});

module.exports = {
  api,
  getList
}










