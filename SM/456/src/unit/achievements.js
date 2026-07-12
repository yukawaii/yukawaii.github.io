// src/unit/achievements.js
var store = require('../store').default || require('../store');
var actions = require('../actions').default || require('../actions');
var achievementStylesAdded = false;

// ===== КЛЮЧИ ДЛЯ ХРАНЕНИЯ =====
var ACHIEVEMENTS_STORAGE_KEY = 'tetris_achievements';
var TOTAL_SCORE_KEY = 'tetris_total_score';

// ===== КЛЮЧИ ДЛЯ СЧЕТЧИКОВ =====
var ARCADE_SCORE_KEY = 'arcade_total_score';
var ARCADES_PLAYED_KEY = 'arcades_played';
var BONUS_COUNT_KEY = 'bonus_count';
var COLLECTIONS_COUNT_KEY = 'collections_count';
var SCROLLS_BOUGHT_KEY = 'scrolls_bought';
var SCROLLS_READ_KEY = 'scrolls_read';

// ===== ФУНКЦИИ ДЛЯ СЧЕТЧИКОВ С СИНХРОНИЗАЦИЕЙ =====

// Загрузка счетчика из VK Storage
function loadCounter(key) {
  return new Promise(function(resolve) {
    var localValue = parseInt(localStorage.getItem(key), 10) || 0;
    
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageGet', { keys: [key] })
        .then(function(data) {
          var vkValue = 0;
          if (data && data.keys && data.keys.length > 0 && data.keys[0].value) {
            vkValue = parseInt(data.keys[0].value, 10) || 0;
          }
          var total = Math.max(localValue, vkValue);
          localStorage.setItem(key, String(total));
          resolve(total);
        })
        .catch(function() {
          resolve(localValue);
        });
    } else {
      resolve(localValue);
    }
  });
}

// Сохранение счетчика в VK Storage (только если больше)
function saveCounter(key, value) {
  var current = parseInt(localStorage.getItem(key), 10) || 0;
  if (value <= current) return;
  
  localStorage.setItem(key, String(value));
  
  if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
    vkBridge.send('VKWebAppStorageSet', {
      key: key,
      value: String(value)
    }).catch(function(err) {
      console.warn('⚠️ Ошибка сохранения счетчика ' + key + ':', err);
    });
  }
}

// Увеличение счетчика
function incrementCounter(key, amount) {
  amount = amount || 1;
  var current = parseInt(localStorage.getItem(key), 10) || 0;
  var newValue = current + amount;
  saveCounter(key, newValue);
  return newValue;
}

// Получение значения счетчика
function getCounter(key) {
  return parseInt(localStorage.getItem(key), 10) || 0;
}

// ===== СПИСОК ДОСТИЖЕНИЙ =====
var ACHIEVEMENTS = [
  {
    id: 1,
    key: 'first_game',
    icon: '🎮',
    name: { ru: 'Первый шаг', en: 'First Step' },
    desc: { ru: 'Сыграть первую партию', en: 'Play your first game' },
    check: function(state) { return state.get('points') > 0; }
  },
  {
    id: 2,
    key: 'score_100',
    icon: '🌟',
    name: { ru: '100 очков', en: '100 Points' },
    desc: { ru: 'Набрать 100 очков', en: 'Score 100 points' },
    check: function(state) { return state.get('points') >= 100; }
  },
  {
    id: 3,
    key: 'score_500',
    icon: '⭐',
    name: { ru: '500 очков', en: '500 Points' },
    desc: { ru: 'Набрать 500 очков', en: 'Score 500 points' },
    check: function(state) { return state.get('points') >= 500; }
  },
  {
    id: 4,
    key: 'score_1000',
    icon: '🏆',
    name: { ru: '1000 очков', en: '1000 Points' },
    desc: { ru: 'Набрать 1000 очков', en: 'Score 1000 points' },
    check: function(state) { return state.get('points') >= 1000; }
  },
  {
    id: 5,
    key: 'clear_10',
    icon: '🧹',
    name: { ru: 'Чистюля', en: 'Cleaner' },
    desc: { ru: 'Очистить 10 линий', en: 'Clear 10 lines' },
    check: function(state) { return state.get('clearLines') >= 10; }
  },
  {
    id: 6,
    key: 'clear_50',
    icon: '✨',
    name: { ru: 'Профи', en: 'Pro' },
    desc: { ru: 'Очистить 50 линий', en: 'Clear 50 lines' },
    check: function(state) { return state.get('clearLines') >= 50; }
  },
  {
    id: 7,
    key: 'clear_100',
    icon: '👑',
    name: { ru: 'Мастер', en: 'Master' },
    desc: { ru: 'Очистить 100 линий', en: 'Clear 100 lines' },
    check: function(state) { return state.get('clearLines') >= 100; }
  },
  {
    id: 8,
    key: 'level_5',
    icon: '🚀',
    name: { ru: 'Выше только небо', en: 'Sky\'s the limit' },
    desc: { ru: 'Достичь 5 уровня', en: 'Reach level 5' },
    check: function(state) { return state.get('speedRun') >= 5; }
  },
  {
    id: 9,
    key: 'tetra_mode',
    icon: '🔷',
    name: { ru: 'Режим ТЕТРА', en: 'TETRA Mode' },
    desc: { ru: 'Сыграть в режиме ТЕТРА', en: 'Win in TETRA mode' },
    check: function(state) {
      return window.currentGameMode === 'tetra' && state.get('points') > 0;
    }
  },
  {
    id: 10,
    key: 'classic_mode',
    icon: '🔶',
    name: { ru: 'Классический режим', en: 'Classic Mode' },
    desc: { ru: 'Сыграть в классическом режиме', en: 'Win in Classic mode' },
    check: function(state) {
      return window.currentGameMode === 'classic' && state.get('points') > 0;
    }
  },
  {
    id: 11,
    key: 'score_2000',
    icon: '💎',
    name: { ru: '2000 очков', en: '2000 Points' },
    desc: { ru: 'Набрать 2000 очков', en: 'Score 2000 points' },
    check: function(state) { return state.get('points') >= 2000; }
  },
  {
    id: 12,
    key: 'score_5000',
    icon: '👑',
    name: { ru: '5000 очков', en: '5000 Points' },
    desc: { ru: 'Набрать 5000 очков', en: 'Score 5000 points' },
    check: function(state) { return state.get('points') >= 5000; }
  },
  {
    id: 13,
    key: 'record_10000',
    icon: '🏆',
    name: { ru: 'Легенда', en: 'Legend' },
    desc: { ru: 'Установить рекорд 10000 очков', en: 'Set a record of 10000 points' },
    check: function(state) { return state.get('max') >= 10000; }
  },
  {
    id: 14,
    key: 'clear_200',
    icon: '🧹',
    name: { ru: 'Мастер очистки', en: 'Master Cleaner' },
    desc: { ru: 'Очистить 200 линий', en: 'Clear 200 lines' },
    check: function(state) { return state.get('clearLines') >= 200; }
  },
  {
    id: 15,
    key: 'level_10',
    icon: '🚀',
    name: { ru: 'Космическая скорость', en: 'Cosmic Speed' },
    desc: { ru: 'Достичь 10 уровня', en: 'Reach level 10' },
    check: function(state) { return state.get('speedRun') >= 10; }
  },
  {
    id: 16,
    key: 'tetra_master',
    icon: '⭐',
    name: { ru: 'Мастер ТЕТРА', en: 'TETRA Master' },
    desc: { ru: 'В режиме ТЕТРА набрать 1000 очков и очистить 50 линий', en: 'In TETRA mode score 1000 and clear 50 lines' },
    check: function(state) {
      return window.currentGameMode === 'tetra' && 
             state.get('points') >= 1000 && 
             state.get('clearLines') >= 50;
    }
  },
  {
    id: 17,
    key: 'classic_master',
    icon: '⭐',
    name: { ru: 'Мастер классики', en: 'Classic Master' },
    desc: { ru: 'В классическом режиме набрать 1000 очков и очистить 50 линий', en: 'In Classic mode score 1000 and clear 50 lines' },
    check: function(state) {
      return window.currentGameMode === 'classic' && 
             state.get('points') >= 1000 && 
             state.get('clearLines') >= 50;
    }
  },
  {
    id: 18,
    key: 'bonus_50',
    icon: '💎',
    name: { ru: 'Бонусный охотник', en: 'Bonus Hunter' },
    desc: { ru: 'Получить бонус 50 раз', en: 'Get bonus 50 times' },
    check: function(state) {
      var bonusCount = parseInt(localStorage.getItem('bonus_count'), 10) || 0;
      return bonusCount >= 50;
    }
  },
  {
    id: 19,
    key: 'arcade_1000',
    icon: '🎯',
    name: { ru: 'Аркадный боец', en: 'Arcade Fighter' },
    desc: { ru: 'Заработать 1000 очков в аркадах', en: 'Earn 1000 points in arcades' },
    check: function(state) {
      var arcadeScore = parseInt(localStorage.getItem('arcade_total_score'), 10) || 0;
      return arcadeScore >= 1000;
    }
  },
  {
    id: 20,
    key: 'arcade_5000',
    icon: '🏆',
    name: { ru: 'Король аркад', en: 'Arcade King' },
    desc: { ru: 'Заработать 5000 очков в аркадах', en: 'Earn 5000 points in arcades' },
    check: function(state) {
      var arcadeScore = parseInt(localStorage.getItem('arcade_total_score'), 10) || 0;
      return arcadeScore >= 5000;
    }
  },
  {
    id: 21,
    key: 'play_all_arcades',
    icon: '🎮',
    name: { ru: 'Игроман', en: 'Gamer' },
    desc: { ru: 'Сыграть во все доступные аркады', en: 'Play all available arcades' },
    check: function(state) {
      var played = JSON.parse(localStorage.getItem('arcades_played') || '{}');
      var allArcades = ['racing', 'snake', 'pong', 'arkanoid'];
      for (var i = 0; i < allArcades.length; i++) {
        if (!played[allArcades[i]]) return false;
      }
      return true;
    }
  },
  {
    id: 22,
    key: 'collect_10',
    icon: '🖼️',
    name: { ru: 'Начинающий коллекционер', en: 'Beginner Collector' },
    desc: { ru: 'Купить 10 экспонатов в коллекциях', en: 'Buy 10 collection items' },
    check: function(state) {
      var collections = JSON.parse(localStorage.getItem('tetris_collections') || '{}');
      var total = 0;
      for (var key in collections) {
        if (collections.hasOwnProperty(key)) {
          var items = collections[key].items || {};
          for (var item in items) {
            if (items.hasOwnProperty(item) && items[item].unlocked) {
              total++;
            }
          }
        }
      }
      return total >= 10;
    }
  },
  {
    id: 23,
    key: 'collect_50',
    icon: '🏛️',
    name: { ru: 'Коллекционер', en: 'Collector' },
    desc: { ru: 'Купить 50 экспонатов в коллекциях', en: 'Buy 50 collection items' },
    check: function(state) {
      var collections = JSON.parse(localStorage.getItem('tetris_collections') || '{}');
      var total = 0;
      for (var key in collections) {
        if (collections.hasOwnProperty(key)) {
          var items = collections[key].items || {};
          for (var item in items) {
            if (items.hasOwnProperty(item) && items[item].unlocked) {
              total++;
            }
          }
        }
      }
      return total >= 50;
    }
  },
  {
    id: 24,
    key: 'collect_100',
    icon: '👑',
    name: { ru: 'Мастер-коллекционер', en: 'Master Collector' },
    desc: { ru: 'Купить 100 экспонатов в коллекциях', en: 'Buy 100 collection items' },
    check: function(state) {
      var collections = JSON.parse(localStorage.getItem('tetris_collections') || '{}');
      var total = 0;
      for (var key in collections) {
        if (collections.hasOwnProperty(key)) {
          var items = collections[key].items || {};
          for (var item in items) {
            if (items.hasOwnProperty(item) && items[item].unlocked) {
              total++;
            }
          }
        }
      }
      return total >= 100;
    }
  },
  {
    id: 25,
    key: 'scrolls_10',
    icon: '📜',
    name: { ru: 'Любопытный читатель', en: 'Curious Reader' },
    desc: { ru: 'Купить 10 свитков', en: 'Buy 10 scrolls' },
    check: function(state) {
      var scrolls = JSON.parse(localStorage.getItem('tetris_scrolls') || '{}');
      var count = 0;
      for (var key in scrolls.unlocked) {
        if (scrolls.unlocked.hasOwnProperty(key)) {
          count++;
        }
      }
      return count >= 10;
    }
  },
  {
    id: 26,
    key: 'scrolls_50',
    icon: '📚',
    name: { ru: 'Книжный червь', en: 'Bookworm' },
    desc: { ru: 'Купить 50 свитков', en: 'Buy 50 scrolls' },
    check: function(state) {
      var scrolls = JSON.parse(localStorage.getItem('tetris_scrolls') || '{}');
      var count = 0;
      for (var key in scrolls.unlocked) {
        if (scrolls.unlocked.hasOwnProperty(key)) {
          count++;
        }
      }
      return count >= 50;
    }
  },
  {
    id: 27,
    key: 'read_10',
    icon: '👀',
    name: { ru: 'Внимательный читатель', en: 'Attentive Reader' },
    desc: { ru: 'Прочитать 20 свитков', en: 'Read 20 scrolls' },
    check: function(state) {
      var scrolls = JSON.parse(localStorage.getItem('tetris_scrolls') || '{}');
      var count = 0;
      for (var key in scrolls.read) {
        if (scrolls.read.hasOwnProperty(key)) {
          count++;
        }
      }
      return count >= 20;
    }
  },
  {
    id: 28,
    key: 'read_50',
    icon: '🧠',
    name: { ru: 'Эрудит', en: 'Erudite' },
    desc: { ru: 'Прочитать 50 свитков', en: 'Read 50 scrolls' },
    check: function(state) {
      var scrolls = JSON.parse(localStorage.getItem('tetris_scrolls') || '{}');
      var count = 0;
      for (var key in scrolls.read) {
        if (scrolls.read.hasOwnProperty(key)) {
          count++;
        }
      }
      return count >= 50;
    }
  },
  {
    id: 29,
    key: 'bonus_10',
    icon: '🎁',
    name: { ru: 'Любитель бонусов', en: 'Bonus Lover' },
    desc: { ru: 'Получить бонус 10 раз', en: 'Get bonus 10 times' },
    check: function(state) {
      var bonusCount = parseInt(localStorage.getItem('bonus_count'), 10) || 0;
      return bonusCount >= 10;
    }
  }
];

// ===== ЗАГРУЗКА ДОСТИЖЕНИЙ =====
function loadAchievements(retries) {
  retries = retries || 2; // число попыток
  console.log('🔥 loadAchievements ВЫЗВАН! (попытка ' + (3 - retries) + ')');

  return new Promise(function(resolve) {
    var localAchievements = {};
    try {
      var saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (saved) {
        localAchievements = JSON.parse(saved);
        console.log('📀 Локальные достижения:', Object.keys(localAchievements).length);
      }
    } catch(e) {
      console.warn('Ошибка загрузки локальных достижений:', e);
    }

    // Если VK не инициализирован – сразу возвращаем локальные
    if (typeof vkBridge === 'undefined' || !window.vkInitialized) {
      console.warn('⚠️ VK Bridge не инициализирован, используем локальные данные');
      resolve(localAchievements);
      return;
    }

    vkBridge.send('VKWebAppStorageGet', { keys: [ACHIEVEMENTS_STORAGE_KEY] })
      .then(function(data) {
        console.log('💾 Ответ VK Storage (достижения):', data);
        var vkAchievements = {};
        if (data && data.keys && data.keys.length > 0 && data.keys[0].value) {
          try {
            vkAchievements = JSON.parse(data.keys[0].value);
            console.log('💾 VK Storage достижения:', Object.keys(vkAchievements).length);
          } catch(e) {
            console.warn('Ошибка парсинга достижений из VK:', e);
          }
        }

        // Объединяем: локальные + VK (VK дополняет)
        var merged = {};
        for (var key in localAchievements) {
          if (localAchievements.hasOwnProperty(key)) {
            merged[key] = localAchievements[key];
          }
        }
        for (var key in vkAchievements) {
          if (vkAchievements.hasOwnProperty(key)) {
            merged[key] = vkAchievements[key];
          }
        }

        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(merged));
        console.log('✅ Достижения загружены:', Object.keys(merged).length);
        resolve(merged);
      })
      .catch(function(err) {
        console.warn('⚠️ Ошибка загрузки достижений из VK Storage:', err);
        // Если есть попытки – повторяем
        if (retries > 0) {
          console.log('🔄 Повторная попытка загрузки...');
          loadAchievements(retries - 1).then(resolve);
        } else {
          // Если попытки кончились – возвращаем локальные
          resolve(localAchievements);
        }
      });
  });
}

// ===== СОХРАНЕНИЕ ДОСТИЖЕНИЙ =====
function saveAchievements(achievements) {
 console.log('🔥 saveAchievements ВЫЗВАН!');
  
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
   console.log('📀 Достижения сохранены локально:', Object.keys(achievements).length);
  } catch(e) {
   console.warn('Ошибка сохранения локальных достижений:', e);
  }
  
  if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
    vkBridge.send('VKWebAppStorageSet', {
      key: ACHIEVEMENTS_STORAGE_KEY,
      value: JSON.stringify(achievements)
    })
    .then(function() {
    console.log('✅ Достижения сохранены в VK Storage');
    })
    .catch(function(err) {
     console.warn('⚠️ Ошибка сохранения достижений в VK Storage:', err);
    });
  }
}

// ===== ПРОВЕРКА ДОСТИЖЕНИЙ (С СИНХРОНИЗАЦИЕЙ СЧЕТЧИКОВ) =====
function checkAchievements() {
 // console.log('🔥 checkAchievements ВЫЗВАН!');
  
  // Сначала синхронизируем все счетчики
  var counters = [
    ARCADE_SCORE_KEY,
    BONUS_COUNT_KEY,
    COLLECTIONS_COUNT_KEY,
    SCROLLS_BOUGHT_KEY,
    SCROLLS_READ_KEY
  ];
  
  var promises = counters.map(function(key) {
    return loadCounter(key);
  });
  
  return Promise.all(promises).then(function() {
    var state = store.getState ? store.getState() : store.getState();
    var unlocked = {};
    
    try {
      var saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (saved) {
        unlocked = JSON.parse(saved);
      }
    } catch(e) {}
    
    var newUnlocked = [];
    var changed = false;
    
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var ach = ACHIEVEMENTS[i];
      if (!unlocked[ach.key] && ach.check(state)) {
        unlocked[ach.key] = {
          unlocked: true,
          date: Date.now()
        };
        newUnlocked.push(ach);
        changed = true;
      //  console.log('🎉 НОВОЕ ДОСТИЖЕНИЕ:', ach.key);
      }
    }
    
    if (changed) {
      saveAchievements(unlocked);
      
      if (newUnlocked.length > 0) {
        showAchievementNotification(newUnlocked);
      }
    }
    
    return { unlocked: unlocked, newUnlocked: newUnlocked };
  });
}

// ===== ПОКАЗАТЬ УВЕДОМЛЕНИЕ =====
var notificationTimeout = null;

function showAchievementNotification(achievements) {
  var oldNotifications = document.querySelectorAll('.achievement-notification');
  for (var i = 0; i < oldNotifications.length; i++) {
    oldNotifications[i].remove();
  }
  
  clearTimeout(notificationTimeout);
  
  if (!achievementStylesAdded) {
    var styleEl = document.createElement('style');
    styleEl.id = 'achievement-styles';
    styleEl.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes fadeOutUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    achievementStylesAdded = true;
  }
  
  for (var i = 0; i < achievements.length; i++) {
    (function(index) {
      setTimeout(function() {
        var ach = achievements[index];
        var div = document.createElement('div');
        div.className = 'achievement-notification';
        div.style.cssText = 
          'position: fixed; ' + 'top: ' + (5 + index * 90) + 'px; ' + 'left: 50%; ' +
          'transform: translateX(-50%); ' +
          'background: #ffd700; border: 3px solid #b8960f; border-radius: 12px; ' +
          'padding: 15px 25px; z-index: 10000; font-family: "Courier New", monospace; ' +
          'box-shadow: 0 4px 20px rgba(0,0,0,0.4); animation: slideDown 0.5s ease; ' +
          'max-width: 300px; display: flex; align-items: center; gap: 12px;';
        
        div.innerHTML = 
          '<span style="font-size: 34px;">' + ach.icon + '</span>' +
          '<div>' +
            '<div style="font-weight: bold; font-size: 18px; color: #2c2c2c;">Новое достижение!</div>' +
            '<div style="font-size: 16px; color: #2c2c2c;">' + ach.name.ru + '</div>' +
          '</div>';
 
        document.body.appendChild(div);
        
        setTimeout(function() {
          div.style.animation = 'fadeOutRight 0.5s ease';
          setTimeout(function() {
            if (div.parentNode) div.remove();
          }, 500);
        }, 3000);
      }, i * 300);
    })(i);
  }
}

// ===== ПОЛУЧЕНИЕ СПИСКА ДОСТИЖЕНИЙ =====
function getAchievementsWithStatus() {
  var unlocked = {};
  try {
    var saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (saved) {
      unlocked = JSON.parse(saved);
    }
  } catch(e) {}
  
  var result = [];
  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var ach = ACHIEVEMENTS[i];
    result.push({
      id: ach.id,
      key: ach.key,
      icon: ach.icon,
      name: ach.name,
      desc: ach.desc,
      unlocked: !!unlocked[ach.key],
      date: unlocked[ach.key] ? unlocked[ach.key].date : null
    });
  }
  return result;
}

// ===== СИНХРОНИЗАЦИЯ ДОСТИЖЕНИЙ =====
function syncAchievements() {
  return loadAchievements().then(function(unlocked) {
    var state = store.getState ? store.getState() : store.getState();
    var changed = false;
    
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var ach = ACHIEVEMENTS[i];
      if (!unlocked[ach.key] && ach.check(state)) {
        unlocked[ach.key] = {
          unlocked: true,
          date: Date.now()
        };
        changed = true;
      //  console.log('🎉 Достижение разблокировано при синхронизации:', ach.key);
      }
    }
    
    if (changed) {
      saveAchievements(unlocked);
    }
    
    return unlocked;
  });
}

// ===== ОБЩИЙ СЧЕТ =====
function loadTotalScore() {
 // console.log('🔥 loadTotalScore ВЫЗВАН!');
  
  return new Promise(function(resolve) {
    var localTotal = parseInt(localStorage.getItem(TOTAL_SCORE_KEY), 10) || 0;
    
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageGet', { keys: [TOTAL_SCORE_KEY] })
        .then(function(data) {
          var vkTotal = 0;
          if (data && data.keys && data.keys.length > 0 && data.keys[0].value) {
            vkTotal = parseInt(data.keys[0].value, 10) || 0;
          }
          var total = vkTotal > 0 ? vkTotal : localTotal;
          localStorage.setItem(TOTAL_SCORE_KEY, String(total));
        //  console.log('📊 Общий счет загружен:', total);
          resolve(total);
        })
        .catch(function(err) {
          console.warn('⚠️ Ошибка загрузки общего счета:', err);
          resolve(localTotal);
        });
    } else {
      resolve(localTotal);
    }
  });
}

export function saveTotalScore(newPoints) {
  // Всегда сохраняем новое значение (без проверки на "больше")
  localStorage.setItem(TOTAL_SCORE_KEY, String(newPoints));
  
  if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
    vkBridge.send('VKWebAppStorageSet', {
      key: TOTAL_SCORE_KEY,
      value: String(newPoints)
    }).catch(function(err) {
      console.warn('⚠️ Ошибка сохранения общего счета:', err);
    });
  }
  return true;
}
function formatScore(number) {
  if (number === 0) return '0';
  
  var num = parseInt(number, 10);
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  
  return String(num);
}

function getTotalScore() {
  return parseInt(localStorage.getItem(TOTAL_SCORE_KEY), 10) || 0;
}

// ===== ЭКСПОРТЫ ДЛЯ COMMONJS =====
module.exports = {
  ACHIEVEMENTS: ACHIEVEMENTS,
  loadAchievements: loadAchievements,
  saveAchievements: saveAchievements,
  checkAchievements: checkAchievements,
  getAchievementsWithStatus: getAchievementsWithStatus,
  syncAchievements: syncAchievements,
  loadTotalScore: loadTotalScore,
  saveTotalScore: saveTotalScore,
  formatScore: formatScore,
  getTotalScore: getTotalScore,
  incrementCounter: incrementCounter,
  getCounter: getCounter,
  loadCounter: loadCounter,
  saveCounter: saveCounter
};