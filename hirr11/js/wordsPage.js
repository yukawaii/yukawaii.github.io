// js/wordsPage.js
// Управление страницей выбора уровней (words.html)
// Проверка разблокировки через VK Storage, модалки, реклама за вознаграждение
// Добавлен тайм-аут 15 секунд для загрузки рекламы

let currentUnlockLevel = null;
let adTimeoutId = null;
let adSubscription = null;

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация VK Bridge, если ещё не инициализирован
    const bridge = window.vkBridge || vkBridge;
    window.vkBridge = bridge;
    
    // Загружаем статусы разблокировки
    loadAllStatuses();
    
    // Обработчики для кнопок уровней
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            if (this.classList.contains('locked')) {
                currentUnlockLevel = level;
                showUnlockModal(level);
            } else {
                window.location.href = `wordQuiz.html?level=${level}`;
            }
        });
    });
    
    // Обработчики модалок
    document.getElementById('unlockConfirm').addEventListener('click', function() {
        hideModal('unlockModal');
        // Показать загрузку
        showModal('loadingModal');
        // Запустить процесс показа рекламы с тайм-аутом
        showRewardedAdWithTimeout(currentUnlockLevel);
    });
    
    document.getElementById('unlockCancel').addEventListener('click', function() {
        hideModal('unlockModal');
        currentUnlockLevel = null;
        clearAdTimeout();
    });
    
    document.getElementById('okBtn').addEventListener('click', function() {
        hideModal('successModal');
        if (currentUnlockLevel) {
            updateButtonState(currentUnlockLevel, true);
            currentUnlockLevel = null;
        }
    });
    
    // Кнопка "Ок" в модалке ошибки
    document.getElementById('errorOkBtn').addEventListener('click', function() {
        hideModal('errorModal');
        clearAdTimeout();
        currentUnlockLevel = null;
    });
    
    // Закрыть модалку по клику на фон (опционально)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal('unlockModal');
                hideModal('loadingModal');
                hideModal('successModal');
                hideModal('errorModal');
                clearAdTimeout();
                currentUnlockLevel = null;
            }
        });
    });
});

// Функции работы с модалками
function showModal(id) {
    document.getElementById(id).classList.add('show');
}
function hideModal(id) {
    document.getElementById(id).classList.remove('show');
}

function showUnlockModal(level) {
    document.getElementById('unlockModal').dataset.level = level;
    showModal('unlockModal');
}

function showSuccessModal() {
    hideModal('loadingModal');
    showModal('successModal');
}

function showErrorModal(message) {
    hideModal('loadingModal');
    document.getElementById('errorModalText').textContent = message || 'Не удалось загрузить рекламу. Попробуйте позже.';
    showModal('errorModal');
}

// Загрузка статусов из VK Storage
async function loadAllStatuses() {
    const levels = [1, 2, 3];
    for (let lvl of levels) {
        const unlocked = await isLevelUnlocked(lvl);
        updateButtonState(lvl, unlocked);
    }
}

function isLevelUnlocked(level) {
    return new Promise((resolve) => {
        const bridge = window.vkBridge;
        if (!bridge) {
            const val = localStorage.getItem(`word_level_${level}_unlocked`);
            resolve(val === 'true');
            return;
        }
        bridge.send('VKWebAppStorageGet', { keys: [`word_level_${level}_unlocked`] })
            .then(data => {
                const value = data.keys[0]?.value;
                resolve(value === 'true');
            })
            .catch(() => {
                resolve(false);
            });
    });
}

function setLevelUnlocked(level) {
    const bridge = window.vkBridge;
    if (!bridge) {
        localStorage.setItem(`word_level_${level}_unlocked`, 'true');
        return;
    }
    bridge.send('VKWebAppStorageSet', {
        key: `word_level_${level}_unlocked`,
        value: 'true'
    }).catch(console.error);
}

function updateButtonState(level, unlocked) {
    const btn = document.querySelector(`.level-btn[data-level="${level}"]`);
    if (!btn) return;
    if (unlocked) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.innerHTML = `📖 Уровень ${level}`;
    } else {
        btn.classList.remove('unlocked');
        btn.classList.add('locked');
        btn.innerHTML = `🔒 Уровень ${level}`;
    }
}

// Очистка таймера и подписки
function clearAdTimeout() {
    if (adTimeoutId) {
        clearTimeout(adTimeoutId);
        adTimeoutId = null;
    }
    if (adSubscription) {
        // Отписываемся от события, чтобы избежать утечек
        const bridge = window.vkBridge;
        if (bridge && bridge.unsubscribe) {
            bridge.unsubscribe(adSubscription);
        }
        adSubscription = null;
    }
}

// Показать рекламу с тайм-аутом 15 секунд
function showRewardedAdWithTimeout(level) {
    const bridge = window.vkBridge;
    
    // Если нет bridge, разблокируем бесплатно (для тестов)
    if (!bridge) {
        setLevelUnlocked(level);
        updateButtonState(level, true);
        showSuccessModal();
        return;
    }
    
    // Устанавливаем тайм-аут 15 секунд
    clearAdTimeout(); // на всякий случай
    adTimeoutId = setTimeout(() => {
        // По истечении 15 секунд показываем ошибку
        showErrorModal('Ой, рекламы нет. Попробуйте позже.');
        clearAdTimeout(); // очищаем таймер, чтобы не сработал повторно
    }, 15000);
    
    // Проверяем доступность рекламы
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(() => {
            // Показываем рекламу
            return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
        })
        .then(() => {
            // Подписываемся на событие результата
            const handler = (e) => {
                if (e.detail.type === 'VKWebAppNativeAdResult') {
                    clearAdTimeout(); // очищаем тайм-аут, т.к. ответ получен
                    if (e.detail.data.result) {
                        // Награда получена
                        setLevelUnlocked(level);
                        updateButtonState(level, true);
                        showSuccessModal();
                    } else {
                        // Пользователь не получил награду (закрыл рекламу раньше)
                        showErrorModal('Реклама не была завершена. Попробуйте ещё раз.');
                    }
                    // Отписываемся
                    if (bridge.unsubscribe) {
                        bridge.unsubscribe(handler);
                    }
                    adSubscription = null;
                }
            };
            bridge.subscribe(handler);
            adSubscription = handler;
        })
        .catch((err) => {
            console.error('Ошибка рекламы:', err);
            clearAdTimeout();
            // Если реклама не доступна, показываем ошибку
            showErrorModal('Ой, рекламы нет. Попробуйте позже.');
        });
}