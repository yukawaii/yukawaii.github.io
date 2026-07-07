// js/diamonds.js
// Управление алмазами, синхронизация с VK Storage и таблицей лидеров

let vkInitialized = false;
let vkUserId = null;
let vkUserToken = null;
let currentDiamonds = 0;

const APP_ID = 8165024; 
const ServToken = '2612c80d2612c80d2612c80d77266e5ead226122612c80d446f8f02f2b5426621bfea1f'; 

// ===== ИНИЦИАЛИЗАЦИЯ VK =====
function initVKSDK() {
    if (typeof vkBridge !== 'undefined') {
        window.vkBridge = vkBridge;

        vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK SDK инициализирован');
                vkInitialized = true;
                return vkBridge.send('VKWebAppGetUserInfo');
            })
            .then((userInfo) => {
                vkUserId = userInfo.id;
                console.log('👤 Пользователь:', userInfo.first_name);
                // Пытаемся получить токен
                return vkBridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: '' });
            })
            .then((authData) => {
                vkUserToken = authData.access_token;
                console.log('🔑 Токен получен, загружаем алмазы');
                loadDiamonds(); // Загружаем алмазы из Storage
            })
            .catch((err) => {
                console.warn('⚠️ Токен не получен, алмазы будут только в localStorage', err);
                loadDiamonds(); // Всё равно пытаемся загрузить из localStorage
            });
    } else {
        console.warn('⚠️ VK Bridge не найден, работаем с localStorage');
        loadDiamonds();
    }
}

// ===== ЗАГРУЗКА АЛМАЗОВ =====
function loadDiamonds() {
    if (vkInitialized && vkUserId) {
        // Пытаемся загрузить из VK Storage
        vkBridge.send('VKWebAppStorageGet', { keys: ['diamonds'] })
            .then((data) => {
                const value = data.keys[0]?.value;
                const diamonds = parseInt(value) || 0;
                currentDiamonds = diamonds;
                updateDiamondUI();
                console.log('💎 Алмазы загружены из VK Storage:', diamonds);
            })
            .catch(() => {
                // Если не получилось — берём из localStorage
                loadDiamondsFromLocal();
            });
    } else {
        loadDiamondsFromLocal();
    }
}

function loadDiamondsFromLocal() {
    const saved = localStorage.getItem('diamonds');
    currentDiamonds = saved ? parseInt(saved) : 0;
    updateDiamondUI();
    console.log('💎 Алмазы загружены из localStorage:', currentDiamonds);
}

// ===== СОХРАНЕНИЕ АЛМАЗОВ =====
function saveDiamonds(value) {
    currentDiamonds = value;
    // Сохраняем в localStorage (всегда)
    localStorage.setItem('diamonds', String(value));
    // Если VK доступен — сохраняем в Storage
    if (vkInitialized && vkUserId) {
        vkBridge.send('VKWebAppStorageSet', { key: 'diamonds', value: String(value) })
            .then(() => {
                console.log('💎 Алмазы сохранены в VK Storage:', value);
                // Обновляем рекорд в таблице лидеров
                saveVKScore(value);
            })
            .catch((err) => {
                console.warn('⚠️ Не удалось сохранить в VK Storage, только локально', err);
            });
    }
    updateDiamondUI();
}

// ===== ДОБАВЛЕНИЕ АЛМАЗОВ (ВЫЗЫВАЕТСЯ ПОСЛЕ ВИКТОРИНЫ) =====
function addDiamonds(amount) {
    const newTotal = currentDiamonds + amount;
    saveDiamonds(newTotal);
    return newTotal;
}

// ===== ОБНОВЛЕНИЕ UI В ГЛАВНОМ МЕНЮ =====
function updateDiamondUI() {
    const el = document.getElementById('diamond-counter');
    if (el) {
        el.textContent = currentDiamonds;
    }
}

// ===== СОХРАНЕНИЕ РЕКОРДА В ТАБЛИЦУ ЛИДЕРОВ =====
function saveVKScore(scoreValue) {
    if (!vkInitialized || !vkUserId || !vkUserToken) {
        console.log('❌ Нет данных для сохранения рекорда');
        return;
    }
    if (scoreValue <= 0) return;

    // Получаем текущий рекорд
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
            // Сохраняем новый рекорд (activity_id: 2 — это очки)
            return vkBridge.send('VKWebAppCallAPIMethod', {
                method: 'secure.addAppEvent',
                params: {
                    user_id: vkUserId,
                    activity_id: 2,
                    value: scoreValue,
                    v: '5.131',
                    access_token: ServToken
                }
            });
        } else {
            return Promise.resolve(); // Рекорд не побит
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
        user_result: currentDiamonds,
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

// Экспортируем функции для использования в других скриптах
window.addDiamonds = addDiamonds;
window.showLeaderboard = showLeaderboard;
window.currentDiamonds = () => currentDiamonds;