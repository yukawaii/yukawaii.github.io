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
            // СРАЗУ ПОКАЗЫВАЕМ БАННЕР ПОСЛЕ ИНИЦИАЛИЗАЦИИ
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

// ===== ПОДЕЛИТЬСЯ =====
function shareApp() {
    console.log('📤 Поделиться...');

    const bridge = getVKBridge();
    if (!bridge) {
        if (navigator.share) {
            navigator.share({
                title: '🎨 Раскраска',
                text: 'Раскрашивай картинки и зарабатывай очки! 🎨✨',
                url: window.location.href
            }).catch(() => {});
        } else {
            alert('Поделиться можно через VK');
        }
        return;
    }

    bridge.send('VKWebAppShowShareBox', {
        link: window.location.href
    })
    .then((data) => {
        console.log('✅ Поделились:', data);
        if (data.result) {
            showToast('📤 Ссылка отправлена!');
        }
    })
    .catch((error) => {
        console.error('❌ Ошибка при шеринге:', error);
    });
}

// ===== ДОБАВИТЬ В ИЗБРАННОЕ =====
function addToFavorites() {
    console.log('⭐ Добавление в избранное...');

    const bridge = getVKBridge();
    if (!bridge) {
        alert('Добавьте страницу в закладки браузера');
        return;
    }

    bridge.send('VKWebAppAddToFavorites', {})
        .then((data) => {
            console.log('✅ Добавлено в избранное:', data);
            if (data.result) {
                showToast('⭐ Добавлено в избранное!');
            }
        })
        .catch((error) => {
            console.error('❌ Ошибка добавления в избранное:', error);
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
function initVK() {
    console.log('🔌 Запуск инициализации VK...');

    return loadVKBridgeScript()
        .then(() => initVKBridge())
        .then(() => {
            console.log('✅ VK полностью инициализирован');
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

// ===== ЗАПУСК ИНИЦИАЛИЗАЦИИ =====
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initVK, 300);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initVK, 300);
    });
}

console.log('📱 VK модуль загружен!');