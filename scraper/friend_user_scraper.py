import db
import requests
import bs4
import logging

import delay
import time
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

if __name__ == "__main__":
    conn = db.database_connection()
    cur = conn.cursor()

    while True:
        the_user = db.random_user_id_and_path()
        if the_user is None:
            continue

        r = requests.get("http://www.last.fm" + the_user[1] + "/friends")
        soup = bs4.BeautifulSoup(r.content)
        for link in soup.select(".userContainer strong a"):
            href = link["href"]
            cur.execute("INSERT into lastfm_users (user_path) SELECT %s where not exists (select 1 from lastfm_users where user_path=%s) RETURNING id", (href,href))
            t = cur.fetchone()
            if t is not None:
                new_user_id = t[0]
                cur.execute("INSERT INTO lastfm_friends (user_1_id, user_2_id) SELECT %s, %s WHERE NOT EXISTS (select 0 FROM lastfm_friends where user_1_id=%s and user_2_id=%s)", (new_user_id, the_user[0], new_user_id, the_user[0]))
                cur.execute("INSERT INTO lastfm_friends (user_1_id, user_2_id) SELECT %s, %s WHERE NOT EXISTS (select 0 FROM lastfm_friends where user_1_id=%s and user_2_id=%s)", (the_user[0], new_user_id, the_user[0], new_user_id))
                logging.info("Got new user %s" % (href))
        conn.commit()
        delay.sleep()
