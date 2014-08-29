import psycopg2
import urlparse
import os


def database_connection():
    parts = urlparse.urlparse(os.environ["POSTGRES_STRING"])
    username = parts.username
    password = parts.password
    database = parts.path[1:]
    hostname = parts.hostname

    return psycopg2.connect(
        database = database,
        user = username,
        password = password,
        host = hostname
    )


def random_user_id_and_path():
    conn = database_connection()
    cur = conn.cursor()
    cur.execute("select id, user_path from lastfm_users order by random()")
    return cur.fetchone()

if __name__ == "__main__":
    conn = database_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lastfm_users (id serial primary key, user_path varchar(255));
    """)

    cur.execute("""
        CREATE UNIQUE INDEX on lastfm_users (user_path)
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lastfm_friends (id serial primary key, user_1_id integer, user_2_id integer);
    """)

    cur.execute("""
        CREATE UNIQUE INDEX ON lastfm_friends(user_1_id, user_2_id)
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lastfm_scrobbles (
         id serial primary key,
         lastfm_track_name varchar(255),
         lastfm_track_path varchar(511),
         lastfm_artist_name varchar(255),
         lastfm_artist_path varchar(255),
         lastfm_track_id varchar(255),
         lastfm_user_id integer,
         previous_scrobble integer,
         scrobbled_at timestamp
       )
    """
    )

    conn.commit()
