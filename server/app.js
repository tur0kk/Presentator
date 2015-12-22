//===============INCLUDES================
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var config = require(path.join(__dirname, 'config'));
var database = require(path.join(__dirname, 'model/database'));
var modelDatabase = database.modelDatabase;
var sessionMiddleware = database.sessionMiddleware;
var multipart = require('connect-multiparty');

var app = express();

//===============PASSPORT===============
passport.serializeUser(function(user, done) {
  done(null, {"username": user.username});
});

passport.deserializeUser(function(obj, done) {
  done(null, modelDatabase.findUser(obj.username));
});
// Use the LocalStrategy within Passport to signup users.
passport.use('local-signup', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
      modelDatabase.localSignup(username, password)
          .then(function (user) {
            if (user) {
              req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
              done(null, user);
            }
            if (!user) {
              req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
              done(null, user);
            }
          })
          .fail(function (err){
            console.log(err.body);
          });
    }
));
// Use the LocalStrategy within Passport to login users.
passport.use('local-login', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
      modelDatabase.localLogin(username, password)
          .then(function (user) {
            if (user) {
              req.session.success = 'You are successfully logged in ' + user.username + '!';
              done(null, user);
            }
            if (!user) {
              req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
              done(null, user);
            }
          })
          .fail(function (err){
            console.log(err.body);
          });
    }
));

//===============EXPRESS================
// Configure Express

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/../public/images/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../file_dir')));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(multipart({ uploadDir: config.tmpDir }));

if (app.get('env') == 'development') {
  app.locals.pretty = true;
}

//===============GLOBALS================
app.locals.title = config.title;
app.locals.moment = moment;
app.locals.basedir = path.join(__dirname + "/../public");

// makes user available for templates
app.use(function(req,res,next){
    res.locals.user = req.user;
    next();
});

// Session-persisted message middleware
app.use(function(req, res, next){
    var err = req.session.error,
        msg = req.session.notice,
        success = req.session.success;

    delete req.session.error;
    delete req.session.success;
    delete req.session.notice;

    if (err) res.locals.error = err;
    if (msg) res.locals.notice = msg;
    if (success) res.locals.success = success;

    next();
});

//===============ROUTES================
var index = require('./../routes/home');
var about = require('./../routes/about');
var mypresentations = require('./../routes/mypresentations')(passport); // pass passport for login stuff
var presentation = require("./../routes/presentation")(passport); // pass passport for login stuff
var notes = require("./../routes/notes")(passport); // pass passport for login stuff
var files = require('./../routes/files');


app.use('/', index);
app.use('/about', about);
app.use('/mypresentations', mypresentations);
app.use('/presentation', presentation);
app.use('/notes', notes);
app.use('/files', files);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


//===============ERROR HANDLERS================
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports.app = app;
