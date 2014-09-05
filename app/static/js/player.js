var TomahawkPlayer = (function() {
    return function() {
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
            var track_parts = track_id.split(",")
            var artist = track_id.split(",")[0]
            var track = track_id.split(",")[1]
            var player = tomaHawk(artist, track, function() {
                setTimeout(function() {
                    player.play();
                    callback();
                }, 6000);
            });
        }
    }
})();

var Player = (function() {
    return function() {
        var that = this;

        var resolvers = {
            "tomahawk": new TomahawkPlayer(),
        }

        this.playTrackFor = function(response, callback) {
            var track_id = response.track_id;
            var resolver = response.resolver;
            console.log(response);

            console.log(resolvers);
            console.log(resolver);
            resolvers[resolver].play(track_id, callback);
        }
    };
})();