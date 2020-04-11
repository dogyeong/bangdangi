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

const serviceAccount = require("./bangdangi-firebase-adminsdk-f87j6-a11d0aadf6.json");
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "bangdangi.appspot.com" 
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static'), { maxAge: '3600000' }));

/**
 * 임시중단 안내문
 */
// app.use((req,res) => {
//   res.render('noti');
// })

// Routers
const indexRouter = require('./routes/index');
const boardRouter = require('./routes/board');
const userRouter = require('./routes/user');
const reserveRouter = require('./routes/reservation');
const RESTapi = require('./routes/api');

app.use('/', indexRouter);
app.use('/board', boardRouter);
app.use('/user', userRouter);
app.use('/reservation', reserveRouter);
app.use('/api', RESTapi);

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










