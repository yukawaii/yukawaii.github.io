// js/memory-unlock.js
// Управление замками для игры "Память" (уровни 1-9)
// Первые 3 уровня разблокированы по умолчанию, остальные – через рекламу

let currentMemoryUnlockLevel = null;
let memoryAdTimeoutId = null;
let memoryAdResultHandler = null;
let memoryAdResolved = false;

// ===== ПРОВЕРКА СТАТУСА РАЗБЛОКИРОВКИ =====
function isMemoryLevelUnlocked(level) {
    // Первые 3 уровня всегда разблокированы
    if (level <= 3) return Promise.resolve(true);

    return new Promise((resolve) => {
        const key = `memory_unlock_${level}`;
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

function setMemoryLevelUnlocked(level) {
    const key = `memory_unlock_${level}`;
    const bridge = window.vkBridge;

    localStorage.setItem(key, 'true');
    if (bridge) {
        bridge.send('VKWebAppStorageSet', { key: key, value: 'true' })
            .catch(console.error);
    }
}

// ===== ОБНОВЛЕНИЕ КНОПКИ =====
function updateMemoryButtonState(level, unlocked) {
    const selector = `.memory-btn[data-level="${level}"]`;
    const btn = document.querySelector(selector);
    if (!btn) return;

    if (unlocked) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.dataset.unlocked = 'true';
        // Восстанавливаем href (если был удалён)
        const originalHref = btn.dataset.originalHref;
        if (originalHref) {
            btn.href = originalHref;
        }
        // Возвращаем исходный текст (без замка)
        const originalText = btn.dataset.originalText;
        if (originalText) {
            btn.innerHTML = originalText;
        }
    } else {
        btn.classList.add('locked');
        btn.classList.remove('unlocked');
        btn.dataset.unlocked = 'false';
        // Сохраняем исходный href и текст
        if (!btn.dataset.originalHref) {
            btn.dataset.originalHref = btn.href || '';
        }
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
        }
        btn.removeAttribute('href');
        // Добавляем замок перед текстом (сохраняя структуру)
        // Если уже есть замок – не дублируем
        if (!btn.innerHTML.includes('🔒')) {
            btn.innerHTML = `🔒 ${btn.dataset.originalText}`;
        }
    }
}

// ===== ЗАГРУЗКА СТАТУСОВ =====
async function loadAllMemoryStatuses() {
    for (let level = 1; level <= 9; level++) {
        const unlocked = await isMemoryLevelUnlocked(level);
        updateMemoryButtonState(level, unlocked);
    }
}

// ===== МОДАЛКИ (ID с префиксом memory) =====
function showMemoryUnlockModal(level) {
    const modal = document.getElementById('memoryUnlockModal');
    if (modal) modal.classList.add('show');
}

function hideMemoryModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

function showMemoryLoadingModal() {
    const modal = document.getElementById('memoryLoadingModal');
    if (modal) modal.classList.add('show');
}

function hideMemoryLoadingModal() {
    const modal = document.getElementById('memoryLoadingModal');
    if (modal) modal.classList.remove('show');
}

function showMemorySuccessModal() {
    hideMemoryLoadingModal();
    const modal = document.getElementById('memorySuccessModal');
    if (modal) modal.classList.add('show');
}

function showMemoryErrorModal(message) {
    hideMemoryLoadingModal();
    const modal = document.getElementById('memoryErrorModal');
    if (modal) {
        document.getElementById('memoryErrorText').textContent = message || 'Ой, рекламы нет. Попробуйте позже.';
        modal.classList.add('show');
    }
}

// ===== ОЧИСТКА РЕСУРСОВ =====
function clearMemoryAdResources() {
    if (memoryAdTimeoutId) {
        clearTimeout(memoryAdTimeoutId);
        memoryAdTimeoutId = null;
    }
    if (memoryAdResultHandler) {
        const bridge = window.vkBridge;
        if (bridge && bridge.unsubscribe) {
            bridge.unsubscribe(memoryAdResultHandler);
        }
        memoryAdResultHandler = null;
    }
    memoryAdResolved = false;
}

// ===== ПОКАЗ РЕКЛАМЫ =====
function showRewardedAdForMemory(level) {
    const bridge = window.vkBridge;

    if (!bridge) {
        showMemoryErrorModal('Реклама недоступна без подключения к интернету. Проверьте соединение.');
        return;
    }

    clearMemoryAdResources();
    memoryAdResolved = false;

    const handler = (e) => {
        if (e.detail.type === 'VKWebAppNativeAdResult' && !memoryAdResolved) {
            memoryAdResolved = true;
            clearMemoryAdResources();
            console.log('🎁 Получен результат рекламы (память):', e.detail.data);
            if (e.detail.data.result === true) {
                setMemoryLevelUnlocked(level);
                updateMemoryButtonState(level, true);
                showMemorySuccessModal();
            } else {
                showMemoryErrorModal('Реклама не была завершена. Попробуйте ещё раз.');
            }
        }
    };
    bridge.subscribe(handler);
    memoryAdResultHandler = handler;

    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(() => {
            return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
        })
        .then((data) => {
            console.log('📺 Реклама показана (память), ожидаем результат...', data);
            hideMemoryLoadingModal(); // скрываем загрузку сразу после запуска
        })
        .catch((err) => {
            console.error('❌ Ошибка при запуске рекламы (память):', err);
            if (!memoryAdResolved) {
                memoryAdResolved = true;
                clearMemoryAdResources();
                showMemoryErrorModal('Ой, рекламы нет. Попробуйте позже.');
            }
        });
}

// ===== ОБРАБОТЧИК КЛИКА НА ЗАБЛОКИРОВАННУЮ КНОПКУ =====
function handleMemoryButtonClick(e) {
    const btn = e.target.closest('.memory-btn');
    if (!btn) return;
    if (btn.dataset.unlocked === 'true') return;

    const level = parseInt(btn.dataset.level);
    if (!level) return;

    e.preventDefault();
    currentMemoryUnlockLevel = level;
    showMemoryUnlockModal(level);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем статусы
    loadAllMemoryStatuses();

    // Делегирование на контейнере с кнопками
    const container = document.querySelector('.memory-menu-grid');
    if (container) {
        container.addEventListener('click', handleMemoryButtonClick);
    }

    // Обработчики модалок
    const confirmBtn = document.getElementById('memoryUnlockConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (!currentMemoryUnlockLevel) return;
            hideMemoryModal('memoryUnlockModal');
            showMemoryLoadingModal();
            showRewardedAdForMemory(currentMemoryUnlockLevel);
        });
    }

    const cancelBtn = document.getElementById('memoryUnlockCancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideMemoryModal('memoryUnlockModal');
            currentMemoryUnlockLevel = null;
            clearMemoryAdResources();
        });
    }

    const okBtn = document.getElementById('memorySuccessOk');
    if (okBtn) {
        okBtn.addEventListener('click', function() {
            hideMemoryModal('memorySuccessModal');
            currentMemoryUnlockLevel = null;
        });
    }

    const errorOkBtn = document.getElementById('memoryErrorOk');
    if (errorOkBtn) {
        errorOkBtn.addEventListener('click', function() {
            hideMemoryModal('memoryErrorModal');
            currentMemoryUnlockLevel = null;
            clearMemoryAdResources();
        });
    }

    // Закрытие по фону
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideMemoryModal('memoryUnlockModal');
                hideMemoryModal('memoryLoadingModal');
                hideMemoryModal('memorySuccessModal');
                hideMemoryModal('memoryErrorModal');
                currentMemoryUnlockLevel = null;
                clearMemoryAdResources();
            }
        });
    });
});

// Перезагрузка статусов после инициализации VK (если нужно)
window.onVKReady = window.onVKReady || function() {};
const originalOnVKReady = window.onVKReady;
window.onVKReady = function() {
    if (typeof originalOnVKReady === 'function') originalOnVKReady();
    console.log('🔄 VK готов, перезагружаем статусы памяти');
    loadAllMemoryStatuses();
};