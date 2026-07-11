// control/index.js
import store from '../store';
import todo from './todo';

const keyboard = {
  37: 'left',
  38: 'rotate',
  39: 'right',
  40: 'down',
  32: 'space',
  83: 's',
  82: 'r',
  80: 'p',
  76: 'l',
};

let keydownActive;

const boardKeys = Object.keys(keyboard).map(e => parseInt(e, 10));

const keyDown = (e) => {
  // Если гонки активны - передаем управление в гонки, а не блокируем
  if (window._isRacingActive) {
    // Отправляем событие для гонок
    var keyMap = {
      37: 'left',
      39: 'right',
      27: 'escape'
    };
    var gameKey = keyMap[e.keyCode];
    if (gameKey) {
      window.dispatchEvent(new CustomEvent('gameControl', {
        detail: { key: gameKey, action: 'down' }
      }));
      e.preventDefault();
      e.stopPropagation();
    }
    // Остальные клавиши (пробел, и т.д.) - игнорируем
    return;
  }

  if (e.metaKey === true || boardKeys.indexOf(e.keyCode) === -1) {
    return;
  }
  e.preventDefault();
  
  const type = keyboard[e.keyCode];
  
  if (type === keydownActive) {
    return;
  }
  keydownActive = type;
  todo[type].down(store);
  
  // Для L открываем меню
  if (e.keyCode === 76) {
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('openMenu'));
    }
  }
};

const keyUp = (e) => {
  // Если гонки активны - передаем управление в гонки
  if (window._isRacingActive) {
    var keyMap = {
      37: 'left',
      39: 'right',
      27: 'escape',
      38: 'up',      
    40: 'down',  
    32: 'space',  
    };
    var gameKey = keyMap[e.keyCode];
    if (gameKey) {
      window.dispatchEvent(new CustomEvent('gameControl', {
        detail: { key: gameKey, action: 'up' }
      }));
      e.preventDefault();
      e.stopPropagation();
    }
    return;
  }

  if (e.metaKey === true || boardKeys.indexOf(e.keyCode) === -1) {
    return;
  }
  e.preventDefault();
  
  const type = keyboard[e.keyCode];
  if (type === keydownActive) {
    keydownActive = '';
  }
  todo[type].up(store);
};

document.addEventListener('keydown', keyDown, true);
document.addEventListener('keyup', keyUp, true);