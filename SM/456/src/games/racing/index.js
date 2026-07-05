// src/games/racing/index.js
import React, { Component } from 'react';
import style from './index.less';
import { incrementCounter } from '../../unit/achievements';
import { showFullscreenAd } from '../../unit/yandexSdk';

// ===== МЕНЯЕМ ИМПОРТ: вместо musicModule используем arcadeSounds =====
var arcadeSounds = require('../../unit/arcadeSounds');

class RacingGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      score: 0,
      gameOver: false,
      carX: 150,
      carY: 280,
      obstacles: [],
      obstaclesPassed: 0,
      isPaused: false,
      speed: 4,
      gameTime: 0,
      soundEnabled: true
    };
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
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
  }

  componentDidMount() {
    window.addEventListener('openRacing', function() {
      window._isRacingActive = true;
      if (typeof window._updateKeyboard === 'function') {
        window._updateKeyboard();
      }
      this.setState({ 
        isOpen: true, 
        score: 0, 
        gameOver: false, 
        carX: 150,
        carY: 280,
        obstacles: [],
        obstaclesPassed: 0,
        isPaused: false,
        speed: 4,
        gameTime: 0,
        soundEnabled: true
      });
      this.startGame();
    }.bind(this));
    
    window.addEventListener('gameControl', this.handleGameControl);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
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
    window.removeEventListener('gameControl', this.handleGameControl);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
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
      
     // console.log('🏁 Заработано очков в гонках:', score, 'Всего:', newTotal);
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
    var now = Date.now();
    if (now - this.lastSoundTime < 100) return;
    this.lastSoundTime = now;
    
    try {
      if (arcadeSounds && arcadeSounds.move) {
        arcadeSounds.move();
      }
    } catch(e) {}
  }

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

  // ===== КЛАВИАТУРА =====
  handleKeyDown(e) {
    var key = e.key;
    var moved = false;
    
    if (key === 'ArrowLeft' || key === 'Left' || key === 'a' || key === 'A' || key === 'ф' || key === 'Ф') {
      e.preventDefault();
      this.moveLeft = true;
      this.moveRight = false;
      moved = true;
      if (!this.state.isPaused && !this.state.gameOver) {
      this.playMoveSound();   // ← звук только здесь
    }
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 'd' || key === 'D' || key === 'в' || key === 'В') {
      e.preventDefault();
      this.moveRight = true;
      this.moveLeft = false;
      moved = true;
      if (!this.state.isPaused && !this.state.gameOver) {
      this.playMoveSound();   // ← звук только здесь
    }
    }
    if (key === 'ArrowUp' || key === 'Up' || key === 'w' || key === 'W' || key === 'ц' || key === 'Ц') {
      e.preventDefault();
      this.moveUp = true;
      this.moveDown = false;
      moved = true;
    }
    if (key === 'ArrowDown' || key === 'Down' || key === 's' || key === 'S' || key === 'ы' || key === 'Ы') {
      e.preventDefault();
      this.moveDown = true;
      this.moveUp = false;
      moved = true;
    }
    if (key === 'Escape' || key === 'Esc') {
      e.preventDefault();
      this.closeGame();
    }    
  
  }

  handleKeyUp(e) {
    var key = e.key;
    
    if (key === 'ArrowLeft' || key === 'Left' || key === 'a' || key === 'A' || key === 'ф' || key === 'Ф') {
      e.preventDefault();
      this.moveLeft = false;
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 'd' || key === 'D' || key === 'в' || key === 'В') {
      e.preventDefault();
      this.moveRight = false;
    }
    if (key === 'ArrowUp' || key === 'Up' || key === 'w' || key === 'W' || key === 'ц' || key === 'Ц') {
      e.preventDefault();
      this.moveUp = false;
    }
    if (key === 'ArrowDown' || key === 'Down' || key === 's' || key === 'S' || key === 'ы' || key === 'Ы') {
      e.preventDefault();
      this.moveDown = false;
    }
  }

  handleGameControl(e) {
    var detail = e.detail || {};
    var key = detail.key;
    var action = detail.action;
    var moved = false;
    
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
    
    if (key === 'left') {
      this.moveLeft = (action === 'down');
      if (action === 'down') this.moveRight = false;
      moved = true;
      if (action === 'down' && !this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
      return;
    }
    if (key === 'right') {
      this.moveRight = (action === 'down');
      if (action === 'down') this.moveLeft = false;
      moved = true;
      if (action === 'down' && !this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
      return;
    }
    if (key === 'up') {
      this.moveUp = (action === 'down');
      if (action === 'down') this.moveDown = false;
      moved = true;
      return;
    }
    if (key === 'down') {
      this.moveDown = (action === 'down');
      if (action === 'down') this.moveUp = false;
      moved = true;
      return;
    }
     
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

  handleTouchStart(e) {
    if (this.state.isPaused || this.state.gameOver) return;
    if (!this.state.isOpen) return;
    
    var touch = e.touches[0];
    if (!touch) return;
    
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var touchX = touch.clientX;
    var touchY = touch.clientY;
    var moved = false;
    
    if (touchX < screenWidth / 2) {
      this.moveLeft = true;
      this.moveRight = false;
      moved = true;
       if (!this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
    } else {
      this.moveRight = true;
      this.moveLeft = false;
      moved = true;
       if (!this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
    }
    
    if (touchY < screenHeight / 3) {
      this.moveUp = true;
      this.moveDown = false;
      moved = true;
    } else if (touchY > screenHeight * 2 / 3) {
      this.moveDown = true;
      this.moveUp = false;
      moved = true;
    }     
  }

  handleTouchEnd(e) {
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
  }

  startGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(function() {
      if (!this.state.isPaused && !this.state.gameOver) {
        this.updateGame();
      }
    }.bind(this), 50);
  }

updateGame() {
  if (this.state.gameOver || this.state.isPaused) return;
  
  var newGameTime = this.state.gameTime + 1;
  var newSpeed = Math.min(12, 4 + Math.floor(newGameTime / 100) * 0.5);
  
  // ===== ДВИЖЕНИЕ МАШИНКИ =====
  var newCarX = this.state.carX;
  var newCarY = this.state.carY;
  
  // ===== ТОЧНЫЕ ОГРАНИЧЕНИЯ ПОД ШИРИНУ ДОРОГИ =====
  // Ширина дороги в CSS: 100% от 340px = 340px - padding (20px*2) - border (4px*2) ≈ 292px
  // Но для простоты используем фиксированные значения
  var carWidth = 40;
  var carHeight = 30;
  var roadPadding = 5;
  
  // Лево-право: дорога ~290px, машинка 40px, отступ 5px
  var minX = 5;
  var maxX = 290 - carWidth - 5; // ≈ 245
  
  // Вверх-вниз: дорога ~350px, машинка 30px, отступ 10px
  var minY = 10;
  var maxY = 320 - carHeight - 10; // ≈ 280
  
  if (this.moveLeft) newCarX = Math.max(minX, newCarX - 8);
  if (this.moveRight) newCarX = Math.min(maxX, newCarX + 8);
  if (this.moveUp) newCarY = Math.max(minY, newCarY - 6);
  if (this.moveDown) newCarY = Math.min(maxY, newCarY + 6);
  
  var currentSpeed = newSpeed;
    var newObstacles = this.state.obstacles.map(function(obs) {
      return {
        x: obs.x,
        y: obs.y + currentSpeed,
        width: obs.width,
        passed: obs.passed || false,
        type: obs.type || '🚧'
      };
    });
    
    // Удаляем препятствия за экраном
    newObstacles = newObstacles.filter(function(obs) {
      return obs.y < 450;
    });
    
    // ===== ВСЕГДА ДОБАВЛЯЕМ ПРЕПЯТСТВИЕ, ЕСЛИ ИХ МАЛО =====
    var spawnRate = Math.max(0.015, 0.03 - newGameTime / 5000);
    if (newObstacles.length < 2 || Math.random() < spawnRate) {
      var types = ['🚧', '⛔', '⚠️', '🛑'];
      var randomType = types[Math.floor(Math.random() * types.length)];
      
      newObstacles.push({
        x: 20 + Math.random() * 260,
        y: -20,
        width: 30 + Math.random() * 20,
        passed: false,
        type: randomType
      });
    }
    
    var carWidth = 30;
    var carHeight = 20;
    var newScore = this.state.score;
    var newPassed = this.state.obstaclesPassed;
    
    for (var i = 0; i < newObstacles.length; i++) {
      var obs = newObstacles[i];
      
      if (obs.y + 20 > newCarY && obs.y < newCarY + carHeight) {
        if (newCarX + carWidth > obs.x && newCarX < obs.x + obs.width) {
          // Сохраняем очки перед game over
          this.saveScore(newScore);
          this.playCrashSound();
          this.setState({ gameOver: true });
          if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
          }
          return;
        }
      }
      
      if (!obs.passed && obs.y > 380) {
        obs.passed = true;
        newPassed++;
        if (newPassed % 50 === 0) {
          newScore++;
        }
      }
    }
    
    this.setState({
      carX: newCarX,
      carY: newCarY,
      obstacles: newObstacles,
      score: newScore,
      obstaclesPassed: newPassed,
      speed: currentSpeed,
      gameTime: newGameTime
    });
  }

  closeGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    // Сохраняем очки при закрытии
    if (this.state.score > 0 && !this.state.gameOver) {
      this.saveScore(this.state.score);
    }
    window._isRacingActive = false;
    if (typeof window._updateKeyboard === 'function') {
      window._updateKeyboard();
    }
    this.setState({ isOpen: false });
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('gameClosed'));
    }
  }

  restartGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.setState({ 
      score: 0, 
      gameOver: false, 
      carX: 150,
      carY: 280,
      obstacles: [],
      obstaclesPassed: 0,
      isPaused: false,
      speed: 4,
      gameTime: 0
    });
    this.startGame();
  }

  render() {
    if (!this.state.isOpen) return null;

    var speedDisplay = Math.round(this.state.speed * 10) / 10;

    return (
      <div className={style.gameWrapper}>
        <div className={style.gameContainer}>
          <button 
            className={style.closeBtn} 
            onClick={this.closeGame}
            onTouchStart={function(e) { 
              e.stopPropagation(); 
              e.preventDefault();
            }}
            onTouchEnd={function(e) { 
              e.stopPropagation(); 
              e.preventDefault();
              this.closeGame(); 
            }.bind(this)}
          >
            ✕
          </button>
          
          <div className={style.scoreDisplay}>
            <span>Очки: {this.state.score}</span>
            <span className={style.speedDisplay}>⚡ {speedDisplay}</span>
            <button 
              className={style.pauseBtn}
              onClick={this.togglePause}
              onTouchStart={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
              }}
              onTouchEnd={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
                this.togglePause(); 
              }.bind(this)}
            >
              {this.state.isPaused ? '▶' : '⏸'}
            </button>
            <button 
              className={style.soundBtn}
              onClick={this.toggleSound}
              onTouchStart={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
              }}
              onTouchEnd={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
                this.toggleSound(); 
              }.bind(this)}
            >
              {this.state.soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
          
          <div className={style.road}>
            <div className={style.car} style={{ left: this.state.carX, top: this.state.carY }}>
              🚘
            </div>
            {this.state.obstacles.map(function(obs, i) {
              return (
                <div 
                  key={i} 
                  className={style.obstacle} 
                  style={{ left: obs.x, top: obs.y, width: obs.width }}
                >
                  {obs.type || '🚧'}
                </div>
              );
            })}
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
                onTouchStart={function(e) { 
                  e.stopPropagation(); 
                  e.preventDefault();
                }}
                onTouchEnd={function(e) { 
                  e.stopPropagation(); 
                  e.preventDefault();
                  this.restartGame(); 
                }.bind(this)}
              >
                🔄 Заново
              </button>
            </div>
          )}
          
          <div className={style.controls}>
            <span>← → ↑ ↓ (WASD)</span>
          </div>
        </div>
      </div>
    );
  }
}

export default RacingGame;