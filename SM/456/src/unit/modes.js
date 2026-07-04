// modes.js — CommonJS для Webpack 1
var GAME_MODES = {
  CLASSIC: 'classic',
  TETRA: 'tetra',
};

// ===== ФИГУРЫ ДЛЯ ТЕТРА (3-блочные) =====
var blockShape = {
  I: [[1, 1, 1]],
  L: [[1, 0], [1, 1]],
  J: [[0, 1], [1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
};

// ===== ФИГУРЫ ДЛЯ КЛАССИКИ (4-блочные) =====
var origin = {
  I: [[1, 1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
};

var MODE_SHAPES = {};
MODE_SHAPES[GAME_MODES.CLASSIC] = origin;
MODE_SHAPES[GAME_MODES.TETRA] = blockShape;

// ===== ЗАГРУЖАЕМ РЕЖИМ ИЗ LOCALSTORAGE =====
var currentMode = GAME_MODES.TETRA;

try {
  var saved = localStorage.getItem('tetris_game_mode');
  
  if (saved === GAME_MODES.CLASSIC) {
    currentMode = GAME_MODES.CLASSIC;
  } else if (saved === GAME_MODES.TETRA) {
    currentMode = GAME_MODES.TETRA;
  } else {
    currentMode = GAME_MODES.TETRA;
    localStorage.setItem('tetris_game_mode', GAME_MODES.TETRA);
  }
} catch(e) {
  currentMode = GAME_MODES.TETRA;
  try {
    localStorage.setItem('tetris_game_mode', GAME_MODES.TETRA);
  } catch(e2) {}
}

// ===== ПРИМЕНЯЕМ РЕЖИМ =====
var currentShapes = MODE_SHAPES[currentMode];

if (typeof window !== 'undefined') {
  window.currentGameMode = currentMode;
  
  try {
    var constModule = require('./const');
    
    // Обновляем blockType
    if (constModule.blockType) {
      var newBlockType = Object.keys(currentShapes);
      constModule.blockType.length = 0;
      newBlockType.forEach(function(key) {
        constModule.blockType.push(key);
      });
    }
    
    // Обновляем blockShape в const.js
    if (constModule.blockShape) {
      for (var key in constModule.blockShape) {
        if (constModule.blockShape.hasOwnProperty(key)) {
          delete constModule.blockShape[key];
        }
      }
      for (var key in currentShapes) {
        if (currentShapes.hasOwnProperty(key)) {
          constModule.blockShape[key] = currentShapes[key];
        }
      }
    }
    
    // Обновляем window.blockShape
    if (window.blockShape) {
      for (var key in window.blockShape) {
        if (window.blockShape.hasOwnProperty(key)) {
          delete window.blockShape[key];
        }
      }
      for (var key in currentShapes) {
        if (currentShapes.hasOwnProperty(key)) {
          window.blockShape[key] = currentShapes[key];
        }
      }
    }
    
    // Обновляем window.blockType
    if (window.blockType) {
      var newBlockType2 = Object.keys(currentShapes);
      window.blockType.length = 0;
      newBlockType2.forEach(function(key) {
        window.blockType.push(key);
      });
    }
    
    if (window.blockShapeUpdate) {
      window.blockShapeUpdate(currentShapes);
    }
    
  } catch(e) {
    console.warn('Ошибка обновления const.js:', e);
  }
  
 // console.log('modes.js: загружен режим =', currentMode);
 // console.log('modes.js: фигуры =', Object.keys(currentShapes));
}

function getCurrentMode() {
  return currentMode;
}

function getCurrentShapes() {
  return currentShapes;
}

function setGameMode(mode) {
  if (MODE_SHAPES[mode]) {
    currentMode = mode;
    currentShapes = MODE_SHAPES[mode];
    localStorage.setItem('tetris_game_mode', mode);
    
    if (typeof window !== 'undefined') {
      window.currentGameMode = mode;
      
      try {
        var constModule = require('./const');
        
        if (constModule.blockType) {
          var newBlockType = Object.keys(currentShapes);
          constModule.blockType.length = 0;
          newBlockType.forEach(function(key) {
            constModule.blockType.push(key);
          });
        }
        
        if (constModule.blockShape) {
          for (var key in constModule.blockShape) {
            if (constModule.blockShape.hasOwnProperty(key)) {
              delete constModule.blockShape[key];
            }
          }
          for (var key in currentShapes) {
            if (currentShapes.hasOwnProperty(key)) {
              constModule.blockShape[key] = currentShapes[key];
            }
          }
        }
        
        if (window.blockShape) {
          for (var key in window.blockShape) {
            if (window.blockShape.hasOwnProperty(key)) {
              delete window.blockShape[key];
            }
          }
          for (var key in currentShapes) {
            if (currentShapes.hasOwnProperty(key)) {
              window.blockShape[key] = currentShapes[key];
            }
          }
        }
        
        if (window.blockType) {
          var newBlockType2 = Object.keys(currentShapes);
          window.blockType.length = 0;
          newBlockType2.forEach(function(key) {
            window.blockType.push(key);
          });
        }
        
        if (window.blockShapeUpdate) {
          window.blockShapeUpdate(currentShapes);
        }
        
      } catch(e) {
        console.warn('Ошибка обновления const.js:', e);
      }
    }
  }
}

module.exports = {
  GAME_MODES: GAME_MODES,
  MODE_SHAPES: MODE_SHAPES,
  getCurrentMode: getCurrentMode,
  getCurrentShapes: getCurrentShapes,
  setGameMode: setGameMode,
};