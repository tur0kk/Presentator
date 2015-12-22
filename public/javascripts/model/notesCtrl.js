// control (model) for presentation view
// defines scope variables and io injection functionality
angular.module('App').controller('notesCtrl', function($scope, $document, io) {

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

    console.log({msg: {topicName:  $scope.currentTopic, presentationName: $scope.currentPresentation}});
    io.emit('mypresentationsServer:getNotes', {msg: {topicName:  $scope.currentTopic, presentationName: $scope.currentPresentation}});

    this.io.on('username', function(data) {
        $scope.name = data.msg;
    });

    this.io.on("changeCurrentPage", function(data) {
        if(data.msg || data.msg == 0) { // Since 0 is valid but a 'falsy' type, catch it separately
            $scope.currentPage = parseInt(data.msg);
            refreshView();
            $.notifyClose(); // close all notifications on slide change
        }
    });

    this.io.on('notes', function(data) {
        $scope.notes = data.msg;
        refreshView();
    });

    this.io.on('notification', function(data) {
        $.notify({message: data.msg},{element: '#canvas-container', delay: 0, type: 'pastel-danger', template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
        '<span data-notify="title">{1}</span>' +
        '<span data-notify="message">{2}</span>' +
        '</div>'});
    });

    function refreshView() {
        // Pass the new page along in the event because the event triggers faster than the value changes
        angular.element("#currentPage").trigger("change", $scope.currentPage);
    }
});