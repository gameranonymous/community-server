import db
import requests
import bs4
import logging

import delay
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

def scrape_scrobbles(user_id, user_path):
    current_scrobble = None
    for page_number in xrange(0, 10):
         logging.info("Pulling scrobble page: %s for user: %s" % (page_number+1,user_path))
         r = requests.get("http://www.last.fm" + user_path + "/tracks?view=compact&page=%s" % (page_number+1,))
         soup = bs4.BeautifulSoup(r.content)
         scrobbles = soup.select(".js-scrobble")
         for scrobble in scrobbles:
             sd = ScrobbleDecoder(scrobble)
             logging.info("Got a scrobble: %s for user: %s" % (sd.track_name(), user_path))
             sd.save(user_id)

             if current_scrobble is not None:
                 current_scrobble.update_previous_scrobble(sd)

             current_scrobble = sd
         logging.info("Done scrobble page: %s for user: %s" % (page_number+1,user_path))

class ScrobbleDecoder:
    def __init__(self, scrobble):
        self._scrobble = scrobble

    def track_id(self):
        return self._scrobble.attrs["data-track-id"]

    def scrobbled_at(self):
        return self._scrobble.select("time")[0].attrs["datetime"]

    def track_name(self):
        return self._track_link().string

    def track_path(self):
        return self._track_link().attrs["href"]

    def artist_name(self):
        return self._artist_link().string

    def artist_path(self):
        return self._artist_link().attrs["href"]

    def save(self, user_id):
        conn = db.database_connection()
        cur = conn.cursor()
        cur.execute("""INSERT INTO lastfm_scrobbles (
            lastfm_track_name,
            lastfm_track_path,
            lastfm_artist_name,
            lastfm_artist_path,
            lastfm_track_id,
            lastfm_user_id,
            scrobbled_at
            ) values (%s,%s,%s,%s,%s,%s,%s) returning id
        """, (
            self.track_name(),
            self.track_path(),
            self.artist_name(),
            self.artist_path(),
            self.track_id(),
            user_id,
            self.scrobbled_at()
            )
        )
        conn.commit()
        self._id = cur.fetchone()[0]

    def update_previous_scrobble(self, previous_scrobble):
        conn = db.database_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE lastfm_scrobbles set previous_scrobble=%s where id=%s
        """, (previous_scrobble._id, self._id))

        conn.commit()

    def _track_link(self):
        return self._detail_links()[1]

    def _artist_link(self):
        return self._detail_links()[0]

    def _detail_links(self):
        return self._scrobble.select(".subjectCell a")

if __name__ == "__main__":
    conn = db.database_connection()
    cur = conn.cursor()

    while True:
        try:
            the_user = db.random_user_id_and_path()
            if the_user is None:
                continue
            
            user_id, user_path = the_user
            delay.sleep()
        except:
            pass
