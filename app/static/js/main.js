$(document).ready(function() {
    window.currentState = null;
    var player = new Player();
    function renderIndex() {
    }

    function renderPlayer() {
        $("#play").fadeOut();
        $("#message").text("Loading a track...");
        $.get("/api/next_track", function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }
            player.playTrackFor(response, function() {
                $("#message").text("Now playing:" + response.track_id);
                window.history.pushState({}, "", "/play/" + response.lastfm_like_url);
            });
        });
    }
    var currentState = null;
    setInterval(function() {
        var newState = window.location.pathname
        var views = {
            "/": renderIndex,
            "/play": renderPlayer,
        }

        if (currentState != newState) {
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
