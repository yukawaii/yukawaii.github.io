// src/components/MenuModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';
import { getTotalScore, formatScore } from '../../unit/yandexSdk';

class MenuModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      isAchievementsOpen: false,
      totalScore: 0,
      showArcades: false
    };
    // ===== ВСЕ МЕТОДЫ ДОЛЖНЫ БЫТЬ ЗАБИНДЕНЫ =====
    this.closeModal = this.closeModal.bind(this);
    this.handleLeaderboard = this.handleLeaderboard.bind(this);
    this.handleInvite = this.handleInvite.bind(this);
    this.handleMode = this.handleMode.bind(this);
    this.handleAchievements = this.handleAchievements.bind(this);
    this.handleCollections = this.handleCollections.bind(this);
    this.handleScrolls = this.handleScrolls.bind(this);
    this.handleBonus = this.handleBonus.bind(this);
    this.handleArcades = this.handleArcades.bind(this);        // ← ДОБАВИТЬ
    this.handleArcadeGame = this.handleArcadeGame.bind(this);  // ← ДОБАВИТЬ
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.updateTotalScore = this.updateTotalScore.bind(this);
    this.toggleArcades = this.toggleArcades.bind(this);        // ← ДОБАВИТЬ
  }

  // ===== ВСЕ МЕТОДЫ КЛАССА =====

  componentDidMount() {
    window.addEventListener('openMenu', () => {
      this.setState({ isOpen: true, isAchievementsOpen: false });
      this.updateTotalScore();
    });
    
    window.addEventListener('achievementsClosed', () => {
      this.setState({ isAchievementsOpen: false });
      this.updateTotalScore();
    });
    
    window.addEventListener('scoreUpdated', () => {
      this.updateTotalScore();
    });
    
    window.addEventListener('openAchievements', () => {
      this.updateTotalScore();
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    }.bind(this));
  }

  updateTotalScore() {
    try {
      var total = getTotalScore();
      this.setState({ totalScore: total });
    } catch(e) {
      console.warn('Ошибка загрузки общего счета:', e);
    }
  }

  closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.setState({ isOpen: false, isAchievementsOpen: false, showArcades: false });
  }

  toggleArcades() {
    this.setState({ showArcades: !this.state.showArcades });
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

  handleLeaderboard(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (typeof window.openLeaderboard === 'function') {
      window.openLeaderboard();
    } else if (typeof window.fetchYandexLeaderboard === 'function') {
      var maxScore = window.store ? window.store.getState().get('max') || 0 : 0;
      window.fetchYandexLeaderboard(maxScore);
    }
   // this.closeModal();
  }

  handleInvite(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (window.vkBridge && window.vkInitialized) {
      window.vkBridge.send('VKWebAppShowInviteBox')
        .catch(function(err) { console.error('Ошибка окна приглашений:', err); });
    } else if (typeof window.showVkInviteBox === 'function') {
      window.showVkInviteBox();
    }
   // this.closeModal();
  }

  handleMode(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      if (window.todo && window.todo.mode && window.todo.mode.down) {
        window.todo.mode.down(window.store);
        setTimeout(function() {
          if (window.todo && window.todo.mode && window.todo.mode.up) {
            window.todo.mode.up(window.store);
          }
        }, 300);
      } else {
        var modes = require('../../unit/modes');
        var currentMode = modes.getCurrentMode();
        var newMode = currentMode === modes.GAME_MODES.CLASSIC ? modes.GAME_MODES.TETRA : modes.GAME_MODES.CLASSIC;
        
        modes.setGameMode(newMode);
        window.currentGameMode = newMode;
        
        var newShapes = modes.MODE_SHAPES[newMode];
        if (window.blockShapeUpdate) {
          window.blockShapeUpdate(newShapes);
        }
        
        if (window.blockType) {
          var newBlockType = Object.keys(newShapes);
          window.blockType.length = 0;
          newBlockType.forEach(function(key) { window.blockType.push(key); });
        }
        
        var states = require('../../control/states').default;
        if (states && typeof states.overStart === 'function') {
          states.overStart();
        }
      }
    } catch(err) {
      console.error('Ошибка смены режима:', err);
    }
    this.closeModal();
  }

  handleCollections(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
   // console.log('🖼️ Открываем коллекции');
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openCollections'));
    }
   // this.closeModal();
  }

  handleScrolls(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
   // console.log('📜 Открываем свитки');
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openScrolls'));
    }
   // this.closeModal();
  }
// В классе MenuModal, после других методов:
handleHelp(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
//  console.log('❓ Открываем помощь');
  
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('openHelp'));
  }
  // Не закрываем меню
}

  handleBonus(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
//    console.log('🎁 Открываем бонус');
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openBonus'));
    }
  //  this.closeModal();
  }

  handleAchievements(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  //  console.log('🏅 Открываем достижения');
    
    this.setState({ isAchievementsOpen: true });
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openAchievements'));
    }
  }

  handleArcades(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.toggleArcades();
  }

  handleArcadeGame(game) {
//  console.log('🎮 Запускаем игру:', game);
  
   if (game === 'racing') {
    // Сначала устанавливаем флаг
    window._isRacingActive = true;
    // Потом отправляем событие
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openRacing'));
    }
  }

  if (game === 'arkanoid') {
  window._isRacingActive = true;
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('openArkanoid'));
  }
}
  if (game === 'snake') {
    window._isRacingActive = true;
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openSnake'));
    }
  }
  if (game === 'pong') {
    window._isRacingActive = true;
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openPong'));
    }
  }
   this.closeModal(); // ← ЗАКРЫВАЕМ МЕНЮ 
}

  render() {
    if (!this.state.isOpen) return null;

    var menuTitle = i18n.menu ? i18n.menu[lan] : 'Меню';
    var inviteLabel = i18n.inviteFriends ? i18n.inviteFriends[lan] : 'Пригласить друзей';
    var modeLabel = i18n.switchMode ? i18n.switchMode[lan] : 'Смена режима';
    var achievementsLabel = i18n.achievements ? i18n.achievements[lan] : 'Достижения';
    var collectionsLabel = i18n.collections ? i18n.collections[lan] : 'Коллекции';
    var scrollsLabel = i18n.scrolls ? i18n.scrolls[lan] : 'Свитки';
    var bonusLabel = i18n.bonus ? i18n.bonus[lan] : 'Бонус';
    var arcadesLabel = i18n.arcades ? i18n.arcades[lan] : 'Аркады';
    
    var formattedScore = formatScore(this.state.totalScore);
    var currentMode = window.currentGameMode || 'tetra';
    var modeDisplay = currentMode === 'tetra' ? 'ТЕТРА' : 'Классика';

    return (
      <div 
        className={style.modalWrapper}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
      >
        <div 
          className={style.modal}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
        >
          <div className={style.header}>
            <span className={style.title}>
              🏠 {menuTitle}
              <span className={style.score}>⭐ {formattedScore}</span>
            </span>
            <button 
              className={style.closeBtn} 
              onClick={this.closeModal}
              onTouchStart={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
              }}
              onTouchEnd={function(e) { 
                e.stopPropagation(); 
                e.preventDefault();
                this.closeModal(e);
              }.bind(this)}
            >
              ✕
            </button>
          </div>
          
          <div className={style.content}>
                      {/* Ряд 1: 🏆 🎁 🖼️ 📜 ❓ (4 кнопки в ряду) */}
<div className={style.rowButtons}>
  <div 
    className={style.iconButton + ' ' + style.yellow}
    onClick={this.handleLeaderboard}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation();
      this.handleLeaderboard(e);
    }.bind(this)}
  >
    <span>🏆</span>
  </div>
  <div 
    className={style.iconButton + ' ' + style.yellow}
    onClick={this.handleBonus}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation();
      this.handleBonus(e);
    }.bind(this)}
  >
    <span>🎁</span>
  </div>
  <div 
    className={style.iconButton + ' ' + style.yellow}
    onClick={this.handleCollections}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation();
      this.handleCollections(e);
    }.bind(this)}
  >
    <span>🖼️</span>
  </div>
  <div 
    className={style.iconButton + ' ' + style.yellow}
    onClick={this.handleScrolls}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation();
      this.handleScrolls(e);
    }.bind(this)}
  >
    <span>📜</span>
  </div>
    {/* ===== НОВАЯ КНОПКА ПОМОЩИ ===== */}
  <div 
    className={style.iconButton + ' ' + style.yellow}
    onClick={this.handleHelp}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation();
      this.handleHelp(e);
    }.bind(this)}
  >
    <span>❓</span>
  </div>
</div>

            {/* 👥 Пригласить друзей */}
            <div 
              className={style.menuItem} 
              onClick={this.handleInvite}
              onTouchStart={function(e) { e.stopPropagation(); }}
              onTouchEnd={function(e) { 
                e.stopPropagation();
                this.handleInvite(e);
              }.bind(this)}
            >
              <div className={style.menuButton + ' ' + style.yellow}>
                <span>👥</span>
              </div>
              <span className={style.menuLabel}>{inviteLabel}</span>
            </div>

            {/* 🏅 Достижения */}
            <div 
              className={style.menuItem} 
              onClick={this.handleAchievements}
              onTouchStart={function(e) { e.stopPropagation(); }}
              onTouchEnd={function(e) { 
                e.stopPropagation();
                this.handleAchievements(e);
              }.bind(this)}
            >
              <div className={style.menuButton + ' ' + style.yellow}>
                <span>🏅</span>
              </div>
              <span className={style.menuLabel}>{achievementsLabel}</span>
            </div>

            {/* 🎮 Смена режима */}
            <div 
              className={style.menuItem} 
              onClick={this.handleMode}
              onTouchStart={function(e) { e.stopPropagation(); }}
              onTouchEnd={function(e) { 
                e.stopPropagation();
                this.handleMode(e);
              }.bind(this)}
            >
              <div className={style.menuButton + ' ' + style.yellow}>
                <span>🎮</span>
              </div>
              <span className={style.menuLabel}>
                {modeLabel}: 🧩
              </span>
            </div>           
            {/* 🎯 Аркады */}
            <div>
              <div 
                className={style.menuItem} 
                onClick={this.handleArcades}
                onTouchStart={function(e) { e.stopPropagation(); }}
                onTouchEnd={function(e) { 
                  e.stopPropagation();
                  this.handleArcades(e);
                }.bind(this)}
              >
                <div className={style.menuButton + ' ' + style.yellow}>
                  <span>🎯</span>
                </div>
                <span className={style.menuLabel}>
                  {arcadesLabel}
                  <span className={style.arrow}>
                    {this.state.showArcades ? ' ▼' : ' ▶'}
                  </span>
                </span>
              </div>
              
              {this.state.showArcades && (
                <div className={style.subMenu}>
                  <div 
                    className={style.subMenuItem}
                    onClick={function() { this.handleArcadeGame('racing'); }.bind(this)}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation();
                      this.handleArcadeGame('racing');
                    }.bind(this)}
                  >
                    <span className={style.subIcon}>🏎️</span>
                    <span className={style.subLabel}>Гонки</span>
                  </div>
                  <div 
                    className={style.subMenuItem}
                    onClick={function() { this.handleArcadeGame('snake'); }.bind(this)}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation();
                      this.handleArcadeGame('snake');
                    }.bind(this)}
                  >
                    <span className={style.subIcon}>🐍</span>
                    <span className={style.subLabel}>Змейка</span>
                  </div>
                  <div 
                    className={style.subMenuItem}
                    onClick={function() { this.handleArcadeGame('pong'); }.bind(this)}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation();
                      this.handleArcadeGame('pong');
                    }.bind(this)}
                  >
                    <span className={style.subIcon}>🏓</span>
                    <span className={style.subLabel}>Пинг-понг</span>
                  </div>
<div 
  className={style.subMenuItem}
  onClick={function() { this.handleArcadeGame('arkanoid'); }.bind(this)}
  onTouchStart={function(e) { e.stopPropagation(); }}
  onTouchEnd={function(e) { 
    e.stopPropagation();
    this.handleArcadeGame('arkanoid');
  }.bind(this)}
>
  <span className={style.subIcon}>🧱</span>
  <span className={style.subLabel}>Арканоид</span>
</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MenuModal;