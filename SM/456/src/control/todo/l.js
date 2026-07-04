// control/todo/l.js
import actions from '../../actions';
import states from '../states';

const down = (store) => {
  store.dispatch(actions.keyboard.leaderboard(true));

  const state = store.getState();
  const cur = state.get('cur');
  const isPause = state.get('pause');
  
  // Ставим на паузу БЕЗ рекламы (fromMenu = true)
  if (cur !== null && !isPause) {
    states.pause(true, true); // <-- fromMenu = true, рекламы НЕ будет
  }

  // Открываем меню
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('openMenu'));
  }
};

const up = (store) => {
  store.dispatch(actions.keyboard.leaderboard(false));
};

export default {
  down,
  up,
};