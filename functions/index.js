const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require("express");
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors')({
  origin: true
});

admin.initializeApp();
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

// Routers
const indexRouter = require('./routes/index');
const boardRouter = require('./routes/board');
const userRouter = require('./routes/user');
const notiRouter = require('./routes/notification');

app.use('/', indexRouter);
app.use('/board', boardRouter);
app.use('/user', userRouter);
app.use('/notification', notiRouter);

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

module.exports = {
  api
}










