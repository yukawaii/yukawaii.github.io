// src/components/BonusModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';
import { showRewardedAd } from '../../unit/yandexSdk';
import { incrementCounter } from '../../unit/achievements';

class BonusModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      step: 'menu', // 'menu' | 'loading' | 'success' | 'error'
      timer: 10
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleGetBonus = this.handleGetBonus.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.timerInterval = null;
  }

  componentDidMount() {
    window.addEventListener('openBonus', function() {
      this.setState({
        isOpen: true,
        step: 'menu',
        timer: 10
      });
    }.bind(this));
    
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    }.bind(this));
  }

  componentWillUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.setState({ isOpen: false, step: 'menu', timer: 10 });
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

  handleGetBonus() {
   // console.log('🎬 Начинаем показ рекламы за вознаграждение');
    
    // Переходим в состояние загрузки
    this.setState({ step: 'loading', timer: 10 });
    
    // Запускаем таймер на 10 секунд
    var timer = 10;
    this.timerInterval = setInterval(function() {
      timer--;
      this.setState({ timer: timer });
      
      if (timer <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        // Если реклама не загрузилась за 10 секунд - ошибка
        this.setState({ step: 'error' });
      }
    }.bind(this), 1000);
    
    // Пытаемся показать рекламу
    showRewardedAd()
      .then(function(success) {
        // Останавливаем таймер
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        
        if (success) {
          // Реклама просмотрена успешно - начисляем бонус
          this.giveBonus();
        } else {
          // Реклама не просмотрена
          this.setState({ step: 'error' });
        }
      }.bind(this))
      .catch(function(err) {
        // Ошибка
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        console.error('❌ Ошибка показа рекламы:', err);
        this.setState({ step: 'error' });
      }.bind(this));
  }

  giveBonus() {
    // Начисляем 10 очков
    var currentTotal = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
    var newTotal = currentTotal + 10;
    localStorage.setItem('tetris_total_score', String(newTotal));
     // ===== СЧЕТЧИК БОНУСОВ С СИНХРОНИЗАЦИЕЙ =====
  incrementCounter('bonus_count', 1);    
    // Сохраняем в VK Storage общие очки
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageSet', {
        key: 'tetris_total_score',
        value: String(newTotal)
      }).catch(function(err) {
        console.warn('⚠️ Ошибка сохранения общего счета в VK Storage:', err);
      });
    }
    
    // Отправляем событие обновления счета
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scoreUpdated'));
    }
    
   // console.log('✅ Бонус +10 очков! Всего:', newTotal);
    this.setState({ step: 'success' });
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.closeModal();
  }

  render() {
    if (!this.state.isOpen) return null;

    var title = i18n.bonus ? i18n.bonus[lan] : 'Бонус';

    return (
      <div 
        className={style.modalWrapper}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
      >
        <div className={style.modal}>
          <button 
            className={style.closeBtn}
            onClick={this.closeModal}
            onTouchStart={function(e) { e.stopPropagation(); }}
            onTouchEnd={function(e) { 
              e.stopPropagation(); 
              this.closeModal(e); 
            }.bind(this)}
          >
            ✕
          </button>
          
          <div className={style.content}>
            {this.state.step === 'menu' && (
              <div>
                <div className={style.icon}>🎁</div>
                <div className={style.titleText}>{title}</div>
                <div className={style.description}>
                  +10 очков!<br />
                  Посмотрите рекламу, чтобы получить бонусные очки.
                </div>
                <div className={style.buttons}>
                  <button 
                    className={style.cancelBtn}
                    onClick={this.handleCancel}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation(); 
                      this.handleCancel(); 
                    }.bind(this)}
                  >
                    Отмена
                  </button>
                  <button 
                    className={style.getBtn}
                    onClick={this.handleGetBonus}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation(); 
                      this.handleGetBonus(); 
                    }.bind(this)}
                  >
                    Получить
                  </button>
                </div>
              </div>
            )}
            
            {this.state.step === 'loading' && (
              <div>
                <div className={style.icon}>⏳</div>
                <div className={style.titleText}>Загрузка рекламы...</div>
                <div className={style.description}>
                  Пожалуйста, подождите<br />
                  <span className={style.timer}>{this.state.timer} сек</span>
                </div>
              </div>
            )}
            
            {this.state.step === 'success' && (
              <div>
                <div className={style.icon}>🎉</div>
                <div className={style.titleText}>Бонус!</div>
                <div className={style.description}>
                  +10 очков получены!
                </div>
                <div className={style.buttons}>
                  <button 
                    className={style.okBtn}
                    onClick={this.handleOk}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation(); 
                      this.handleOk(); 
                    }.bind(this)}
                  >
                    Ок
                  </button>
                </div>
              </div>
            )}
            
            {this.state.step === 'error' && (
              <div>
                <div className={style.icon}>😔</div>
                <div className={style.titleText}>Реклама недоступна</div>
                <div className={style.description}>
                  Попробуйте позже
                </div>
                <div className={style.buttons}>
                  <button 
                    className={style.okBtn}
                    onClick={this.handleOk}
                    onTouchStart={function(e) { e.stopPropagation(); }}
                    onTouchEnd={function(e) { 
                      e.stopPropagation(); 
                      this.handleOk(); 
                    }.bind(this)}
                  >
                    Ок
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default BonusModal;