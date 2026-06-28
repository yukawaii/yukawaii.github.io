// ====== App.js — ИСПРАВЛЕННАЯ ВЕРСИЯ ======

// ====== ЗАЩИТА ОТ ОШИБОК ПОРЯДКА ЗАГРУЗКИ ======
(function() {
    // Проверяем, что game.js уже загружен
    if (typeof GALAXY_KEY === 'undefined' || 
        typeof ACHIEVEMENTS_KEY === 'undefined' || 
        typeof THEME_KEY === 'undefined') {
        console.warn('⚠️ App.js: game.js ещё не загружен! Откладываем выполнение...');
        
        const checkDependencies = function(attempts) {
            attempts = attempts || 0;
            if (attempts > 50) {
                console.error('❌ App.js: game.js не загружен после 50 попыток!');
                return;
            }
            
            if (typeof GALAXY_KEY !== 'undefined' && 
                typeof ACHIEVEMENTS_KEY !== 'undefined' && 
                typeof THEME_KEY !== 'undefined') {
                console.log('✅ App.js: зависимости загружены! Продолжаем выполнение.');
                if (typeof runApp === 'function') {
                    runApp();
                }
                return;
            }
            
            setTimeout(function() {
                checkDependencies(attempts + 1);
            }, 100);
        };
        
        // Сохраняем основной код в функцию
        window.runApp = function() {
            // Вызываем основной код App.js
            mainApp();
        };
        
        checkDependencies();
        return;
    }
    
    // Если зависимости уже загружены — выполняем сразу
    mainApp();
})();

// ====== ОСНОВНОЙ КОД APP.JS ======
function mainApp() {
    console.log('🚀 App.js: Запуск основного кода...');
    
    var score, id, token, name1;
    window.vkBridge = vkBridge;
    
    // Инициализация моста (УДАЛЯЕМ, так как теперь это делает vk-init.js)
    // Но оставляем для обратной совместимости
    
    function getid() {
        if (typeof vkBridge === 'undefined') {
            console.log('ℹ️ VK Bridge не доступен');
            return;
        }
        vkBridge.send('VKWebAppGetUserInfo')
            .then(data => {
                console.log(data);
                id = data.id;
                name1 = data.first_name;
                sessionStorage.setItem('id', id);
                setTimeout(function() { console.log("id^ " + id); }, 3000);
            })
            .catch(error => console.log(error));
    }
    getid();

    // ====== VK STORAGE СИНХРОНИЗАЦИЯ ======
    // Используем константы из game.js
    const VK_STORAGE_KEYS = {
        GALAXY: 'wordgame_galaxy_v2',
        ACHIEVEMENTS: 'wordgame_achievements_v2',
        THEME: 'wordgame_theme_v2',
        SOUND: 'wordgame_sound_v2'
    };

    // Сохранение данных в VK Storage
    function saveToVKStorage(key, value) {
        // Проверяем, что мы внутри ВК
        if (typeof vkBridge === 'undefined' || !window.__isVK) {
            console.log('ℹ️ VK не доступен, сохраняем локально');
            return Promise.resolve();
        }
        
        // Проверяем, что функция существует
        if (!vkBridge.send) {
            console.log('ℹ️ VK Bridge не инициализирован');
            return Promise.resolve();
        }
        
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
        if (typeof vkBridge === 'undefined' || !window.__isVK) {
            console.log('ℹ️ VK не доступен');
            return Promise.resolve(null);
        }
        
        if (!vkBridge.send) {
            console.log('ℹ️ VK Bridge не инициализирован');
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
        
        // Проверяем, что функции из game.js существуют
        if (typeof getGalaxyProgress === 'undefined' || 
            typeof loadAchievements === 'undefined' || 
            typeof THEME_KEY === 'undefined') {
            console.warn('⚠️ syncAllDataToVK: функции game.js не доступны');
            return Promise.resolve();
        }
        
        try {
            const galaxy = getGalaxyProgress();
            const achievements = loadAchievements();
            const theme = localStorage.getItem(THEME_KEY) || 'light';
            const sound = localStorage.getItem('wordgame:v1:sound') || '1';
            
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
        } catch (e) {
            console.warn('⚠️ Ошибка в syncAllDataToVK:', e);
            return Promise.resolve();
        }
    }

    // Загрузка всех данных из VK Storage
    function loadAllDataFromVK() {
        console.log('🔄 Загрузка данных из VK Storage...');
        
        if (typeof getGalaxyProgress === 'undefined' || 
            typeof loadAchievements === 'undefined' || 
            typeof saveGalaxyProgress === 'undefined' || 
            typeof saveAchievements === 'undefined' ||
            typeof THEME_KEY === 'undefined') {
            console.warn('⚠️ loadAllDataFromVK: функции game.js не доступны');
            return Promise.resolve(false);
        }
        
        return Promise.all([
            loadFromVKStorage(VK_STORAGE_KEYS.GALAXY),
            loadFromVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS),
            loadFromVKStorage(VK_STORAGE_KEYS.THEME),
            loadFromVKStorage(VK_STORAGE_KEYS.SOUND)
        ]).then(([galaxyData, achievementsData, themeData, soundData]) => {
            let loaded = false;
            
            try {
                // ====== ГАЛАКТИКА ======
                if (galaxyData && galaxyData.totalWords !== undefined) {
                    const currentLocal = getGalaxyProgress();
                    
                    const merged = {
                        totalWords: Math.max(currentLocal.totalWords || 0, galaxyData.totalWords || 0),
                        totalStars: Math.max(currentLocal.totalStars || 0, galaxyData.totalStars || 0),
                        stars: Math.max(currentLocal.stars || 0, galaxyData.stars || 0),
                        currentMilestone: Math.max(currentLocal.currentMilestone || 0, galaxyData.currentMilestone || 0),
                        shownIntro: currentLocal.shownIntro || galaxyData.shownIntro || false,
                        lastDailyBonus: currentLocal.lastDailyBonus || galaxyData.lastDailyBonus || null
                    };
                    
                    const scrollsSet = new Set([...(currentLocal.unlockedScrolls || []), ...(galaxyData.unlockedScrolls || [])]);
                    merged.unlockedScrolls = Array.from(scrollsSet);
                    
                    const hasChanges = 
                        merged.totalWords !== currentLocal.totalWords ||
                        merged.totalStars !== currentLocal.totalStars ||
                        merged.unlockedScrolls.length !== (currentLocal.unlockedScrolls || []).length;
                    
                    if (hasChanges) {
                        saveGalaxyProgress(merged);
                        loaded = true;
                        console.log(`✅ Галактика объединена: ${merged.totalWords} слов, ${merged.totalStars} звёзд`);
                    } else {
                        console.log('ℹ️ Новых данных галактики из VK нет');
                    }
                }
                
                // ====== ДОСТИЖЕНИЯ ======
                if (achievementsData && typeof achievementsData === 'object') {
                    const currentLocal = loadAchievements();
                    const merged = { ...currentLocal };
                    let mergedCount = Object.keys(merged).length;
                    
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
                        console.log(`✅ Достижения объединены: ${mergedCount} всего`);
                    } else {
                        console.log('ℹ️ Новых достижений из VK нет');
                    }
                }
                
                // ====== ТЕМА ======
                if (themeData && typeof themeData === 'string') {
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
                syncAllDataToVK();
                
                return loaded;
            } catch (e) {
                console.warn('⚠️ Ошибка обработки данных из VK:', e);
                return false;
            }
        }).catch((error) => {
            console.warn('⚠️ Ошибка загрузки из VK:', error);
            return false;
        });
    }

    // Синхронизация при изменении данных
    function syncOnChange() {
        // Сохраняем галактику при каждом обновлении
        if (typeof saveGalaxyProgress === 'function') {
            const originalSave = saveGalaxyProgress;
            saveGalaxyProgress = function(data) {
                originalSave(data);
                saveToVKStorage(VK_STORAGE_KEYS.GALAXY, data);
            };
        }
        
        // Сохраняем достижения при каждом обновлении
        if (typeof saveAchievements === 'function') {
            const originalSaveAchievements = saveAchievements;
            saveAchievements = function(data) {
                originalSaveAchievements(data);
                saveToVKStorage(VK_STORAGE_KEYS.ACHIEVEMENTS, data);
            };
        }
        
        // Сохраняем тему при изменении
        if (typeof applyTheme === 'function') {
            const originalApplyTheme = applyTheme;
            applyTheme = function(theme) {
                originalApplyTheme(theme);
                saveToVKStorage(VK_STORAGE_KEYS.THEME, theme);
            };
        }
        
        console.log('✅ Авто-синхронизация настроена');
    }

    // Инициализация синхронизации
    function initVKStorageSync() {
        if (!window.__isVK) {
            console.log('ℹ️ Запуск вне ВК, VK Storage синхронизация отключена');
            return;
        }
        
        console.log('🌐 Инициализация VK Storage синхронизации...');
        
        loadAllDataFromVK().then((loaded) => {
            syncOnChange();
            
            if (!loaded) {
                console.log('📤 Отправка текущих данных в VK Storage...');
                setTimeout(syncAllDataToVK, 1000);
            }
        });
    }

    // Ручная синхронизация
    function manualSync() {
        console.log('🔄 Ручная синхронизация...');
        syncAllDataToVK();
    }

    // Отладка
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

    // ========== ПОДСКАЗКИ С РЕКЛАМОЙ ==========
    function showRewardedAd() {
        if (typeof vkBridge === 'undefined' || !window.__isVK) {
            console.log('ℹ️ VK не доступен, реклама недоступна');
            return Promise.resolve(false);
        }
        
        if (!vkBridge.send) {
            return Promise.resolve(false);
        }
        
        return vkBridge.send("VKWebAppShowNativeAds", { ad_format: "reward" })
            .then((data) => {
                console.log('✅ Реклама за вознаграждение показана');
                return true;
            })
            .catch((e) => {
                console.log("❌ Ошибка или реклама не досмотрена:", e);
                return false;
            });
    }

    // Проверка, есть ли подсказки
    function checkHintsAndShowAd() {
        if (typeof gameState === 'undefined') {
            console.warn('⚠️ gameState не определён');
            return;
        }
        
        if (gameState.hintsLeft > 0) {
            if (typeof showToast === 'function') {
                showToast(`💡 У вас есть ${gameState.hintsLeft} подсказок`);
            }
            return;
        }
        
        const modal = document.getElementById('hintAdModal');
        if (modal) {
            if (typeof pauseGame === 'function') {
                pauseGame();
            }
            modal.classList.add('show');
        }
    }

    // Получение подсказок через рекламу
    function getHintsViaAd() {
        const modal = document.getElementById('hintAdModal');
        
        showRewardedAd().then((success) => {
            if (typeof gameState !== 'undefined') {
                if (success) {
                    gameState.hintsLeft += 3;
                    if (typeof showToast === 'function') {
                        showToast('🎉 +3 подсказки!');
                    }
                    if (typeof playSound === 'function') {
                        playSound('levelup');
                    }
                } else {
                    gameState.hintsLeft += 1;
                    if (typeof showToast === 'function') {
                        showToast('💡 Реклама недоступна, но вы получаете +1 подсказку!');
                    }
                    if (typeof playSound === 'function') {
                        playSound('hint');
                    }
                }
                
                if (typeof updateUI === 'function') {
                    updateUI();
                }
            }
            
            if (modal) modal.classList.remove('show');
            
            if (typeof gamePaused !== 'undefined' && gamePaused && typeof resumeGame === 'function') {
                resumeGame();
            }
        });
    }

    // Закрытие модалки без получения подсказок
    function closeHintAdModal() {
        const modal = document.getElementById('hintAdModal');
        if (modal) modal.classList.remove('show');
        
        if (typeof gamePaused !== 'undefined' && gamePaused && typeof resumeGame === 'function') {
            resumeGame();
        }
    }

    // ====== ИНИЦИАЛИЗАЦИЯ ======
    // Сделаем функции доступными из консоли
    window.syncAllDataToVK = syncAllDataToVK;
    window.loadAllDataFromVK = loadAllDataFromVK;
    window.debugVKStorage = debugVKStorage;
    window.manualSync = manualSync;
    window.saveToVKStorage = saveToVKStorage;
    window.loadFromVKStorage = loadFromVKStorage;
    window.initVKStorageSync = initVKStorageSync;
    window.showRewardedAd = showRewardedAd;
    window.checkHintsAndShowAd = checkHintsAndShowAd;
    window.getHintsViaAd = getHintsViaAd;
    window.closeHintAdModal = closeHintAdModal;

    // ====== АВТОЗАПУСК ======
    // Ждём событие vk-ready или запускаем через таймер
    if (window.__isVK) {
        document.addEventListener('vk-ready', function() {
            console.log('🌐 VK готов! Запускаем синхронизацию...');
            setTimeout(initVKStorageSync, 1000);
        });
        
        // Если vk-ready уже произошёл
        if (window.__vkReady) {
            console.log('🌐 VK уже готов! Запускаем синхронизацию...');
            setTimeout(initVKStorageSync, 1000);
        }
    } else {
        console.log('ℹ️ Запуск вне ВК, синхронизация отключена');
        // Всё равно делаем vkBridge доступным (пустышка)
        if (typeof vkBridge === 'undefined') {
            window.vkBridge = {
                send: () => Promise.resolve({}),
                subscribe: () => {}
            };
        }
    }

    console.log('✅ App.js загружен!');
}

// Для совместимости с vk-init.js
if (typeof window.runApp === 'function') {
    window.runApp();
}