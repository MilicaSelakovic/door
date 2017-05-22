from flask import Flask
from flask import request
import json
import wave
from pyaudio import PyAudio
import math
import multiprocessing
import threading
import struct
import numpy as np

app = Flask(__name__, static_folder='./static')

lock = multiprocessing.Lock()

class Noise:
    chunk = 1024
    start = False
    # start = multiprocessing.Value('i', 0);


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
        # self.process = multiprocessing.Process(self.play())
        # self.process.start()


    def play(self):
        # i = 0;
        if self.start :
            self.data = self.wf.readframes(self.chunk)
            if self.data == '':
                self.wf.rewind()
                self.data = self.wf.readframes(self.CHUNK)
            self.stream.write(self.data)

    def wav2array(self, nchannels, sampwidth, data):
        """data must be the string containing the bytes from the wav file."""
        num_samples, remainder = divmod(len(data), sampwidth * nchannels)
        if remainder > 0:
            raise ValueError('The length of data is not a multiple of '
                            'sampwidth * num_channels.')
        if sampwidth > 4:
            raise ValueError("sampwidth must not be greater than 4.")

        if sampwidth == 3:
            a = np.empty((num_samples, nchannels, 4), dtype=np.uint8)
            raw_bytes = np.fromstring(data, dtype=np.uint8)
            a[:, :, :sampwidth] = raw_bytes.reshape(-1, nchannels, sampwidth)
            a[:, :, sampwidth:] = (a[:, :, sampwidth - 1:sampwidth] >> 7) * 255
            result = a.view('<i4').reshape(a.shape[:-1])
        else:
            # 8 bit samples are stored as unsigned ints; others as signed ints.
            dt_char = 'u' if sampwidth == 1 else 'i'
            a = np.fromstring(data, dtype='<%s%d' % (dt_char, sampwidth))
            result = a.reshape(-1, nchannels)
        return result

    def fft(self):
        self.play()
        array = self.wav2array(self.wf.getnchannels(), self.wf.getsampwidth(), self.data)
        fs = self.wf.getframerate()
        ff = np.fft.fft(array)
        freq = np.fft.fftfreq(len(array), d=1./fs)
        ff += 0.00001 # da ne bi bio log od 0
        ffDec = 20*np.log10(np.abs(ff[0:ff.shape[0]//2]))
        ffDec -= np.max(ffDec)
        freq = freq[0:len(freq)//2]
        result = dict(zip(freq.tolist(), ffDec.tolist()));
        return result

    def setStart(self, value):
        self.start = value

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
        result = noise.fft()
        return json.dumps(result);

@app.route('/startNoise')
def startNoise():
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
