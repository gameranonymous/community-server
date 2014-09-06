$(document).ready(function() {
    var i = 0;
    function html_for_response(prefix, response) {
        i += 1;
        return "<h3>" + prefix + "</h3>" + "<h1>" + response.track_name + "</h1>" + "<h2>" + response.artist_name +"</h2>" + "<img src='" + response.album_art_url + "'>"
    }
    window.currentState = null;
    var currentTrackID = null;
    function loadNextTrack() {
        $.get("/api/next_track", {"cid":currentTrackID}, function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }

            console.log("start loading next track");
            player.startLoadingNextTrack(response);
            $("#next-up").html(html_for_response("Next up: ", response));
            $("#next-up").show();
            $(".right .background").css({
                "background-image":"url('" + response.album_art_url + "')",
                "background-size":"cover",
            });

        });
    }
    var player = new Player(function(trackHandle) {
        console.log("track id is");
        currentTrackID = trackHandle.response.lastfm_id;
        console.log(currentTrackID);
        $("#message").show();
        $("#message").html(html_for_response("Now Playing: ", trackHandle.response));
        $(".show-on-play").show();
        loadNextTrack();
        window.history.pushState({}, "", "/play/" + trackHandle.response.artist_name.replace(" ", "+") + "/_/" + trackHandle.response.track_name.replace(" ", "+"));
    });
    function renderIndex() {
    }

    $("#another").click(function() {
        loadNextTrack();
    });

    function renderPlayer() {
        $(".hide-on-play").fadeOut();
        $("#message").show();
        $("#message").text("Loading a track...");
        $("#left-column").hover(function() {
            $("#controls").show();
        }, function() {
            $("#controls").hide();
        });

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
