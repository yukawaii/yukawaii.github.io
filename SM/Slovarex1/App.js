var score,id,token, name1;
  window.vkBridge = vkBridge; 
// ====== ПЛАТФОРМА (VK / OK) ======
const __PLATFORM = window.__PLATFORM || {
    isOK: false, isVK: true, platform: 'vk',
    userId: 0, storagePrefix: '', launchParams: {}
};
const STORAGE_PREFIX = __PLATFORM.storagePrefix;   // '' | 'ok_'
const IS_OK_PLATFORM = __PLATFORM.isOK;

  // ====== DEBOUNCE ДЛЯ СИНХРОНИЗАЦИИ ======
let syncTimer = null;
let syncPending = false;


function getid(){
    // Если userId уже известен из launch-параметров (OK) — используем его
    if (__PLATFORM.userId) {
        id = __PLATFORM.userId;
        sessionStorage.setItem("id", id);
        console.log(`✅ UserID из launch-параметров: ${id}`);
        return;
    }
    // Иначе запрашиваем через VK Bridge (работает и на VK, и на OK)
    vkBridge.send("VKWebAppGetUserInfo")
        .then((e) => {
            id = e.id;
            name1 = e.first_name;
            sessionStorage.setItem("id", id);
        })
        .catch(() => {});
}
getid();


  /* function gettoken(){
    vkBridge.send("VKWebAppGetAuthToken", { 
            "app_id": 54634418, 
            "scope": "friends"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for"+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }    
   gettoken();  
    //первичная отправка очков в вк, проверка на 0
    function sendscore0(){        score0=1;        setTimeout(function (){        vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
     {"client_secret":"vTHFnjvA35iL1nEpMSTr",      "user_id":id,      "activity_id":1,       "value":score0,        "v": "5.131",        "global": 1,    "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec",
         }})    .then(data => {console.log("Ответ на первичное добавление очков:" + data);    })    .catch(error => console.log(error)); }, 3000);}
             sendscore0();

//Обычная отправка очков в вк, таблицу лидеров, из игры.
function sendscore(){  sessionStorage.setItem('score',score);  vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
 {"client_secret":"qp47UOdcqJmW94rKknxR",    "user_id":id,  "activity_id":1,   "value":gameState.level,    "v": "5.131",    "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec"}}).then(data => {console.log("Ответ на добавление очков:" + data);}).catch(error => console.log(error)); 
}
 function getsc(){
  getid();
  setTimeout(function (){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "32test", "params":
       {"user_id":id,
         "v": "5.131", 
         "access_token":"f2380f3ff2380f3ff2380f3fcaf179a88dff238f2380f3f98141885cf86ef093e89c993"}})
      .then(data => {console.log(data); score=data.response; console.log("getsc=  "+score); 
      })
      .catch(error => console.log(error)); }, 2000);}
getsc();

    function top0(){
      getsc();
          vkBridge.send("VKWebAppShowLeaderBoardBox", {"app_id": 54634418,"user_result": score, "global":1})
        .then(data => console.log(data.success))  
       .catch(error => console.log(error));
        } */

/*function banner1(){
vkBridge.send('VKWebAppShowBannerAd', {  banner_location: 'bottom'  })
 .then((data) => {     if (data.result) {      // Баннерная реклама отобразилась   
   }  })  .catch((error) => {       console.log(error);
  });}
  banner1(); */

//пригласить друзей
function share2(){
    if (IS_OK_PLATFORM) {
        if (typeof showToast === 'function') showToast('❌ Приглашение друзей недоступно в Одноклассниках', true);
        return;
    }
    vkBridge.send("VKWebAppShowInviteBox", {});
}
function myadd1(){vkBridge.send("VKWebAppShowNativeAds",{ad_format:"interstitial"}).then((t=>{})).catch((t=>{}))}
//пригласить друзей в игру
function infr(){
    if (IS_OK_PLATFORM) {
        if (typeof showToast === 'function') showToast('❌ Приглашение друзей недоступно в Одноклассниках', true);
        return;
    }
    vkBridge.send("VKWebAppShowInviteBox", {});
}
// ====== VK STORAGE СИНХРОНИЗАЦИЯ ======
const VK_STORAGE_KEYS={
    GALAXY:      STORAGE_PREFIX + "wordgame_galaxy_v2",
    ACHIEVEMENTS: STORAGE_PREFIX + "wordgame_achievements_v2",
    THEME:       STORAGE_PREFIX + "wordgame_theme_v2",
    SOUND:       STORAGE_PREFIX + "wordgame_sound_v2",
    LEVEL:       STORAGE_PREFIX + "wordgame_level_v2",
    HINTS:       STORAGE_PREFIX + "wordgame_hints_v2",
    TOTAL_SCORE: STORAGE_PREFIX + 'wordgame_total_score_v2'
};

// Сохранение данных в VK Storage
function saveToVKStorage(key, value) {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return Promise.resolve();
    }    
    // Просто пытаемся отправить — если мост есть, он сработает
    return vkBridge.send('VKWebAppStorageSet', {
        key: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
    })
    .then(() => {
        console.log(`✅ Сохранено в VK Storage: ${key}`);
    })
    .catch((error) => {
        console.warn(`❌ Ошибка сохранения ${key}:`, error);
    });
}

// Загрузка данных из VK Storage
function loadFromVKStorage(key) {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return Promise.resolve(null);
    }
    
    return vkBridge.send('VKWebAppStorageGet', { keys: [key] })
        .then((data) => {
            console.log(`📥 Загрузка из VK Storage: ${key}`, data);
            
            if (data && data.keys) {
                if (Array.isArray(data.keys) && data.keys.length > 0) {
                    const value = data.keys[0].value;
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value;
                    }
                }
            }
            return null;
         })
        .catch((error) => {
            console.warn(`❌ Ошибка загрузки ${key}:`, error);
            return null;
        });
}

// Полная синхронизация всех данных
function syncAllDataToVK() {
    console.log('🔄 Синхронизация данных с VK Storage...');    
    // Получаем текущие данные
    const galaxy = getGalaxyProgress();
    const achievements = loadAchievements();
    const theme = localStorage.getItem(THEME_KEY) || 'light';
const sound = localStorage.getItem(STORAGE_PREFIX + 'wordgame:v1:sound') || '1';
    const level = gameState ? gameState.level : 1;
    const hints = gameState ? gameState.hintsLeft : CONFIG.HINTS_START;    
     const totalScore = gameState ? gameState.totalScore : 0;
    // Сохраняем ВСЕГДА (даже если 0) — это нормально, потому что мы уже убедились, что локальные данные актуальны
    return Promise.all([
        saveToVKStorage(VK_STORAGE_KEYS.GALAXY, galaxy),
        saveToVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS, achievements),
        saveToVKStorage(VK_STORAGE_KEYS.THEME, theme),
        saveToVKStorage(VK_STORAGE_KEYS.SOUND, sound),
        saveToVKStorage(VK_STORAGE_KEYS.LEVEL, level),   
        saveToVKStorage(VK_STORAGE_KEYS.HINTS, hints),
       saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, totalScore)
    ]).then(() => {
        console.log('✅ Полная синхронизация завершена');
    }).catch((error) => {
        console.warn('⚠️ Ошибка синхронизации:', error);
    });
}

// Загрузка всех данных из VK Storage
function loadAllDataFromVK() {
    console.log('🔄 Загрузка данных из VK Storage...');
    
    return Promise.all([
        loadFromVKStorage(VK_STORAGE_KEYS.GALAXY),
        loadFromVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS),
        loadFromVKStorage(VK_STORAGE_KEYS.THEME),
        loadFromVKStorage(VK_STORAGE_KEYS.SOUND),
        loadFromVKStorage(VK_STORAGE_KEYS.LEVEL),   
        loadFromVKStorage(VK_STORAGE_KEYS.HINTS),
         loadFromVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE)  
    ]).then(([galaxyData, achievementsData, themeData, soundData, levelData, hintsData, totalScoreData]) => { // ← ИСПРАВЛЕНО: добавил levelData, hintsData, totalScoreData
        let loaded = false;
      // ====== УРОВЕНЬ: БЕРЁМ МАКСИМУМ ======
        if (levelData !== null && levelData !== undefined) {
            const currentLevel = gameState.level || 1;
            const vkLevel = Number(levelData) || 1;
            if (vkLevel > currentLevel) {
                gameState.level = vkLevel;
                loaded = true;
                console.log(`✅ Уровень обновлён из VK: ${vkLevel} (было ${currentLevel})`);
            } else if (currentLevel > vkLevel) {
                console.log(`📤 Локальный уровень ${currentLevel} выше VK (${vkLevel}), сохраняем...`);
                saveToVKStorage(VK_STORAGE_KEYS.LEVEL, currentLevel);
            }
        }
        
        // ====== ПОДСКАЗКИ ======
        if (hintsData !== null && hintsData !== undefined) {
            const vkHints = Number(hintsData) || CONFIG.HINTS_START;
            gameState.hintsLeft = Math.min(vkHints, CONFIG.HINTS_START * 3);
            loaded = true;
            console.log(`✅ Подсказки загружены из VK: ${gameState.hintsLeft}`);
        }
        
        // ====== ОБЩИЕ ОЧКИ: БЕРЁМ МАКСИМУМ ======
        if (totalScoreData !== null && totalScoreData !== undefined) {
            const currentTotal = gameState.totalScore || 0;
            const vkTotal = Number(totalScoreData) || 0;
            if (vkTotal > currentTotal) {
                gameState.totalScore = vkTotal;
                loaded = true;
                console.log(`✅ Общие очки обновлены из VK: ${vkTotal} (было ${currentTotal})`);
            } else if (currentTotal > vkTotal) {
                console.log(`📤 Локальные очки ${currentTotal} выше VK (${vkTotal}), сохраняем...`);
                saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, currentTotal);
            }
        }
// ====== ГАЛАКТИКА: БЕРЁМ МАКСИМУМ ======
if (galaxyData && galaxyData.totalWords !== undefined) {
    const currentLocal = getGalaxyProgress();    
    // Берём максимум по каждому полю
    const merged = {
        totalWords: Math.max(currentLocal.totalWords || 0, galaxyData.totalWords || 0),
        totalStars: Math.max(currentLocal.totalStars || 0, galaxyData.totalStars || 0),
        stars: Math.max(currentLocal.stars || 0, galaxyData.stars || 0),
        currentMilestone: Math.max(currentLocal.currentMilestone || 0, galaxyData.currentMilestone || 0),
        shownIntro: currentLocal.shownIntro || galaxyData.shownIntro || false,
        lastDailyBonus: currentLocal.lastDailyBonus || galaxyData.lastDailyBonus || null
    };    
    // Объединяем свитки (берём все уникальные)
    const scrollsSet = new Set([...(currentLocal.unlockedScrolls || []), ...(galaxyData.unlockedScrolls || [])]);
    merged.unlockedScrolls = Array.from(scrollsSet);    
    // Проверяем, изменилось ли что-то
    const hasChanges = 
        merged.totalWords !== currentLocal.totalWords ||
        merged.totalStars !== currentLocal.totalStars ||
        merged.unlockedScrolls.length !== (currentLocal.unlockedScrolls || []).length;
    
    if (hasChanges) {
        saveGalaxyProgress(merged);
        loaded = true;
        console.log(`✅ Галактика объединена: ${merged.totalWords} слов, ${merged.totalStars} звёзд, ${merged.unlockedScrolls.length} свитков`);
    } else {
        console.log('ℹ️ Новых данных галактики из VK нет');
    }
}        
        // ====== ДОСТИЖЕНИЯ: ОБЪЕДИНЯЕМ ======
if (achievementsData && typeof achievementsData === 'object') {
    const currentLocal = loadAchievements();
    const merged = { ...currentLocal };
    let mergedCount = Object.keys(merged).length;
    
    // Добавляем все достижения из VK, которых нет локально
    for (const key in achievementsData) {
        if (!merged[key]) {
            merged[key] = achievementsData[key];
            mergedCount++;
            console.log(`🔄 Добавлено достижение из VK: ${key}`);
        }
    }
    
    if (mergedCount > Object.keys(currentLocal).length) {
        saveAchievements(merged);
        loaded = true;
        console.log(`✅ Достижения объединены: ${mergedCount} всего (${Object.keys(currentLocal).length} локально + ${Object.keys(achievementsData).length} из VK)`);
    } else {
        console.log('ℹ️ Новых достижений из VK нет');
    }
}        
        // ====== ТЕМА ======
        if (themeData && typeof themeData === 'string') {
            const localTheme = localStorage.getItem(THEME_KEY) || 'light';
            // Тему всегда загружаем из VK (она не критична)
            localStorage.setItem(THEME_KEY, themeData);
            if (typeof applyTheme === 'function') {
                applyTheme(themeData);
            }
            loaded = true;
            console.log('✅ Тема загружена из VK');
        }        
        // ====== ЗВУК ======
        if (soundData && typeof soundData === 'string') {
       localStorage.setItem(STORAGE_PREFIX + 'wordgame:v1:sound', soundData);
            if (typeof gameState !== 'undefined') {
                gameState.soundEnabled = soundData === '1';
            }
            loaded = true;
            console.log('✅ Звук загружен из VK');
        }        
        if (!loaded) {
            console.log('ℹ️ В VK Storage нет данных или локальные данные новее');
        }        
         // ====== МГНОВЕННОЕ ОБНОВЛЕНИЕ ПОСЛЕ ЗАГРУЗКИ ======
        // Просто вызываем существующие функции (они определены в game.js)
        if (typeof updateTotalScoreInMenu === 'function') {
            updateTotalScoreInMenu();
        }
        if (typeof updateUI === 'function') {
            updateUI();
        }

        console.log('totalScore в localStorage:', localStorage.getItem('wordgame_total_score'));
console.log('galaxy в localStorage:', localStorage.getItem('wordgame_galaxy'));
        // ===============================================
        // ====== ПОСЛЕ ЗАГРУЗКИ — СОХРАНЯЕМ ВСЁ В VK ======
        // Это важно: если локальные данные новее — обновляем VK
        syncAllDataToVK();        
        return loaded;
    }).catch((error) => {
        console.warn('⚠️ Ошибка загрузки из VK:', error);
        return false;
    });

    
}
// Синхронизация при изменении данных
function syncOnChange() {
        // Защита: game.js мог не загрузиться или упасть на top-level
    if (typeof saveGalaxyProgress !== 'function' ||
        typeof saveAchievements   !== 'function' ||
        typeof applyTheme         !== 'function') {
        console.warn('⚠️ syncOnChange: game.js не загружен или упал, синхронизация отложена');
        return;
    }
    // Сохраняем галактику при каждом обновлении
    const originalSave = saveGalaxyProgress;
    saveGalaxyProgress = function(data) {
        originalSave(data);
        // После сохранения локально — синхронизируем с VK
      //  saveToVKStorage(VK_STORAGE_KEYS.GALAXY, data);
        triggerSync();
    };
    
    // Сохраняем достижения при каждом обновлении
    const originalSaveAchievements = saveAchievements;
    saveAchievements = function(data) {
        originalSaveAchievements(data);
       // saveToVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS, data);
        triggerSync();
    };
    
    // Сохраняем тему при изменении
    const originalApplyTheme = applyTheme;
    applyTheme = function(theme) {
        originalApplyTheme(theme);
       // saveToVKStorage(VK_STORAGE_KEYS.THEME, theme);
        triggerSync();
    };
    
    console.log('✅ Авто-синхронизация настроена');
}


// Ручная синхронизация (можно вызвать из консоли)
function manualSync() {
    console.log('🔄 Ручная синхронизация...');
    syncAllDataToVK();
}


// Отладка: показать, что сохранено в VK Storage
function debugVKStorage() {
    console.log('🔍 Проверка VK Storage...');
    Promise.all([
        loadFromVKStorage(VK_STORAGE_KEYS.GALAXY),
        loadFromVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS),
        loadFromVKStorage(VK_STORAGE_KEYS.THEME),
        loadFromVKStorage(VK_STORAGE_KEYS.SOUND)
    ]).then(([galaxy, achievements, theme, sound]) => {
        console.log('📦 Галактика:', galaxy);
        console.log('📦 Достижения:', achievements);
        console.log('📦 Тема:', theme);
        console.log('📦 Звук:', sound);
    });
}

// Сделаем функции доступными из консоли для отладки
window.syncAllDataToVK=syncAllDataToVK,window.loadAllDataFromVK=loadAllDataFromVK,window.debugVKStorage=debugVKStorage,window.manualSync=manualSync;

// ========== ПОДСКАЗКИ С РЕКЛАМОЙ ==========
// ========== ПРЕДЗАГРУЗКА РЕКЛАМЫ ЗА ВОЗНАГРАЖДЕНИЕ ==========
function preloadRewardedAd() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не найден, предзагрузка невозможна');
        return;
    }
    
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    sendMethod.call(vkBridge, 'VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then((data) => {
            if (data && data.result) {
                console.log('✅ Рекламные материалы reward предзагружены');
            } else {
                console.log('⚠️ Рекламные материалы не найдены, запрос отправлен');
            }
        })
        .catch((error) => {
            console.warn('❌ Ошибка предзагрузки рекламы:', error);
        });
}

// Показать рекламу за вознаграждение
function showRewardedAd() {
    if (typeof vkBridge === 'undefined') {
        console.log("ℹ️ VK Bridge не найден");
        return Promise.resolve(false);
    }
    
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    
    // Таймаут 90 сек: 50 сек реклама + 30 сек запас на загрузку/задержки WebView
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            console.warn('⏰ Таймаут 90с ожидания рекламы — считаем неудачей');
            resolve(false);
        }, 90000);
    });
    
    const adPromise = sendMethod.call(vkBridge, "VKWebAppShowNativeAds", { ad_format: "reward" })
        .then((data) => {
            console.log('✅ Реклама показана:', data);
            preloadRewardedAd();
            return !!(data && (data.result === true || data.result === 1 || data.success === true));
        })
        .catch((e) => {
            console.log("❌ Реклама не показана:", e);
            return false;
        });
    
    return Promise.race([adPromise, timeoutPromise]);
}

// Проверка, есть ли подсказки
function checkHintsAndShowAd() {
    if (gameState.hintsLeft > 0) {
        showToast(`💡 У вас есть ${gameState.hintsLeft} подсказок`);
        return;
    }
    
    // Если подсказки кончились — показываем модалку
    const modal = document.getElementById('hintAdModal');
    if (modal) {
        // Ставим игру на паузу
        pauseGame();
        modal.classList.add('show');
    }
}

// Получение подсказок через рекламу
function getHintsViaAd() {
    const modal = document.getElementById('hintAdModal');
    
    // Показываем рекламу
    showRewardedAd().then((success) => {
        if (success) {
            // Реклама просмотрена → 3 подсказки
            gameState.hintsLeft += 3;
            showToast('🎉 +3 подсказки!');
            playSound('levelup');
        } else {
            // Рекламы нет → 1 подсказка
            gameState.hintsLeft += 1;
            showToast('💡 Реклама недоступна, но вы получаете +1 подсказку!');
            playSound('hint');
        }
        // ====== СИНХРОНИЗАЦИЯ ПОДСКАЗОК С VK STORAGE ======
        if (typeof saveToVKStorage === 'function') {
            saveToVKStorage(VK_STORAGE_KEYS.HINTS, gameState.hintsLeft);
            console.log('☁️ Подсказки синхронизированы с VK Storage');
        }       
        // Обновляем интерфейс
        updateUI();
        
        // Закрываем модалку
        if (modal) modal.classList.remove('show');
        
        // Снимаем паузу
        if (gamePaused) {
            resumeGame();
        }
    });
}

// Закрытие модалки без получения подсказок (отмена)
function closeHintAdModal() {
    const modal = document.getElementById('hintAdModal');
    if (modal) modal.classList.remove('show');
    
    // Снимаем паузу
    if (gamePaused) {
        resumeGame();
    }
}

/**
 * Отложенная синхронизация – вызывается не чаще чем раз в 3 секунды.
 * Все изменения, произошедшие за это время, будут отправлены одним пакетом.
 */
function triggerSync() {
    // Если уже есть ожидающий таймер – сбрасываем его
    if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
    // Устанавливаем новый таймер на 3 секунды
    syncTimer = setTimeout(() => {
        syncTimer = null;
        syncPending = false;
        // Выполняем полную синхронизацию
        if (typeof syncAllDataToVK === 'function') {
            console.log('🔄 Debounced sync: отправка данных в VK Storage');
            syncAllDataToVK();
        }
    }, 3000); // 3 секунды – оптимально для большинства сценариев
}

/**
 * Немедленная синхронизация (без debounce) – для критичных моментов
 * (выход из игры, переход на уровень и т.п.)
 */
function immediateSync() {
    if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
    syncPending = false;
    if (typeof syncAllDataToVK === 'function') {
        console.log('⚡ Immediate sync: срочная отправка данных');
        syncAllDataToVK();
    }
}

window.addEventListener('beforeunload', function() {
    // Если есть отложенная синхронизация – выполняем её немедленно
    if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
        if (typeof syncAllDataToVK === 'function') {
            syncAllDataToVK();
        }
    }
});
// Мобильные браузеры надёжнее вызывают pagehide
window.addEventListener('pagehide', function() {
    if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
    if (typeof syncAllDataToVK === 'function') {
        console.log('📱 pagehide → срочная синхронизация');
        syncAllDataToVK();
    }
});

// И на visibilitychange — когда вкладка/приложение уходит в фон
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        if (typeof immediateSync === 'function') {
            console.log('📱 visibilitychange → hidden → синхронизация');
            immediateSync();
        }
    }
});
// ====== ЕДИНАЯ ИНИЦИАЛИЗАЦИЯ И ЗАГРУЗКА ДАННЫХ ======
(function() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }

    // Флаг от повторного запуска
    if (window.__wordGameSyncStarted) {
        console.log('ℹ️ Синхронизация уже запускалась, пропускаем');
        return;
    }

    function runInit() {
        window.__wordGameSyncStarted = true;
        console.log('🌐 Инициализация VK Bridge и загрузка данных...');

        vkBridge.send('VKWebAppInit', {})
            .then(() => {
                console.log('✅ VK Bridge инициализирован');

                // game.js уже загружен (мы ждали DOMContentLoaded),
                // но на всякий случай проверяем
                const tryLoad = (attempts) => {
                    const ready = (() => {
                        try {
                            return typeof gameState !== 'undefined'
                                && gameState
                                && typeof CONFIG !== 'undefined'
                                && typeof loadAllDataFromVK === 'function'
                                && typeof getGalaxyProgress === 'function';
                        } catch (e) { return false; }
                    })();

                    if (ready) {
                        if (typeof loadAllDataFromVK === 'function') {
                            loadAllDataFromVK().then(function(loaded) {
                                console.log('📦 Данные из VK Storage загружены:', loaded);

                                if (typeof updateUI === 'function') updateUI();
                                if (typeof updateTotalScoreInMenu === 'function') updateTotalScoreInMenu();
                                if (typeof syncOnChange === 'function') syncOnChange();

                                if (!loaded && typeof syncAllDataToVK === 'function') {
                                    console.log('📤 Отправка текущих данных в VK Storage...');
                                    syncAllDataToVK();
                                }
                            }).catch(err => {
                                console.warn('⚠️ Ошибка загрузки из VK:', err);
                            });
                        }
                        if (typeof preloadRewardedAd === 'function') preloadRewardedAd();
                    } else if (attempts < 100) {
                        setTimeout(() => tryLoad(attempts + 1), 50);
                    } else {
                        console.warn('⚠️ game.js так и не загрузился за 5 секунд');
                    }
                };

                tryLoad(0);
            })
            .catch((error) => {
                console.warn('⚠️ Ошибка инициализации VK Bridge:', error);
                // Всё равно пытаемся загрузить данные
                setTimeout(() => {
                    if (typeof loadAllDataFromVK === 'function') {
                        loadAllDataFromVK().catch(() => {});
                    }
                }, 1000);
            });
    }

    // ГЛАВНОЕ: ждём полной загрузки DOM и всех скриптов (включая game.js)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }
})();