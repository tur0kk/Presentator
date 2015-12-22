function Topic(name) {
    var Presentation = require('./presentation');

    if(typeof name == 'string') {
        this.name = name;
        this.presentations = [];
    }
    else if(typeof name == 'object') { // json constructor
        var topic = name;

        // topic variables
        this.name = topic.name;
        this.presentations = [];

        // presentations
        for (var j = 0; j < topic.presentations.length; j++) {
            var presentation = new Presentation(topic.presentations[j]);
            this.addPresentation(presentation)
        }
    }
    else {
        console.log("Topic: wrong constructor usage");
    }
}

Topic.prototype.addPresentation = function addPresentation(presentation) {
    this.presentations.push(presentation);
};

Topic.prototype.findPresentation = function findPresentation(presentationName) {
    var presentation = this.presentations.filter(function(obj){
        if(obj.name == presentationName) {
            return obj;
        }
    }); // select requested topic

    if (presentation.length == 0) {
        return null;
    }
    else {
        // items found
        presentation = presentation[0];
        return presentation;
    }
}

Topic.prototype.deletePresentation = function deletePresentation(presentationName) {
    var presentation = this.findPresentation(presentationName);
    if(presentation != null) {
        var idx = this.presentations.indexOf(presentation);
        this.presentations.splice(idx, 1);
    }
};

module.exports = Topic;