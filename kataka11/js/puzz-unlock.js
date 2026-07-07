// js/puzz-unlock.js
// Управление замками для уровней пятнашек (2-5)
// Использует VK Storage и localStorage

let currentPuzzLevel = null;
let adPuzzHandler = null;
let adPuzzResolved = false;

// ===== ПРОВЕРКА СТАТУСА =====
function isPuzzLevelUnlocked(level) {
    return new Promise((resolve) => {
        const key = `puzz_unlock_${level}`;
        const bridge = window.vkBridge;
        if (!bridge) {
            resolve(localStorage.getItem(key) === 'true');
            return;
        }
        bridge.send('VKWebAppStorageGet', { keys: [key] })
            .then(data => {
                const val = data.keys[0]?.value;
                resolve(val === 'true');
            })
            .catch(() => {
                resolve(localStorage.getItem(key) === 'true');
            });
    });
}

function setPuzzLevelUnlocked(level) {
    const key = `puzz_unlock_${level}`;
    localStorage.setItem(key, 'true');
    const bridge = window.vkBridge;
    if (bridge) {
        bridge.send('VKWebAppStorageSet', { key, value: 'true' }).catch(console.error);
    }
}

function updatePuzzButtonState(level, unlocked) {
    const btn = document.querySelector(`.puzz-btn[data-level="${level}"]`);
    if (!btn) return;
    if (unlocked) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        btn.dataset.unlocked = 'true';
        btn.href = `puzz${level}.html`;
    } else {
        btn.classList.add('locked');
        btn.classList.remove('unlocked');
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = `🔒 Уровень ${level}`;
        btn.dataset.unlocked = 'false';
        btn.removeAttribute('href');
    }
}

async function loadAllPuzzStatuses() {
    for (let level = 2; level <= 5; level++) {
        const unlocked = await isPuzzLevelUnlocked(level);
        updatePuzzButtonState(level, unlocked);
    }
}

// Модалки (используем те же, что и в охоте, с другими id, но можно переиспользовать)
function showPuzzModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
}
function hidePuzzModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

function showPuzzUnlockModal(level) {
    currentPuzzLevel = level;
    showPuzzModal('puzzUnlockModal');
}
function showPuzzLoading() { showPuzzModal('puzzLoadingModal'); }
function hidePuzzLoading() { hidePuzzModal('puzzLoadingModal'); }
function showPuzzSuccess() { hidePuzzLoading(); showPuzzModal('puzzSuccessModal'); }
function showPuzzError(msg) {
    hidePuzzLoading();
    const errEl = document.getElementById('puzzErrorText');
    if (errEl) errEl.textContent = msg || 'Реклама недоступна. Попробуйте позже.';
    showPuzzModal('puzzErrorModal');
}

function clearAdPuzzResources() {
    if (adPuzzHandler) {
        const bridge = window.vkBridge;
        if (bridge && bridge.unsubscribe) bridge.unsubscribe(adPuzzHandler);
        adPuzzHandler = null;
    }
    adPuzzResolved = false;
}

function showRewardedAdForPuzz(level) {
    const bridge = window.vkBridge;
    if (!bridge) {
        showPuzzError('Реклама недоступна без интернета.');
        return;
    }
    clearAdPuzzResources();
    adPuzzResolved = false;

    const handler = (e) => {
        if (e.detail.type === 'VKWebAppNativeAdResult' && !adPuzzResolved) {
            adPuzzResolved = true;
            clearAdPuzzResources();
            if (e.detail.data.result === true) {
                setPuzzLevelUnlocked(level);
                updatePuzzButtonState(level, true);
                showPuzzSuccess();
            } else {
                showPuzzError('Реклама не была завершена.');
            }
        }
    };
    bridge.subscribe(handler);
    adPuzzHandler = handler;

    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(() => bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' }))
        .then(() => {
            console.log('📺 Реклама для пятнашек показана');
            hidePuzzLoading(); // скрываем загрузку сразу
        })
        .catch((err) => {
            console.error('❌ Ошибка рекламы пятнашек:', err);
            if (!adPuzzResolved) {
                adPuzzResolved = true;
                clearAdPuzzResources();
                showPuzzError('Ой, рекламы нет.');
            }
        });
}

// Обработчик кликов по кнопкам (делегирование)
function handlePuzzClick(e) {
    const btn = e.target.closest('.puzz-btn');
    if (!btn) return;
    if (btn.dataset.unlocked === 'true') return;
    const level = parseInt(btn.dataset.level);
    if (!level || level < 2) return;
    e.preventDefault();
    showPuzzUnlockModal(level);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadAllPuzzStatuses();

    const container = document.querySelector('.puzz-grid');
    if (container) container.addEventListener('click', handlePuzzClick);

    // Обработчики модалок
    document.getElementById('puzzUnlockConfirm')?.addEventListener('click', function() {
        if (!currentPuzzLevel) return;
        hidePuzzModal('puzzUnlockModal');
        showPuzzLoading();
        showRewardedAdForPuzz(currentPuzzLevel);
    });
    document.getElementById('puzzUnlockCancel')?.addEventListener('click', function() {
        hidePuzzModal('puzzUnlockModal');
        currentPuzzLevel = null;
        clearAdPuzzResources();
    });
    document.getElementById('puzzSuccessOk')?.addEventListener('click', function() {
        hidePuzzModal('puzzSuccessModal');
        currentPuzzLevel = null;
    });
    document.getElementById('puzzErrorOk')?.addEventListener('click', function() {
        hidePuzzModal('puzzErrorModal');
        currentPuzzLevel = null;
        clearAdPuzzResources();
    });
    // Закрытие по фону
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hidePuzzModal('puzzUnlockModal');
                hidePuzzModal('puzzLoadingModal');
                hidePuzzModal('puzzSuccessModal');
                hidePuzzModal('puzzErrorModal');
                currentPuzzLevel = null;
                clearAdPuzzResources();
            }
        });
    });
});

// Перезагрузка статусов после инициализации VK
window.onVKReady = function() {
    console.log('🔄 VK готов, перезагружаем статусы пятнашек');
    loadAllPuzzStatuses();
};