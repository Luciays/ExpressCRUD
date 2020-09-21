var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var crypto = require('crypto');
var mysql = require('mysql');
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var userRouter = require('./routes/user');

var connection = mysql.createConnection({
  host: process.env.SESSIONSDB_HOST,
  port: process.env.SESSIONSDB_PORT,
  user: process.env.SESSIONSDB_USER,
  password: process.env.SESSIONSDB_PASS,
  database: process.env.SESSIONSDB_DB
});

var sessionStore = new MySQLStore({
  checkExpirationInterval: parseInt(process.env.SESSIONSDB_CHECK_EXP_INTERVAL, 10),
  expiration: parseInt(process.env.SESSIONSDB_EXPIRATION, 10)
}, connection);

var app = express();

/* Create a cookie that expires in 1 day */
var expireDate = new Date();
expireDate.setDate(expireDate.getDate() + 1);

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSIONSDB_SECRET,
  store: sessionStore,
  cookie: { expires: expireDate }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/user', userRouter);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

//Session serialization
passport.serializeUser(function(user, done) {
  done(null, {id: user.id, email: user.email, role: user.role});
});

passport.deserializeUser(function(user, done) {
  done(null, {id: user.id, email: user.email, role: user.role});
});