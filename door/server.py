from flask import Flask
from flask import request
import json
import wave
from pyaudio import PyAudio
import math
import multiprocessing
import threading

app = Flask(__name__, static_folder='./static')

class Noise:
    chunk = 1024
    start = False

    def __init__(self):
        """Init noise"""
        self.wf = wave.open("noise/noise.wav", 'rb');
        self.p = PyAudio()
        self.stream = self.p.open(
            format = self.p.get_format_from_width(self.wf.getsampwidth()),
            channels = self.wf.getnchannels(),
            rate = self.wf.getframerate(),
            output = True
        )

    def play(self):
        while True:
            self.data = self.wf.readframes(self.chunk)
            if self.data == '':
                self.wf.rewind()
                self.data = self.wf.readframes(self.CHUNK)
            self.stream.write(self.data)

    def fft(self):
        # TODO  1. predji na procese 2.uraditi fft imas primer kod Andjelke, proveri samo da li ova data ima i vise nego sto treba
        print("krava")
        # print(self.data)

    def setStart(self, value):
        print(value)
        if value:
            print("ukljuci")
            # TODO ovo pod komentarom radi
            # self.procces = multiprocessing.Process(self.play())
            # self.procces.start()
        else:
            print("iskljuci")
            # TODO ovo ne radi, nadji kako da ubijes proces ili vec kako hoces da izvedes play pause
            # self.procces.terminate()

    def close(self):
        self.stream.close()
        self.p.terminate()

def play(frequency, length):
    print(frequency);
    frequency = float(frequency);
    BITRATE = 16000

    FREQUENCY = frequency
    LENGTH = length

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

noise = Noise()

@app.route('/play', methods=['GET', 'POST'])
def freq():
    if request.method == 'GET':
        if threading.active_count() < 2:
            threading.Thread(target=play(request.args['freq'], 0.01)).start()
    return "Zdravo"

@app.route('/fftNoise', methods=['GET'])
def fftNoise():
    if request.method == 'GET':
        noise.fft()
        # TODO vrati klijentu ono sto izracunas kao fft
        return '[1, 2, 3]';

@app.route('/startNoise')
def startNoise():
    #TODO start sledeci je stop
    noise.setStart(True)
    return ""

@app.route('/stopNoise')
def stopNoise():
    noise.setStart(False)
    return ""


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
