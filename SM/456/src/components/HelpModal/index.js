// src/components/HelpModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';

class HelpModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      currentPage: 0
    };
    this.closeModal = this.closeModal.bind(this);
    this.goToPage = this.goToPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openHelp', function() {
      this.setState({ isOpen: true, currentPage: 0 });
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

  goToPage(page) {
    var totalPages = this.getTotalPages();
    if (page >= 0 && page < totalPages) {
      this.setState({ currentPage: page });
    }
  }

  nextPage() {
    this.goToPage(this.state.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.state.currentPage - 1);
  }

  getTotalPages() {
    return this.pages ? this.pages.length : 0;
  }

  render() {
    if (!this.state.isOpen) return null;

    // Страницы: по 2 секции на страницу
    this.pages = [
      // Страница 0: Управление + Очки
      [
        { title: '🎮 Управление Тетра', items: ['← → — движение влево/вправо', '↑ или Поворот — вращение фигуры', '↓ — ускоренное падение', 'Пробел — мгновенное падение'] },
        { title: '⭐ Очки в Тетра', items: ['Очки начисляются за упавшие блоки и очищенные линии:', '1 линия → 2 очка', '2 линии → 3 очка', '3 линии → 4 очка', '4 линии → 5 очков', 'Очки можно тратить на покупку Свитков и экспонатов!'] }
      ],
      // Страница 1: Коллекции + Свитки
      [
        { title: '🖼️ Коллекции', items: ['Собирайте коллекции за очки.', 'Каждый экспонат стоит 300 очков.', 'Чтобы открыть следующую коллекцию, нужно собрать все экспонаты в предыдущей.'] },
        { title: '📜 Свитки', items: [ 'Каждый свиток стоит 300 очков.', 'Покупайте и читайте свитки, чтобы узнать много интересного!'] }
      ],
      // Страница 2: Аркады + Таблица лидеров
      [
        { title: '🎯 Аркады', items: ['В аркадах тоже можно заработать очки!', '🏎️ Гонки — 1 очко за 50 препятствий', '🐍 Змейка — 1 очко за 10 яблок', '🏓 Пинг-понг — 1 очко за 20 ударов', '🧱 Арканоид — 1 очко за 50 кирпичей'] },
        { title: '🏆 Таблица лидеров', items: ['В таблице лидеров хранится ваш рекорд за одну игру в Тетра (в любом режиме).', 'Это не общее количество очков, а максимальный результат в одной партии!'] }
      ]
    ];

    var currentPage = this.state.currentPage;
    var totalPages = this.pages.length;
    var sections = this.pages[currentPage] || [];

    return (
      <div className={style.modalWrapper}>
        <div className={style.modal}>
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
  {sections.map(function(section, idx) {
    return (
      <div key={idx} className={style.section}>
        <h3>{section.title}</h3>
        {section.items.map(function(item, i) {
          var isHint = (i === section.items.length - 1) && 
                       (section.title === '⭐ Очки в Тетра' || section.title === '🏆 Таблица лидеров');
          
          // ===== ВЫДЕЛЯЕМ "300 очков" ЖИРНЫМ =====
          var content = item;
          if (typeof item === 'string' && item.includes('300 очков')) {
            var parts = item.split('300 очков');
            content = <span>{parts[0]}<strong>300 очков</strong>{parts[1]}</span>;
          }
          
          return <p key={i} className={isHint ? style.hint : ''}>{content}</p>;
        })}
      </div>
    );
  })}
</div>

          <div className={style.pagination}>
            <button 
              className={style.pageBtn} 
              onClick={this.prevPage}
              disabled={currentPage === 0}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); this.prevPage(); }}
            >
              ◀
            </button>
            <span className={style.pageInfo}>{currentPage + 1} / {totalPages}</span>
            <button 
              className={style.pageBtn} 
              onClick={this.nextPage}
              disabled={currentPage === totalPages - 1}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); this.nextPage(); }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default HelpModal;