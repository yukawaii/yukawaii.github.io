import React from 'react';
import Immutable from 'immutable'; 
import propTypes from 'prop-types';
import style from './index.less';
import Button from './button';
import store from '../../store';
import todo from '../../control/todo';
import { i18n, lan } from '../../unit/const';

export default class Keyboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inviteActive: false,
      isRacingActive: false
    };
    this.updateRacingState = this.updateRacingState.bind(this);
  }

 componentDidMount() {
  const touchEventCatch = {};
  const mouseDownEventCatch = {};
  
  document.addEventListener('touchstart', (e) => {
              // Не блокируем скролл внутри модалок
              if (e.target.closest('.modal-content') || e.target.closest('.modal')) {
                return;
              }
    if (e.cancelable && e.preventDefault) e.preventDefault();
  }, { passive: false, capture: true });
  
  document.addEventListener('touchend', (e) => {
                    // Не блокируем скролл внутри модалок
                if (e.target.closest('.modal-content') || e.target.closest('.modal')) {
                  return;
                }
    if (e.cancelable && e.preventDefault) e.preventDefault();
  }, { passive: false, capture: true });
  
  document.addEventListener('gesturestart', (e) => {
    if (e.preventDefault) event.preventDefault();
  });
  
  document.addEventListener('mousedown', (e) => {
    if (e.preventDefault) e.preventDefault();
  }, true);
  
  Object.keys(todo).forEach((key) => {
  if (!this[`dom_${key}`] || !this[`dom_${key}`].dom) return;
  
  const triggerLeaderboard = (score) => {
    if (key !== 'l') return;
    if (this.props.showLeaderboard) {
      this.props.showLeaderboard(score);
    }
  };
  
  // ===== MOUSEDOWN =====
  this[`dom_${key}`].dom.addEventListener('mousedown', (e) => {
    var eventKey = (key === 'rotate') ? 'up' : key;
    window.dispatchEvent(new CustomEvent('gameControl', {
      detail: { key: eventKey, action: 'down' }
    }));
    if (window._isRacingActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (touchEventCatch[key] === true) return;
    todo[key].down(store);
    mouseDownEventCatch[key] = true;
  }, true);
  
  // ===== MOUSEUP =====
  this[`dom_${key}`].dom.addEventListener('mouseup', (e) => {
    var eventKey = (key === 'rotate') ? 'up' : key;
    window.dispatchEvent(new CustomEvent('gameControl', {
      detail: { key: eventKey, action: 'up' }
    }));
    if (window._isRacingActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (touchEventCatch[key] === true) {
      touchEventCatch[key] = false;
      return;
    }
    todo[key].up(store);
    mouseDownEventCatch[key] = false;
    triggerLeaderboard(this.props.max || 0);
  }, true);
  
  this[`dom_${key}`].dom.addEventListener('mouseout', () => {
    if (mouseDownEventCatch[key] === true) todo[key].up(store);
  }, true);
  
  // ===== TOUCHSTART =====
  this[`dom_${key}`].dom.addEventListener('touchstart', (e) => {
    var eventKey = (key === 'rotate') ? 'up' : key;
    window.dispatchEvent(new CustomEvent('gameControl', {
      detail: { key: eventKey, action: 'down' }
    }));
    if (window._isRacingActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    touchEventCatch[key] = true;
    todo[key].down(store);
  }, true);
  
  // ===== TOUCHEND =====
  this[`dom_${key}`].dom.addEventListener('touchend', (e) => {
    var eventKey = (key === 'rotate') ? 'up' : key;
    window.dispatchEvent(new CustomEvent('gameControl', {
      detail: { key: eventKey, action: 'up' }
    }));
    if (window._isRacingActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    todo[key].up(store);
    triggerLeaderboard(this.props.max || 0);
  }, true);
});
  
   
  // Слушаем события открытия и закрытия гонок
  window.addEventListener('openRacing', function() {
    setTimeout(function() {
      this.updateRacingState();
    }.bind(this), 50);
  }.bind(this));
  
  window.addEventListener('gameClosed', function() {
    this.updateRacingState();
  }.bind(this));
  
  window.addEventListener('openMenu', function() {
    this.updateRacingState();
  }.bind(this));
  
  window._updateKeyboard = function() {
    this.updateRacingState();
  }.bind(this);

  // ========== КНОПКА MODE ==========
  if (this.dom_mode && this.dom_mode.dom) {
    const modeKey = 'mode';
    
    this.dom_mode.dom.addEventListener('mousedown', (e) => {
      if (todo[modeKey] && todo[modeKey].down) {
        todo[modeKey].down(store);
      }
    }, true);
    
    this.dom_mode.dom.addEventListener('mouseup', (e) => {
      if (todo[modeKey] && todo[modeKey].up) {
        todo[modeKey].up(store);
      }
    }, true);
    
    this.dom_mode.dom.addEventListener('touchstart', (e) => {
      if (todo[modeKey] && todo[modeKey].down) {
        todo[modeKey].down(store);
      }
    }, true);
    
    this.dom_mode.dom.addEventListener('touchend', (e) => {
      if (todo[modeKey] && todo[modeKey].up) {
        todo[modeKey].up(store);
      }
    }, true);
  }
}

componentWillUnmount() {
  // Очищаем функцию обновления
  window._updateKeyboard = null;
}
  updateRacingState() {
    var isActive = window._isRacingActive || false;
    this.setState({ isRacingActive: isActive });
  }

  shouldComponentUpdate({ keyboard, filling }, nextState) {
    return !Immutable.is(keyboard, this.props.keyboard) ||
      filling !== this.props.filling ||
      nextState.showLeaderboard !== this.state.showLeaderboard ||
      nextState.loadingStatus !== this.state.loadingStatus ||
      nextState.isRacingActive !== this.state.isRacingActive;
  }

  render() {
    const keyboard = this.props.keyboard;
    const menuLabel = i18n.menu ? i18n.menu[lan] : 'Меню';
    const isRacingActive = this.state.isRacingActive;
    
    return (
      <div
        className={style.keyboard}
        style={{ marginTop: 20 + this.props.filling, position: 'relative' }}
      >
        {/* Кнопки приставки */}
        <Button
          color="green"
          size="s2"
          top={0}
          left={16}
          label={i18n.pause ? i18n.pause[lan] : 'Пауза'}
          active={keyboard.get('pause')}
          ref={(c) => { this.dom_p = c; }}
          disabled={isRacingActive}
        />
        <Button
          color="green"
          size="s2"
          top={0}
          left={106}
          label={i18n.sound ? i18n.sound[lan] : 'Звук'}
          active={keyboard.get('music')}
          ref={(c) => { this.dom_s = c; }}
          disabled={isRacingActive} 
        />
        <Button
          color="red"
          size="s2"
          top={0}
          left={196}
          label={i18n.reset ? i18n.reset[lan] : 'Сброс'}
          active={keyboard.get('reset')}
          ref={(c) => { this.dom_r = c; }}
          disabled={isRacingActive}
        />
        <Button
          color="yellow"
          size="s2"
          top={0}
          left={286}
          label={menuLabel}
          active={keyboard.get('leaderboard')}
          ref={(c) => { this.dom_l = c; }}
        />
        
        {/* Кнопки движений */}
        <Button
          color="blue"
          size="s1"
          top={0}
          left={374}
          label={i18n.rotation ? i18n.rotation[lan] : 'Поворот'}
          arrow="translate(0, 63px)"
          position
          active={keyboard.get('rotate')}
          ref={(c) => { this.dom_rotate = c; }}
        />
        <Button
          color="blue"
          size="s1"
          top={180}
          left={374}
          label={i18n.down[lan]}
          arrow="translate(0,-71px) rotate(180deg)"
          active={keyboard.get('down')}
          ref={(c) => { this.dom_down = c; }}
        />
        <Button
          color="blue"
          size="s1"
          top={90}
          left={284}
          label={i18n.left[lan]}
          arrow="translate(60px, -12px) rotate(270deg)"
          active={keyboard.get('left')}
          ref={(c) => { this.dom_left = c; }}
        />
        <Button
          color="blue"
          size="s1"
          top={90}
          left={464}
          label={i18n.right[lan]}
          arrow="translate(-60px, -12px) rotate(90deg)"
          active={keyboard.get('right')}
          ref={(c) => { this.dom_right = c; }}
        />
        <Button
          color="blue"
          size="s0"
          top={100}
          left={52}
          label={i18n.drop ? i18n.drop[lan] : 'Уронить'}
          active={keyboard.get('drop')}
          ref={(c) => { this.dom_space = c; }}
           disabled={isRacingActive} 
        />
      </div>
    );
  }
}

Keyboard.propTypes = {
  filling: propTypes.number.isRequired,
  keyboard: propTypes.object.isRequired,
  invite: propTypes.bool,
  showLeaderboard: propTypes.func,
  mode: propTypes.bool,
};