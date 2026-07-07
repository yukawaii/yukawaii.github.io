// js/hunt-unlock.js
// Управление замками для уровней охоты (30 и 50 мор)
// Использует VK Storage (и localStorage как fallback) для синхронизации

let currentUnlockData = null; // { level: 'easy', count: 30 }
let adTimeoutId = null;
let adResultHandler = null;
let adResolved = false;

// ===== ПРОВЕРКА СТАТУСА РАЗБЛОКИРОВКИ =====
function isHuntLevelUnlocked(level, count) {
    return new Promise((resolve) => {
        const key = `hunt_unlock_${level}_${count}`;
        const bridge = window.vkBridge;

        if (!bridge) {
            const val = localStorage.getItem(key);
            resolve(val === 'true');
            return;
        }

        bridge.send('VKWebAppStorageGet', { keys: [key] })
            .then(data => {
                const value = data.keys[0]?.value;
                resolve(value === 'true');
            })
            .catch(() => {
                // Если ошибка – пробуем localStorage
                const val = localStorage.getItem(key);
                resolve(val === 'true');
            });
    });
}

// ===== СОХРАНЕНИЕ СТАТУСА РАЗБЛОКИРОВКИ =====
function setHuntLevelUnlocked(level, count) {
    const key = `hunt_unlock_${level}_${count}`;
    const bridge = window.vkBridge;

    // Всегда сохраняем в localStorage
    localStorage.setItem(key, 'true');

    if (bridge) {
        bridge.send('VKWebAppStorageSet', {
            key: key,
            value: 'true'
        }).catch(console.error);
    }
}

// ===== ОБНОВЛЕНИЕ UI КНОПОК =====
function updateHuntButtonState(level, count, unlocked) {
    const selector = `.hunt-btn[data-level="${level}"][data-count="${count}"]`;
    const btn = document.querySelector(selector);
    if (!btn) return;

    if (unlocked) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.innerHTML = `${count} <small>мор</small>`;
        btn.disabled = false;
        btn.href = `hunt-game.html?level=${level}&count=${count}`;
    } else {
        btn.classList.add('locked');
        btn.classList.remove('unlocked');
        btn.innerHTML = `🔒 ${count} <small>мор</small>`;
        btn.disabled = false; // чтобы клик работал для показа модалки
        btn.removeAttribute('href'); // убираем переход
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            currentUnlockData = { level, count };
            showUnlockModal(level, count);
        });
    }
}

// ===== ЗАГРУЗКА СТАТУСОВ ДЛЯ ВСЕХ УРОВНЕЙ =====
async function loadAllHuntStatuses() {
    const levels = ['easy', 'medium'];
    const counts = [30, 50];

    for (let level of levels) {
        for (let count of counts) {
            const unlocked = await isHuntLevelUnlocked(level, count);
            updateHuntButtonState(level, count, unlocked);
        }
    }
}

// ===== МОДАЛКИ (добавляем их в HTML) =====
function showUnlockModal(level, count) {
    const modal = document.getElementById('huntUnlockModal');
    if (modal) modal.classList.add('show');
}

function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

function showLoadingModal() {
    const modal = document.getElementById('huntLoadingModal');
    if (modal) modal.classList.add('show');
}

function hideLoadingModal() {
    const modal = document.getElementById('huntLoadingModal');
    if (modal) modal.classList.remove('show');
}

function showSuccessModal() {
    hideLoadingModal();
    const modal = document.getElementById('huntSuccessModal');
    if (modal) modal.classList.add('show');
}

function showErrorModal(message) {
    hideLoadingModal();
    const modal = document.getElementById('huntErrorModal');
    if (modal) {
        document.getElementById('huntErrorText').textContent = message || 'Ой, рекламы нет. Попробуйте позже.';
        modal.classList.add('show');
    }
}

// ===== ОЧИСТКА РЕСУРСОВ =====
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
    adResolved = false;
}

// ===== ПОКАЗ РЕКЛАМЫ (БЕЗ ТАЙМАУТА) =====
function showRewardedAdForHunt(level, count) {
    const bridge = window.vkBridge;

    if (!bridge) {
        // Если нет VK Bridge – разблокируем бесплатно (для тестов)
       showErrorModal('Реклама недоступна без интернета. Проверьте соединение.');
        return;
    }

    clearAdResources();
    adResolved = false;

    // Подписка на событие результата
    const handler = (e) => {
        if (e.detail.type === 'VKWebAppNativeAdResult' && !adResolved) {
            adResolved = true;
            clearAdResources();
            console.log('🎁 Получен результат рекламы:', e.detail.data);
            if (e.detail.data.result === true) {
                setHuntLevelUnlocked(level, count);
                updateHuntButtonState(level, count, true);
                showSuccessModal();
            } else {
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

// ===== ОБРАБОТЧИК КНОПКИ "ОТКРЫТЬ" =====
function handleUnlockConfirm() {
    if (!currentUnlockData) return;
    hideModal('huntUnlockModal');
    showLoadingModal();
    showRewardedAdForHunt(currentUnlockData.level, currentUnlockData.count);
}

// ===== ЗАКРЫТИЕ МОДАЛОК =====
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем статусы
    loadAllHuntStatuses();

    // Обработчики для модалок
    const confirmBtn = document.getElementById('huntUnlockConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleUnlockConfirm);
    }

    const cancelBtn = document.getElementById('huntUnlockCancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideModal('huntUnlockModal');
            currentUnlockData = null;
            clearAdResources();
        });
    }

    const okBtn = document.getElementById('huntSuccessOk');
    if (okBtn) {
        okBtn.addEventListener('click', function() {
            hideModal('huntSuccessModal');
            currentUnlockData = null;
        });
    }

    const errorOkBtn = document.getElementById('huntErrorOk');
    if (errorOkBtn) {
        errorOkBtn.addEventListener('click', function() {
            hideModal('huntErrorModal');
            currentUnlockData = null;
            clearAdResources();
        });
    }

    // Закрытие по фону
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal('huntUnlockModal');
                hideModal('huntLoadingModal');
                hideModal('huntSuccessModal');
                hideModal('huntErrorModal');
                currentUnlockData = null;
                clearAdResources();
            }
        });
    });
});