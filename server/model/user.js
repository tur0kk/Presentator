var _ = require("underscore");
function User(username, passwordHash) {
    var Topic = require('./topic');

    if(typeof username == 'string') {
        this.username = username;
        this.password = passwordHash;
        this.topics = [];
        this.sockets = [];
    }
    else if(typeof username == 'object') { // json constructor
        var user = username;

        // user variables
        this.username = user.username;
        this.password = user.password;
        this.topics = [];
        this.sockets = [];

        // topics
        for (var i = 0; i < user.topics.length; i++) {
            var topic = new Topic(user.topics[i]);
            this.addTopic(topic);
        }
    }
    else {
        console.log("User: wrong constructor usage");
    }
}

User.prototype.save = function save() {
    var database = require('./database');
    var modelDatabase = database.modelDatabase;
    modelDatabase.saveUser(this);
};

User.prototype.addTopic = function addTopic(topic) {
    this.topics.push(topic);
};

User.prototype.addSocket = function addSocket(socket) {
    if(!_.contains(socket, this.sockets)) {
        this.sockets.push(socket);
    }
};

User.prototype.findTopic = function findTopic(topicName) {
    var topic = this.topics.filter(function(obj){
        if(obj.name == topicName) {
            return obj;
        }
    }); // select requested topic

    if (topic.length == 0) {
        return null;
    }
    else {
        // items found
        topic = topic[0];
        return topic;
    }
}
User.prototype.deleteTopic = function deleteTopic(topicName) {
    var topic = this.topics.filter(function(obj){
        if(obj.name == topicName) {
            return obj;
        }
    }); // select requested topic

    if (topic.length == 0) {
        // not found
    }
    else {
        // items found
        topic = topic[0];
    }
    var idx = this.topics.indexOf(topic);
    this.topics.splice(idx, 1);
};

module.exports = User;