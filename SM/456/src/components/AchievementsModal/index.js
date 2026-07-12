// src/components/AchievementsModal/index.js
import React, { Component } from 'react';
import style from './index.less';
import { i18n, lan } from '../../unit/const';
import { syncYandexAchievements, getAchievementsList } from '../../unit/yandexSdk';
import { getTotalScore, formatScore, loadTotalScore } from '../../unit/achievements';
import { loadCounter } from '../../unit/achievements';

class AchievementsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      achievements: [],
      loading: true,
       totalScore: 0 
    };
    this.closeModal = this.closeModal.bind(this);
    this.refreshAchievements = this.refreshAchievements.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  componentDidMount() {
    window.addEventListener('openAchievements', () => {
     // console.log('🏅 openAchievements событие получено!');
       // Загружаем общий счет
    loadTotalScore().then(function(total) {
      this.setState({ totalScore: total });
    }.bind(this));
    
      this.setState({ 
        isOpen: true,
        loading: true 
      }, () => {
        this.refreshAchievements();
      });
    });
    
    // Слушаем событие закрытия достижений
    window.addEventListener('closeAchievements', () => {
      this.closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 27 && this.state.isOpen) {
        this.closeModal(e);
      }
    });
  }

  closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.setState({ isOpen: false });
    
    // Сообщаем меню, что достижения закрыты
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('achievementsClosed'));
    }
  }

  handleTouchStart(e) {
    e.stopPropagation();
  }

  handleTouchEnd(e) {
    e.stopPropagation();
  }

 refreshAchievements() {
  console.log('🔄 Обновляем достижения...refreshAchievements');
  this.setState({ loading: true });

  // Загружаем все счётчики из VK Storage
  var counters = ['arcade_total_score', 'bonus_count', 'collections_count', 'scrolls_bought', 'scrolls_read'];
  var loadPromises = counters.map(function(key) {
    return loadCounter(key);
  });

  Promise.all(loadPromises)
    .then(function() {
      return syncYandexAchievements();
    })
    .then(function() {
                   // Принудительно проверить все достижения
                        checkAchievementsNow();  
                        
      const list = getAchievementsList();
      this.setState({
        achievements: list,
        loading: false
      });
    }.bind(this))
    .catch(function(err) {
      console.error('❌ Ошибка синхронизации:', err);
      // Попробовать ещё раз через 2 секунды
      setTimeout(function() {
        console.log('🔄 Повторная попытка синхронизации...');
        syncYandexAchievements()
          .then(function() {
            const list = getAchievementsList();
            this.setState({
              achievements: list,
              loading: false
            });
          }.bind(this))
          .catch(function(err2) {
            console.error('❌ Вторая попытка также не удалась:', err2);
            const list = getAchievementsList();
            this.setState({
              achievements: list,
              loading: false
            });
          }.bind(this));
      }.bind(this), 2000);
    }.bind(this));
}


  render() {    
    if (!this.state.isOpen) return null;

    const title = i18n.achievements ? i18n.achievements[lan] : 'Достижения';
     const formattedTotal = formatScore(this.state.totalScore);
    const unlockedCount = this.state.achievements.filter(a => a.unlocked).length;
    const totalCount = this.state.achievements.length;
    const progress = totalCount > 0 ? (unlockedCount / totalCount * 100) : 0;

     const modalClass = `${style.modal} ${this.state.isVisible ? style.visible : ''}`;

    return (
// НЕТ overlay - только модалка поверх затемнения от меню
      <div 
        className={style.modalWrapper}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
      >
        <div 
          className={`${style.modal} modal`}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
        >
          <div className={style.header}>
            <span className={style.title}>🏆 {title} ⭐ {formattedTotal} </span>
            {/* ОБНОВЛЯЕМ КНОПКУ ЗАКРЫТИЯ */}
            <button 
              className={style.closeBtn} 
              onClick={this.closeModal}
              onTouchStart={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
              }}
              onTouchEnd={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                this.closeModal(e);
              }}
            >
              ✕
            </button>
          </div>
          
          <div className={style.progressBar}>
            <div 
              className={style.progressFill} 
              style={{ width: progress + '%' }}
            />
            <span className={style.progressText}>
              {unlockedCount} / {totalCount}
            </span>
          </div>
          
          <div className={style.content}>
            {this.state.loading ? (
              <div className={style.loading}>Загрузка...</div>
            ) : (
              this.state.achievements.map((ach) => (
                <div 
                  key={ach.id} 
                  className={`${style.achievementItem} ${ach.unlocked ? style.unlocked : style.locked}`}
                >
                  <div className={style.achievementIcon}>
                    {ach.icon}
                  </div>
                  <div className={style.achievementInfo}>
                    <div className={style.achievementName}>
                      {ach.unlocked ? '✅' : '🔒'} {ach.name.ru}
                    </div>
                    <div className={style.achievementDesc}>
                      {ach.desc.ru}
                    </div>
                    {ach.unlocked && ach.date && (
                      <div className={style.achievementDate}>
                        Получено: {new Date(ach.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default AchievementsModal;