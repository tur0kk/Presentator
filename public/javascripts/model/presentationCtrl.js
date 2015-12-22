// control (model) for presentation view
// defines scope variables and io injection functionality
angular.module('App').controller('presentationCtrl', function($scope, $document, io) {

    // connection variables
    this.io = io;
    this.io.emit('mypresentationsServer:connect', {}); // initial connect to request user view

    var pathParts = window.location.href.split("/");

    // model variables
    $scope.name = '';
    $scope.currentPresentation = pathParts[pathParts.length-2].replace('%20', ' ');
    $scope.currentTopic = pathParts[pathParts.length-3].replace('%20', ' ');
    $scope.currentPage = parseInt(pathParts[pathParts.length-1]);
    $scope.slides = [];

    // Get slides for current presentation
    io.emit('mypresentationsServer:getSlides', {msg: {topicName:  $scope.currentTopic, presentationName: $scope.currentPresentation}});


    var canvas = document.getElementById("slide-display");
    ctx = canvas.getContext("2d");
    ctx.beginPath();

    $('#slide-display')
        .drag("start",function( ev, dd ){
            var relativePointX = (ev.pageX - dd.originalX)/$('#slide-display').width();
            var relativePontY = (ev.pageY - dd.originalY)/$('#slide-display').height();
            io.emit("mypresentationsServer:moveTo", {x: relativePointX, y: relativePontY});
        })
        .drag(function( ev, dd ){
            var relativePointX = (ev.pageX - dd.originalX)/$('#slide-display').width();
            var relativePontY = (ev.pageY - dd.originalY)/$('#slide-display').height();
            io.emit("mypresentationsServer:lineTo", {x: relativePointX, y: relativePontY});
        });

    io.on('moveTo', function(data) {
        ctx.fillStyle = "solid";
        ctx.strokeStyle = "#bada55";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        var absolutePointX = data.x * $('#slide-display').width();
        var absolutePointY = data.y * $('#slide-display').height();
        ctx.moveTo(absolutePointX, absolutePointY);
    });

    io.on('lineTo', function(data) {
        var absolutePointX = data.x * $('#slide-display').width();
        var absolutePointY = data.y * $('#slide-display').height();
        ctx.lineTo(absolutePointX, absolutePointY);
        ctx.stroke();
    });


    $document.bind("keydown", function(evt) {
        switch (evt.keyCode) {
            case 37:
                prevPage();
                break;
            case 39:
                nextPage();
                break;
        }
    });

    this.io.on('username', function(data) {
        $scope.name = data.msg;
    });

    this.io.on("changeCurrentPage", function(data) {
        if(data.msg || data.msg == 0) { // Since 0 is valid but a 'falsy' type, catch it separately
            $scope.currentPage = parseInt(data.msg);
            refreshView();
        }
    });

    this.io.on('slides', function(data) {
        $scope.slides = data.msg;
        refreshView();
    });

    function refreshView() {
        // Pass the new page along in the event because the event triggers faster than the value changes
        angular.element("#currentPage").trigger("change", $scope.currentPage);
    }

    changePage = function(page) {
        io.emit("mypresentationsServer:changeCurrentPage", {pageNum: page});
    };

    function nextPage() {
        // First, see if next page exists
        if($scope.currentPage < $scope.slides.length) {
            $scope.currentPage += 1;
            changePage($scope.currentPage);
        }
    }

    function prevPage() {
        if($scope.currentPage > 1) {
            $scope.currentPage -= 1;
            changePage($scope.currentPage);
        }
    }
});