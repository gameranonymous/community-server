import db
import requests
import bs4
import logging

import delay
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

if __name__ == "__main__":
    conn = db.database_connection()
    cur = conn.cursor()

    while True:
        r = requests.get("http://www.last.fm/community/users/active")
        soup = bs4.BeautifulSoup(r.content)
        for link in soup.select(".userContainer strong a"):
            href = link["href"]
            cur.execute("INSERT into lastfm_users (user_path) SELECT %s where not exists (select 1 from lastfm_users where user_path=%s) returning id", (href,href))
            if cur.fetchone() is not None:
                logging.info("Got new user %s" % (href))
        conn.commit()
        delay.sleep()
