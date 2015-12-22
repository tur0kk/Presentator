// specific socketio server for mypresentationsCtrl
module.exports = function MyPresentationsServer(io) {
    var database = require('../model/database');
    var Topic = require('../model/topic');
    var Presentation = require('../model/presentation');
    var _ = require('underscore');

    // connection variables
    this.io = io;

    this.userSockets = {};

    function broadcastToUser(username, event, data) {
        if(this.userSockets[username]) {
            _.each(this.userSockets[username], function(socket) {
                socket.emit(event, data);
            });
        }
    }

    function addUserSocket(username, socket) {
        if(!this.userSockets[username]) {
            this.userSockets[username] = [];
        }
        this.userSockets[username].push(socket);
    }


    //============SPECIFIC BINDINGS============
    this.io.on('connection', function(socket) {
        var user = socket.request.user;
        if(!user) { // allow only connection with valid user logged in
            return
        }
        else {
            user.addSocket(socket);
            user.save();
        }

        addUserSocket(user.username, socket);

        // initial connect, send user specific view to inject into angular
        socket.on('mypresentationsServer:connect', function(data){
            socket.emit('username', {msg: user.username});
            socket.emit('topics', {msg: user.topics.map(function(obj){return obj.name})}); // send all topic names
        });

        // register further events for changes
        socket.on('mypresentationsServer:getPresentations', function(data){
            if(data.msg) {
                var topic = user.findTopic(data.msg);
                if (topic != null) {
                    socket.emit('presentations', {
                        msg: topic.presentations.map(function (obj) {
                            return obj.name
                        })
                    }); // send all presentation names
                }
            }
        });

        socket.on('mypresentationsServer:getSlides', function(data) {
            if(data.msg && data.msg.topicName) {
                var topic = user.findTopic(data.msg.topicName);
                if(topic != null && data.msg.presentationName !== null) {
                    var presentation = topic.findPresentation(data.msg.presentationName);
                    socket.emit('slides', {msg: presentation.slides});
                }
            }
        });

        socket.on('mypresentationsServer:getNotes', function(data) {
            if(data.msg && data.msg.topicName) {
                var topic = user.findTopic(data.msg.topicName);
                if(topic != null && data.msg.presentationName !== null) {
                    var presentation = topic.findPresentation(data.msg.presentationName);
                    socket.emit('notes', {msg: presentation.notes});
                }
            }
        });



        socket.on('mypresentationsServer:addTopic', function(data){
            if(data.msg && data.msg.topic) {
                user.addTopic(new Topic(data.msg.topic));
                user.save();
            }
        });
        socket.on('mypresentationsServer:addPresentation', function(data){
            if(data.msg && data.msg.topic && data.msg.presentation) {
                var topic = user.findTopic(data.msg.topic);
                if(topic != null) {
                    topic.addPresentation(new Presentation(data.msg.presentation));
                    user.save();
                }
            }
        });
        socket.on('mypresentationsServer:deleteTopic', function(data){
            if(data.msg && data.msg.topic) {
                var topic = user.deleteTopic(data.msg.topic);
                user.save();
            }
        });
        socket.on('mypresentationsServer:deletePresentation', function(data){
            if(data.msg && data.msg.topic && data.msg.presentation) {
                var topic = user.findTopic(data.msg.topic);
                if(topic != null) {
                    topic.deletePresentation(data.msg.presentation);
                    user.save();
                }
            }
        });

        socket.on('mypresentationsServer:deleteSlide', function(data) {
            if(data.msg && data.msg.topic && data.msg.presentation) {
                var topic = user.findTopic(data.msg.topic);
                if(topic != null) {
                    var presentation = topic.findPresentation(data.msg.presentation);
                    if(presentation !== null && presentation !== undefined) {

                        if (presentation.notes.length >= data.msg.fileIndex) {
                            presentation.notes.splice(data.msg.fileIndex - 1, 1);
                            _.each(presentation.notes, function (note, index) {
                                if(note !== null && note !== undefined) {
                                    if (note.fileIndex > data.msg.fileIndex) {
                                        note.fileIndex = note.fileIndex - 1;
                                    }
                                }
                            });
                            user.save();
                            broadcastToUser(user.username, 'notes', {msg: presentation.notes});
                        }

                        if (presentation.slides.length >= data.msg.fileIndex) {
                            presentation.slides.splice(data.msg.fileIndex - 1, 1);
                            _.each(presentation.slides, function (slide, index) {
                                if (slide.fileIndex > data.msg.fileIndex) {
                                    slide.fileIndex = slide.fileIndex - 1;
                                }
                            });
                            user.save();
                            broadcastToUser(user.username, 'slides', {msg: presentation.slides});
                        }

                    }
                }
            }
        });

        socket.on('mypresentationsServer:updateListOrder', function(data) {

            if(data.msg && data.msg.topic && data.msg.presentation) {
                var topic = user.findTopic(data.msg.topic);
                if (topic != null) {
                    var presentation = topic.findPresentation(data.msg.presentation);

                    if(presentation.notes.length > 0) {
                        var tempNote = presentation.notes.splice(data.msg.oldPos - 1, 1);
                        presentation.notes.splice(data.msg.newPos - 1, 0, tempNote[0]);

                        if(data.msg.oldPos < data.msg.newPos) {
                            for(i=data.msg.oldPos;i<data.msg.newPos;i++) {
                                if(presentation.notes[i-1] !== null && presentation.notes[i-1] !== undefined) {
                                    presentation.notes[i-1].fileIndex = presentation.notes[i-1].fileIndex - 1;
                                }

                            }
                        }
                        else if(data.msg.oldPos > data.msg.newPos) {
                            for(i=data.msg.newPos+1; i<=data.msg.oldPos;i++) {
                                if(presentation.notes[i-1] !== null && presentation.notes[i-1] !== undefined) {
                                    presentation.notes[i - 1].fileIndex = presentation.notes[i - 1].fileIndex + 1;
                                }
                            }
                        }
                        presentation.notes[data.msg.newPos-1].fileIndex = data.msg.newPos;
                        broadcastToUser(user.username, 'notes', {msg: presentation.notes});
                    }

                    var tempSlide = presentation.slides.splice(data.msg.oldPos - 1, 1);

                    presentation.slides.splice(data.msg.newPos - 1, 0, tempSlide[0]);
                    if(data.msg.oldPos < data.msg.newPos) {
                        for(i=data.msg.oldPos;i<data.msg.newPos;i++) {
                            presentation.slides[i-1].fileIndex = presentation.slides[i-1].fileIndex - 1;
                        }
                    }
                    else if(data.msg.oldPos > data.msg.newPos) {
                        for(i=data.msg.newPos+1; i<=data.msg.oldPos;i++) {
                            presentation.slides[i-1].fileIndex = presentation.slides[i-1].fileIndex + 1;
                        }
                    }

                    presentation.slides[data.msg.newPos-1].fileIndex = data.msg.newPos;
                    broadcastToUser(user.username, 'slides', {msg: presentation.slides});

                    console.log("Updated and emitting");

                    //socket.emit('slides', {msg: presentation.slides});




                }
            }
           /* var tempSlideArray = [];
            _.each(presentation.slides, function(slide, index) {
                if(data.msg.newPos > data.msg.oldPos) {
                    if(index+1 > data.msg.oldPos && index+1 <= data.msg.newPos) {
                        presentation.slides[index-1] = presentation.slides[index];
                    }
                }
                else if(data.msg.newPos < data.msg.oldPos) {
                    if(index+1 >= data.msg.newPos && index+1 < data.msg.oldPos) {
                        temp = presentation.slides[index+1];
                        presentation.slides[index+1] = presentation.slides[index];
                    }
                }
                else {

                }

            });
            presentation.slides[newPos-1] = tempSlide;
            _.each(presentation.notes, function(note, index) {
                if(note.fileIndex > data.msg.newPos) {
                }
            }); */
        });

        socket.on('mypresentationsServer:changeCurrentPage', function(data) {
            if(data.pageNum || data.pageNum == 0) { // Since 0 is valid but a 'falsy' type, catch it separately
                console.log(data.pageNum);
                broadcastToUser(user.username, 'changeCurrentPage', {msg: data.pageNum});
            }
        });

        socket.on('mypresentationsServer:notification', function(data) {
            broadcastToUser(user.username, 'notification', {msg: data.msg});
        });

        socket.on('mypresentationsServer:moveTo', function(data) {
            broadcastToUser(user.username, 'moveTo', {x: data.x, y:data.y});
        });

        socket.on('mypresentationsServer:lineTo', function(data) {
            broadcastToUser(user.username, 'lineTo', {x: data.x, y:data.y});
        });


    });

    this.io.on('close', function(socket) {

    });

};
