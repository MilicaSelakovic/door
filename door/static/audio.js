window.onload = function() {
    new Visualizer().ini();
};
var Visualizer = function() {
        this.audioContext = null;
        this.source = null; //the audio source
        this.info = document.getElementById('info').innerHTML; //used to upgrade the UI information
        this.animationId = null;

        this.allCapsReachBottom = false;




        this.audioInput = null,
        this.microphone_stream = null,
        this.gain_node = null,
        this.script_processor_node = null,
        this.script_processor_analysis_node = null,
        this.analyser_node = null;

};
Visualizer.prototype = {
        ini: function() {
        this._prepareAPI();
        // this._addEventListner();
        },
        _prepareAPI: function() {
        //fix browser vender for AudioContext and requestAnimationFrame
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

            navigator.getUserMedia({audio:true},
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
        gain_node.connect( this.audioContext.destination );

        microphone_stream = this.audioContext.createMediaStreamSource(stream);
        microphone_stream.connect(gain_node);

        script_processor_node = this.audioContext.createScriptProcessor(BUFF_SIZE_RENDERER, 1, 1);
        script_processor_node.onaudioprocess = this.process_microphone_buffer;

        microphone_stream.connect(script_processor_node);


        // --- setup FFT

        script_processor_analysis_node = this.audioContext.createScriptProcessor(4096, 1, 1);
        script_processor_analysis_node.connect(gain_node);

        analyser_node = this.audioContext.createAnalyser();
        analyser_node.smoothingTimeConstant = 0;
        analyser_node.fftSize = 4096;

        microphone_stream.connect(analyser_node);

        analyser_node.connect(script_processor_analysis_node);

        var that = this;

        script_processor_analysis_node.onaudioprocess = function() {
            if (microphone_stream.playbackState == microphone_stream.PLAYING_STATE) {
                    that._drawSpectrum(analyser_node)
            }
        };
},
    _drawSpectrum: function(analyser) {
        var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
        ctx = canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(1, '#0f0');
        gradient.addColorStop(0.5, '#ff0');
        gradient.addColorStop(0, '#f00');
        var drawMeter = function() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            if (that.status === 0) {
                //fix when some sounds end the value still not back to zero
                for (var i = array.length - 1; i >= 0; i--) {
                    array[i] = 0;
                };
                allCapsReachBottom = true;
                for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                };
                if (allCapsReachBottom) {
                    cancelAnimationFrame(that.animationId); //since the sound is stoped and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                    return;
                };
            };
            var step = Math.round(array.length / meterNum); //sample limited data from the total array
            ctx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i < meterNum; i++) {
                var value = array[i * step];
                if (capYPositionArray.length < Math.round(meterNum)) {
                    capYPositionArray.push(value);
                };
                ctx.fillStyle = capStyle;
                //draw the cap, with transition effect
                if (value < capYPositionArray[i]) {
                    ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                } else {
                    ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                };
                ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
                ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
            }
            that.animationId = requestAnimationFrame(drawMeter);
        }
        this.animationId = requestAnimationFrame(drawMeter);
    },
    _audioEnd: function(instance) {
        if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
        };
        this.status = 0;
        var text = 'HTML5 Audio API showcase | An Audio Viusalizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
        document.getElementById('uploadedFile').value = '';
    },
    _updateInfo: function(text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if (this.infoUpdateId !== null) {
            clearTimeout(this.infoUpdateId);
        };
        if (processing) {
            //animate dots at the end of the info text
            var animateDot = function() {
                if (i > 3) {
                    i = 0
                };
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.infoUpdateId = setTimeout(animateDot, 250);
            }
            this.infoUpdateId = setTimeout(animateDot, 250);
        };
    },
    process_microphone_buffer: function (event) {

    var i, N, inp, microphone_output_buffer;

    microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now
},

}

function start(stream){
        Visualizer._start_microphone(stream);
}
