from flask import Flask, render_template, request, session, redirect
from markovish import markovish
import json
from bs4 import BeautifulSoup
import requests
from random import choice
import os
import db
from rdioapi import Rdio


app = Flask(__name__)
app.secret_key = 'oiqfwjwoeifjqweopifjqwpiogjqwiopfhqweiopfhjqweoif'


def rdio_key():
    return "cgkga8w7axepedt9qgzaejyb"

def rdio_secret():
    return "AdQVAfCvrQ"


def make_rdio(state):
    return Rdio(rdio_key(), rdio_secret(), state)

def request_host():
    return request.url_root

def begin_rdio_auth():
    state = {}
    rdio = make_rdio(state)
    auth_url = rdio.begin_authentication("%srdio_callback" % request_host())
    session["rdio_token_complete"] = False
    session["rdio_state"] = state
    return auth_url

def spotify_id_from_lastfm_page(lastfm_id):
    response = requests.get("http://last.fm" + lastfm_id)
    body = response.content
    soup = BeautifulSoup(body)
    return soup.select(".spotify-inline-play-button")[0].attrs["data-uri"]

def metadata_for_lastfm_id(lastfm_id):
    spaces = [
            "7digital-US",
            "deezer",
            "fma",
            "playme",
            "rhapsody-US",
            "rdio-DE",
            "spotify",
            "whosampled",
    ]

    all_spaces = "&".join(["bucket=id:" + k for k in spaces])
    row = db.metadata_row(lastfm_id)
    if row is None:
        spotify_id = spotify_id_from_lastfm_page(lastfm_id)
        print spotify_id
        echonest_url = "http://developer.echonest.com/api/v4/track/profile?api_key=NODV0LSHAP8SI9WAF&format=json&id=" + spotify_id
        response = requests.get(echonest_url)
        json = response.json()
        song_id = json["response"]["track"]["song_id"]
        print song_id
        echonest_url = "http://developer.echonest.com/api/v4/song/profile?api_key=NODV0LSHAP8SI9WAF&format=json&id=" + song_id + "&bucket=tracks&" + all_spaces
        response = requests.get(echonest_url)
        json = response.json()
        artist_name = json["response"]["songs"][0]["artist_name"]
        track_name = json["response"]["songs"][0]["title"]
        ids = {}
        album_art = []
        for track in json["response"]["songs"][0]["tracks"]:
            ids[track["catalog"].split("-")[0]] = track["foreign_id"].split(":")[-1]
            if track.has_key("release_image"):
                album_art.append(track["release_image"])

        album_art = choice(album_art)

        ids["tomahawk"] = artist_name + "," + track_name

        db.save_metadata_row(lastfm_id, artist_name, track_name, ids, album_art)
    row = db.metadata_row(lastfm_id)

    return row

@app.route("/")
@app.route("/play")
@app.route("/play/<path:path>")
def index(path=None):
    return render_template("index.html")

@app.route("/deezer_channel")
def channel(path=None):
    return "<script src='http://cdn-files.deezer.com/js/min/dz.js'></script>"

@app.route("/api/next_track")
def next_track():
    cid = request.args.get("cid", "")
    if cid == "":
        tracks = [("Imagine Dragons", "Radioactive"), ("AWOLNATION", "Sail")]
        track = choice(tracks)
        lastfm_track_id = "/music/" + track[0].replace(" ","+") + "/_/" + track[1].replace(" ", "+")
    else:
        lastfm_track_id = markovish().select_next_track(cid)

    metadata = metadata_for_lastfm_id(lastfm_track_id)
    return json.dumps(metadata)

@app.route("/user/has_rdio")
def has_rdio():
    if session.get("rdio_token_complete", False):
        state = session["rdio_state"]
        rdio = make_rdio(state)
        playback_token = rdio.getPlaybackToken(domain=request_host().replace("http://","").replace("/","").replace(":5567", ""))
    else:
        playback_token = None

    return json.dumps({"has_rdio": session.get("rdio_token_complete", False), "playback_token": playback_token})

@app.route("/user/rdio_auth_url")
def rdio_auth_url():
    return json.dumps({"url": begin_rdio_auth()})


@app.route("/rdio_callback")
def rdio_callback():
    state = session["rdio_state"]
    rdio = make_rdio(state)
    rdio.complete_authentication(request.args["oauth_verifier"])
    session["rdio_state"] = state
    session["rdio_token_complete"] = True
    return render_template("player.html")

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ["PORT_TO_BIND_TO"]))
