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
      timer: 60,
      bonusAvailable: true,
      errorMessage: ''
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleGetBonus = this.handleGetBonus.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.loadBonusDate = this.loadBonusDate.bind(this);
    this.saveBonusDate = this.saveBonusDate.bind(this);
    this.checkBonusAvailable = this.checkBonusAvailable.bind(this);
    this.getTodayDate = this.getTodayDate.bind(this);
    this.timerInterval = null;
  }

  componentDidMount() {
    window.addEventListener('openBonus', function() {
      this.setState({
        isOpen: true,
        step: 'menu',
        timer: 60,
        bonusAvailable: true,
        errorMessage: ''
      });
      this.loadBonusDate();
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

  getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  checkBonusAvailable() {
    var today = this.getTodayDate();
    var stored = localStorage.getItem('bonus_last_date');
    return (stored !== today);
  }

  loadBonusDate() {
    var self = this;
    var today = this.getTodayDate();
    var localDate = localStorage.getItem('bonus_last_date');
    var available = (localDate !== today);
    
    this.setState({ bonusAvailable: available });

    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageGet', { keys: ['bonus_last_date'] })
        .then(function(data) {
          var vkDate = null;
          if (data && data.keys && data.keys.length > 0 && data.keys[0].value) {
            vkDate = data.keys[0].value;
            localStorage.setItem('bonus_last_date', vkDate);
          }
          var finalAvailable = true;
          if (vkDate) {
            finalAvailable = (vkDate !== today);
          } else {
            finalAvailable = (localDate !== today);
          }
          self.setState({ bonusAvailable: finalAvailable });
        })
        .catch(function(err) {
          console.warn('Ошибка загрузки даты бонуса из VK:', err);
        });
    }
  }

  saveBonusDate() {
    var today = this.getTodayDate();
    localStorage.setItem('bonus_last_date', today);
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageSet', {
        key: 'bonus_last_date',
        value: today
      }).catch(function(err) {
        console.warn('Ошибка сохранения даты бонуса в VK:', err);
      });
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
    this.setState({ isOpen: false, step: 'menu', timer: 60 });
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

  handleGetBonus() {
    if (!this.checkBonusAvailable()) {
      this.setState({
        step: 'error',
        errorMessage: 'Бонус уже получен сегодня'
      });
      return;
    }

    this.setState({ step: 'loading', timer: 60 });
    
    var timer = 60;
    this.timerInterval = setInterval(function() {
      timer--;
      this.setState({ timer: timer });
      if (timer <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.setState({ step: 'error', errorMessage: 'Реклама не загрузилась' });
      }
    }.bind(this), 1000);
    
    showRewardedAd()
      .then(function(success) {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        if (success) {
          this.giveBonus();
        } else {
          this.setState({ step: 'error', errorMessage: 'Реклама не просмотрена до конца' });
        }
      }.bind(this))
      .catch(function(err) {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        console.error('❌ Ошибка показа рекламы:', err);
        this.setState({ step: 'error', errorMessage: 'Ошибка показа рекламы' });
      }.bind(this));
  }

  giveBonus() {
    var currentTotal = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
    var newTotal = currentTotal + 10;
    localStorage.setItem('tetris_total_score', String(newTotal));
    
    incrementCounter('bonus_count', 1);
    
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageSet', {
        key: 'tetris_total_score',
        value: String(newTotal)
      }).catch(function(err) {
        console.warn('⚠️ Ошибка сохранения общего счета в VK Storage:', err);
      });
    }
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scoreUpdated'));
    }
    
    this.saveBonusDate();
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
    var isAvailable = this.state.bonusAvailable;
    var descriptionText = isAvailable 
      ? '+10 очков!<br />Посмотрите рекламу, чтобы получить бонусные очки.'
      : 'Вы уже получили бонус сегодня.<br />Возвращайтесь завтра!';

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
                <div className={style.description} dangerouslySetInnerHTML={{ __html: descriptionText }} />
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
                    disabled={!isAvailable}
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
                  {this.state.errorMessage || 'Попробуйте позже'}
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