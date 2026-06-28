var score,id,token, name1;
  window.vkBridge = vkBridge; 
// Инициализация моста
if (window.vkBridge) {
    window.vkBridge.send('VKWebAppInit')
        .then((data) => {
            console.log("Лоадер ВК должен скрыться:", data);
        })
        .catch((error) => {
            console.error("ВК отклонил инициализацию:", error);
        });
} else {
    console.error("Критическая ошибка: VK Bridge не найден в window!");
}

function getid(){
    vkBridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data);
    // *назначение переменных*
id = data.id;
name1=data.first_name;
sessionStorage.setItem('id', id);
setTimeout(function (){console.log("id^ "+ id);}, 3000);
})
.catch(error => console.log(error));
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
  vkBridge.send("VKWebAppShowInviteBox", {})
}

function myadd1(){
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
}

// ====== VK STORAGE СИНХРОНИЗАЦИЯ ======
const VK_STORAGE_KEYS = {
    GALAXY: 'wordgame_galaxy_v2',
    ACHIEVEMENTS: 'wordgame_achievements_v2',
    THEME: 'wordgame_theme_v2',
    SOUND: 'wordgame_sound_v2'
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
    const sound = localStorage.getItem('wordgame:v1:sound') || '1';
    
    // Сохраняем ВСЕГДА (даже если 0) — это нормально,
    // потому что мы уже убедились, что локальные данные актуальны
    return Promise.all([
        saveToVKStorage(VK_STORAGE_KEYS.GALAXY, galaxy),
        saveToVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS, achievements),
        saveToVKStorage(VK_STORAGE_KEYS.THEME, theme),
        saveToVKStorage(VK_STORAGE_KEYS.SOUND, sound)
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
        loadFromVKStorage(VK_STORAGE_KEYS.SOUND)
    ]).then(([galaxyData, achievementsData, themeData, soundData]) => {
        let loaded = false;
        
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
            localStorage.setItem('wordgame:v1:sound', soundData);
            if (typeof gameState !== 'undefined') {
                gameState.soundEnabled = soundData === '1';
            }
            loaded = true;
            console.log('✅ Звук загружен из VK');
        }
        
        if (!loaded) {
            console.log('ℹ️ В VK Storage нет данных или локальные данные новее');
        }
        
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
    // Сохраняем галактику при каждом обновлении
    const originalSave = saveGalaxyProgress;
    saveGalaxyProgress = function(data) {
        originalSave(data);
        // После сохранения локально — синхронизируем с VK
        saveToVKStorage(VK_STORAGE_KEYS.GALAXY, data);
    };
    
    // Сохраняем достижения при каждом обновлении
    const originalSaveAchievements = saveAchievements;
    saveAchievements = function(data) {
        originalSaveAchievements(data);
        saveToVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS, data);
    };
    
    // Сохраняем тему при изменении
    const originalApplyTheme = applyTheme;
    applyTheme = function(theme) {
        originalApplyTheme(theme);
        saveToVKStorage(VK_STORAGE_KEYS.THEME, theme);
    };
    
    console.log('✅ Авто-синхронизация настроена');
}

// Инициализация синхронизации
function initVKStorageSync() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    
    console.log('🌐 Инициализация VK Storage синхронизации...');
    
    // Сначала загружаем данные из VK
    loadAllDataFromVK().then((loaded) => {
        // После загрузки настраиваем авто-синхронизацию
        syncOnChange();
        
        // Если данные не были загружены — сохраняем текущие
        if (!loaded) {
            console.log('📤 Отправка текущих данных в VK Storage...');
            setTimeout(syncAllDataToVK, 1000);
        }
    });
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
window.syncAllDataToVK = syncAllDataToVK;
window.loadAllDataFromVK = loadAllDataFromVK;
window.debugVKStorage = debugVKStorage;
window.manualSync = manualSync;

// ========== ПОДСКАЗКИ С РЕКЛАМОЙ ==========

// Показать рекламу за вознаграждение
function showRewardedAd() {
    if (typeof vkBridge === 'undefined') {
        console.log("ℹ️ VK Bridge не найден");
        return Promise.resolve(false);
    }
    
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    return sendMethod.call(vkBridge, "VKWebAppShowNativeAds", { ad_format: "reward" })
        .then((data) => {
            console.log('✅ Реклама за вознаграждение показана, награда выдана:', data);
            return true;
        })
        .catch((e) => {
            console.log("❌ Ошибка или реклама не досмотрена:", e);
            return false;
        });
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

// В конце App.js, после всех определений в начале игры загружаем данные из вк-стораджа
(function() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    
    console.log('🌐 Загружаем данные из VK Storage...');
    setTimeout(function() {
        if (typeof loadAllDataFromVK === 'function') {
            loadAllDataFromVK().then(function(loaded) {
                console.log('📦 Данные из VK Storage загружены:', loaded);
                if (loaded) {
                    if (typeof updateUI === 'function') {
                        setTimeout(updateUI, 300);
                    }
                }
            });
        }
    }, 1500);
})();

// В конце App.js, после всех определений вызов синхронизации
if (typeof vkBridge !== 'undefined') {
    // Инициализируем синхронизацию после загрузки
    setTimeout(initVKStorageSync, 2000);
}