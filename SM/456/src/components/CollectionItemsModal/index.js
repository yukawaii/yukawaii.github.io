// src/components/CollectionItemsModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';
import { incrementCounter } from '../../unit/achievements';

var collectionsModule = require('../../unit/collections');

class CollectionItemsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      collectionId: null,
      collection: null,
      currentPage: 0,
      itemsPerPage: 12,
      totalScore: 0
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.goToPage = this.goToPage.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleShow = this.handleShow.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openCollectionItems', function() {
      var collectionId = window._pendingCollectionId || 'blocks';
      if (collectionId) {
        this.refreshData(collectionId);
      }
    }.bind(this));
    
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    }.bind(this));
  }

  refreshData(collectionId) {
    try {
      var collection = collectionsModule.getCollectionStatus(collectionId);
      var totalScore = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
      
      this.setState({
        isOpen: true,
        collectionId: collectionId,
        collection: collection,
        currentPage: 0,
        totalScore: totalScore
      });
    } catch(e) {
      console.error('❌ Ошибка загрузки коллекции:', e);
    }
  }
// src/components/CollectionItemsModal/index.js - в классе

handleTouchStart(e) {
  e.stopPropagation();
  // Не вызываем preventDefault здесь
}

handleTouchEnd(e) {
  e.stopPropagation();
  // Не вызываем preventDefault здесь
}

// Для кнопок используем отдельные обработчики
handlePageTouchStart(e) {
  e.stopPropagation();
  e.preventDefault();
}

handlePageTouchEnd(page, e) {
  e.stopPropagation();
  e.preventDefault();
  this.goToPage(page);
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

  goToPage(page) {
    if (!this.state.collection) return;
    var totalPages = Math.ceil(this.state.collection.totalCount / this.state.itemsPerPage);
    if (page >= 0 && page < totalPages) {
      this.setState({ currentPage: page });
    }
  }

  handleBuy(itemIndex) {
    var result = collectionsModule.buyItem(this.state.collectionId, itemIndex);
    
    if (result.success) {
      var collection = collectionsModule.getCollectionStatus(this.state.collectionId);
      this.setState({
        collection: collection,
        totalScore: result.totalScore
      });

       // ← ОТПРАВЛЯЕМ СОБЫТИЕ ОБНОВЛЕНИЯ СЧЕТА
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('scoreUpdated'));
    }
      
      if (typeof window.dispatchEvent === 'function') {
        window._pendingItemData = {
          collectionId: this.state.collectionId,
          itemIndex: itemIndex,
          action: 'unlocked'
        };
        window.dispatchEvent(new Event('openItemPreview'));
      }
    } else {
if (result.error === 'not_enough_points') {
  if (typeof window._showNotification === 'function') {
    window._showNotification('Недостаточно очков! Нужно ' + collectionsModule.ITEM_PRICE + ' очков.', '❌', 2500);
  }
} else if (result.error === 'already_unlocked') {
  if (typeof window._showNotification === 'function') {
    window._showNotification('Этот экспонат уже открыт!', '🔒', 2000);
  }
}
    }
     // ===== СЧЕТЧИК КОЛЛЕКЦИЙ =====
  incrementCounter('collections_count', 1);
  }

  handleShow(itemIndex) {
    if (typeof window.dispatchEvent === 'function') {
      window._pendingItemData = {
        collectionId: this.state.collectionId,
        itemIndex: itemIndex,
        action: 'show'
      };
      window.dispatchEvent(new Event('openItemPreview'));
    }
  }

  render() {
    if (!this.state.isOpen || !this.state.collection) return null;

    var collection = this.state.collection;
    var config = collectionsModule.COLLECTIONS_CONFIG[this.state.collectionId];
    if (!config) return null;
    
    var totalPages = Math.ceil(collection.totalCount / this.state.itemsPerPage);
    var currentPage = this.state.currentPage;
    var startIndex = currentPage * this.state.itemsPerPage;
    var endIndex = Math.min(startIndex + this.state.itemsPerPage, collection.totalCount);
    
    var title = config.name.ru;
    var itemPrice = collectionsModule.ITEM_PRICE || 300;
    
    // Форматируем очки
    var totalScore = this.state.totalScore;
    var formattedScore = totalScore >= 1000 ? (totalScore / 1000).toFixed(1) + 'k' : String(totalScore);

    // Создаем массив предметов для текущей страницы
    var items = [];
    for (var i = startIndex; i < endIndex; i++) {
      var index = i + 1;
      var isUnlocked = collection.items && collection.items[index];
      items.push({ index: index, isUnlocked: isUnlocked });
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
              {config.icon} {title}
              <span className={style.score}>⭐{formattedScore}</span>
            </span>
  <button 
  className={style.closeBtn} 
  onClick={this.closeModal}
  onTouchStart={function(e) { 
    e.stopPropagation(); 
    // Убираем e.preventDefault()
  }}
  onTouchEnd={function(e) { 
    e.stopPropagation(); 
    this.closeModal(e); 
  }.bind(this)}
>
  ✕
</button>
          </div>
          
          <div className={style.progressInfo}>
            <span>Открыто: {collection.unlockedCount} / {collection.totalCount}</span>           
          </div>
          
          <div className={style.grid}>
            {items.map(function(item) {
              var index = item.index;
              var isUnlocked = item.isUnlocked;
              
              return (
                <div 
                  key={index} 
                  className={style.gridItem}
                >
            {isUnlocked ? (
  <div 
    className={style.itemUnlocked}
    onClick={function() { this.handleShow(index); }.bind(this)}
    onTouchStart={function(e) { e.stopPropagation(); }}
    onTouchEnd={function(e) { 
      e.stopPropagation(); 
      this.handleShow(index); 
    }.bind(this)}
  >
    <img 
      src={'/SM/456/src/images/' + config.path + '/' + index + '.png'} 
      alt={index}
      className={style.itemImage}
      onError={(e) => { e.target.src = ''; e.target.alt = '🎨'; }}
    />
    <div className={style.itemOverlay}>
      <span>👁️</span>
    </div>
  </div>
) : (
  <div className={style.itemLocked}>
    <div className={style.itemSilhouette}>
      <span className={style.lockIcon}>🔒</span>
    </div>
    <div className={style.itemPrice}>
      {this.state.totalScore >= itemPrice ? (
        <button 
          className={style.buyBtn}
          onClick={function(e) { 
            e.stopPropagation(); 
            this.handleBuy(index); 
          }.bind(this)}
          onTouchStart={function(e) { e.stopPropagation(); }}
          onTouchEnd={function(e) { 
            e.stopPropagation(); 
            this.handleBuy(index); 
          }.bind(this)}
        >
          Получить
        </button>
        ) : null}
    </div>
  </div>
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
    onTouchStart={function(e) { 
      e.stopPropagation(); 
      // Убираем e.preventDefault()
    }}
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
    onTouchStart={function(e) { 
      e.stopPropagation(); 
      // Убираем e.preventDefault()
    }}
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

export default CollectionItemsModal;