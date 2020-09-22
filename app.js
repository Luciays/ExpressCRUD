var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var userRouter = require('./routes/user');

var crypto = require('crypto');
var mysql = require('mysql');
var session = require("express-session");
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var dbConfig = require('./config/config.json');

var connection = mysql.createConnection(dbConfig.development);

var del = connection._protocol._delegateError;
connection._protocol._delegateError = function(err, sequence){
      if (err.fatal) {
        console.trace('fatal error: ' + err.message);
      }
      return del.call(this, err, sequence);
};

var sessionStore = new MySQLStore({}, connection);

var app = express();

/* Create a cookie that expires in 1 day */
var expireDate = new Date();
expireDate.setDate(expireDate.getDate() + 1);

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: "key secret",
  store: sessionStore,
  cookie: { expires: expireDate }
}));

app.use(passport.initialize());
app.use(passport.session());



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', userRouter);

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

//pass user variable to the view template
app.use(function (req, res, next) {
  res.locals.user_id = req.user.id;
  next();
});