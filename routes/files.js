var express = require('express');
var router = express.Router();
var _ = require("underscore");
var config = require('../server/config');
var fs = require('fs');
var childProcess = require("child_process")

/* POST file upload. */
router.post('/uploadPresentation', function (req, res, next) {
    var user = req.user;
    var fileObject = req.files.file;
    var fileName = fileObject.originalFilename;
    var tmpPath = fileObject.path;
    var uploadPath = config.fileDir;
    var topic = user.findTopic(req.body.topic);
    var presentation = topic.findPresentation(req.body.presentation);
    var fileIndex = req.body.fileIndex; // indicates which file of presentation was uploaded (0 for initial presentation upload)
    if(fileIndex == 0) {
        var num_pages;
        var output_format = process.cwd() + "/" + uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-{}.pdf";
        output_format = output_format.replace(/ /g,'');
        childProcess.exec("python " + process.cwd() + "/public/python/split_pdf.py " + tmpPath + " " + output_format, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                num_pages = parseInt(stdout);
                for(i = 1; i <= num_pages; i++) {
                    var newFilePath = uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-" + i + ".pdf"; // uploadDir/username-topicname-presentationname-fileindex.pdf
                    newFilePath = newFilePath.replace(/ /g,'');
                    presentation.files[i] = newFilePath; // add file to presentation
                    presentation.slides.push({filePath: newFilePath.replace("public/",""), fileIndex: i, presentation: presentation.name, topic: topic.name});
                    _.each(user.sockets, function(socket, index) {
                        socket.emit("addPDFToList", {fileIndex: i, filePath: newFilePath.replace("public/",""), presentation: presentation.name, topic: topic.name} );
                    });
                }
            }
            fs.unlinkSync(tmpPath, function (err) {
                if (err) throw err;
            }); // delete temporary file

            user.save();
        });
    }
    else if(fileIndex <= presentation.slides.length){
        var newFilePath = uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-" + fileIndex + ".pdf"; // uploadDir/username-topicname-presentationname-fileindex.pdf
        presentation.files[fileIndex] = newFilePath; // add file to presentation
        fs.rename(tmpPath, newFilePath); // move file from tmp to file_dir
        presentation.slides[fileIndex-1] = {filePath: newFilePath.replace("public/",""), fileIndex: fileIndex, presentation: presentation.name, topic: topic.name};
        _.each(user.sockets, function(socket, index) {
            socket.emit("updatePDFToList", {fileIndex: fileIndex, filePath: newFilePath.replace("public/",""), presentation: presentation.name, topic: topic.name} );
        });
        user.save();
    }

    else {
        var newFilePath = uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-" + fileIndex + ".pdf"; // uploadDir/username-topicname-presentationname-fileindex.pdf
        presentation.files[fileIndex] = newFilePath; // add file to presentation
        fs.rename(tmpPath, newFilePath); // move file from tmp to file_dir
        presentation.slides.push({filePath: newFilePath.replace("public/",""), fileIndex: fileIndex, presentation: presentation.name, topic: topic.name});
        _.each(user.sockets, function(socket, index) {
            socket.emit("addPDFToList", {fileIndex: fileIndex, filePath: newFilePath.replace("public/",""), presentation: presentation.name, topic: topic.name} );
        });
        user.save();
    }
    res.sendStatus(200);
});

router.post('/uploadNotes', function (req, res, next) {
    var user = req.user;
    var fileObject = req.files.file;
    var fileName = fileObject.originalFilename;
    var tmpPath = fileObject.path;
    var uploadPath = config.fileDir;
    var topic = user.findTopic(req.body.topic);
    var presentation = topic.findPresentation(req.body.presentation);
    var fileIndex = req.body.fileIndex; // indicates which file of presentation was uploaded (0 for initial presentation upload)
    if(fileIndex == 0) {
        var num_pages;
        output_format = process.cwd() + "/" + uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-notes-{}.pdf";
        output_format = output_format.replace(/ /g,'');
        childProcess.exec("python " + process.cwd() + "/public/python/split_pdf.py " + tmpPath + " " + output_format, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                num_pages = parseInt(stdout);
                for(i = 1; i <= num_pages; i++) {
                    var newFilePath = uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-notes-" + i + ".pdf"; // uploadDir/username-topicname-presentationname-fileindex.pdf
                    newFilePath = newFilePath.replace(/ /g,'');
                    //presentation.files[i] = newFilePath; // add file to presentation
                    presentation.notes.push({filePath: newFilePath.replace("public/",""), fileIndex: i, presentation: presentation.name, topic: topic.name});
                    _.each(user.sockets, function(socket, index) {
                        socket.emit("addNoteToList", {fileIndex: i, filePath: newFilePath.replace("public/",""), presentation: presentation.name, topic: topic.name} );
                    });
                }
            }
            fs.unlinkSync(tmpPath, function (err) {
                if (err) throw err;
            }); // delete temporary file

            user.save();
        });
    }
    else {

        var newFilePath = uploadPath + "/" + user.username + "-" + topic.name + "-" + presentation.name + "-notes-" + fileIndex + ".pdf"; // uploadDir/username-topicname-presentationname-fileindex.pdf
        presentation.files[fileIndex] = newFilePath; // add file to presentation
        fs.rename(tmpPath, newFilePath); // move file from tmp to file_dir
        presentation.notes[fileIndex-1] = {filePath: newFilePath.replace("public/",""), fileIndex: fileIndex, presentation: presentation.name, topic: topic.name};
        _.each(user.sockets, function(socket, index) {
            socket.emit("updateNotes", {
                fileIndex: fileIndex,
                filePath: newFilePath.replace("public/", ""),
                presentation: presentation.name,
                topic: topic.name
            });
            var praesiSlide = presentation.slides[fileIndex-1];
            socket.emit("updatePDFToList", {fileIndex: praesiSlide.fileIndex, filePath: praesiSlide.filePath, presentation: presentation.name, topic: topic.name});
        });

        user.save();
    }

    res.sendStatus(200);
});

module.exports = router;