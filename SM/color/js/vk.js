// ===== VK: НОВАЯ ВЕРСИЯ (как в Судоку) =====

let vkBridgeInstance = null;
let isVKInitialized = false;
let vkUserId = null;

// ===== ИНИЦИАЛИЗАЦИЯ VK (как в Судоку) =====
async function initVK() {
    const loading = document.getElementById('splashScreen');
    
    if (typeof vkBridge === 'undefined' || !vkBridge.send) {
        console.log('ℹ️ VK Bridge не найден, работаем офлайн');
        return false;
    }
    
    try {
        // 1. Инициализируем VK Bridge
        const initData = await vkBridge.send('VKWebAppInit', {});
        console.log('✅ VK Bridge инициализирован:', initData);
        isVKInitialized = true;
        vkBridgeInstance = vkBridge;
        
        // 2. Получаем пользователя (как в Судоку)
        try {
            const userInfo = await vkBridge.send('VKWebAppGetUserInfo', {});
            if (userInfo && userInfo.id) {
                vkUserId = userInfo.id;
                console.log('👤 Пользователь VK:', vkUserId);
            }
        } catch(e) {
            console.warn('⚠️ Не удалось получить пользователя:', e);
            // Пробуем получить из launch params
            try {
                const launchParams = await vkBridge.send('VKWebAppGetLaunchParams', {});
                if (launchParams && launchParams.vk_user_id) {
                    vkUserId = launchParams.vk_user_id;
                    console.log('👤 Пользователь VK (из launch params):', vkUserId);
                }
            } catch(e2) {}
        }
        
        // 3. Показываем баннер (как в Судоку)
        setTimeout(() => showBanner(), 500);
        
        return true;
        
    } catch(error) {
        console.warn('⚠️ Ошибка инициализации VK:', error);
        return false;
    }
}

// ===== ЗАГРУЗКА ДАННЫХ ИЗ VK STORAGE (как в Судоку) =====
async function loadAppStateFromVK() {
   // if (!isVKInitialized || !vkUserId) {
     if (!isVKInitialized) {
        console.log('ℹ️ VK не инициализирован, пропускаем загрузку');
        return;
    }
    
    try {
        const data = await vkBridge.send('VKWebAppStorageGet', {
            keys: ['coloringAppData']
        });
        
        if (data && data.keys && data.keys.length > 0) {
            const value = data.keys[0].value;
            if (value) {
                const parsed = JSON.parse(value);
                console.log('📥 Данные из VK Storage получены:', {
                    points: parsed.totalPoints,
                    colored: parsed.coloredImages?.length || 0,
                    achievements: parsed.unlockedAchievements?.length || 0
                });
                
                // ===== МЕРЖИМ ДАННЫЕ (как в Судоку) =====
                mergeDataFromVK(parsed);
            } else {
                console.log('ℹ️ В VK Storage нет сохраненных данных');
            }
        }
    } catch(error) {
        console.warn('⚠️ Ошибка загрузки из VK Storage:', error);
    }
}

// ===== МЕРЖ ДАННЫХ (как в Судоку — берем максимум) =====
function mergeDataFromVK(data) {
    // 1. totalPoints — берем максимум
    if (typeof data.totalPoints === 'number' && data.totalPoints > appState.totalPoints) {
        appState.totalPoints = data.totalPoints;
        console.log(`⭐ Обновлено количество звезд: ${appState.totalPoints}`);
    }
    
    // 2. coloredImages — объединяем без дубликатов
    if (data.coloredImages && Array.isArray(data.coloredImages)) {
        const existing = appState.coloredImages.map(item => JSON.stringify(item));
        const incoming = data.coloredImages.filter(item => !existing.includes(JSON.stringify(item)));
        if (incoming.length > 0) {
            appState.coloredImages = [...appState.coloredImages, ...incoming];
            console.log(`🖼️ Добавлено ${incoming.length} раскрашенных картинок из VK`);
        }
    }
    
    // 3. unlockedAchievements — объединяем через Set
    if (data.unlockedAchievements && Array.isArray(data.unlockedAchievements)) {
        const merged = new Set([...appState.unlockedAchievements, ...data.unlockedAchievements]);
        if (merged.size > appState.unlockedAchievements.length) {
            appState.unlockedAchievements = Array.from(merged);
            console.log(`🏆 Добавлено достижений из VK`);
        }
    }
    
    // 4. unlockedLevels — объединяем
    if (data.unlockedLevels && typeof data.unlockedLevels === 'object') {
        for (const key of Object.keys(data.unlockedLevels)) {
            if (data.unlockedLevels[key] === true && !unlockedLevels[key]) {
                unlockedLevels[key] = true;
            }
        }
        saveUnlockedState();
    }
    
    // 5. brushesState — мержим с проверкой срока
    if (data.brushesState && typeof data.brushesState === 'object') {
        const now = Date.now();
        for (const brushId of Object.keys(data.brushesState)) {
            const remote = data.brushesState[brushId];
            if (!remote.unlocked) continue;
            if (remote.expiresAt && remote.expiresAt < now) continue;
            
            const local = brushesState[brushId] || { unlocked: false, expiresAt: null };
            if (!local.unlocked || (remote.expiresAt && remote.expiresAt > local.expiresAt)) {
                brushesState[brushId] = {
                    unlocked: true,
                    expiresAt: remote.expiresAt || null
                };
            }
        }
        saveBrushesState();
    }
    
    // 6. scrollsProgress — объединяем
    if (data.scrollsProgress && typeof data.scrollsProgress === 'object') {
        let localProgress = {};
        try {
            const saved = localStorage.getItem('coloringScrollsProgress');
            if (saved) localProgress = JSON.parse(saved);
        } catch(e) {}
        
        for (const key of Object.keys(data.scrollsProgress)) {
            if (data.scrollsProgress[key] === true) {
                localProgress[key] = true;
            }
        }
        saveScrollsProgress(localProgress);
    }
    
    // 7. dailyBonusData
    if (data.dailyBonusData && typeof data.dailyBonusData === 'object') {
        const localDate = dailyBonusData.lastClaimDate;
        const remoteDate = data.dailyBonusData.lastClaimDate;
        if (remoteDate && (!localDate || remoteDate > localDate)) {
            dailyBonusData.lastClaimDate = remoteDate;
            saveDailyBonusData();
        }
    }
    
    // 8. Обновляем UI и сохраняем
    updateStats();
    if (currentCategory) renderLevels(currentCategory);
    saveState();
    
    console.log('✅ Данные из VK успешно объединены с локальными');
}

// ===== СОХРАНЕНИЕ В VK STORAGE (как в Судоку) =====
function saveAppStateToVK() {
   // if (!isVKInitialized || !vkUserId) return;
      if (!isVKInitialized) return;
    const data = {
        totalPoints: appState.totalPoints,
        coloredImages: appState.coloredImages,
        unlockedAchievements: appState.unlockedAchievements,
        unlockedLevels: unlockedLevels,
        brushesState: brushesState,
        scrollsProgress: getScrollsProgress ? getScrollsProgress() : {},
        dailyBonusData: dailyBonusData
    };
    
    vkBridge.send('VKWebAppStorageSet', {
        key: 'coloringAppData',
        value: JSON.stringify(data)
    })
    .then(() => console.log('✅ Данные сохранены в VK Storage'))
    .catch(e => console.warn('⚠️ Ошибка сохранения в VK Storage:', e));
}

// ===== ПОКАЗ БАННЕРА (как в Судоку) =====
function showBanner() {
    if (!isVKInitialized) return;
    
    vkBridge.send('VKWebAppShowBannerAd', {
        banner_location: 'bottom'
    })
    .then(data => {
        if (data && data.result) {
            console.log('✅ Баннер показан');
        }
    })
    .catch(error => {
        if (error?.error_data?.error_code === 10 || error?.error_data?.error_code === 20) {
            console.log('ℹ️ Баннер не доступен (тестовый режим)');
        } else {
            console.warn('⚠️ Ошибка показа баннера:', error);
        }
    });
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) =====
function getVKBridge() {
    return isVKInitialized ? vkBridgeInstance : null;
}

function inviteFriends() {
    if (!isVKInitialized) {
        if (navigator.share) {
            navigator.share({
                title: '🎨 Раскраска',
                text: 'Присоединяйся! Раскрашивай картинки и зарабатывай звёзды! 🎨✨',
                url: window.location.href
            }).catch(() => {});
        }
        return;
    }
    
    vkBridge.send('VKWebAppShowInviteBox', {})
        .then(data => {
            if (data && data.result) {
                showToast('👥 Приглашение отправлено друзьям!');
            }
        })
        .catch(error => console.error('❌ Ошибка приглашения:', error));
}
function showLeaderboard() {
    if (!isVKInitialized || !vkUserId) {
        showToast('❌ Таблица лидеров недоступна');
        return;
    }

    const currentScore = appState ? appState.totalPoints : 0;

    // Сначала синхронизируем текущий рекорд
    syncLeaderboard(currentScore)
        .then(() => {
            vkBridge.send('VKWebAppShowLeaderBoardBox', {
                app_id: 54678489, // ID вашего приложения (замените при необходимости)
                user_result: currentScore,
                global: 1
            })
            .catch(err => {
                console.error('❌ Ошибка открытия таблицы лидеров:', err);
                showToast('❌ Не удалось открыть таблицу лидеров');
            });
        })
        .catch(() => {
            showToast('❌ Ошибка синхронизации, попробуйте позже');
        });
}
function syncLeaderboard(score) {
    if (!isVKInitialized || !vkUserId) return Promise.resolve();

    const lastSent = parseInt(localStorage.getItem('coloring_lastSentScore') || '0');
    if (score <= lastSent) {
        console.log('⏩ Рекорд не изменился');
        return Promise.resolve();
    }

    return vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'secure.addAppEvent',
        params: {
            client_secret: 'WKSPyYFeeLu0KQdi5bQB', // замените на свой
            user_id: vkUserId,
            activity_id: 2,
            value: score,
            v: '5.131',
            access_token: 'db3b39f4db3b39f4db3b39f470d8796a2dddb3bdb3b39f4b16d18e684cea8b82e7816dc' // замените на свой
        }
    })
    .then(() => {
        localStorage.setItem('coloring_lastSentScore', String(score));
        console.log('🏆 Рекорд синхронизирован');
    })
    .catch(err => {
        console.warn('⚠️ Ошибка синхронизации лидерборда:', err);
    });
}


// ===== ЭКСПОРТ =====
window.initVK = initVK;
window.loadAppStateFromVK = loadAppStateFromVK;
window.saveAppStateToVK = saveAppStateToVK;
window.getVKBridge = getVKBridge;
window.inviteFriends = inviteFriends;
window.syncLeaderboard = syncLeaderboard;
window.showLeaderboard = showLeaderboard;
window.showBanner = showBanner;
window.vkUserId = vkUserId;

console.log('📱 VK модуль загружен (новая версия)');