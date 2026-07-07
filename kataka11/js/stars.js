// js/diamonds.js
// Управление звездами, синхронизация с VK Storage и таблицей лидеров

let vkInitialized = false;
let vkUserId = null;
let vkUserToken = null;
let currentDiamonds = 0;

const APP_ID = 8165904; 
const ServToken = '435fa635435fa635435fa635f943233c254435f435fa6352121dc97157664a5927e4d4f'; 

function initVKSDK() {
    // Если VK Bridge уже инициализирован (например, через App.js), пропускаем повторную инициализацию,
    // но загружаем данные пользователя и токен, если они ещё не получены.
    if (window.vkBridgeInitialized) {
        console.log('ℹ️ VK уже инициализирован в App.js, загружаем звёзды');
        const bridge = window.vkBridge;
        if (bridge && !vkUserId) {
            bridge.send('VKWebAppGetUserInfo')
                .then((userInfo) => {
                    vkUserId = userInfo.id;
                    console.log('👤 Пользователь:', userInfo.first_name);
                    return bridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: '' });
                })
                .then((authData) => {
                    vkUserToken = authData.access_token;
                    console.log('🔑 Токен получен, загружаем звёзды');
                    vkInitialized = true;
                    loadStars();
                })
                .catch((err) => {
                    console.warn('⚠️ Токен не получен, звёзды только в localStorage', err);
                    vkInitialized = true; // помечаем как инициализированный, чтобы loadStars работал
                    loadStars();
                });
        } else {
            // Если userId уже есть или bridge отсутствует – просто загружаем звёзды
            vkInitialized = true;
            loadStars();
        }
        return;
    }

    // Если флаг не установлен – выполняем полную инициализацию (как было)
    if (typeof vkBridge !== 'undefined') {
        window.vkBridge = vkBridge;

        vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK SDK инициализирован');
                vkInitialized = true;
                window.vkBridgeInitialized = true; // устанавливаем флаг, чтобы другие скрипты не повторяли
                return vkBridge.send('VKWebAppGetUserInfo');
            })
            .then((userInfo) => {
                vkUserId = userInfo.id;
                console.log('👤 Пользователь:', userInfo.first_name);
                return vkBridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: '' });
            })
            .then((authData) => {
                vkUserToken = authData.access_token;
                console.log('🔑 Токен получен, загружаем звёзды');
                loadStars();
            })
            .catch((err) => {
                console.warn('⚠️ Токен не получен, звёзды только в localStorage', err);
                loadStars();
            });
    } else {
        console.warn('⚠️ VK Bridge не найден, работаем с localStorage');
        loadStars();
    }
}
// ===== ЗАГРУЗКА ЗВЁЗД =====
function loadStars() {
    if (vkInitialized && vkUserId) {
        vkBridge.send('VKWebAppStorageGet', { keys: ['stars'] })
            .then((data) => {
                const value = data.keys[0]?.value;
                const stars = parseInt(value) || 0;
                currentStars = stars;
                updateStarsUI();
                console.log('⭐ Звёзды загружены из VK Storage:', stars);
            })
            .catch(() => {
                loadStarsFromLocal();
            });
    } else {
        loadStarsFromLocal();
    }
}

function loadStarsFromLocal() {
    const saved = localStorage.getItem('stars');
    currentStars = saved ? parseInt(saved) : 0;
    updateStarsUI();
    console.log('⭐ Звёзды загружены из localStorage:', currentStars);
}

// ===== СОХРАНЕНИЕ ЗВЁЗД =====
function saveStars(value) {
    currentStars = value;
    localStorage.setItem('stars', String(value));
    if (vkInitialized && vkUserId) {
        vkBridge.send('VKWebAppStorageSet', { key: 'stars', value: String(value) })
            .then(() => {
                console.log('⭐ Звёзды сохранены в VK Storage:', value);
                saveVKScore(value);
            })
            .catch((err) => {
                console.warn('⚠️ Не удалось сохранить в VK Storage', err);
            });
    }
    updateStarsUI();
}

// ===== ДОБАВЛЕНИЕ ЗВЁЗД (ВЫЗЫВАЕТСЯ ПОСЛЕ ВИКТОРИНЫ) =====
function addStars(amount) {
    const newTotal = currentStars + amount;
    saveStars(newTotal);
    return newTotal;
}

// ===== ОБНОВЛЕНИЕ UI В ГЛАВНОМ МЕНЮ =====
function updateStarsUI() {
    const el = document.getElementById('star-counter');
    if (el) {
        el.textContent = currentStars;
        console.log('⭐ Счётчик обновлён:', currentStars);
    } else {
        console.warn('⚠️ Элемент #star-counter не найден, обновление UI отложено');
        // Повторим попытку через 100 мс (если DOM ещё не готов)
        setTimeout(() => {
            const el2 = document.getElementById('star-counter');
            if (el2) {
                el2.textContent = currentStars;
                console.log('⭐ Счётчик обновлён (повторная попытка):', currentStars);
            }
        }, 100);
    }
}

// ===== СОХРАНЕНИЕ РЕКОРДА В ТАБЛИЦУ ЛИДЕРОВ =====
function saveVKScore(scoreValue) {
    if (!vkInitialized || !vkUserId || !vkUserToken) {
        console.log('❌ Нет данных для сохранения рекорда');
        return;
    }
    if (scoreValue <= 0) return;

    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getScore',
        params: {
            user_id: vkUserId,
            v: '5.131',
            access_token: vkUserToken
        }
    })
    .then((data) => {
        let currentScore = parseInt(data.response) || 0;
        if (scoreValue > currentScore) {
            return vkBridge.send('VKWebAppCallAPIMethod', {
                method: 'secure.addAppEvent',
                params: {
                    user_id: vkUserId,
                    activity_id: 2,   // 2 – очки
                    value: scoreValue,
                    v: '5.131',
                    access_token: ServToken
                }
            });
        } else {
            return Promise.resolve();
        }
    })
    .then(() => {
        console.log('🏆 Рекорд обновлён в таблице лидеров:', scoreValue);
    })
    .catch((err) => {
        console.error('❌ Ошибка сохранения рекорда:', err);
    });
}

// ===== ОТКРЫТИЕ ТАБЛИЦЫ ЛИДЕРОВ =====
function showLeaderboard() {
    if (!vkInitialized) {
        alert('Таблица лидеров доступна только в приложении VK');
        return;
    }
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: currentStars,
        global: 1
    })
    .then(() => {
        console.log('📊 Таблица лидеров открыта');
    })
    .catch((err) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', err);
        alert('Не удалось открыть таблицу лидеров. Попробуйте позже.');
    });
}

// ===== ЗАПУСК ИНИЦИАЛИЗАЦИИ =====
initVKSDK();
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log('📄 Страница восстановлена из кеша, обновляем звёзды');
        loadStars();
    }
});
// Экспортируем функции для использования в других скриптах
window.addStars = addStars;
window.showLeaderboard = showLeaderboard;
window.currentStars = () => currentStars;