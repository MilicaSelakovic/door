from flask import Flask
from pyaudio import PyAudio
import math
import threading

app = Flask(__name__)

def play(frequency, length):
    BITRATE = 16000 #number of frames per second/frameset.

    #See http://www.phy.mtu.edu/~suits/notefreqs.html
    FREQUENCY = frequency #Hz, waves per second, 261.63=C4-note.
    LENGTH = length #seconds to play sound

    NUMBEROFFRAMES = int(BITRATE * LENGTH)
    RESTFRAMES = NUMBEROFFRAMES % BITRATE
    WAVEDATA = ''

    for x in xrange(NUMBEROFFRAMES):
       WAVEDATA += chr(int(math.sin(x / ((BITRATE / FREQUENCY) / math.pi)) * 127 + 128))

    #fill remainder of frameset with silence
    for x in xrange(RESTFRAMES):
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
        threading.Thread(target=play(1000, 1)).start()
    return "Hvala na paznji!"

if __name__ == "__main__":
    app.run()
