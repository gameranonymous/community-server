from flask import Flask, render_template, request, session, redirect
import json
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

@app.route("/")
@app.route("/play")
@app.route("/play/<path:path>")
def index(path=None):
    return render_template("index.html")

@app.route("/api/next_track")
def next_track():
    return json.dumps(
            {
                "track_ids": {"tomahawk": "Imagine Dragons,Radioactive", "rdio": "t20005736" },
                "lastfm_like_url":"Imagine+Dragons/_/Radioactive",
            }
    )

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
