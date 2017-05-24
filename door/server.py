from flask import Flask
from flask import request
import json
import wave
from pyaudio import PyAudio, paContinue
import math
import multiprocessing
import threading
import numpy as np
import os

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

class Noise:
    chunk = 1024

    def __init__(self):
        """Init noise"""
        self.wf = wave.open(os.path.join(os.path.dirname(__file__), "noise/noise.wav"), 'rb');
        self.p = PyAudio()
        self.fftArray = []
        self.fft()
        self.curentIndex = 0

        def callback(in_data, frame_count, time_info, status):
            data = self.wf.readframes(frame_count)
            self.curentIndex += 1
            if len(data) < 2*frame_count:
                self.wf.rewind()
                self.curentIndex = 0
                data = self.wf.readframes(frame_count)
            return (data, paContinue)


        self.stream = self.p.open(
            format = self.p.get_format_from_width(self.wf.getsampwidth()),
            channels = self.wf.getnchannels(),
            rate = self.wf.getframerate(),
            output = True,
            frames_per_buffer=self.chunk,
            start=False,
            stream_callback=callback
        )

    def wav2array(self, nchannels, sampwidth, data):
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
            dt_char = 'u' if sampwidth == 1 else 'i'
            a = np.fromstring(data, dtype='<%s%d' % (dt_char, sampwidth))
            result = a.reshape(-1, nchannels)
        return result

    def fft(self):
        self.wf.rewind()
        while True:
            data = self.wf.readframes(self.chunk)
            if len(data) < 2*self.chunk:
                break
            array = self.wav2array(self.wf.getnchannels(), self.wf.getsampwidth(), data)
            fs = self.wf.getframerate()
            ff = np.fft.fft(array)
            freq = np.fft.fftfreq(len(array), d=1./fs)
            ff += 0.00001 # da ne bi desio log od 0
            ffDec = 20*np.log10(np.abs(ff[0:ff.shape[0]//2]))
            ffDec -= np.max(ffDec)
            freq = freq[0:len(freq)//2]
            result = dict(zip(freq.tolist(), ffDec.tolist()));
            self.fftArray.append(result)
        self.wf.rewind()

    def close(self):
        self.stream.close()
        self.p.terminate()

def play(frequency, length):
    print("Playing impulse at %sHz" % frequency);
    frequency = float(frequency);
    BITRATE = 16000

    FREQUENCY = frequency
    LENGTH = length

    NUMBEROFFRAMES = int(BITRATE * LENGTH)
    RESTFRAMES = NUMBEROFFRAMES % BITRATE
    WAVEDATA = ''

    for x in range(NUMBEROFFRAMES):
       WAVEDATA += chr(int(math.sin(x / ((BITRATE / FREQUENCY) / math.pi)) * 127 + 128))

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
        return json.dumps(noise.fftArray);

@app.route('/fftIndex', methods=['GET'])
def fftIndex():
    if request.method == 'GET':
        return str(noise.curentIndex)

@app.route('/startNoise')
def startNoise():
    noise.stream.start_stream()
    return ""

@app.route('/stopNoise')
def stopNoise():
    noise.stream.stop_stream();
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

@app.route("/favicon.ico")
def icon():
    return app.send_static_file('favicon.ico')

@app.route("/index.html")
@app.route("/")
def app_html():
    return app.send_static_file('index.html')

if __name__ == "__main__":
    app.run()
