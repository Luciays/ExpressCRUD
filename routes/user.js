var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var User = require('../models').User;

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async function(email, password, done) {
  var user = await User.findOne(
    { where: {
        email: email
      }
    });
  if (user == null) {
    return done(null, false, { message: 'Incorrect email.' });
  }
  if (!user.validPassword(password)) {
    return done(null, false, { message: 'Incorrect password.' });
  }
  return done(null, user);
}
));

//checks if password has > 8 chars
function isValidPassword(password) {
  if (password.length >= 8) {
    return true;
  }
  return false;
}

//uses a regex to check if email is valid
function isValidEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

//renders register view
router.get('/register', function(req, res, next) {
  res.render('user/register', { });
});

//handles register POST
router.post('/register', async function(req, res, next) {
  var salt = crypto.randomBytes(64).toString('hex');
  var password = crypto.pbkdf2Sync(req.body.password, salt, 10000, 64, 'sha512').toString('base64');

  if (!isValidPassword(req.body.password)) {
    return res.json({status: 'error', message: 'Password must be 8 or more characters.'});
  }
  if (!isValidEmail(req.body.email)) {
    return res.json({status: 'error', message: 'Email address not formed correctly.'});
  }

  try {
    var user = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      role: "user",
      password: password,
      salt: salt
    });
  } catch (err) {
    return res.json({status: 'error', message: 'Email address already exists.'});
  }
  if (user) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return res.json({status: 'error', message: info.message});
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.json({status: 'ok'});
      });
    })(req, res, next);
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

//login route
router.get('/login', function(req, res, next) {
  res.render('user/login', { });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.json({status: 'error', message: info.message});
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.json({status: 'ok'});
    });
  })(req, res, next);
});

router.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
});