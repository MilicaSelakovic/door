from flask import Flask
from pyaudio import PyAudio
import math
import threading

app = Flask(__name__, static_folder='./static')

def play(frequency, length):
    BITRATE = 16000 #number of frames per second/frameset.

    #See http://www.phy.mtu.edu/~suits/notefreqs.html
    FREQUENCY = frequency #Hz, waves per second, 261.63=C4-note.
    LENGTH = length #seconds to play sound

    NUMBEROFFRAMES = int(BITRATE * LENGTH)
    RESTFRAMES = NUMBEROFFRAMES % BITRATE
    WAVEDATA = ''

    for x in range(NUMBEROFFRAMES):
       WAVEDATA += chr(int(math.sin(x / ((BITRATE / FREQUENCY) / math.pi)) * 127 + 128))

    #fill remainder of frameset with silence
    for x in range(RESTFRAMES):
        WAVEDATA += chr(128)

    p = PyAudio()
    stream = p.open(
        format=p.get_format_from_width(1),
        channels=1,
        rate=BITRATE,
        output=True,
        )
    stream.write(WAVEDATA)
    stream.stop_stream()
    stream.close()
    p.terminate()

@app.route("/")
def hello():
    if threading.active_count() < 2:
        threading.Thread(target=play(1000, 0.01)).start()
    return r'<b>Hvala na paznji!</b><br><a href="/audiomic.html">Vizualizacija zvuka</a>'

@app.route("/audiomic.html")
def audiomic():
    return app.send_static_file('audiomic.html')

@app.route("/audio.js")
def audio():
    return app.send_static_file('audio.js')

@app.route("/style.css")
def style():
    return app.send_static_file('style.css')

@app.route("/scripts/main.js")
def main_js():
    return app.send_static_file('scripts/main.js')

@app.route("/scripts/vendor.js")
def vendor_js():
    return app.send_static_file('scripts/vendor.js')

@app.route("/styles/main.css")
def main_css():
    return app.send_static_file('styles/main.css')

@app.route("/app.html")
def app_html():
    return app.send_static_file('index.html')

if __name__ == "__main__":
    app.run()
