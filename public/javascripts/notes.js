$(document).ready( function() {

    var fullscreen = false;

    $('#fullscreen').on('click', function(event) {
        var canvas = document.getElementById("slide-display");
        RunPrefixMethod($("#canvas-container")[0], "RequestFullScreen");
    });

    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
        fullscreen = !fullscreen;
        renderPage();
    });

    $('#currentPage').on('change', function(event, newPage) {
        curPage = newPage;

        // Update URL
        var newurl = window.location.href.substr(0,window.location.href.lastIndexOf("/")) + "/" + curPage;
        window.history.pushState({}, "", newurl);

        renderPage();
    });

    function renderPage() {
        var curPage = $('[ng-controller="notesCtrl"]').scope().currentPage;
        var notes = $('[ng-controller="notesCtrl"]').scope().notes;
        var filePath = "/" + notes[curPage-1].filePath;

        console.log(filePath);

        PDFJS.getDocument(filePath).then(function (pdf) {
            if(curPage == $('[ng-controller="notesCtrl"]').scope().currentPage) {
                // Makes sure that we do not render old pages if the response took too long
                pdf.getPage(1).then(function (page) {
                    var canvas = document.getElementById("slide-display");
                    var context = canvas.getContext('2d');
                    var scale, viewport;

                    if (fullscreen) {
                        // Find correct scale for fullscreen
                        scale = 1;
                        viewport = page.getViewport(scale);
                        scale = $(window).height() / viewport.height;
                        viewport = page.getViewport(scale);

                        canvas.width = viewport.width;
                        canvas.height = $(window).height();

                        // Set background black
                        $("#canvas-container").css("background-color","black");
                    } else {
                        scale = 1;
                        viewport = page.getViewport(scale);
                        scale = (2/3) * $(window).height() / viewport.height;
                        viewport = page.getViewport(scale);

                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        // Set background white
                        $("#canvas-container").css("background-color","white");
                    }

                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            } else {
                console.log("Skipped response");
            }
        });
    }

    // Code from http://www.sitepoint.com/html5-full-screen-api/
    var pfx = ["webkit", "moz", "ms", "o", ""];
    function RunPrefixMethod(obj, method) {

        var p = 0, m, t;
        while (p < pfx.length && !obj[m]) {
            m = method;
            if (pfx[p] == "") {
                m = m.substr(0,1).toLowerCase() + m.substr(1);
            }
            m = pfx[p] + m;
            t = typeof obj[m];
            if (t != "undefined") {
                pfx = [pfx[p]];
                return (t == "function" ? obj[m]() : obj[m]);
            }
            p++;
        }

    }

});

