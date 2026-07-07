// js/wordsPage.js
// Управление страницей выбора уровней (words.html)
// Используем промис VKWebAppShowNativeAds напрямую, без подписки на событие (как в рабочем коде)

let currentUnlockLevel = null;
let adTimeoutId = null;
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
        showRewardedAdWithTimeout(currentUnlockLevel);
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

// ===== ОЧИСТКА РЕСУРСОВ =====
function clearAdResources() {
    if (adTimeoutId) {
        clearTimeout(adTimeoutId);
        adTimeoutId = null;
    }
    adResolved = false;
}

// ===== ПОКАЗ РЕКЛАМЫ С ТАЙМ-АУТОМ (ПРОМИС) =====
function showRewardedAdWithTimeout(level) {
    const bridge = window.vkBridge;

    if (!bridge) {
        setLevelUnlocked(level);
        updateButtonState(level, true);
        showSuccessModal();
        return;
    }

    clearAdResources();
    adResolved = false;

    // Тайм-аут 15 секунд
    adTimeoutId = setTimeout(() => {
        if (!adResolved) {
            adResolved = true;
            console.warn('⏰ Тайм-аут рекламы (15 сек)');
            showErrorModal('Ой, рекламы нет. Попробуйте позже.');
            clearAdResources();
        }
    }, 15000);

    // Используем метод send (или sendPromise) как в рабочем коде
    const sendMethod = bridge.sendPromise || bridge.send;
    sendMethod.call(bridge, 'VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then((data) => {
            adResolved = true;
            clearAdResources();
            console.log('✅ Реклама за вознаграждение показана, награда выдана:', data);
            // Разблокируем уровень
            setLevelUnlocked(level);
            updateButtonState(level, true);
            showSuccessModal();
        })
        .catch((error) => {
            adResolved = true;
            clearAdResources();
            console.error('❌ Ошибка или реклама не досмотрена:', error);
            showErrorModal('Реклама не была завершена или недоступна. Попробуйте позже.');
        });
}