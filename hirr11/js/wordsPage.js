// js/wordsPage.js
// Управление страницей выбора уровней (words.html)
// Таймаут убран – модалка загрузки скрывается при любом ответе от рекламы

let currentUnlockLevel = null;
let adResultHandler = null;
let adResolved = false;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof vkBridge !== 'undefined') {
        window.vkBridge = vkBridge;
    }

    loadAllStatuses();

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

    document.getElementById('unlockConfirm').addEventListener('click', function() {
        hideModal('unlockModal');
        showModal('loadingModal');
        showRewardedAd(currentUnlockLevel);
    });

    document.getElementById('unlockCancel').addEventListener('click', function() {
        hideModal('unlockModal');
        currentUnlockLevel = null;
        clearAdResources();
    });

    document.getElementById('okBtn').addEventListener('click', function() {
        hideModal('successModal');
        if (currentUnlockLevel) {
            updateButtonState(currentUnlockLevel, true);
            currentUnlockLevel = null;
        }
    });

    document.getElementById('errorOkBtn').addEventListener('click', function() {
        hideModal('errorModal');
        clearAdResources();
        currentUnlockLevel = null;
    });

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
    hideModal('errorModal'); // на всякий случай
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

// ===== ОЧИСТКА ПОДПИСКИ =====
function clearAdResources() {
    if (adResultHandler) {
        const bridge = window.vkBridge;
        if (bridge && bridge.unsubscribe) {
            bridge.unsubscribe(adResultHandler);
        }
        adResultHandler = null;
    }
    adResolved = false;
}

// ===== ПОКАЗ РЕКЛАМЫ (БЕЗ ТАЙМАУТА) =====
function showRewardedAd(level) {
    const bridge = window.vkBridge;

    if (!bridge) {
        // Если нет VK Bridge –
        showErrorModal('Реклама недоступна без интернета. Проверьте соединение.');
        return;
    }

    clearAdResources();
    adResolved = false;

    // Подписка на событие результата (награда)
    const handler = (e) => {
        if (e.detail.type === 'VKWebAppNativeAdResult' && !adResolved) {
            adResolved = true;
            clearAdResources();
            console.log('🎁 Получен результат рекламы:', e.detail.data);
            if (e.detail.data.result === true) {
                setLevelUnlocked(level);
                updateButtonState(level, true);
                showSuccessModal();
            } else {
                // Закрыто крестиком или не досмотрено
                showErrorModal('Реклама не была завершена. Попробуйте ещё раз.');
            }
        }
    };
    bridge.subscribe(handler);
    adResultHandler = handler;

    // Запуск рекламы
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(() => {
            return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
        })
        .then((data) => {
            console.log('📺 Реклама показана, ожидаем результат...', data);
        })
        .catch((err) => {
            console.error('❌ Ошибка при запуске рекламы:', err);
            if (!adResolved) {
                adResolved = true;
                clearAdResources();
                showErrorModal('Ой, рекламы нет. Попробуйте позже.');
            }
        });
}