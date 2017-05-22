"use strict";

/*!
 * @license Open source under BSD 2-clause (http://choosealicense.com/licenses/bsd-2-clause/)
 * Copyright (c) 2015, Curtis Bratton
 * All rights reserved.
 *
 * Liquid Fill Gauge v1.1
 */
function liquidFillGaugeDefaultSettings() {
  return {
    minValue: 0, // The gauge minimum value.
    maxValue: 100, // The gauge maximum value.
    circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
    circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
    circleColor: "#178BCA", // The color of the outer circle.
    waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
    waveCount: 1, // The number of full waves per width of the wave circle.
    waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
    waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
    waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
    waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
    waveAnimate: true, // Controls if the wave scrolls or is static.
    waveColor: "#178BCA", // The color of the fill wave.
    waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
    textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
    textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
    valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
    displayPercent: true, // If true, a % symbol is displayed after the value.
    textColor: "#045681", // The color of the value text when the wave does not overlap it.
    waveTextColor: "#A4DBf8", // The color of the value text when the wave overlaps it.
    colorsCss: false
  };
}

function loadLiquidFillGauge(elementId, value, config) {
  if (config == null) config = liquidFillGaugeDefaultSettings();

  var gauge = d3.select("#" + elementId);
  var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height"))) / 2;
  var locationX = parseInt(gauge.style("width")) / 2 - radius;
  var locationY = parseInt(gauge.style("height")) / 2 - radius;
  var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;

  var waveHeightScale;
  if (config.waveHeightScaling) {
    waveHeightScale = d3.scale.linear().range([0, config.waveHeight, 0]).domain([0, 50, 100]);
  } else {
    waveHeightScale = d3.scale.linear().range([config.waveHeight, config.waveHeight]).domain([0, 100]);
  }

  var textPixels = config.textSize * radius / 2;
  var textFinalValue = parseFloat(value).toFixed(2);
  var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
  var percentText = config.displayPercent ? "%" : "";
  var circleThickness = config.circleThickness * radius;
  var circleFillGap = config.circleFillGap * radius;
  var fillCircleMargin = circleThickness + circleFillGap;
  var fillCircleRadius = radius - fillCircleMargin;
  var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

  var waveLength = fillCircleRadius * 2 / config.waveCount;
  var waveClipCount = 1 + config.waveCount;
  var waveClipWidth = waveLength * waveClipCount;

  // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
  var textRounder = function textRounder(value) {
    return Math.round(value);
  };
  if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
    textRounder = function textRounder(value) {
      return parseFloat(value).toFixed(1);
    };
  }
  if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
    textRounder = function textRounder(value) {
      return parseFloat(value).toFixed(2);
    };
  }

  // Data for building the clip wave area.
  var data = [];
  for (var i = 0; i <= 40 * waveClipCount; i++) {
    data.push({ x: i / (40 * waveClipCount), y: i / 40 });
  }

  // Scales for drawing the outer circle.
  var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1]);
  var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius]);

  // Scales for controlling the size of the clipping path.
  var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
  var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);

  // Scales for controlling the position of the clipping path.
  var waveRiseScale = d3.scale.linear()
  // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
  // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
  // circle at 100%.
  .range([fillCircleMargin + fillCircleRadius * 2 + waveHeight, fillCircleMargin - waveHeight]).domain([0, 1]);
  var waveAnimateScale = d3.scale.linear().range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
  .domain([0, 1]);

  // Scale for controlling the position of the text within the gauge.
  var textRiseScaleY = d3.scale.linear().range([fillCircleMargin + fillCircleRadius * 2, fillCircleMargin + textPixels * 0.7]).domain([0, 1]);

  // Center the gauge within the parent SVG.
  var gaugeGroup = gauge.append("g").attr('transform', 'translate(' + locationX + ',' + locationY + ')');

  // Draw the outer circle.
  var gaugeCircleArc = d3.svg.arc().startAngle(gaugeCircleX(0)).endAngle(gaugeCircleX(1)).outerRadius(gaugeCircleY(radius)).innerRadius(gaugeCircleY(radius - circleThickness));
  if (config.colorsCss) {
    gaugeGroup.append("path").attr("d", gaugeCircleArc).attr("class", "Circle").attr('transform', 'translate(' + radius + ',' + radius + ')');
  } else {
    gaugeGroup.append("path").attr("d", gaugeCircleArc).attr("class", "Circle").style("fill", config.circleColor).attr('transform', 'translate(' + radius + ',' + radius + ')');
  }

  // Text where the wave does not overlap.
  var text1;
  if (config.colorsCss) {
    text1 = gaugeGroup.append("text").text(textRounder(textStartValue) + percentText).attr("class", "liquidFillGaugeText").attr("text-anchor", "middle").attr("font-size", textPixels + "px").attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
  } else {
    text1 = gaugeGroup.append("text").text(textRounder(textStartValue) + percentText).attr("class", "liquidFillGaugeText").attr("text-anchor", "middle").attr("font-size", textPixels + "px").style("fill", config.textColor).attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
  }

  // The clipping wave area.
  var clipArea = d3.svg.area().x(function (d) {
    return waveScaleX(d.x);
  }).y0(function (d) {
    return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
  }).y1(function (d) {
    return fillCircleRadius * 2 + waveHeight;
  });
  var waveGroup = gaugeGroup.append("defs").append("clipPath").attr("id", "clipWave" + elementId);
  var wave = waveGroup.append("path").datum(data).attr("d", clipArea).attr("T", 0);

  // The inner circle with the clipping wave attached.
  var fillCircleGroup = gaugeGroup.append("g").attr("clip-path", "url(#clipWave" + elementId + ")");
  if (config.colorsCss) {
    fillCircleGroup.append("circle").attr("cx", radius).attr("cy", radius).attr("r", fillCircleRadius).attr("class", "Wave");
  } else {
    fillCircleGroup.append("circle").attr("cx", radius).attr("cy", radius).attr("r", fillCircleRadius).attr("class", "Wave").style("fill", config.waveColor);
  }

  // Text where the wave does overlap.
  var text2;
  if (config.colorsCss) {
    text2 = fillCircleGroup.append("text").text(textRounder(textStartValue) + percentText).attr("class", "liquidFillGaugeTextOverlap").attr("text-anchor", "middle").attr("font-size", textPixels + "px").attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
  } else {
    text2 = fillCircleGroup.append("text").text(textRounder(textStartValue) + percentText).attr("class", "liquidFillGaugeTextOverlap").attr("text-anchor", "middle").attr("font-size", textPixels + "px").style("fill", config.waveTextColor).attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
  }

  // Make the value count up.
  if (config.valueCountUp) {
    var textTween = function textTween() {
      var i = d3.interpolate(this.textContent, textFinalValue);
      return function (t) {
        this.textContent = textRounder(i(t)) + percentText;
      };
    };
    text1.transition().duration(config.waveRiseTime).tween("text", textTween);
    text2.transition().duration(config.waveRiseTime).tween("text", textTween);
  }

  // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
  var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
  if (config.waveRise) {
    waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')').transition().duration(config.waveRiseTime).attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')').each("start", function () {
      wave.attr('transform', 'translate(1,0)');
    }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
  } else {
    waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
  }

  if (config.waveAnimate) animateWave();

  function animateWave() {
    wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
    wave.transition().duration(config.waveAnimateTime * (1 - wave.attr('T'))).ease('linear').attr('transform', 'translate(' + waveAnimateScale(1) + ',0)').attr('T', 1).each('end', function () {
      wave.attr('T', 0);
      animateWave(config.waveAnimateTime);
    });
  }

  function GaugeUpdater() {
    this.update = function (value) {
      var newFinalValue = parseFloat(value).toFixed(2);
      var textRounderUpdater = function textRounderUpdater(value) {
        return Math.round(value);
      };
      if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
        textRounderUpdater = function textRounderUpdater(value) {
          return parseFloat(value).toFixed(1);
        };
      }
      if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
        textRounderUpdater = function textRounderUpdater(value) {
          return parseFloat(value).toFixed(2);
        };
      }

      var textTween = function textTween() {
        var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
        return function (t) {
          this.textContent = textRounderUpdater(i(t)) + percentText;
        };
      };

      text1.transition().duration(config.waveRiseTime).tween("text", textTween);
      text2.transition().duration(config.waveRiseTime).tween("text", textTween);

      var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
      var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
      var waveRiseScale = d3.scale.linear()
      // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
      // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
      // circle at 100%.
      .range([fillCircleMargin + fillCircleRadius * 2 + waveHeight, fillCircleMargin - waveHeight]).domain([0, 1]);
      var newHeight = waveRiseScale(fillPercent);
      var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
      var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);
      var newClipArea;
      if (config.waveHeightScaling) {
        newClipArea = d3.svg.area().x(function (d) {
          return waveScaleX(d.x);
        }).y0(function (d) {
          return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
        }).y1(function (d) {
          return fillCircleRadius * 2 + waveHeight;
        });
      } else {
        newClipArea = clipArea;
      }

      var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
      wave.transition().duration(0).transition().duration(config.waveAnimate ? config.waveAnimateTime * (1 - wave.attr('T')) : config.waveRiseTime).ease('linear').attr('d', newClipArea).attr('transform', 'translate(' + newWavePosition + ',0)').attr('T', '1').each("end", function () {
        if (config.waveAnimate) {
          wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
          animateWave(config.waveAnimateTime);
        }
      });
      waveGroup.transition().duration(config.waveRiseTime).attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')');
    };
  }

  return new GaugeUpdater();
}
//# sourceMappingURL=liquid.js.map

'use strict';

function setWaterColor(value) {
  var water = $('.gauge');
  for (var i = 1; i <= 100; i++) {
    water.removeClass('color-' + i);
  }
  water.addClass("color-" + value);
}

var config1 = liquidFillGaugeDefaultSettings();
config1.circleThickness = 0.1;
config1.circleFillGap = 0;
config1.waveAnimateTime = 700;
config1.waveRiseTime = 1000;
config1.colorsCss = true;
config1.displayPercent = false;
var gauge1 = loadLiquidFillGauge("fillgauge1", 0, config1);
setWaterColor(55);
//# sourceMappingURL=liquidConfig.js.map

"use strict";

var ctx = document.getElementById("myChart");

function asd(data) {
  var i = 0;
  return data.map(function (x) {
    i += 1;
    return {
      x: i,
      y: x
    };
  });
}

var data1 = [1, 2, 3, 4, 5, 6];
data1 = asd(data1);
var data2 = [6, 5, 4, 3, 2, 1];
data2 = asd(data2);

var dysplayYAxis = true;

var scatterChart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [{
      fill: false,
      borderColor: "#f16e2d",
      pointBorderColor: "rgba(0,0,0,0)",
      pointBackgroundColor: "rgba(0,0,0,0)",
      pointHoverBackgroundColor: "rgba(0,0,0,0)",
      pointHoverBorderColor: "rgba(0,0,0,0)",
      borderWidth: "2",
      data: data1
    }, {
      fill: false,
      borderColor: "#0956a2",
      pointBorderColor: "rgba(0,0,0,0)",
      pointBackgroundColor: "rgba(0,0,0,0)",
      pointHoverBackgroundColor: "rgba(0,0,0,0)",
      pointHoverBorderColor: "rgba(0,0,0,0)",
      borderWidth: "2",
      data: []
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    tooltips: {
      enabled: false
    },
    animation: {
      duration: 50
    },
    scales: {
      yAxes: [{
        display: dysplayYAxis,
        position: 'left',
        scaleShowLabels: false,
        ticks: {
          min: -130,
          max: 20
        },
        gridLines: {
          display: true,
          drawBorder: true
        }
      }, {
        display: dysplayYAxis,
        position: 'right',
        ticks: {
          min: -130,
          max: 20
        },
        gridLines: {
          display: true,
          drawBorder: true
        }
      }],
      xAxes: [{
        type: 'logarithmic',
        position: 'bottom',
        gridLines: {
          display: true,
          drawBorder: true
        },
        ticks: {
          min: 10,
          max: 21000,
          callback: function callback(tick, index, ticks) {
            if (tick > 20000) {
              return "";
            }
            var str = "" + tick;
            var ind = {
              '1': true,
              '2': true,
              '4': true,
              '5': true
            };
            if (str[0] == '4' && ("" + ticks[index + 1])[0] == '5') {
              return "";
            }
            return str[0] in ind ? str : ""; // new default function here
          }
        }
      }]
    }
  }
});
//# sourceMappingURL=chartConfig.js.map

'use strict';

var v;
var noise;
window.onload = function () {
  v = new Visualizer();
  v.ini();
  $.get("/fftNoise", function (data) {
    noise = JSON.parse(data);
  });
};

var Visualizer = function Visualizer() {
  this.audioContext = null;
  this.powerOfNoise = 0;
  this.power80 = 0;
  this.powerAfter = 0;
  this.count = 0;
  this.timer = null;
  this.timer1 = null;

  this.analyser = null;
  this.gain_node = null;
  this.noiseTimer = null;
};
Visualizer.prototype = {
  ini: function ini() {
    this._prepareAPI();
  },
  _prepareAPI: function _prepareAPI() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      this._updateInfo('!Your browser does not support AudioContext', false);
      console.log(e);
    }

    if (!navigator.getUserMedia) navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    var that = this;
    if (navigator.getUserMedia) {

      navigator.getUserMedia({ audio: true, video: false }, function (stream) {
        that._start_microphone(stream);
      }, function (e) {
        window.alert('Error capturing audio.');
      });
    } else {
      window.alert('getUserMedia not supported in this browser.');
    }
  },
  _start_microphone: function _start_microphone(stream) {
    var BUFF_SIZE_RENDERER = 16384;
    this.gain_node = this.audioContext.createGain();
    this.gain_node.gain.value = 0; // postavljen na 0 jer ne treba da pusta zvuk

    var microphone_stream = this.audioContext.createMediaStreamSource(stream);

    var analyser_node = this.audioContext.createAnalyser();
    analyser_node.smoothingTimeConstant = 0;
    analyser_node.minDecibels = -120;
    analyser_node.maxDecibels = 10;
    analyser_node.fftSize = BUFF_SIZE_RENDERER;

    this.analyser = analyser_node;

    microphone_stream.connect(analyser_node);

    analyser_node.connect(this.gain_node);

    this.gain_node.connect(this.audioContext.destination);

    this._drawSpectrum(analyser_node);
  },
  _drawSpectrum: function _drawSpectrum(analyser) {
    analyser.smoothingTimeConstant = 0.9;
    analyser.fftSize = 4096;

    var bufferLength = analyser.frequencyBinCount - 250;
    var dataArray = new Float32Array(bufferLength);
    var data = new Array(bufferLength);
    for (var i = 0, j = 0; i < bufferLength; j++) {
      data[j] = { x: i * this.audioContext.sampleRate / analyser.fftSize };
      i += Math.floor(i / 50) + 1;
    }

    var that = this;
    function draw() {
      var drawVisual = requestAnimationFrame(draw);
      analyser.getFloatFrequencyData(dataArray);

      for (var i = 0, j = 0; i < bufferLength; j++) {
        data[j].y = dataArray[i];
        i += Math.floor(i / 50) + 1;
      }

      scatterChart.data.datasets[0].data = data;
      scatterChart.update();
    };
    draw();
  },
  clarty: function clarty(analyser) {
    var data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    data = data.map(function (x) {
      return Math.pow(10, x / 20);
    });

    var power = 0;
    for (var i = 0, l = data.length; i < l; i++) {
      var frequency = i * this.audioContext.sampleRate / analyser.fftSize;
      power += data[i] * frequency * data[i] * frequency;
    }
    power -= this.powerOfNoise;
    if (this.count < 50) {
      // console.log(power);
      this.power80 += power * power;
      this.count += 1;
    } else {
      if (this.count > 500) {
        this._result();
      }
      this.powerAfter += power * power;
      this.count += 1;
    }
  },
  _noisePower: function _noisePower(analyser) {
    this.count += 1;

    if (this.count > 100) {
      this._noise();
    }
    var data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    data = data.map(function (x) {
      return Math.pow(10, x / 20);
    });
    var power = 0;
    for (var i = 0, l = data.length; i < l; i++) {
      var frequency = i * this.audioContext.sampleRate / analyser.fftSize;
      power += data[i] * frequency * data[i] * frequency;
    }
    this.powerOfNoise += power;
  },
  _result: function _result() {
    this.analyser.smoothingTimeConstant = 0.9;
    clearInterval(this.timer);
    var c50;
    if (this.powerAfter == 0) {
      c50 = 0;
    } else {
      c50 = 10 * Math.log(this.power80 / this.powerAfter);
    }
    var value = function value(c50) {
      if (c50 > -5 && c50 < 4) {
        return 100;
      }

      var x = Math.min(Math.abs(c50 + 5), Math.abs(c50 - 4));

      return Math.max(0, 100 - Math.round(x));
    };
    gauge1.update(value(c50));
    setWaterColor(value(c50));
    enablePlay();
    // console.log(c50);
  },
  _noise: function _noise() {
    clearInterval(this.timer1);
    this.powerOfNoise /= this.count;
    this.count = 0;
    var that = this;
    // console.log(sliderValue());
    $.ajax({
      type: "GET",
      url: "/play",
      data: { "freq": sliderValue() }
    });
    this.timer = setInterval(function () {
      that.clarty(that.analyser);
    }, 1);
  },
  _start: function _start() {
    if (inMode2()) {
      this.analyser.smoothingTimeConstant = 0;
      var that = this;
      this.timer1 = setInterval(function () {
        that._noisePower(that.analyser);
      }, 1);
    } else {
      if (isActive()) {
        this._playNoise();
      } else {
        this._pauseNoise();
      }
    }
  },
  _playNoise: function _playNoise() {
    var that = this;
    $.get("/startNoise");
    this.noiseTimer = setInterval(function () {
      that._drawNoise();
    }, 100);
  },
  _pauseNoise: function _pauseNoise() {
    $.get("/stopNoise");
    clearInterval(this.noiseTimer);
    setTimeout(function () {
      scatterChart.data.datasets[1].data = [];
      scatterChart.update();
    }, 10);
  },
  _drawNoise: function _drawNoise() {

    $.get("/fftIndex", function (data) {
      var json = noise[data];
      var dataS = new Array(data.length);
      var i = 0;
      var keys = [];
      Object.keys(json).forEach(function (key) {
        keys.push(key);
      });

      keys.sort(function (a, b) {
        return parseFloat(a) - parseFloat(b);
      });

      for (var i = 0, n = keys.length; i < n; i++) {
        dataS[i] = { "x": parseFloat(keys[i]), "y": json[keys[i]][0] };
      }
      scatterChart.data.datasets[1].data = dataS;
      scatterChart.update();
    });
  }
};
//# sourceMappingURL=audio.js.map

'use strict';

function switchMode() {
  if (!inMode2()) {
    v._pauseNoise();
    $('.play').removeClass('active');
  }
  $('body').toggleClass('mode2');
}

function inMode2() {
  return $('body').hasClass('mode2');
}

function isActive() {
  return $('.play').hasClass('active');
}

function enablePlay() {
  $('.loader').removeClass("loader active").addClass("play");
}

function disablePlay() {
  $('.play').removeClass("play").addClass("loader");
}

function sliderValue() {
  return $("#slider")[0].noUiSlider.get();
}

$(document).ready(function () {
  var icon = $('.play');
  icon.click(function () {
    if (icon.hasClass("play")) {
      if (!inMode2()) {
        icon.toggleClass('active');
      } else {
        disablePlay();
      }
      v._start();
    }
    return false;
  });
});

$(function () {
  noUiSlider.create($("#slider")[0], {
    start: 440,
    tooltips: true,
    step: 1,
    range: {
      min: [1],
      max: [20000]
    }
  });
});
//# sourceMappingURL=app.js.map
