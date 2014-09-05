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
