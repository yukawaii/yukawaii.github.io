// src/components/ItemPreviewModal/index.js
import React, { Component } from 'react';
import style from './index.less';

var collectionsModule = require('../../unit/collections');

class ItemPreviewModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      collectionId: null,
      itemIndex: null,
      action: null
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openItemPreview', function() {
      var data = window._pendingItemData;
      if (data) {
        var config = collectionsModule.COLLECTIONS_CONFIG[data.collectionId];
        if (config) {
          this.setState({
            isOpen: true,
            collectionId: data.collectionId,
            itemIndex: data.itemIndex,
            action: data.action || 'show'
          });
        }
        window._pendingItemData = null;
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

  render() {
    if (!this.state.isOpen || !this.state.collectionId || !this.state.itemIndex) {
      return null;
    }

    var config = collectionsModule.COLLECTIONS_CONFIG[this.state.collectionId];
    if (!config) return null;
    
    var itemIndex = this.state.itemIndex;
    var isUnlocked = this.state.action === 'unlocked';

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
            {isUnlocked && (
              <div className={style.unlockMessage}>
                🎉 <strong>Экспонат открыт!</strong>
              </div>
            )}
            
            <div className={style.imageWrapper}>
              <img 
                src={'/SM/456/src/images/' + config.path + '/' + itemIndex + '.png'} 
                alt={itemIndex}
                className={style.image}
                onError={(e) => { 
                  e.target.src = '';
                  e.target.alt = '🖼️ Изображение не найдено';
                  e.target.style.fontSize = '24px';
                  e.target.style.display = 'flex';
                  e.target.style.alignItems = 'center';
                  e.target.style.justifyContent = 'center';
                  e.target.style.height = '100%';
                }}
              />
            </div>
            
            <div className={style.info}>
              <span className={style.itemTitle}>
                {config.name.ru} #{itemIndex}
              </span>
            </div>
            
            {/* Кнопка "Ок" вместо "Показать" */}
            <button 
              className={style.showBtn}
              onClick={this.closeModal}
              onTouchStart={function(e) { e.stopPropagation(); }}
              onTouchEnd={function(e) { 
                e.stopPropagation(); 
                this.closeModal(e); 
              }.bind(this)}
            >
              Ок
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ItemPreviewModal;