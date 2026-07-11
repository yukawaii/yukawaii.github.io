// src/games/arkanoid/index.js
import React, { Component } from 'react';
import style from './index.less';
import { incrementCounter } from '../../unit/achievements';
import { showFullscreenAd } from '../../unit/yandexSdk';
import { visibilityChangeEvent, isFocus } from '../../unit/';

var arcadeSounds = require('../../unit/arcadeSounds');

class ArkanoidGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      score: 0,
      gameOver: false,
      isPaused: false,
      soundEnabled: true,
      paddleX: 140,
      ballX: 170,
      ballY: 250,
   ballSpeedX: 1.25,
ballSpeedY: -1.75,
      bricks: [],
      hits: 0,
      gameTime: 0,
      speed: 1,
      paddleWidth: 70,
      paddleHeight: 12,
      ballSize: 10,
      fieldWidth: 320,
      fieldHeight: 300,
      lives: 3,
      soundEnabled: true,
     

    };
// В конструкторе:
this.PADDLE_BOTTOM = 20; // ← то же, что в пинг-понге
this.PADDLE_WIDTH = 70;
this.PADDLE_HEIGHT = 15;
this.BALL_SIZE = 12;

    this.moveLeft = false;
    this.moveRight = false;
    this.gameLoop = null;
    this.lastSoundTime = 0;
     this._soundEnabled = true; // синхронный флаг для левоправо playmove
    
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
    this.initBricks = this.initBricks.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openArkanoid', function() {
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

  initBricks() {
    var bricks = [];
    var cols = 8;
    var rows = 5;
    var brickWidth = 35;
    var brickHeight = 14;
    var gap = 4;
    var offsetX = 10;
    var offsetY = 30;
    var colors = ['#ff6b6b', '#ff9f43', '#feca57', '#54a0ff', '#5f27cd'];
    
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = offsetX + col * (brickWidth + gap);
        var y = offsetY + row * (brickHeight + gap);
        // Некоторые блоки пропускаем для сложности
        var skip = (row === 0 && (col === 0 || col === cols - 1)) ||
                   (row === rows - 1 && (col === 0 || col === cols - 1));
        if (!skip) {
          bricks.push({
            x: x,
            y: y,
            width: brickWidth,
            height: brickHeight,
            color: colors[row % colors.length],
            alive: true
          });
        }
      }
    }
    return bricks;
  }

  initGame() {
     this._soundEnabled = true; 
    this.setState({
      isOpen: true,
      score: 0,
      gameOver: false,
      isPaused: false,
      soundEnabled: true,
      paddleX: (this.state.fieldWidth - this.state.paddleWidth) / 2,
      ballX: this.state.fieldWidth / 2 - this.state.ballSize / 2,
      ballY: 250,
    ballSpeedX: 1.25,
ballSpeedY: -1.75,
      bricks: this.initBricks(),
      hits: 0,
      gameTime: 0,
      speed: 1,
      lives: 3
    });
  }

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
    
   // console.log('🧱 +1 очко в общий счет за 50 кирпичей!');
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

playMoveSound() {
  if (!this._soundEnabled) return;
  var now = Date.now();
  if (now - this.lastSoundTime < 100) return;
  this.lastSoundTime = now;
  
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
  this._soundEnabled = !this._soundEnabled;          // сразу меняем
  this.setState({ soundEnabled: this._soundEnabled }); // для UI
}


  handleKeyDown(e) {
    var key = e.key;
    
    if (key === 'ArrowLeft' || key === 'Left' || key === 'a' || key === 'A' || key === 'ф' || key === 'Ф') {
      e.preventDefault();
      this.moveLeft = true;
      this.moveRight = false;
  if (!this.state.isPaused && !this.state.gameOver) {
      this.playMoveSound();   // ← звук только здесь
    }
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 'd' || key === 'D' || key === 'в' || key === 'В') {
      e.preventDefault();
      this.moveRight = true;
      this.moveLeft = false;
  if (!this.state.isPaused && !this.state.gameOver) {
      this.playMoveSound();   // ← звук только здесь
    }
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
    
    if (key === 'left') {
      this.moveLeft = (action === 'down');
      if (action === 'down') this.moveRight = false;
     if (action === 'down' && !this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
      return;
    }
    if (key === 'right') {
      this.moveRight = (action === 'down');
      if (action === 'down') this.moveLeft = false;
      if (action === 'down' && !this.state.isPaused && !this.state.gameOver) {
    this.playMoveSound();
  }
      return;
    }
  }

  handleTouchStart(e) {
  // Игнорируем касания на кнопках управления
  const target = e.target;
 if (target.closest('.' + style.soundBtn) || 
    target.closest('.' + style.pauseBtn) || 
    target.closest('.' + style.closeBtn) || 
    target.closest('.' + style.restartBtn)) {
  return;
}
    if (this.state.isPaused || this.state.gameOver) return;
    if (!this.state.isOpen) return;
    
    var touch = e.touches[0];
    if (!touch) return;
    
    var screenWidth = window.innerWidth;
    var touchX = touch.clientX;
    
    if (touchX < screenWidth / 2) {
      this.moveLeft = true;
      this.moveRight = false;
    } else {
      this.moveRight = true;
      this.moveLeft = false;
    }
  }

  handleTouchEnd(e) {
    this.moveLeft = false;
    this.moveRight = false;
  }
playBounceSound() {
  if (!this.state.soundEnabled) return;
  try {
    if (arcadeSounds && arcadeSounds.bounce) {
      arcadeSounds.bounce();
    }
  } catch(e) {}
}
  startGame() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(function() {
      if (!this.state.isPaused && !this.state.gameOver) {
        this.updateGame();
      }
    }.bind(this), 16);
  }

updateGame() {
  if (this.state.gameOver || this.state.isPaused) return;
  
  var FW = this.state.fieldWidth;
  var FH = this.state.fieldHeight;
  var PW = this.state.paddleWidth;
  var PH = this.state.paddleHeight;
  var BS = this.state.ballSize;
  var PB = this.PADDLE_BOTTOM;
  
  var newGameTime = this.state.gameTime + 1;
  var newSpeed = Math.min(5, 1 + Math.floor(newGameTime / 300) * 0.3);
  
  // ===== ДВИЖЕНИЕ ПЛАТФОРМЫ =====
  var newPaddleX = this.state.paddleX;
  var moveSpeed = 5 + newSpeed * 1.5;
  if (this.moveLeft) newPaddleX = Math.max(0, newPaddleX - moveSpeed);
  if (this.moveRight) newPaddleX = Math.min(FW - PW, newPaddleX + moveSpeed);
  
  // ===== ДВИЖЕНИЕ МЯЧА =====
  var newBallX = this.state.ballX + this.state.ballSpeedX;
  var newBallY = this.state.ballY + this.state.ballSpeedY;
  var newBallSpeedX = this.state.ballSpeedX;
  var newBallSpeedY = this.state.ballSpeedY;
  var newHits = this.state.hits;
  var newScore = this.state.score;
  var newBricks = this.state.bricks.slice();
  var brokenCount = 0;
  
  // ===== СТЕНЫ =====
  var leftPadding = 3;
  if (newBallX < leftPadding) {
    newBallX = leftPadding;
    newBallSpeedX = -newBallSpeedX;
    this.playBounceSound();
  }
  if (newBallX + BS > FW) {
    newBallX = FW - BS;
    newBallSpeedX = -newBallSpeedX;
     this.playBounceSound();
  }
  if (newBallY < 0) {
    newBallY = 0;
    newBallSpeedY = -newBallSpeedY;
    this.playBounceSound();
  }
  
  // ===== ПЛАТФОРМА (ТОЧНО КАК В ПИНГ-ПОНГЕ) =====
  var offsetY = 50;  // ← ТОТ ЖЕ СМЕЩЕНИЕ
  var paddleY = FH - PH - PB + offsetY;
  var paddleLeft = newPaddleX;
  var paddleRight = newPaddleX + PW;
  var paddleTop = paddleY;
  
  var ballLeft = newBallX;
  var ballRight = newBallX + BS;
  var ballBottom = newBallY + BS;
  
  if (ballBottom >= paddleTop && 
      ballBottom <= paddleTop + 8 &&
      ballRight > paddleLeft + 2 && 
      ballLeft < paddleRight - 2) {
    
    newBallSpeedY = -Math.abs(newBallSpeedY) * 1.03;
    var hitPos = (ballLeft + ballRight) / 2 - newPaddleX;
    hitPos = hitPos / PW;
    newBallSpeedX = (hitPos - 0.5) * 5;
    newBallY = paddleTop - BS;
    newHits++;
    
    if (newHits % 20 === 0) {
      this.saveScore(1);
    }
  }
    
// ===== КИРПИЧИ =====
for (var i = 0; i < newBricks.length; i++) {
  var brick = newBricks[i];
  if (!brick.alive) continue;
  
  var brickLeft = brick.x;
  var brickRight = brick.x + brick.width;
  var brickTop = brick.y;
  var brickBottom = brick.y + brick.height;
  
  // Проверка столкновения мяча с кирпичом
  if (newBallX + BS > brickLeft && 
      newBallX < brickRight &&
      newBallY + BS > brickTop && 
      newBallY < brickBottom) {
    
    brick.alive = false;
    brokenCount++;
   // this.playCrashSound();
    
    // Определяем направление отскока
    var overlapX = Math.min(newBallX + BS - brickLeft, brickRight - newBallX);
    var overlapY = Math.min(newBallY + BS - brickTop, brickBottom - newBallY);
    
    if (overlapX < overlapY) {
      newBallSpeedX = -newBallSpeedX;
    } else {
      newBallSpeedY = -newBallSpeedY;
    }
    
    break;
  }
}

// ===== ОБНОВЛЯЕМ СЧЕТ =====
var newScore = this.state.score + brokenCount;

// ===== ОЧКИ В ОБЩИЙ СЧЕТ: 1 очко за 50 кирпичей =====
if (brokenCount > 0) {
  var totalBricks = this.state.score + brokenCount;
  var oldThreshold = Math.floor(this.state.score / 50);
  var newThreshold = Math.floor(totalBricks / 50);
  
  if (newThreshold > oldThreshold) {
    this.saveScore(1);
  }
}

// ===== ПРОВЕРКА ВСЕ ЛИ КИРПИЧИ РАЗБИТЫ =====
var allBroken = true;
for (var j = 0; j < newBricks.length; j++) {
  if (newBricks[j].alive) {
    allBroken = false;
    break;
  }
}

if (allBroken && newBricks.length > 0) {
  newBricks = this.initBricks();
  newScore += 5;
  if (!this.state.isPaused && !this.state.gameOver) {
  this.playCrashSound();
  }
}
    // ===== ПРОВЕРКА ПРОИГРЫША =====
    if (newBallY > FH + 20) {
      var newLives = this.state.lives - 1;
      if (newLives <= 0) {
        if (!this.state.isPaused && !this.state.gameOver) {
        this.playCrashSound();
        }
        this.setState({ gameOver: true });
        if (this.gameLoop) {
          clearInterval(this.gameLoop);
          this.gameLoop = null;
        }
        return;
      }
      // Сброс мяча
      this.setState({
        lives: newLives,
        ballX: FW / 2 - BS / 2,
        ballY: FH - 60,
        ballSpeedX: 2.5 * (Math.random() > 0.5 ? 1 : -1),
        ballSpeedY: -3.5,
        paddleX: (FW - PW) / 2
      });
      return;
    }
    
    // Ограничение скорости
    var maxSpeed = 6 + newSpeed;
    if (newBallSpeedX > maxSpeed) newBallSpeedX = maxSpeed;
    if (newBallSpeedX < -maxSpeed) newBallSpeedX = -maxSpeed;
    if (newBallSpeedY > maxSpeed) newBallSpeedY = maxSpeed;
    if (newBallSpeedY < -maxSpeed) newBallSpeedY = -maxSpeed;
    
    this.setState({
      paddleX: newPaddleX,
      ballX: newBallX,
      ballY: newBallY,
      ballSpeedX: newBallSpeedX,
      ballSpeedY: newBallSpeedY,
      bricks: newBricks,
      score: newScore,
      hits: newHits,
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
    window._isRacingActive = false;
    if (typeof window._updateKeyboard === 'function') {
      window._updateKeyboard();
    }
    this.setState({ isOpen: false });
    this.moveLeft = false;
    this.moveRight = false;
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

    var speedDisplay = Math.round(this.state.speed * 10) / 10;
    var hearts = '';
    for (var i = 0; i < this.state.lives; i++) {
      hearts += '❤️';
    }
    for (var j = this.state.lives; j < 3; j++) {
      hearts += '🖤';
    }

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
            <span>🧱 {this.state.score}</span>
            <span className={style.livesDisplay}>{hearts}</span>
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
            <div className={style.gameField}>
              {/* Кирпичи */}
              {this.state.bricks.map(function(brick, i) {
                if (!brick.alive) return null;
                return (
                  <div 
                    key={i} 
                    className={style.brick}
                    style={{ 
                      left: brick.x, 
                      top: brick.y, 
                      width: brick.width, 
                      height: brick.height,
                      background: brick.color
                    }}
                  ></div>
                );
              })}
              
              {/* Платформа */}
              <div 
                className={style.paddle}
                style={{ left: this.state.paddleX, bottom: 10 }}
              ></div>
              
              {/* Мяч */}
              <div 
                className={style.ball}
                style={{ left: this.state.ballX, top: this.state.ballY }}
              ></div>
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
              <div className={style.finalScore}>Кирпичей: {this.state.score}</div>
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
            <span>← →</span>
          </div>
        </div>
      </div>
    );
  }
}

export default ArkanoidGame;