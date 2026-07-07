// js/hunt-unlock.js
// Управление замками для уровней охоты (30 и 50 мор)
// Использует VK Storage (и localStorage как fallback) для синхронизации

let currentUnlockData = null;
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
                const val = localStorage.getItem(key);
                resolve(val === 'true');
            });
    });
}

// ===== СОХРАНЕНИЕ СТАТУСА РАЗБЛОКИРОВКИ =====
function setHuntLevelUnlocked(level, count) {
    const key = `hunt_unlock_${level}_${count}`;
    const bridge = window.vkBridge;

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
        btn.dataset.unlocked = 'true';
        btn.href = `hunt-game.html?level=${level}&count=${count}`;
    } else {
        btn.classList.add('locked');
        btn.classList.remove('unlocked');
        btn.innerHTML = `🔒 ${count} <small>мор</small>`;
        btn.dataset.unlocked = 'false';
        btn.removeAttribute('href');
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

// ===== МОДАЛКИ =====
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

// ===== ПОКАЗ РЕКЛАМЫ (упрощённо, как в рабочем примере) =====
function showRewardedAdForHunt(level, count) {
    const bridge = window.vkBridge;

    if (!bridge) {
        showErrorModal('Реклама недоступна без подключения к интернету. Проверьте соединение.');
        return;
    }

    clearAdResources();
    adResolved = false;

    // Показываем рекламу – награда выдаётся сразу в then
    bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then(function(data) {
            adResolved = true;
            clearAdResources();
            console.log('✅ Реклама за вознаграждение показана, награда выдана:', data);
            // Скрываем модалку загрузки
            hideLoadingModal();
            // Разблокируем уровень
            setHuntLevelUnlocked(level, count);
            updateHuntButtonState(level, count, true);
            showSuccessModal();
        })
        .catch(function(error) {
            adResolved = true;
            clearAdResources();
            console.log("❌ Ошибка или реклама не досмотрена:", error);
            hideLoadingModal();
            showErrorModal('Реклама недоступна. Попробуйте позже.');
        });
}

// ===== ОБРАБОТЧИК КЛИКА НА ЗАБЛОКИРОВАННУЮ КНОПКУ (делегирование) =====
function handleHuntButtonClick(e) {
    const btn = e.target.closest('.hunt-btn');
    if (!btn) return;
    if (btn.dataset.unlocked === 'true') return; // разблокировано – не обрабатываем

    const level = btn.dataset.level;
    const count = parseInt(btn.dataset.count);
    if (!level || !count) return;

    e.preventDefault();
    currentUnlockData = { level, count };
    showUnlockModal(level, count);
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем статусы
    loadAllHuntStatuses();

    // Навешиваем делегирование на контейнер с кнопками
    const menuWrapper = document.querySelector('.hunt-menu-wrapper');
    if (menuWrapper) {
        menuWrapper.addEventListener('click', handleHuntButtonClick);
    }

    // Обработчики модалок
    const confirmBtn = document.getElementById('huntUnlockConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (!currentUnlockData) return;
            hideModal('huntUnlockModal');
            showLoadingModal();
            showRewardedAdForHunt(currentUnlockData.level, currentUnlockData.count);
        });
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

window.onVKReady = function() {
    console.log('🔄 VK готов, перезагружаем статусы разблокировки охоты');
    loadAllHuntStatuses();
};