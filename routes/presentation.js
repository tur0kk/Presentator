module.exports = function(passport) { // passed by app to do login stuff
  var express = require('express');
  var router = express.Router();


  /* Redirect to mypresentations if no presentation has been specified */
  router.get('/', loggedIn, function (req, res, next) { // only if logged in, otherwise redirected to login (see below)
    res.redirect('/mypresentations');
  });

  /* Redirect to page 1 if no oage has been specified */
  router.get('/:topic/:presentation', loggedIn, function(req, res, next) {
    res.redirect('/presentations/' + req.params.topic + "/" + req.params.presentation + "/1");
  });

  router.get('/:topic/:presentation/:page', loggedIn, function(req, res, next) {
    res.render('presentation');
  });

  // middle call which redirects if not logged in
  function loggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.render('login.jade');
    }
  }

  //sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
  router.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/presentation', // presentation displayed
        failureRedirect: '/presentation' // login displayed, errors are shown
      })
  );

  //sends the request through our local login strategy, and if successful takes user to homepage, otherwise returns then to signin page
  router.post('/login', passport.authenticate('local-login', {
        successRedirect: '/presentation', // presentation displayed
        failureRedirect: '/presentation' // login displayed, errors are shown
      })
  );

  //logs user out of site, deleting them from the session, and returns to homepage
  router.get('/logout', function (req, res) {
    req.logout();
    req.session.success = "You have successfully been logged out!";
    res.redirect('/presentation');

  });


  return router;
}