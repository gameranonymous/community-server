var RdioPlayer = (function() {
    return function(token, endCallback) {
        console.log("more token2");
        console.log(token);
        var flashvars = {
            playbackToken:token,
            domain: window.location.hostname,
            listener: "rdio_callback",
            enableLogging: 1
        };
        var params = {
            allowScriptAccess: "always"
        };
        var attributes = {};

        swfobject.embedSWF(
            "http://www.rdio.com/api/swf/",
            "rdio_player",
            "0",
            "0",
            "9.0.0",
            "expressInstall.swf",
            flashvars,
            params,
            attributes
        );

        var player = document.getElementById("rdio_player");
        window.rdio_callback = {
            ready: function(info) {
                console.log(info);
            }
        }

        this.preload = function(track_id, callback) {
            console.log("SWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG");
            player.rdio_clearQueue();
            console.log("queued rdio track" + track_id);
            player.rdio_queue(track_id);
            return {
                "artist_string": "fix this",
                "title_string": "fix that",
                "play": function() {
                    console.log("CALLING PLAY");
                    console.log(track_id);
                    player.rdio_playQueuedTrack(0,0);
                },
                "pause": function() {
                    player.rdio_pause();
                },
                "stop": function() {
                    player.rdio_pause();
                    player.rdio_seek(0);
                }
            }
        }
    }
})();

var TomahawkPlayer = (function() {
    return function(endCallback) {
        var that = this;

        function tomaHawk(artist, title, loadCallback) {
            var track;
            console.log("hawk");
            track = window.tomahkAPI.Track(title,artist, {
                width:0,
                  height:0,
                  disabledResolvers: [
                //"Youtube",
                //  "Exfm", "SpotifyMetadata", "SoundCloud", "Officialfm", "Lastfm", "Jamendo"
                // options: "SoundCloud", "Officialfm", "Lastfm", "Jamendo", "Youtube", "Rdio", "SpotifyMetadata", "Deezer", "Exfm"
                ],
                  handlers: {
                      onloaded: function() {
                          console.log(track.connection+":\n  api loaded");
                      },
                  onended: function() {
                      console.log(track.connection+":\n  Song ended: "+track.artist+" - "+track.title);
                      endCallback();
                  },
                  onplayable: function() {
                      console.log(track.connection+":\n  playable");
                      loadCallback();
                  },
                  onresolved: function(resolver, result) {
                  },
                  ontimeupdate: function(timeupdate) {

                  }
                  }
            });
            $("body").append(track.render());
            return track;

        }

        this.play = function(track_id, callback) {
            var track_parts = track_id.split(",");
            var artist = track_id.split(",")[0]
            var track = track_id.split(",")[1]
            var player = tomaHawk(artist, track, function() {
                setTimeout(function() {
                    player.play();
                    callback();
                }, 30000);
            });
        }

        this.preload = function(track_id, callback) {
            var cb = callback || function() { "Loaded" };
            var track_parts = track_id.split(",");
            var artist = track_id.split(",")[0];
            var track = track_id.split(",")[1];
            var player = tomaHawk(artist, track, cb);
            return {
                "artist_string": artist,
                "title_string": track,
                "play": function() { player.play() },
                "pause": function() { player.pause() },
                "stop": function() { player.pause(); player.seek(0) },
            }
        };
    }
})();

var Player = (function() {
    return function(newTrackPlayingCallback) {
        var that = this;
        var currentTrackHandle = null;
        var nextTrackHandle = null;

        var resolverToUse = "tomahawk";

        var endCallback = function() {
            console.log("playing next track handle");
            if (currentTrackHandle) {
                currentTrackHandle.stop();
            }
            nextTrackHandle.play();
            currentTrackHandle = nextTrackHandle;
            console.log("calling back");
            newTrackPlayingCallback(nextTrackHandle);
            nextTrackHandle = null;
        };

        var resolvers = {
            "tomahawk": new TomahawkPlayer(endCallback),
        }

        this.pause = function() {
            currentTrackHandle.pause();
        }

        this.play = function() {
            currentTrackHandle.play();
        }

        this.next = function() {
            endCallback();
        }

        this.playTrackFor = function(response, callback) {
            var resolverToUse = "tomahawk";
            var track_id = response.track_ids[resolverToUse];
            nextTrackHandle = resolvers[resolverToUse].preload(track_id, function() {
                console.log("Eqwfoqweifjqwioefj");
                endCallback();
            });
            console.log("first track handle");
            console.log(nextTrackHandle);
        }

        this.setupRdio = function(token) {
            console.log("more token");
            console.log(token);
            resolvers["rdio"] = new RdioPlayer(token, endCallback);
            resolverToUse = "rdio";
        }

        this.startLoadingNextTrack = function(response) {
            var track_id = response.track_ids[resolverToUse];
            nextTrackHandle = resolvers[resolverToUse].preload(track_id);
            console.log("using " + resolverToUse);
            console.log("another track handle");
            console.log(nextTrackHandle);
        };
    };
})();
