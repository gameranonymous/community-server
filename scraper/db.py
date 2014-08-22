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



if __name__ == "__main__":
    conn = database_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lastfm_users (id serial primary key, user_path varchar(255));
    """)

    cur.execute("""
        CREATE UNIQUE INDEX on lastfm_users (user_path)
    """)

    conn.commit()
