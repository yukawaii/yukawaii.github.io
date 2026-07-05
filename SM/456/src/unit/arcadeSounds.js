// src/unit/arcadeSounds.js
import store from '../store';

var AudioContext = (
  window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  window.oAudioContext ||
  window.msAudioContext
);

var hasWebAudioAPI = !!AudioContext && location.protocol.indexOf('http') !== -1;
var audioBuffer = null;
var context = null;

function playSound(startTime, duration) {
  if (!hasWebAudioAPI || !audioBuffer || !context) return;
  
  try {
    var state = store.getState();
    if (!state.get('music')) return;
  } catch(e) { return; }
  
  try {
    var source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(0, startTime, duration);
  } catch(e) {}
}

(function() {
  if (!hasWebAudioAPI) return;
  
  var url = './music.mp3';
  context = new AudioContext();
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';

  req.onload = function() {
    context.decodeAudioData(req.response, function(buf) {
      audioBuffer = buf;
      console.log('✅ Звуки аркад загружены!');
    }, function() {
      hasWebAudioAPI = false;
    });
  };
  req.send();
})();


module.exports = {
  playSound: function(start, duration) {
    playSound(start, duration);
  },
  hit: function() { playSound(0, 0.2); },
  score: function() { playSound(1.2558, 0.3546); },
  gameover: function() { playSound(8.1276, 1.1437); },
  move: function() { playSound(2.9088, 0.1437); },
  // ===== ИСПОЛЬЗУЕМ ПРОГРАММНЫЙ ЗВУК =====
  bounce: function() { playBounceSound(); }
};

module.exports = {
  playSound: function(start, duration) {
    playSound(start, duration);
  },
  // Короткие звуки для аркад
  hit: function() { playSound(0, 0.2); },
  score: function() { playSound(1.2558, 0.3546); },
  gameover: function() { playSound(8.1276, 1.1437); },
  move: function() { playSound(2.9088, 0.1437); },

};