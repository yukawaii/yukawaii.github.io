// src/components/CollectionsModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';

var collectionsModule = require('../../unit/collections');

class CollectionsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      collections: {}
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.openCollection = this.openCollection.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleItemTouchEnd = this.handleItemTouchEnd.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openCollections', function() {
     // console.log('🖼️ openCollections событие получено!');
      try {
        var collections = collectionsModule.getAllCollections();
      //  console.log('📊 Коллекции:', collections);
        this.setState({
          isOpen: true,
          collections: collections
        });
      } catch(e) {
      //  console.error('❌ Ошибка загрузки коллекций:', e);
      }
    }.bind(this));
    
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    }.bind(this));
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

  openCollection(collectionId) {
   // console.log('📂 Открываем коллекцию:', collectionId);
    
    window._pendingCollectionId = collectionId;
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openCollectionItems'));
    }
    
    this.closeModal();
  }

  // ← ДОБАВЛЯЕМ ОБРАБОТЧИКИ ДЛЯ МОБИЛЬНЫХ
  handleItemClick(collectionId, e) {
    e.preventDefault();
    e.stopPropagation();
    this.openCollection(collectionId);
  }

  handleItemTouchEnd(collectionId, e) {
    e.preventDefault();
    e.stopPropagation();
    this.openCollection(collectionId);
  }

  render() {
    if (!this.state.isOpen) return null;

    var title = i18n.collections ? i18n.collections[lan] : 'Коллекции';
    var collections = this.state.collections;
    var order = ['blocks', 'animals', 'plants', 'cos'];

    return (
      <div 
        className={style.modalWrapper}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
      >
        <div className={style.modal}>
          <div className={style.header}>
            <span className={style.title}>🖼️ {title}</span>
           <button 
  className={style.closeBtn} 
  onClick={this.closeModal}
  onTouchStart={function(e) { 
    e.stopPropagation(); 
  }}
  onTouchEnd={function(e) { 
    e.stopPropagation(); 
    this.closeModal(e); 
  }.bind(this)}
>
  ✕
</button>
          </div>
          
          <div className={style.content}>
            {order.map(function(id) {
              var col = collections[id];
              if (!col) return null;
              
              var progress = col.totalCount > 0 ? Math.round(col.unlockedCount / col.totalCount * 100) : 0;
              var isUnlocked = col.isUnlocked;
              
              return (
                <div 
                  key={id}
                  className={style.collectionItem}
                  onClick={isUnlocked ? function(e) { this.handleItemClick(id, e); }.bind(this) : null}
                  onTouchStart={isUnlocked ? function(e) { e.stopPropagation(); } : null}
                  onTouchEnd={isUnlocked ? function(e) { this.handleItemTouchEnd(id, e); }.bind(this) : null}
                  style={{ 
                    opacity: isUnlocked ? 1 : 0.5,
                    cursor: isUnlocked ? 'pointer' : 'default'
                  }}
                >
                  <div className={style.collectionIcon}>
                    {isUnlocked ? col.config.icon : '🔒'}
                  </div>
                  <div className={style.collectionInfo}>
                    <div className={style.collectionName}>
                      {col.config.name.ru}
                      {!isUnlocked && ' 🔒'}
                    </div>
                    <div className={style.collectionProgress}>
                      <div className={style.progressBar}>
                        <div 
                          className={style.progressFill} 
                          style={{ width: progress + '%' }}
                        />
                      </div>
                      <span className={style.progressText}>
                        {col.unlockedCount} / {col.totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }.bind(this))}
          </div>
        </div>
      </div>
    );
  }
}

export default CollectionsModal;