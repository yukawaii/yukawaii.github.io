// src/unit/arcadeSounds.js
// НЕ ИСПОЛЬЗУЕМ store для проверки звука — управление только через локальный стейт аркад
// import store from '../store'; // ← удалить

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
  
  // Убрали проверку store.getState().get('music')
  // Теперь звук зависит только от того, вызван ли playSound из аркады,
  // а в аркадах есть локальный флаг soundEnabled, который управляет вызовом.
  
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

// ===== ГЕНЕРАЦИЯ ПРОГРАММНОГО ЗВУКА ДЛЯ ОТСКОКА =====
function playBounceSound() {
  if (!hasWebAudioAPI || !context) return;
  
  try {
    var oscillator = context.createOscillator();
    var gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(180, context.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  } catch(e) {}
}

// ===== ОДИН module.exports =====
module.exports = {
  playSound: playSound,
  hit: function() { playSound(0, 0.2); },
  score: function() { playSound(1.2558, 0.3546); },
  gameover: function() { playSound(8.1276, 1.1437); },
  move: function() { playSound(2.9088, 0.1437); },
  bounce: playBounceSound   // ← теперь экспортируется
};