var config = require('../config');
//===============MODEL DATABASE===============
function ModelDatabase() {
    // imports
    var bcrypt = require('bcryptjs');
    var Q = require('q');
    var User = require('./user');
    var Topic = require('./topic');
    var Presentation = require('./presentation');

    // test user
    var user = new User("Test", bcrypt.hashSync("test",8));
    var topic1 = new Topic('AwesomeTopic1');
    var topic2 = new Topic('AwesomeTopic2');
    var presentation1 = new Presentation('AwesomePresentation1');
    var presentation2 = new Presentation('AwesomePresentation2');
    user.addTopic(topic1);
    user.addTopic(topic2);
    topic1.addPresentation(presentation1);
    topic2.addPresentation(presentation2);

    // model
    var databaseClient = null; // database just used for persistently storing users, read out at startup
    var users = {}; // volatile datastructure
    if(config.useRedisStore) { // read out persistent users from database
        databaseClient = require('redis').createClient(config.redis.port, config.redis.host);
        databaseClient.on('connect', function() {
            databaseClient.keys('user:*', function (err, keys) { // search for all users in database
                if (err) return console.log(err);

                for (var i = 0, len = keys.length; i < len; i++) {
                    databaseClient.get(keys[i], function(err, user) { // query each user and save in volatile datastructure
                        user = JSON.parse(user);
                        // convert into real user objects
                        var userObject = new User(user);
                        users[userObject.username] = userObject;
                    });
                    //databaseClient.del(keys[i]);
                }
            });
        });
    }
    // add static test user
    users[user.username] = user;


    // save users on change
    this.saveUser = function(user) {
        if(config.useRedisStore) {
            var cache = [];
            databaseClient.set('user:'+user.username, JSON.stringify(user, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    // Store value in our collection
                    cache.push(value);
                }
                return value;
            }));
            cache = null;
        }
    };

    // search in volatile data structure
    this.findUser = function(username){
        if(username in users) {
            return users[username];
        }
        else{
            return null;
        }
    };

    //used in local-signup strategy
    // check if user exists, if not add
    this.localSignup = function (username, password) {
        var deferred = Q.defer();

        var userOld = this.findUser(username);
        if(userOld) {
            deferred.resolve(false); //username already exists
        }
        else{
            var userNew = new User(username, bcrypt.hashSync(password, 8));
            users[username] = userNew;
            userNew.save();
            deferred.resolve(userNew);
        }
        return deferred.promise;
    };

    //used in local-login strategy
    //check if user exists
    //check if passwords match
    this.localLogin = function (username, password) {
        var deferred = Q.defer();

        var user = this.findUser(username);
        if(user) {
            if (bcrypt.compareSync(password, user.password)) {
                deferred.resolve(user); // passwords match
            } else {
                deferred.resolve(false); // wrong password
            }
        }
        else{ // user does not exist
            deferred.resolve(false);
        }
        return deferred.promise;
    }
}
exports.modelDatabase = new ModelDatabase();

//===============SESSION DATABASE===============
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var store = null;
if(config.useRedisStore) {
    store = new RedisStore({
        host: config.redis.host,
        port: config.redis.port
    })
}
// session storage, same as socketio
exports.sessionMiddleware = session({
    secret: '!topPresentatorSecret1',
    store: store,
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: 3600000
    }
});