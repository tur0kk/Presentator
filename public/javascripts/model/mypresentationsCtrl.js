// control (model) for mypresentations site
// defines scope variables and io injection functionality
angular.module('App').controller('MyPresentationsCtrl', function($scope, io) {

    // connection variables
    this.io = io;
    this.io.emit('mypresentationsServer:connect', {}); // initial connect to request user view

    // model variables
    $scope.name = '';
    $scope.topics = [];
    $scope.presentations = [];
    $scope.presentationSlides = [];
    $scope.presentationNotes = [];
    $scope.highestFileIndex = 0;

    $scope.currentSelectedTopic = ""; // nav menu
    $scope.currentSelectedPresentation = ""; // visualized in content screen
    $scope.currentDisplayedTopic = ""; // nav menu
    $scope.currentDisplayedPresentation = ""; // visualized in content screen

    // indicates which file in list was selected last, so that file is replaced at right position on server. 0 for initial presentation upload !!!! UPLOAD
    $scope.fileIndex = 0;

    // set on enter certain dropzone to distinguish between drop areas
    $scope.lastDropArea = "";

    // set on upload error so that last drop area can be displayed with error class
    $scope.lastDropAreaError = false;


    // event handler bindings for data coming from server
    this.io.on('username', function(data) {
        $scope.name = data.msg;
    });
    this.io.on('topics', function(data) {
        $scope.topics = data.msg;
    });
    this.io.on('presentations', function(data) {
        $scope.presentations = data.msg;
    });

    this.io.on('slides', function(data) {
        $scope.presentationSlides = data.msg;
        $scope.highestFileIndex = $scope.presentationSlides.length;
    });

    this.io.on('addPDFToList', function(data) {
        $scope.presentationSlides.push(data);
        $scope.highestFileIndex = $scope.presentationSlides.length;
        console.log("data")
    });

    this.io.on('updatePDFToList', function(data) {
        $scope.presentationSlides[data.fileIndex-1] = data;
        $scope.highestFileIndex = $scope.presentationSlides.length;
    });

    this.io.on('notes', function(data) {
        $scope.presentationNotes = data.msg;
    })

    this.io.on('updateNotes', function(data) {
        $scope.presentationNotes[data.fileIndex-1] = data;
    });

    this.io.on('addNoteToList', function(data) {
        $scope.presentationNotes.push(data);
    });


    // register functions to change view, additionally push changes to server
    $scope.selectTopic = function(topicName) {
        $scope.currentSelectedTopic = topicName;
        io.emit('mypresentationsServer:getPresentations', {msg: topicName}); // request presentations of certain topic
    }
    $scope.selectPresentation = function(presentationName) {
        $scope.currentSelectedPresentation = presentationName;

        // display corresponding slides
        $scope.currentDisplayedTopic = $scope.currentSelectedTopic;
        $scope.currentDisplayedPresentation = $scope.currentSelectedPresentation;
        io.emit('mypresentationsServer:getSlides', {msg: {topicName:  $scope.currentSelectedTopic, presentationName: presentationName}});
        io.emit('mypresentationsServer:getNotes', {msg: {topicName:  $scope.currentSelectedTopic, presentationName: presentationName}});
    }
    $scope.addTopic = function() {
        if($scope.topics.indexOf($scope.newTopic) <= - 1 && $scope.newTopic != undefined) { // does not exist
            $scope.topics.push($scope.newTopic);
            io.emit('mypresentationsServer:addTopic', {msg: {topic: $scope.newTopic}}); // request adding topic
            $scope.selectTopic($scope.newTopic);
        }
        $scope.newTopic = "";
    }
    $scope.addPresentation = function() {
        if($scope.presentations.indexOf($scope.newPresentation) <= - 1 && $scope.newPresentation != undefined) { // does not exist
            $scope.presentations.push($scope.newPresentation);
            io.emit('mypresentationsServer:addPresentation', {msg: {topic: $scope.currentSelectedTopic, presentation: $scope.newPresentation}}); // request adding topic
            $scope.selectPresentation($scope.newPresentation);
        }
        $scope.newPresentation = "";
    }
    $scope.deleteTopic = function(topicName) {
        var idx = $scope.topics.indexOf(topicName);
        $scope.topics.splice(idx, 1);
        $scope.currentSelectedPresentation = "";
        $scope.currentDisplayedPresentation = "";
        $scope.currentSelectedTopic = "";
        $scope.currentDisplayedTopic = "";
        io.emit('mypresentationsServer:deleteTopic', {msg: {topic: topicName}}); // request adding topic

    }
    $scope.deletePresentation = function(presentationName) {
        var idx = $scope.presentations.indexOf(presentationName);
        $scope.presentations.splice(idx, 1);
        $scope.currentSelectedPresentation = "";
        $scope.currentDisplayedPresentation = "";
        io.emit('mypresentationsServer:deletePresentation', {msg: {topic: $scope.currentSelectedTopic, presentation: presentationName}}); // request adding topic
    }

    $scope.deleteSlide = function(slide) {
        io.emit('mypresentationsServer:deleteSlide', {msg: slide});
    }

    $scope.notification = function() {
        io.emit("mypresentationsServer:notification", {msg:$('#messageSource').val()});
        // clear text box
        $('#messageSource').val('');
    }

    $scope.showPDFPreview = function(data) {
        PDFJS.getDocument(data.filePath).then(function(pdf) {

            pdf.getPage(1).then(function(page) {
                var desiredHeight = 150;
                var viewport = page.getViewport(1);
                var scale = desiredHeight / viewport.height;
                var scaledViewport = page.getViewport(scale);

                var canvas = document.getElementById('slide'+data.fileIndex);
                if(canvas !== undefined && canvas !== null ){
                    var context = canvas.getContext('2d');
                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    var renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport
                    };
                    page.render(renderContext);
                }

            });
        });
    }

    $scope.showNotesPreview = function(data) {
        var filePath = $scope.presentationNotes[data.fileIndex-1].filePath;
        if(filePath !== undefined && filePath !== null) {
            PDFJS.getDocument(filePath).then(function (pdf) {

                pdf.getPage(1).then(function (page) {
                    var desiredHeight = 150;
                    var viewport = page.getViewport(1);
                    var scale = desiredHeight / viewport.height;
                    var scaledViewport = page.getViewport(scale);


                    var canvas = document.getElementById('note' + data.fileIndex);
                    if(canvas !== undefined && canvas !== null ) {
                        var context = canvas.getContext('2d');
                        canvas.height = scaledViewport.height;
                        canvas.width = scaledViewport.width;

                        var renderContext = {
                            canvasContext: context,
                            viewport: scaledViewport
                        };
                        page.render(renderContext);
                    }
                });
            });
        }
    }

    $scope.makeReordable = function(slide) {
        var panelList = $('#draggableSlideList');
        var adjustment;
        var oldPosition = -1;
        var newPosition = -1;
        $(function  () {
            panelList.sortable({
                // Only make the .panel-heading child elements support dragging.
                // Omit this to make then entire <li>...</li> draggable.
                handle: '.panel-heading',
                pullPlaceholder: '.placeholder',
                // animation on drop
                onDrop: function ($item, container, _super) {
                    var $clonedItem = $('<li/>').css({height: 0});
                    $item.before($clonedItem);
                    $clonedItem.animate({'height': $item.height()});
                    newPosition = $item.prevAll().length;
                    $item.animate($clonedItem.position(), function () {
                        $clonedItem.detach();
                        _super($item, container);
                    });

                    io.emit('mypresentationsServer:updateListOrder', {msg: {topic: $scope.currentSelectedTopic, presentation: $scope.currentSelectedPresentation, newPos: newPosition, oldPos: oldPosition}});
                    oldPosition = newPosition;
                },

                // set $item relative to cursor position
                onDragStart: function ($item, container, _super) {
                    var offset = $item.offset(),
                        pointer = container.rootGroup.pointer;
                    oldPosition = $item.prevAll().length +1;
                    adjustment = {
                        left: pointer.left - offset.left,
                        top: pointer.top - offset.top
                    };

                    _super($item, container);
                },
                onDrag: function ($item, position) {
                    $item.css({
                        left: position.left - adjustment.left,
                        top: position.top - adjustment.top
                    });
                }
            });
        });
    }

    $scope.startPresentation = function() {
        var pres_url = "presentation/" + $scope.currentDisplayedTopic + "/" + $scope.currentDisplayedPresentation + "/1";
        window.open(pres_url, "presentation", "fullscreen=1");
    }

    $scope.showNotes = function() {
        var notes_url = "notes/" +$scope.currentDisplayedTopic + "/" + $scope.currentDisplayedPresentation + "/1";
        window.open(notes_url, "notes", "fullscreen=1");
    }
});



angular.module('App' /*['angularFileUpload']*/).controller('UploadCtrl', ['$scope','$element', 'FileUploader', '$timeout', function($scope, $element, FileUploader, $timeout) {


    var uploader = $scope.uploader = new FileUploader({
        url: '/files/uploadPresentation',
        autoUpload: true
    });

    // FILTERS
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            if(item.type === "application/pdf") {
                return true;
            }
            else {
                return false;
            }
        }
    });

    // CALLBACKS
    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        // changes the class of lastDropZone to error class and back after 1,5 secs
        $scope.lastDropAreaError = true;
        $timeout( function(){ $scope.lastDropAreaError = false; }, 1500);
    };
    uploader.onAfterAddingFile = function(fileItem) {
        var fileIndex = 0;
        if($element.attr("id") ===  "presDropZone") {
            fileIndex = 0;
        }
        else if($element.attr("class").indexOf("test") > -1) {
            var test = $scope.$parent;
            var test2 = test.slide;
            fileIndex = test2.fileIndex;
        }

        else if($element.attr("id") === "slideAddDropZone") {
            var $previewList = $("#draggableSlideList");
            fileIndex = $previewList.children().length;
        }
        fileItem.formData = [{"topic" : $scope.currentDisplayedTopic, "presentation" : $scope.currentDisplayedPresentation, "fileIndex" : fileIndex}];
        fileItem.removeAfterUpload = true;
        $scope.fileIndex = 0;
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
    };
    uploader.onBeforeUploadItem = function(item) {
    };
    uploader.onProgressItem = function(fileItem, progress) {
    };
    uploader.onProgressAll = function(progress) {
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
    };
    uploader.onCompleteAll = function() {
    };

    // set on enter certain dropzone to distinguish between drop areas
    $scope.setLastDropZone = function(name) {
        $scope.lastDropArea = name;
    }

    $scope.setDroppedFileIndex = function(droppedFile) {
        if(droppedFile)
            $scope.fileIndex = droppedFile.fileIndex;
    }
}]);

angular.module('App' /*['angularFileUpload']*/).controller('UploadCtrlNotes', ['$scope', '$element', 'FileUploader', '$timeout', function($scope, $element, FileUploader, $timeout) {
    var uploader = $scope.uploader = new FileUploader({
        url: '/files/uploadNotes',
        autoUpload: true
    });

    // FILTERS
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            if(item.type === "application/pdf") {
                return true;
            }
            else {
                return false;
            }
        }
    });

    // CALLBACKS
    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        // changes the class of lastDropZone to error class and back after 1,5 secs
        $scope.lastDropAreaError = true;
        $timeout( function(){ $scope.lastDropAreaError = false; }, 1500);
    };
    uploader.onAfterAddingFile = function(fileItem) {
        var fileIndex = 0;
        if($element.attr("id") ===  "notesDropZone") {
            fileIndex = 0;
        }
        else if($element.attr("class").indexOf("test") > -1) {
            var test = $scope.$parent;
            var test2 = test.slide;
            fileIndex = test2.fileIndex;
        }

        fileItem.formData = [{"topic" : $scope.currentDisplayedTopic, "presentation" : $scope.currentDisplayedPresentation, "fileIndex" : fileIndex}];
        fileItem.removeAfterUpload = true;
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
    };
    uploader.onBeforeUploadItem = function(item) {
    };
    uploader.onProgressItem = function(fileItem, progress) {
    };
    uploader.onProgressAll = function(progress) {
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
    };
    uploader.onCompleteAll = function() {
    };

    // set on enter certain dropzone to distinguish between drop areas
    $scope.setLastDropZone = function(name) {
        $scope.lastDropArea = name;
    }

    $scope.setDroppedFileIndex = function(droppedFile) {
        if(droppedFile)
            $scope.fileIndex = droppedFile.fileIndex;
    }
}]);