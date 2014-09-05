$(document).ready(function() {
    window.currentState = null;
    var i = 0;
    var player = new Player(function(trackHandle) {
        i += 1;
        $("#message").show();
        $("#message").text("Now Playing:" + trackHandle.artist_string + "_" +  trackHandle.title_string + " " + i);
        $.get("/api/next_track", function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }

            player.startLoadingNextTrack(response);

        });
        window.history.pushState({}, "", "/play/" + trackHandle.artist_string.replace(" ", "+") + "/_/" + trackHandle.title_string.replace(" ", "+"));
    });
    function renderIndex() {
    }

    function renderPlayer() {
        $("#play").fadeOut();
        $("#message").show();
        $("#message").text("Loading a track...");
        $("#controls").show();

        var state = 1;
        $("#pause").click(function() {
            if (state == 1) {
                player.pause();
                state = 0;
            } else {
                player.play();
                state = 1;
            }
        });

        $("#next").click(function() {
            player.next();
        });

        $.get("/api/next_track", function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }
            player.playTrackFor(response);
        });
    }
    var currentState = null;
    setInterval(function() {
        var newState = window.location.pathname
        var views = {
            "/": renderIndex,
            "/play": renderPlayer,
        }

        if (currentState != newState && newState.indexOf("_" == -1)) {
            console.log("state transition");
            currentState = newState;
            views[newState]();
        }
    }, 60);

    function checkRdio() {
        console.log("checking rdio");
        $.get("/user/has_rdio", function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }

            if (response.has_rdio) {
                clearInterval(interval);
                console.log("the playback token is");
                console.log(response.playback_token);
                player.setupRdio(response.playback_token);
            } else {
                console.log("no rdio");
            }
        });
    }

    var interval = setInterval(function() {
        checkRdio();
    }, 5000);
    checkRdio();
    $("#play").click(function(e) {
        window.history.pushState({}, "", "/play");
        showPlayer();
        e.preventDefault();
        return false;
    });
    console.log("hi");
});
