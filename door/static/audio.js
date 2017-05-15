window.onload = function() {
    new Visualizer().ini();
};
var Visualizer = function() {
        this.audioContext = null;
};
Visualizer.prototype = {
      ini: function() {
        this._prepareAPI();
      },
      _prepareAPI: function() {
          window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
          window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
          window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
          try {
              this.audioContext = new AudioContext();
          } catch (e) {
              this._updateInfo('!Your browser does not support AudioContext', false);
              console.log(e);
          }

          if (!navigator.getUserMedia)
              navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
          var that = this;
          if (navigator.getUserMedia){

              navigator.getUserMedia({audio:true, video:false},
                  function(stream) {
                          that._start_microphone(stream);
                  },
                  function(e) {
                      window.alert('Error capturing audio.');
                  }
                  );

          } else { window.alert('getUserMedia not supported in this browser.'); }

    },
    _start_microphone: function(stream){
        var BUFF_SIZE_RENDERER = 16384;
        gain_node = this.audioContext.createGain();
        gain_node.gain.value = 0; // postavljen na 0 jer ne treba da pusta zvuk

        microphone_stream = this.audioContext.createMediaStreamSource(stream);

        analyser_node = this.audioContext.createAnalyser();
        analyser_node.smoothingTimeConstant = 0.85;
        analyser_node.minDecibels = -90;
        analyser_node.maxDecibels = -10;
        analyser_node.fftSize = 2048;

        distortion = this.audioContext.createWaveShaper();
        biquadFilter = this.audioContext.createBiquadFilter();
        convolver = this.audioContext.createConvolver();

        microphone_stream.connect(analyser_node);
        analyser_node.connect(distortion);
        distortion.connect(biquadFilter);
        biquadFilter.connect(convolver);
        convolver.connect(gain_node);
        gain_node.connect(this.audioContext.destination)

        this._drawSpectrum(analyser_node)

},
    _drawSpectrum: function(analyser) {
      analyser.fftSize = 1024;
      canvas = document.getElementById('canvas');
      cwidth = canvas.width;
      cheight = canvas.height - 2;
      canvasCtx = canvas.getContext('2d');
      var bufferLength = analyser.frequencyBinCount;
      console.log(bufferLength);
      var dataArray = new Uint8Array(bufferLength);

      canvasCtx.clearRect(0, 0, cwidth, cheight);

      function draw() {
        drawVisual = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, cwidth, cheight);

        var barWidth = (cwidth / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];

          canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvasCtx.fillRect(x,cheight-barHeight/2,barWidth,barHeight/2);

          x += barWidth + 1;
        }
      };
      draw();
    },
}
