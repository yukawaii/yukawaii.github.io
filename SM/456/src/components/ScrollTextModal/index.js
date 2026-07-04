// src/components/ScrollTextModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { incrementCounter } from '../../unit/achievements';

var scrollsModule = require('../../unit/scrolls');

class ScrollTextModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      scrollId: null,
      scroll: null
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleRead = this.handleRead.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openScrollText', function() {
      var scrollId = window._pendingScrollId;
      var scroll = scrollsModule.getScrollById(scrollId);
      
      if (scroll) {
        this.setState({
          isOpen: true,
          scrollId: scrollId,
          scroll: scroll
        });
        window._pendingScrollId = null;
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

  handleRead() {
    if (this.state.scrollId) {
      scrollsModule.markScrollAsRead(this.state.scrollId);
       // ===== СЧЕТЧИК ПРОЧИТАННЫХ СВИТКОВ =====
    incrementCounter('scrolls_read', 1);
      
      var scroll = scrollsModule.getScrollById(this.state.scrollId);
      this.setState({ scroll: scroll });
      
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('scrollsUpdated'));
      }
      
    }
    this.closeModal();
  }

  render() {
    if (!this.state.isOpen || !this.state.scroll) return null;

    var scroll = this.state.scroll;
    var isRead = scroll.read || false;

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
            <div className={style.headerText}>
              <span className={style.titleText}>📜 {scroll.title}</span>
              {isRead && <span className={style.readBadge}>✓ Прочитано</span>}
            </div>
            
            <div className={style.textContent}>
              {scroll.text}
            </div>
            
            {!isRead && (
              <button 
                className={style.readBtn}
                onClick={this.handleRead}
                onTouchStart={function(e) { e.stopPropagation(); }}
                onTouchEnd={function(e) { 
                  e.stopPropagation(); 
                  this.handleRead(); 
                }.bind(this)}
              >
                Прочитано
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ScrollTextModal;