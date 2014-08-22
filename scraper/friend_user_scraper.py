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
        cur.execute("select user_path from lastfm_users order by random()")
        the_user = cur.fetchone()
        if the_user is None:
            continue

        r = requests.get("http://www.last.fm" + the_user[0] + "/friends")
        soup = bs4.BeautifulSoup(r.content)
        for link in soup.select(".userContainer strong a"):
            href = link["href"]
            cur.execute("INSERT into lastfm_users (user_path) SELECT %s where not exists (select 1 from lastfm_users where user_path=%s)", (href,href))
            logging.info("Got user %s" % (href))
        conn.commit()
        delay.sleep()
