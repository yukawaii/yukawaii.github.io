// src/unit/collections.js - ВЕСЬ ФАЙЛ

var COLLECTIONS_KEY = 'tetris_collections';

// Конфигурация коллекций
var COLLECTIONS_CONFIG = {
  blocks: {
    id: 'blocks',
    name: { ru: 'Блоки', en: 'Blocks' },
    icon: '🧱',
    path: 'blocks',
    count: 50,
    unlockOrder: 1
  },
  animals: {
    id: 'animals',
    name: { ru: 'Животные', en: 'Animals' },
    icon: '🐾',
    path: 'animals',
    count: 50,
    unlockOrder: 2
  },
  plants: {
    id: 'plants', 
    name: { ru: 'Растения', en: 'Plants' },
    icon: '🌿',
    path: 'plants',
    count: 50,
    unlockOrder: 3
  },
  cos: {
    id: 'cos',
    name: { ru: 'Космос', en: 'Cosmos' },
    icon: '🚀',
    path: 'cos',
    count: 50,
    unlockOrder: 4
  }
};

var ITEM_PRICE = 300;

// Загрузка данных коллекций
function loadCollectionsData() {
  try {
    var saved = localStorage.getItem(COLLECTIONS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch(e) {}
  return {};
}

// Сохранение данных коллекций
function saveCollectionsData(data) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(data));
  
  if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
    vkBridge.send('VKWebAppStorageSet', {
      key: COLLECTIONS_KEY,
      value: JSON.stringify(data)
    }).catch(function(err) {
      console.warn('⚠️ Ошибка сохранения коллекций в VK Storage:', err);
    });
  }
}

// Загрузка из VK Storage
function loadCollectionsFromVK() {
  return new Promise(function(resolve) {
    var localData = loadCollectionsData();
    
    if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
      vkBridge.send('VKWebAppStorageGet', { keys: [COLLECTIONS_KEY] })
        .then(function(data) {
          var vkData = {};
          if (data && data.keys && data.keys.length > 0 && data.keys[0].value) {
            try {
              vkData = JSON.parse(data.keys[0].value);
            } catch(e) {}
          }
          
          var merged = {};
          for (var key in localData) {
            if (localData.hasOwnProperty(key)) {
              merged[key] = localData[key];
            }
          }
          for (var key in vkData) {
            if (vkData.hasOwnProperty(key)) {
              merged[key] = vkData[key];
            }
          }
          
          saveCollectionsData(merged);
          resolve(merged);
        })
        .catch(function() {
          resolve(localData);
        });
    } else {
      resolve(localData);
    }
  });
}

// Получить статус коллекции
function getCollectionStatus(collectionId) {
  var data = loadCollectionsData();
  var collection = data[collectionId] || { items: {} };
  var config = COLLECTIONS_CONFIG[collectionId];
  
  var unlockedCount = 0;
  for (var i = 1; i <= config.count; i++) {
    if (collection.items[i]) unlockedCount++;
  }
  
  var isUnlocked = false;
  var order = config.unlockOrder;
  if (order === 1) {
    isUnlocked = true;
  } else {
    var prevUnlocked = true;
    for (var key in COLLECTIONS_CONFIG) {
      if (COLLECTIONS_CONFIG.hasOwnProperty(key) && COLLECTIONS_CONFIG[key].unlockOrder < order) {
        var prevData = data[key] || { items: {} };
        var prevCount = 0;
        var prevConfig = COLLECTIONS_CONFIG[key];
        for (var j = 1; j <= prevConfig.count; j++) {
          if (prevData.items[j]) prevCount++;
        }
        if (prevCount < prevConfig.count) {
          prevUnlocked = false;
          break;
        }
      }
    }
    isUnlocked = prevUnlocked;
  }
  
  return {
    id: collectionId,
    config: config,
    unlockedCount: unlockedCount,
    totalCount: config.count,
    isUnlocked: isUnlocked,
    isComplete: unlockedCount === config.count,
    items: collection.items || {}
  };
}

// Получить все коллекции
function getAllCollections() {
  var result = {};
  for (var key in COLLECTIONS_CONFIG) {
    if (COLLECTIONS_CONFIG.hasOwnProperty(key)) {
      result[key] = getCollectionStatus(key);
    }
  }
  return result;
}

// Купить предмет
// src/unit/collections.js - функция buyItem

function buyItem(collectionId, itemIndex) {
  var data = loadCollectionsData();
  if (!data[collectionId]) {
    data[collectionId] = { items: {} };
  }
  
  if (data[collectionId].items[itemIndex]) {
    return { success: false, error: 'already_unlocked' };
  }
  
  // ✅ Проверяем достаточно ли очков
  var totalScore = parseInt(localStorage.getItem('tetris_total_score'), 10) || 0;
  if (totalScore < ITEM_PRICE) {
    return { success: false, error: 'not_enough_points' };
  }
    // Открываем предмет
  data[collectionId].items[itemIndex] = {
    unlocked: true,
    date: Date.now()
  };  
  // ✅ СПИСЫВАЕМ очки
  var newTotal = totalScore - ITEM_PRICE;
  localStorage.setItem('tetris_total_score', String(newTotal));
    // ✅ Сохраняем в VK Storage сразу (синхронизация)
  saveTotalScoreToVK(newTotal);  
  saveCollectionsData(data);  
  // Отправляем событие обновления счета
if (typeof window !== 'undefined' && window.dispatchEvent) {
  window.dispatchEvent(new Event('scoreUpdated'));
}
  return { 
    success: true, 
    item: data[collectionId].items[itemIndex],
    totalScore: newTotal
  };
}

// Добавляем функцию для сохранения в VK Storage
function saveTotalScoreToVK(score) {
  if (typeof vkBridge !== 'undefined' && window.vkInitialized) {
    vkBridge.send('VKWebAppStorageSet', {
      key: 'tetris_total_score',
      value: String(score)
    }).catch(function(err) {
      console.warn('⚠️ Ошибка сохранения общего счета в VK Storage:', err);
    });
  }
}

// Форматирование числа
function formatScore(number) {
  var num = parseInt(number, 10);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

// ===== ЭКСПОРТЫ ДЛЯ COMMONJS =====
module.exports = {
  COLLECTIONS_CONFIG: COLLECTIONS_CONFIG,
  ITEM_PRICE: ITEM_PRICE,
  loadCollectionsData: loadCollectionsData,
  saveCollectionsData: saveCollectionsData,
  loadCollectionsFromVK: loadCollectionsFromVK,
  getCollectionStatus: getCollectionStatus,
  getAllCollections: getAllCollections,
  buyItem: buyItem,
  formatScore: formatScore
};