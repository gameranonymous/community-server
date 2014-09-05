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

        this.preload = function(track_id, response, callback) {
            console.log("SWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG");
            return {
                "response": response,
                "play": function() {
                    player.rdio_queue(track_id);
                    setTimeout(function() {
                        console.log("track_id");
                        console.log(track_id);
                        player.rdio_play(track_id);
                    }, 1200);
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
                    "Rdio",
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

        this.preload = function(track_id, response, callback) {
            var cb = callback || function() { "Loaded" };
            var track_parts = track_id.split(",");
            var artist = track_id.split(",")[0];
            var track = track_id.split(",")[1];
            var player = tomaHawk(artist, track, cb);
            return {
                "response": response,
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
        var tracksPlayed = 0;

        var endCallback = function() {
            console.log("playing next track handle");
            if (currentTrackHandle) {
                currentTrackHandle.stop();
            }
            console.log("calling back");
            tracksPlayed += 1;
            if (resolverToUse == "tomahawk" && tracksPlayed % 3 == 0) {
                $.get("http://delivery.adam.rmsi.de/vast/1235/vast.json?lid=1111111111&sid=1212312312321", function(response) {
                    if (typeof(response) === 'string') {
                        response = JSON.parse(string);
                    }

                    var the_ad = response.VAST.Ad[0].InLine.Creatives.Creative[0].Linear;
                    var duration = the_ad.Duration;
                    var sound_url = the_ad.MediaFiles.MediaFile[0].$;
                    var impression_url = response.VAST.Ad[0].InLine.Impression[0];

                    $("<audio></audio>").attr({
                            'src':sound_url,
                            'volume':0.4,
                            'autoplay':'autoplay'
                    }).appendTo("body");

                    setTimeout(function() {
                        console.log("GO NEXT TRACK");
                        $("audio").remove();
                        $.get(impression_url);
                        nextTrackHandle.play();
                        currentTrackHandle = nextTrackHandle;
                        newTrackPlayingCallback(nextTrackHandle);
                        nextTrackHandle = null;
                    }, parseInt(duration.split(":")[2])*1000);

                });
            } else {
                nextTrackHandle.play();
                currentTrackHandle = nextTrackHandle;
                newTrackPlayingCallback(nextTrackHandle);
                nextTrackHandle = null;
            }
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
            nextTrackHandle = resolvers[resolverToUse].preload(track_id, response, function() {
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
            console.log("start loading next track called");
            var track_id = response.track_ids[resolverToUse];
            nextTrackHandle = resolvers[resolverToUse].preload(track_id, response);
            console.log("using " + resolverToUse);
            console.log("another track handle");
            console.log(nextTrackHandle);
        };
    };
})();
