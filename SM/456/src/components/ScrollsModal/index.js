// src/components/ScrollsModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';
import { incrementCounter } from '../../unit/achievements';
// Импортируем функции напрямую из yandexSdk
import { 
  getAllScrollsList, 
  getScroll, 
  buyScroll, 
  getScrollPrice,
  markScrollRead 
} from '../../unit/yandexSdk';

var SCROLL_PRICE = getScrollPrice();

class ScrollsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      scrolls: [],
      currentPage: 0,
      itemsPerPage: 12,
      totalScore: 0
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleScrollClick = this.handleScrollClick.bind(this);
    this.goToPage = this.goToPage.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.handleBuyScroll = this.handleBuyScroll.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openScrolls', function() {
      this.refreshData();
    }.bind(this));
    
    window.addEventListener('scrollsUpdated', function() {
      this.refreshData();
    }.bind(this));
    
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    }.bind(this));
  }

  refreshData() {
    try {
      // Используем импортированную функцию getAllScrollsList
      var scrolls = getAllScrollsList();
      var totalScore = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
      
      this.setState({
        isOpen: true,
        scrolls: scrolls,
        currentPage: 0,
        totalScore: totalScore
      });
    } catch(e) {
      console.error('❌ Ошибка загрузки свитков:', e);
    }
  }

  closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.setState({ isOpen: false });
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

  handleScrollClick(scrollId) {
    // Используем импортированную функцию getScroll
    var scroll = getScroll(scrollId);
    if (!scroll) return;
    
    var scrolls = getAllScrollsList();
    var found = null;
    for (var i = 0; i < scrolls.length; i++) {
      if (scrolls[i].id === scrollId) {
        found = scrolls[i];
        break;
      }
    }
    
    if (found && found.unlocked) {
      if (typeof window.dispatchEvent === 'function') {
        window._pendingScrollId = scrollId;
        window.dispatchEvent(new Event('openScrollText'));
      }
    }
  }

  goToPage(page) {
    var totalPages = Math.ceil(this.state.scrolls.length / this.state.itemsPerPage);
    if (page >= 0 && page < totalPages) {
      this.setState({ currentPage: page });
    }
  }

handleBuyScroll(scrollId) {
//  console.log('🛒 Покупаем свиток:', scrollId);
  
  // Используем импортированную функцию buyScroll
  var result = buyScroll(scrollId);
  
  if (result.success) {
    // Обновляем данные
    this.refreshData();
    
    // Обновляем счет на экране
    var newTotal = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
    this.setState({ totalScore: newTotal });
    // ← ОТПРАВЛЯЕМ СОБЫТИЕ ОБНОВЛЕНИЯ СЧЕТА
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scoreUpdated'));
    }
     // ===== СЧЕТЧИК КУПЛЕННЫХ СВИТКОВ =====
  incrementCounter('scrolls_bought', 1);
    // ===== ЗАМЕНЯЕМ ALERT НА УВЕДОМЛЕНИЕ =====
    if (typeof window._showNotification === 'function') {
      window._showNotification('Свиток открыт!', '📜', 2500);
    }
    
  } else {
    if (result.error === 'not_enough_points') {
      if (typeof window._showNotification === 'function') {
        window._showNotification('Недостаточно очков! Нужно ' + SCROLL_PRICE + ' очков.', '❌', 2500);
      }
    } else if (result.error === 'already_unlocked') {
      if (typeof window._showNotification === 'function') {
        window._showNotification('Этот свиток уже открыт!', '🔒', 2000);
      }
    }
  }
}

  render() {
    if (!this.state.isOpen) return null;

    var title = i18n.scrolls ? i18n.scrolls[lan] : 'Свитки';
    var totalPages = Math.ceil(this.state.scrolls.length / this.state.itemsPerPage);
    var currentPage = this.state.currentPage;
    var startIndex = currentPage * this.state.itemsPerPage;
    var endIndex = Math.min(startIndex + this.state.itemsPerPage, this.state.scrolls.length);
    var pageScrolls = this.state.scrolls.slice(startIndex, endIndex);
    
    var unlockedCount = 0;
    for (var i = 0; i < this.state.scrolls.length; i++) {
      if (this.state.scrolls[i].unlocked) unlockedCount++;
    }

    return (
      <div 
        className={style.modalWrapper}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
      >
        <div className={style.modal}>
          <div className={style.header}>
            <span className={style.title}>
              📜 {title}
              <span className={style.count}>
                {unlockedCount} / {this.state.scrolls.length}
              </span>
            </span>
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
          </div>
          
          <div className={style.scrollsGrid}>
            {pageScrolls.map(function(scroll) {
              var isUnlocked = scroll.unlocked;
              var canBuy = !isUnlocked && this.state.totalScore >= SCROLL_PRICE;
              
              return (
                <div 
                  key={scroll.id}
                  className={style.scrollItem}
                  onClick={isUnlocked ? function() { this.handleScrollClick(scroll.id); }.bind(this) : null}
                  onTouchStart={function(e) { e.stopPropagation(); }}
                  onTouchEnd={isUnlocked ? function(e) { 
                    e.stopPropagation(); 
                    this.handleScrollClick(scroll.id); 
                  }.bind(this) : null}
                  style={{
                    opacity: isUnlocked ? 1 : 0.6,
                    cursor: isUnlocked ? 'pointer' : 'default'
                  }}
                >
                  <div className={style.scrollIcon}>
                    {isUnlocked ? '📜' : '🔒'}
                  </div>
                  <div className={style.scrollTitle}>
                    {scroll.title}
                  </div>
                  
                  {/* Кнопка покупки для закрытых свитков */}
                  {!isUnlocked && (
                    <div className={style.scrollPrice}>
                      {canBuy ? (
                        <button 
                          className={style.buyBtn}
                          onClick={function(e) { 
                            e.stopPropagation(); 
                            this.handleBuyScroll(scroll.id); 
                          }.bind(this)}
                          onTouchStart={function(e) { e.stopPropagation(); }}
                          onTouchEnd={function(e) { 
                            e.stopPropagation(); 
                            this.handleBuyScroll(scroll.id); 
                          }.bind(this)}
                        >
                          {SCROLL_PRICE}⭐
                        </button>
                      ) : (
                        <span className={style.priceText}>{SCROLL_PRICE}⭐</span>
                      )}
                    </div>
                  )}
                  
                  {isUnlocked && scroll.read && (
                    <div className={style.scrollRead}>✓</div>
                  )}
                </div>
              );
            }.bind(this))}
          </div>
          
          {totalPages > 1 && (
            <div className={style.pagination}>
              <button 
                className={style.pageBtn}
                onClick={function() { this.goToPage(currentPage - 1); }.bind(this)}
                onTouchStart={function(e) { e.stopPropagation(); }}
                onTouchEnd={function(e) { 
                  e.stopPropagation(); 
                  this.goToPage(currentPage - 1); 
                }.bind(this)}
                disabled={currentPage === 0}
              >
                ◀
              </button>
              <span className={style.pageInfo}>
                {currentPage + 1} / {totalPages}
              </span>
              <button 
                className={style.pageBtn}
                onClick={function() { this.goToPage(currentPage + 1); }.bind(this)}
                onTouchStart={function(e) { e.stopPropagation(); }}
                onTouchEnd={function(e) { 
                  e.stopPropagation(); 
                  this.goToPage(currentPage + 1); 
                }.bind(this)}
                disabled={currentPage === totalPages - 1}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ScrollsModal;