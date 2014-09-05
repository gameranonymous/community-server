$(document).ready(function() {
    window.currentState = null;
    var i = 0;
    var player = new Player(function(trackHandle) {
        i += 1;
        $("#message").text("Now Playing:" + trackHandle.artist_string + "_" +  trackHandle.title_string + " " + i);
        window.history.pushState({}, "", "/play/" + trackHandle.artist_string.replace(" ", "+") + "/_/" + trackHandle.title_string.replace(" ", "+"));
    });
    function renderIndex() {
    }

    function renderPlayer() {
        $("#play").fadeOut();
        $("#message").text("Loading a track...");

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
    $("#play").click(function(e) {
        window.history.pushState({}, "", "/play");
        showPlayer();
        e.preventDefault();
        return false;
    });
    console.log("hi");
});
