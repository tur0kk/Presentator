// sets up general io for session and user (server model) management of io sockets
// allow only socket communication with valid user logged in
// routes to specific socketio server
module.exports = function ServerSocketIO(io) {
    var database = require('./model/database');
    var modelDatabase = database.modelDatabase;
    var sessionMiddleware = database.sessionMiddleware;

    // connection variables
    this.io = io;


    // inject parameter into sockets
    // add session management to socketio
    this.io.use(function(socket,next) {
        sessionMiddleware(socket.request, socket.request.res, next); // adds session to socket at request
    });
    // makes user available for io at request
    this.io.use(function(socket,next){
        if(socket.request && socket.request.session) {
            var session = socket.request.session;
            if(session.passport && session.passport.user) {
                var user = modelDatabase.findUser(session.passport.user.username);
                socket.request.user = user;
            }
        }
        next();
    });

    //===============ROUTES================
    /*
     * Add specific server routes here
     */
    var mypresentationsServer = require('./socketioServer/mypresentationsServer')(this.io);
}