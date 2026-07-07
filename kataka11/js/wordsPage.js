// js/wordsPage.js
// Управление страницей выбора уровней (words.html)
// Проверка разблокировки через VK Storage, модалки, реклама за вознаграждение
// Исправлена обработка событий рекламы

let currentUnlockLevel = null;
let adTimeoutId = null;
let adResultHandler = null;

document.addEventListener('DOMContentLoaded', function() {
    // Сохраняем bridge в window
    if (typeof vkBridge !== 'undefined') {
        window.vkBridge = vkBridge;
    }

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

    // Кнопка "Открыть" в модалке
    document.getElementById('unlockConfirm').addEventListener('click', function() {
        hideModal('unlockModal');
        showModal('loadingModal');
        showRewardedAdWithTimeout(currentUnlockLevel);
    });

    // Кнопка "Отмена"
    document.getElementById('unlockCancel').addEventListener('click', function() {
        hideModal('unlockModal');
        currentUnlockLevel = null;
        clearAdResources();
    });

    // Кнопка "Ок" в модалке успеха
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
        clearAdResources();
        currentUnlockLevel = null;
    });

    // Закрытие по клику на фон
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal('unlockModal');
                hideModal('loadingModal');
                hideModal('successModal');
                hideModal('errorModal');
                clearAdResources();
                currentUnlockLevel = null;
            }
        });
    });
});

// ===== МОДАЛКИ =====
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

// ===== РАБОТА С VK STORAGE =====
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
            .catch(() => resolve(false));
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

// ===== ОЧИСТКА РЕСУРСОВ (таймер + подписка) =====
function clearAdResources() {
    if (adTimeoutId) {
        clearTimeout(adTimeoutId);
        adTimeoutId = null;
    }
    if (adResultHandler) {
        const bridge = window.vkBridge;
        if (bridge && bridge.unsubscribe) {
            bridge.unsubscribe(adResultHandler);
        }
        adResultHandler = null;
    }
}

// ===== ПОКАЗ РЕКЛАМЫ С ТАЙМ-АУТОМ =====
function showRewardedAdWithTimeout(level) {
    const bridge = window.vkBridge;

    // Если нет VK Bridge – разблокируем бесплатно (для тестов)
    if (!bridge) {
        setLevelUnlocked(level);
        updateButtonState(level, true);
        showSuccessModal();
        return;
    }

    // Очищаем предыдущие ресурсы
    clearAdResources();

    // Тайм-аут 15 секунд
    adTimeoutId = setTimeout(() => {
        console.warn('⏰ Тайм-аут рекламы (15 сек)');
        showErrorModal('Ой, рекламы нет. Попробуйте позже.');
        clearAdResources();
    }, 15000);

    // Шаг 1: Проверяем доступность рекламы
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(() => {
            // Шаг 2: Показываем рекламу
            return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
        })
        .then((data) => {
            // Реклама показана (но награда ещё не получена)
            console.log('📺 Реклама показана, ожидаем результат...', data);
            // Подписываемся на событие результата
            const handler = (e) => {
                if (e.detail.type === 'VKWebAppNativeAdResult') {
                    console.log('🎁 Получен результат рекламы:', e.detail.data);
                    // Очищаем тайм-аут и подписку
                    clearAdResources();

                    if (e.detail.data.result === true) {
                        // Награда получена – разблокируем
                        setLevelUnlocked(level);
                        updateButtonState(level, true);
                        showSuccessModal();
                    } else {
                        // Пользователь не получил награду (закрыл раньше)
                        showErrorModal('Реклама не была завершена. Попробуйте ещё раз.');
                    }
                }
            };
            bridge.subscribe(handler);
            adResultHandler = handler;
        })
        .catch((err) => {
            console.error('❌ Ошибка при показе рекламы:', err);
            clearAdResources();
            // Если ошибка – показываем модалку
            showErrorModal('Ой, рекламы нет. Попробуйте позже.');
        });
}