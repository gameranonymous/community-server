import psycopg2
import urlparse
import json
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

def save_metadata_row(lastfm_id, artist_name, track_name, ids, album_art):
    conn = database_connection()
    cur = conn.cursor()
    cur.execute("""
    insert into rosetta_metadata (lastfm_track_path, json, artist_name, track_name, album_art_url) values (%s, %s, %s, %s, %s)""",
    (lastfm_id, json.dumps(ids), artist_name, track_name, album_art)
    )
    conn.commit()


def metadata_row(lastfm_track_id):
    conn = database_connection()
    cur = conn.cursor()
    cur.execute("select * from rosetta_metadata where lastfm_track_path=%s", (lastfm_track_id,))
    row = cur.fetchone()
    if row is None:
        return None
    else:
        return {
                "lastfm_id": row[1],
                "track_ids": json.loads(row[2]),
                "album_art_url": row[5],
                "artist_name": row[3],
                "track_name":row[4]
                }
