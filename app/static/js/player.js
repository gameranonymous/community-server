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
                "play": function() { player.play() }
            }
        };
    }
})();

var Player = (function() {
    return function(newTrackPlayingCallback) {
        var that = this;
        var nextTrackHandle = null;

        var endCallback = function() {
            console.log("playing next track handle");
            nextTrackHandle.play();
            console.log("calling back");
            newTrackPlayingCallback(nextTrackHandle);
            nextTrackHandle = null;
        };

        var resolvers = {
            "tomahawk": new TomahawkPlayer(endCallback),
        }

        this.playTrackFor = function(response, callback) {
            var resolverToUse = "tomahawk";
            var track_id = response.track_ids[resolverToUse];
            nextTrackHandle = resolvers[resolverToUse].preload(track_id, function() {
                console.log("Eqwfoqweifjqwioefj");
                endCallback();
            });
        }

        this.startLoadingNextTrack = function(response) {
            var resolverToUse = "tomahawk";
            var track_id = response.track_ids[resolverToUse];
            nextTrackHandle = resolvers[resolverToUse].preload(track_id);
        };
    };
})();
