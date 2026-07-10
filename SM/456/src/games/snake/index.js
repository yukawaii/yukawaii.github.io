// src/games/snake/index.js
import React, { Component } from 'react';
import style from './index.less';
import { incrementCounter } from '../../unit/achievements';
import { showFullscreenAd } from '../../unit/yandexSdk';
import { visibilityChangeEvent, isFocus } from '../../unit/';

var arcadeSounds = require('../../unit/arcadeSounds');

class SnakeGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      score: 0,
      gameOver: false,
      isPaused: false,
      soundEnabled: true,
      snake: [],
      food: { x: 5, y: 5 },
      direction: 'right',
      nextDirection: 'right',
      speed: 300,
      goals: 0,
      gameTime: 0,
      gridSize: 20,
      cols: 18,
      rows: 16,
      soundEnabled: true 
    };
    this.gameLoop = null;
    this.lastSoundTime = 0;
    
    this.closeGame = this.closeGame.bind(this);
    this.startGame = this.startGame.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.restartGame = this.restartGame.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleGameControl = this.handleGameControl.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.toggleSound = this.toggleSound.bind(this);
    this.playMoveSound = this.playMoveSound.bind(this);
    this.playCrashSound = this.playCrashSound.bind(this);
    this.saveScore = this.saveScore.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openSnake', function() {
      window._isRacingActive = true;
      if (typeof window._updateKeyboard === 'function') {
        window._updateKeyboard();
      }
      this.initGame();
      this.startGame();
    }.bind(this));
    
    window.addEventListener('gameControl', this.handleGameControl);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    if (visibilityChangeEvent) {
  document.addEventListener(visibilityChangeEvent, this.handleVisibilityChange);
}
  }

  componentWillUnmount() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    window._isRacingActive = false;
    if (typeof window._updateKeyboard === 'function') {
      window._updateKeyboard();
    }
    if (visibilityChangeEvent) {
  document.removeEventListener(visibilityChangeEvent, this.handleVisibilityChange);
}
    window.removeEventListener('gameControl', this.handleGameControl);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }

  initGame() {
    var cols = this.state.cols;
    var rows = this.state.rows;
    var startX = Math.floor(cols / 2);
    var startY = Math.floor(rows / 2);
    
    var snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    
    this.setState({
      isOpen: true,
      score: 0,
      gameOver: false,
      isPaused: false,
      soundEnabled: true,
      snake: snake,
      direction: 'right',
      nextDirection: 'right',
      speed: 300,
      goals: 0,
      gameTime: 0,
      food: this.generateFood(snake)
    });
  }

  generateFood(snake) {
    var cols = this.state.cols;
    var rows = this.state.rows;
    var maxAttempts = 100;
    
    for (var i = 0; i < maxAttempts; i++) {
      var food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
      
      var collision = false;
      for (var j = 0; j < snake.length; j++) {
        if (snake[j].x === food.x && snake[j].y === food.y) {
          collision = true;
          break;
        }
      }
      if (!collision) return food;
    }
    return { x: 0, y: 0 };
  }

  // ===== СОХРАНЕНИЕ ОЧКОВ =====
  saveScore(score) {
    if (score <= 0) return;
    try {
      var currentTotal = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
      var newTotal = currentTotal + score;
      localStorage.setItem('tetris_total_score', String(newTotal));
      
      if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', {
          key: 'tetris_total_score',
          value: String(newTotal)
        }).catch(function(err) {
          console.warn('⚠️ Ошибка сохранения очков в VK Storage:', err);
        });
      }
      
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('scoreUpdated'));
      }
      
     // console.log('🐍 Заработано очков в змейке:', score, 'Всего:', newTotal);
       // ===== СЧЕТЧИК АРКАД =====
    incrementCounter('arcade_total_score', score);
    
    // ===== ОТМЕТКА ОБ ИГРЕ =====
    var played = JSON.parse(localStorage.getItem('arcades_played') || '{}');
    var gameName = this.constructor.name.toLowerCase().replace('game', '');
    if (!played[gameName]) {
      played[gameName] = true;
      localStorage.setItem('arcades_played', JSON.stringify(played));
      // Синхронизируем через VK Storage
      if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', {
          key: 'arcades_played',
          value: JSON.stringify(played)
        }).catch(function(err) {
          console.warn('⚠️ Ошибка сохранения аркад:', err);
        });
      }
    }
    
    } catch(e) {
      console.warn('Ошибка сохранения очков:', e);
    }
  }

  // ===== ЗВУКИ =====
 playMoveSound() {
  if (!this.state.soundEnabled) return;
  try {
    if (arcadeSounds && arcadeSounds.move) {
      arcadeSounds.move();
    }
  } catch(e) {}
}

// В playCrashSound:
playCrashSound() {
  if (!this.state.soundEnabled) return;
  try {
    if (arcadeSounds && arcadeSounds.gameover) {
      arcadeSounds.gameover();
    } else if (arcadeSounds && arcadeSounds.hit) {
      arcadeSounds.hit();
    }
  } catch(e) {}
}
toggleSound() {
  this.setState({ soundEnabled: !this.state.soundEnabled });
}

  // ===== УПРАВЛЕНИЕ =====
  handleKeyDown(e) {
    var key = e.key;
    var dir = null;
    
    if (key === 'ArrowLeft' || key === 'Left' || key === 'a' || key === 'A' || key === 'ф' || key === 'Ф') {
      e.preventDefault();
      dir = 'left';
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 'd' || key === 'D' || key === 'в' || key === 'В') {
      e.preventDefault();
      dir = 'right';
    }
    if (key === 'ArrowUp' || key === 'Up' || key === 'w' || key === 'W' || key === 'ц' || key === 'Ц') {
      e.preventDefault();
      dir = 'up';
    }
    if (key === 'ArrowDown' || key === 'Down' || key === 's' || key === 'S' || key === 'ы' || key === 'Ы') {
      e.preventDefault();
      dir = 'down';
    }
    if (key === 'Escape' || key === 'Esc') {
      e.preventDefault();
      this.closeGame();
    }
    
    if (dir && !this.state.isPaused && !this.state.gameOver) {
      this.setDirection(dir);
   //   this.playMoveSound();
    }
  }

  handleKeyUp(e) {
    // Ничего не делаем
  }

  handleGameControl(e) {
    var detail = e.detail || {};
    var key = detail.key;
    var action = detail.action;
    
    if (key === 'escape') {
      if (action === 'down') {
        this.closeGame();
      }
      return;
    }
    
    if (key === 'reset') {
      if (action === 'down') {
        this.restartGame();
      }
      return;
    }
    
    if (key === 'leaderboard' || key === 'l') {
      if (action === 'down') {
        this.handleMenu();
      }
      return;
    }
    
    if (key === 'music' || key === 's') {
      if (action === 'down') {
        this.toggleSound();
      }
      return;
    }
    
    if (key === 'pause') {
      return;
    }
    
    var dir = null;
    if (key === 'left') dir = 'left';
    if (key === 'right') dir = 'right';
    if (key === 'up') dir = 'up';
    if (key === 'down') dir = 'down';
    
    if (dir && action === 'down' && !this.state.isPaused && !this.state.gameOver) {
      this.setDirection(dir);
     // this.playMoveSound();
    }
  }

  setDirection(dir) {
    var opposite = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    };
    if (dir !== opposite[this.state.direction]) {
      this.setState({ nextDirection: dir });
    }
  }

  handleTouchStart(e) {
    if (this.state.isPaused || this.state.gameOver) return;
    if (!this.state.isOpen) return;
    
    var touch = e.touches[0];
    if (!touch) return;
    
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var touchX = touch.clientX;
    var touchY = touch.clientY;
    
    var dir = null;
    if (touchX < screenWidth / 2) dir = 'left';
    else dir = 'right';
    
    if (touchY < screenHeight / 3) dir = 'up';
    else if (touchY > screenHeight * 2 / 3) dir = 'down';
    
    if (dir && !this.state.isPaused && !this.state.gameOver) {
      this.setDirection(dir);
     this.playMoveSound();
    }
  }

  handleTouchEnd(e) {
    // Ничего не делаем
  }

  // ===== ИГРОВОЙ ЦИКЛ =====
  startGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(function() {
      if (!this.state.isPaused && !this.state.gameOver) {
        this.updateGame();
      }
    }.bind(this), this.state.speed);
  }

  updateGame() {
    if (this.state.gameOver || this.state.isPaused) return;
    
    var newGameTime = this.state.gameTime + 1;
    var newSpeed = Math.max(100, 200 - Math.floor(newGameTime / 100) * 2);
    
    var direction = this.state.nextDirection;
    var snake = this.state.snake.slice();
    var head = { x: snake[0].x, y: snake[0].y };
    
    // Движение головы
    if (direction === 'right') head.x += 1;
    if (direction === 'left') head.x -= 1;
    if (direction === 'up') head.y -= 1;
    if (direction === 'down') head.y += 1;
    
    var cols = this.state.cols;
    var rows = this.state.rows;
    
    // Проверка столкновения со стеной
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      this.saveScore(this.state.score);
      this.playCrashSound();
      this.setState({ gameOver: true });
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      return;
    }
    
    // Проверка столкновения с собой
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        this.saveScore(this.state.score);
        this.playCrashSound();
        this.setState({ gameOver: true });
        if (this.gameLoop) {
          clearInterval(this.gameLoop);
          this.gameLoop = null;
        }
        return;
      }
    }
    
    snake.unshift(head);
    
    // Проверка еды
   if (head.x === this.state.food.x && head.y === this.state.food.y) {
  var newScore = this.state.score + 1;
  this.playBounceSound();
  var newFood = this.generateFood(snake);
  
  // ===== НАЧИСЛЯЕМ ОЧКИ В ОБЩИЙ СЧЕТ ЗА КАЖДЫЕ 10 ЯБЛОК =====
  if (newScore % 10 === 0) {
    // 1 очко за 10 яблок
    var totalScore = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
    var newTotal = totalScore + 1;
    localStorage.setItem('tetris_total_score', String(newTotal));
    
    // Сохраняем в VK Storage
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageSet', {
        key: 'tetris_total_score',
        value: String(newTotal)
      }).catch(function(err) {
        console.warn('⚠️ Ошибка сохранения очков в VK Storage:', err);
      });
    }
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scoreUpdated'));
    }
    
   // console.log('🐍 +1 очко в общий счет (10 яблок)');
  }
  
  this.setState({
    score: newScore,
    food: newFood
  });
  
  if (newScore % 5 === 0) {
   // this.playMoveSound();
  }
} else {
  snake.pop();
}
    
    this.setState({
      snake: snake,
      direction: direction,
      gameTime: newGameTime,
      speed: newSpeed
    });
  }

  togglePause() {
    if (this.state.gameOver) return;
    var newPaused = !this.state.isPaused;
    this.setState({ isPaused: newPaused });
    
    if (newPaused) {
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
        // ===== ПОКАЗЫВАЕМ РЕКЛАМУ ПРИ ПАУЗЕ =====
    showFullscreenAd();
    } else {
      this.startGame();
    }
  }

  handleMenu() {
    this.closeGame();
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openMenu'));
    }
  }

  closeGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    if (this.state.score > 0 && !this.state.gameOver) {
      this.saveScore(this.state.score);
    }
    window._isRacingActive = false;
    if (typeof window._updateKeyboard === 'function') {
      window._updateKeyboard();
    }
    this.setState({ isOpen: false });
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('gameClosed'));
    }
  }

  restartGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.initGame();
    this.startGame();
  }

   handleVisibilityChange() {
  if (document.hidden) {
    if (this.state.isOpen && !this.state.isPaused && !this.state.gameOver) {
      this.togglePause();
    }
  }
}

  render() {
    if (!this.state.isOpen) return null;

    var speedDisplay = Math.round(1000 / this.state.speed * 10) / 10;

    return (
      <div className={style.gameWrapper}>
        <div className={style.gameContainer}>
          <button 
            className={style.closeBtn} 
            onClick={this.closeGame}
            onTouchStart={function(e) { e.stopPropagation(); e.preventDefault(); }}
            onTouchEnd={function(e) { e.stopPropagation(); e.preventDefault(); this.closeGame(); }.bind(this)}
          >
            ✕
          </button>
          
          <div className={style.scoreDisplay}>
            <span>Еда: {this.state.score}</span>
            <span className={style.speedDisplay}>⚡ {speedDisplay}</span>
            <button 
              className={style.pauseBtn}
              onClick={this.togglePause}
              onTouchStart={function(e) { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={function(e) { e.stopPropagation(); e.preventDefault(); this.togglePause(); }.bind(this)}
            >
              {this.state.isPaused ? '▶' : '⏸'}
            </button>
            <button 
              className={style.soundBtn}
              onClick={this.toggleSound}
              onTouchStart={function(e) { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={function(e) { e.stopPropagation(); e.preventDefault(); this.toggleSound(); }.bind(this)}
            >
              {this.state.soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
          
          <div className={style.field}>
            <div className={style.snakeGrid}>
              {Array.from({ length: this.state.rows }, function(_, y) {
                return Array.from({ length: this.state.cols }, function(_, x) {
                  var isSnake = false;
                  var isHead = false;
                  for (var i = 0; i < this.state.snake.length; i++) {
                    if (this.state.snake[i].x === x && this.state.snake[i].y === y) {
                      isSnake = true;
                      if (i === 0) isHead = true;
                      break;
                    }
                  }
                  var isFood = (this.state.food.x === x && this.state.food.y === y);
                  
                  var cellClass = style.cell;
                  if (isHead) cellClass += ' ' + style.head;
                  else if (isSnake) cellClass += ' ' + style.snakeBody;
                  else if (isFood) cellClass += ' ' + style.food;
                  
                  return (
                    <div key={x + '-' + y} className={cellClass}>
                      {isHead ? '🐍' : isFood ? '🍎' : ''}
                    </div>
                  );
                }.bind(this));
              }.bind(this))}
            </div>
            
            {this.state.isPaused && (
              <div className={style.pauseOverlay}>
                <div className={style.pauseText}>⏸ ПАУЗА</div>
              </div>
            )}
          </div>
          
          {this.state.gameOver && (
            <div className={style.gameOver}>
              <div className={style.gameOverText}>💥 Игра окончена!</div>
              <div className={style.finalScore}>Очков: {this.state.score}</div>
              <button 
                className={style.restartBtn} 
                onClick={this.restartGame}
                onTouchStart={function(e) { e.stopPropagation(); e.preventDefault(); }}
                onTouchEnd={function(e) { e.stopPropagation(); e.preventDefault(); this.restartGame(); }.bind(this)}
              >
                🔄 Заново
              </button>
            </div>
          )}
          
          <div className={style.controls}>
            <span>← → ↑ ↓ (WASD/ЦЫФВ)</span>
          </div>
        </div>
      </div>
    );
  }
}

export default SnakeGame;