module.exports = function(passport) { // passed by app to do login stuff
    var express = require('express');
    var router = express.Router();


    /* GET index page. */
    router.get('/', loggedIn, function (req, res, next) { // only if logged in, otherwise redirected to login (see below)
        res.render('mypresentations_index');
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
            successRedirect: '/mypresentations', // mypresentations displayed
            failureRedirect: '/mypresentations' // login displayed, errors are shown
        })
    );

    //sends the request through our local login strategy, and if successful takes user to homepage, otherwise returns then to signin page
    router.post('/login', passport.authenticate('local-login', {
            successRedirect: '/mypresentations', // mypresentations displayed
            failureRedirect: '/mypresentations' // login displayed, errors are shown
        })
    );

    //logs user out of site, deleting them from the session, and returns to homepage
    router.get('/logout', function (req, res) {
        req.logout();
        req.session.success = "You have successfully been logged out!";
        res.redirect('/mypresentations');

    });


    return router;
}