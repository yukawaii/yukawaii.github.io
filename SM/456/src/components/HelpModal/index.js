// src/components/HelpModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';

class HelpModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
    this.closeModal = this.closeModal.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openHelp', function() {
      this.setState({ isOpen: true });
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

  handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      this.closeModal(e);
    }
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

  render() {
    if (!this.state.isOpen) return null;

    return (
      <div    className={style.modalWrapper}
            >
      <div className={`${style.modal} modal`}>
          <div className={style.header}>
            <span className={style.title}>❓ Как играть?</span>
            <button 
              className={style.closeBtn} 
              onClick={this.closeModal}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); this.closeModal(e); }}
            >
              ✕
            </button>
          </div>
          
          <div className={style.content}>
            <div className={style.section}>
              <h3>🎮 Управление Тетра</h3>
              <p>← → — движение влево/вправо</p>
              <p>↑ или Поворот — вращение фигуры</p>
              <p>↓ — ускоренное падение</p>
              <p>Пробел — мгновенное падение</p>
            </div>
            
            <div className={style.section}>
              <h3>⭐ Очки в Тетра</h3>
              <p>Очки начисляются за упавшие блоки и очищенные линии:</p>
              <p>1 линия → <strong>2 очка</strong></p>
              <p>2 линии → <strong>3 очка</strong></p>
              <p>3 линии → <strong>4 очка</strong></p>
              <p>4 линии → <strong>5 очков</strong></p>
              <p className={style.hint}>Очки можно тратить на покупку Свитков и экспонатов!</p>
            </div>
            
            <div className={style.section}>
              <h3>🖼️ Коллекции</h3>
              <p>Собирайте коллекции за очки.</p>
              <p>Каждый экспонат стоит <strong>300 очков</strong>.</p>
              <p>Чтобы открыть следующую коллекцию, нужно собрать все экспонаты в предыдущей.</p>
            </div>
            
            <div className={style.section}>
              <h3>📜 Свитки</h3>           
              <p>Покупайте и читайте свитки, чтобы узнать много интересного!</p>
            </div>
            
            <div className={style.section}>
              <h3>🎯 Аркады</h3>
              <p>В аркадах тоже можно заработать очки!</p>
              <p>🏎️ Гонки — 1 очко за 50 препятствий</p>
              <p>🐍 Змейка — 1 очко за 10 яблок</p>
              <p>🏓 Пинг-понг — 1 очко за 20 ударов</p>
              <p>🧱 Арканоид — 1 очко за 50 кирпичей</p>
            </div>
              <div className={style.section}>
    <h3>🏆 Таблица лидеров</h3>
    <p>В таблице лидеров хранится ваш <strong>рекорд за одну игру</strong> в Тетра (в любом режиме).</p>
    <p className={style.hint}>Это не общее количество очков, а максимальный результат в одной партии!</p>
  </div>
          </div>
        </div>
      </div>
    );
  }
}

export default HelpModal;