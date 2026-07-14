// ===== VK: ВСЕ ФУНКЦИИ ДЛЯ РАБОТЫ С VK BRIDGE =====

let vkBridgeInstance = null;
let isVKInitialized = false;

// ===== ИНИЦИАЛИЗАЦИЯ VK BRIDGE =====
function initVKBridge() {
    console.log('🔌 Инициализация VK Bridge...');

    const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;

    if (!bridge) {
        console.warn('⚠️ VK Bridge не найден.');
        return Promise.reject('VK Bridge not found');
    }

    vkBridgeInstance = bridge;
    window.vkBridge = bridge;

    return bridge.send('VKWebAppInit')
        .then((data) => {
        isVKInitialized = true;
        console.log('✅ VK Bridge инициализирован:', data);

         initVKUserData().then(() => {
                // После получения данных синхронизируем рекорд при старте
                if (window.appState) {
                    syncLeaderboard(window.appState.totalPoints);
                }
            });
        
        // Загружаем данные из VK Storage
        if (typeof loadAppStateFromVK === 'function') {
            loadAppStateFromVK().then(() => {
                // Обновляем UI после загрузки
                if (typeof updateStats === 'function') updateStats();
                if (typeof renderLevels === 'function' && currentCategory) renderLevels(currentCategory);
                console.log('✅ Данные синхронизированы с VK');
            });
        }
        
        setTimeout(showBanner, 500);
        return data;
    })
    .catch((error) => {
        console.error('❌ Ошибка инициализации VK Bridge:', error);
        throw error;
    });
}

// ===== ПРОВЕРКА СТАТУСА VK =====
function isVKReady() {
    return isVKInitialized && vkBridgeInstance !== null;
}

// ===== ПОЛУЧИТЬ VK BRIDGE =====
function getVKBridge() {
    if (!isVKReady()) {
        console.warn('⚠️ VK Bridge не готов');
        return null;
    }
    return vkBridgeInstance;
}

// ===== ПРИГЛАСИТЬ ДРУЗЕЙ =====
function inviteFriends() {
    console.log('📨 Приглашение друзей...');

    const bridge = getVKBridge();
    if (!bridge) {
        if (navigator.share) {
            navigator.share({
                title: '🎨 Раскраска',
                text: 'Присоединяйся! Раскрашивай картинки и зарабатывай очки! 🎨✨',
                url: window.location.href
            }).catch(() => {});
        } else {
            alert('Пригласить друзей можно через VK');
        }
        return;
    }

    bridge.send('VKWebAppShowInviteBox', {})
        .then((data) => {
            console.log('✅ Приглашение отправлено:', data);
            if (data.result) {
                showToast('👥 Приглашение отправлено друзьям!');
            }
        })
        .catch((error) => {
            console.error('❌ Ошибка приглашения:', error);
        });
}


// ===== ПОКАЗАТЬ РЕКЛАМНЫЙ БАННЕР =====
function showBanner() {
    console.log('📢 Запуск рекламного баннера...');

    const bridge = getVKBridge();
    if (!bridge) {
        console.warn('⚠️ VK Bridge не доступен, баннер не будет показан');
        return;
    }

    bridge.send('VKWebAppShowBannerAd', {
        banner_location: 'bottom'
    })
    .then((data) => {
        if (data.result) {
            console.log('✅ Баннерная реклама отобразилась');
        } else {
            console.log('ℹ️ Баннер не отобразился:', data);
        }
    })
    .catch((error) => {
        if (error?.error_data?.error_code === 10) {
            console.log('ℹ️ Лимит запросов баннера (тестовый режим)');
        } else if (error?.error_data?.error_code === 20) {
            console.log('ℹ️ Нет рекламы для показа (тестовый режим)');
        } else {
            console.warn('⚠️ Ошибка показа баннера:', error);
        }
    });
}

// ===== ПОЛУЧИТЬ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ =====
function getUserInfo() {
    console.log('👤 Получение информации о пользователе...');

    const bridge = getVKBridge();
    if (!bridge) {
        console.warn('⚠️ VK Bridge не доступен');
        return Promise.reject('VK Bridge not available');
    }

    return bridge.send('VKWebAppGetUserInfo', {})
        .then((data) => {
            console.log('✅ Информация о пользователе:', data);
            return data;
        })
        .catch((error) => {
            console.error('❌ Ошибка получения информации:', error);
            throw error;
        });
}

// ===== ДИНАМИЧЕСКАЯ ЗАГРУЗКА VK BRIDGE =====
function loadVKBridgeScript() {
    return new Promise((resolve, reject) => {
        if (typeof vkBridge !== 'undefined' || typeof window.vkBridge !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js';
        script.onload = () => {
            console.log('✅ VK Bridge загружен динамически');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Не удалось загрузить VK Bridge');
            reject('Failed to load VK Bridge script');
        };
        document.head.appendChild(script);
    });
}



// ===== ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ =====
preloadRewardAd// В vk.js или app.js - обновите initVK()
function initVK() {
    console.log('🔌 Запуск инициализации VK...');

    return loadVKBridgeScript()
        .then(() => initVKBridge())
        .then(() => {
            console.log('✅ VK полностью инициализирован');
            // Загружаем состояние кистей из VK
            return loadBrushesFromVK();
        })
        .then(() => {
            // Предзагружаем рекламу
            if (typeof preloadRewardAd === 'function') {
                setTimeout(preloadRewardAd, 1000);
            }
            return true;
        })
        .catch((error) => {
            console.warn('⚠️ VK недоступен, работаем в офлайн-режиме:', error);
            return false;
        });
}

// ===== СИНХРОНИЗАЦИЯ КИСТЕЙ ЧЕРЕЗ VK STORAGE =====
function saveBrushesToVK() {
    const bridge = getVKBridge();
    if (!bridge) {
        console.log('ℹ️ VK не доступен, синхронизация кистей отключена');
        return;
    }
    
    // Сохраняем только актуальные данные (без expired)
    const dataToSave = {};
    for (const [id, data] of Object.entries(brushesState)) {
        if (data.unlocked && data.expiresAt) {
            dataToSave[id] = {
                unlocked: true,
                expiresAt: data.expiresAt
            };
        } else if (data.unlocked && !data.expiresAt) {
            // Дефолтные кисти (без срока)
            dataToSave[id] = {
                unlocked: true,
                expiresAt: null
            };
        }
    }
    
    bridge.send('VKWebAppStorageSet', {
        key: 'brushesState',
        value: JSON.stringify(dataToSave)
    })
    .then(() => {
        console.log('✅ Состояние кистей сохранено в VK');
    })
    .catch((error) => {
        console.warn('⚠️ Ошибка сохранения кистей в VK:', error);
    });
}

function loadBrushesFromVK() {
    const bridge = getVKBridge();
    if (!bridge) {
        console.log('ℹ️ VK не доступен, загрузка кистей из VK отключена');
        return Promise.resolve();
    }
    
    return bridge.send('VKWebAppStorageGet', {
        keys: ['brushesState']
    })
    .then((data) => {
        if (data && data.keys && data.keys.length > 0) {
            const stored = data.keys[0].value;
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const now = Date.now();
                    let hasChanges = false;
                    
                    for (const [id, remoteData] of Object.entries(parsed)) {
                        // Проверяем, не истекло ли время
                        if (remoteData.expiresAt && remoteData.expiresAt < now) {
                            // Истекло - не загружаем
                            continue;
                        }
                        
                        // Обновляем локальное состояние
                        if (brushesState[id]) {
                            if (!brushesState[id].unlocked && remoteData.unlocked) {
                                brushesState[id].unlocked = true;
                                brushesState[id].expiresAt = remoteData.expiresAt || null;
                                hasChanges = true;
                            }
                        }
                    }
                    
                    if (hasChanges) {
                        saveBrushesState();
                        console.log('✅ Кисти синхронизированы с VK');
                    }
                } catch(e) {
                    console.warn('⚠️ Ошибка парсинга кистей из VK:', e);
                }
            }
        }
    })
    .catch((error) => {
        console.warn('⚠️ Ошибка загрузки кистей из VK:', error);
    });
}

// ===== ЗАПУСК ИНИЦИАЛИЗАЦИИ =====
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initVK, 300);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initVK, 300);
    });
}
// ===== ПЕРЕМЕННЫЕ ДЛЯ ЛИДЕРБОРДА =====
let vkUserId = null;

// ===== ФИКСИРОВАННЫЕ ДАННЫЕ ДЛЯ VK API =====
// ⚠️ ЗАМЕНИТЕ НА СВОИ ЗНАЧЕНИЯ ИЗ НАСТРОЕК ПРИЛОЖЕНИЯ VK
const VK_APP_ID = 54678489;                     // ID вашего приложения
const VK_CLIENT_SECRET = 'WKSPyYFeeLu0KQdi5bQB'; // Секретный ключ
const VK_ACCESS_TOKEN = 'db3b39f4db3b39f4db3b39f470d8796a2dddb3bdb3b39f4b16d18e684cea8b82e7816dc'; // Service token

// ===== ПОЛУЧЕНИЕ USER_ID =====
function initVKUser() {
    const bridge = getVKBridge();
    if (!bridge) return Promise.reject('VK Bridge not available');
    
    return bridge.send('VKWebAppGetUserInfo')
        .then((userInfo) => {
            vkUserId = userInfo.id;
            console.log('👤 VK User ID:', vkUserId);
            return vkUserId;
        })
        .catch((err) => {
            console.warn('⚠️ Не удалось получить user_id:', err);
            return null;
        });
}

// ===== СИНХРОНИЗАЦИЯ РЕКОРДА (только если рекорд увеличился) =====
function syncLeaderboard(score) {
    if (!vkUserId) {
        console.warn('⚠️ Нет user_id, синхронизация невозможна');
        return initVKUser().then(() => {
            if (vkUserId) return syncLeaderboard(score);
            return Promise.resolve();
        });
    }

    const lastSent = parseInt(localStorage.getItem('coloring_lastSentScore') || '0');
    if (score <= lastSent) {
        console.log('⏩ Рекорд не изменился, синхронизация не требуется');
        return Promise.resolve();
    }

    const bridge = getVKBridge();
    if (!bridge) {
        // Не сохраняем рекорд, чтобы позже попробовать снова при наличии VK
        return Promise.resolve();
    }

    console.log(`📤 Отправка рекорда ${score} для пользователя ${vkUserId}`);
    return bridge.send('VKWebAppCallAPIMethod', {
        method: 'secure.addAppEvent',
        params: {
            client_secret: VK_CLIENT_SECRET,
            user_id: vkUserId,
            activity_id: 2,
            value: score,
            v: '5.131',
            access_token: VK_ACCESS_TOKEN
        }
    })
    .then(() => {
        console.log('🏆 Рекорд синхронизирован:', score);
        // ✅ Сохраняем только после успешной отправки
        localStorage.setItem('coloring_lastSentScore', String(score));
    })
    .catch((err) => {
        console.error('❌ Ошибка синхронизации лидерборда:', err);
        // ❌ Не сохраняем рекорд, чтобы можно было повторить попытку позже
    });
}

// ===== ОТКРЫТИЕ ТАБЛИЦЫ ЛИДЕРОВ =====
function showLeaderboard() {
    const bridge = getVKBridge();
    if (!bridge) {
        showToast('❌ Нет соединения');
        return;
    }
    
    const currentScore = appState ? appState.totalPoints : 0;
    // Сначала синхронизируем текущий рекорд
    syncLeaderboard(currentScore);
    
    bridge.send('VKWebAppShowLeaderBoardBox', {
        app_id: VK_APP_ID,
        user_result: currentScore,
        global: 1
    })
    .then(() => {
        console.log('📊 Таблица лидеров открыта');
    })
    .catch((err) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', err);
        showToast('❌ Не удалось открыть таблицу лидеров. Попробуйте позже.');
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ СТАРТЕ =====
// Вызываем в initVKBridge после успешной инициализации
function initLeaderboard() {
    initVKUser().then(() => {
        if (vkUserId && window.appState) {
            syncLeaderboard(window.appState.totalPoints);
        }
    });
}

// Экспорт
window.initLeaderboard = initLeaderboard;
window.syncLeaderboard = syncLeaderboard;
window.showLeaderboard = showLeaderboard;
console.log('📱 VK модуль загружен!');