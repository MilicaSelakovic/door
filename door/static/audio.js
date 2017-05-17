var v;
window.onload = function() {
    v = new Visualizer();
    v.ini();
};
var Visualizer = function() {
        this.audioContext = null;
        this.powerOfNoise = 0;
        this.power80 = 0;
        this.powerAfter = 0;
        this.count = 0;
        this.timer = null;

        this.analyser = null;

        this.id = 0;
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
        analyser_node.smoothingTimeConstant = 0;
        analyser_node.minDecibels = -120;
        analyser_node.maxDecibels = 10;
        analyser_node.fftSize = BUFF_SIZE_RENDERER;

        this.analyser = analyser_node;
        distortion = this.audioContext.createWaveShaper();
        biquadFilter = this.audioContext.createBiquadFilter();
        convolver = this.audioContext.createConvolver();

        microphone_stream.connect(analyser_node);
        analyser_node.connect(distortion);
        distortion.connect(biquadFilter);
        biquadFilter.connect(convolver);
        convolver.connect(gain_node);
        gain_node.connect(this.audioContext.destination);

        this._drawSpectrum(analyser_node);


},
    _drawSpectrum: function(analyser) {
      analyser.fftSize = 4096;
      canvas = document.getElementById('canvas');
      cwidth = canvas.width;
      cheight = canvas.height - 2;
      canvasCtx = canvas.getContext('2d');
      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      console.log(dataArray);

      canvasCtx.clearRect(0, 0, cwidth, cheight);
      that = this;
      function draw() {
        drawVisual = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
      //  that.clarty(analyser)
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
    clarty: function(analyser){

      data = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(data);
      data = data.map(function(x){
        return Math.pow(10, x/20);
      });

      power = 0
      for(var i = 0, l = data.length; i < l; i++){
        var frequency = i*this.audioContext.sampleRate/analyser.fftSize;
        power += data[i]*frequency*data[i]*frequency;
      }
      power -= this.powerOfNoise*this.count;
      if(this.count < 80){
        // console.log(power);
        this.power80 += power*power;
        this.count += 1;
      } else{
        if(this.count > 1000){
          this._result();
        }
        this.powerAfter += power*power;
        this.count += 1;
      }
    },
    _beginFreq: function(analyser){
      data = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(data);
      data = data.map(function(x){
        return Math.pow(10, x/20);
      });

      for(var i = 0, l = data.length; i < l; i++){
        var frequency = i*this.audioContext.sampleRate/analyser.fftSize;
        this.powerOfNoise += data[i]*frequency*data[i]*frequency;
      }
    },
    _result: function(){
      // console.log('radi');
      clearInterval(this.timer);
      if(this.powerAfter == 0){
        c80 = 0;
      } else{
        c80 = 10*Math.log(this.power80/this.powerAfter);
      }
      console.log(c80);
      this.id = 0;
    },
    _start: function(){
      if(this.id == 0){
        this._beginFreq(this.analyser);
        $.get('http://localhost:5000')
        that = this;
        this.timer = setInterval(function() {that.clarty(that.analyser)}, 1);
        this.id = 1;
      } else{
        console.log('majmune');
      }

    }
}
