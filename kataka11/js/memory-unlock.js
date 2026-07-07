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
            console.log(`🔍 Проверка уровня ${level} (локально): ${val}`);
            resolve(val === 'true');
            return;
        }

        bridge.send('VKWebAppStorageGet', { keys: [key] })
            .then(data => {
                const value = data.keys[0]?.value;
                console.log(`🔍 Проверка уровня ${level} (VK Storage): ${value}`);
                resolve(value === 'true');
            })
            .catch(() => {
                const val = localStorage.getItem(key);
                console.log(`🔍 Проверка уровня ${level} (fallback): ${val}`);
                resolve(val === 'true');
            });
    });
}

function setMemoryLevelUnlocked(level) {
    const key = `memory_unlock_${level}`;
    const bridge = window.vkBridge;

    localStorage.setItem(key, 'true');
    console.log(`💾 Сохранено локально: ${key}=true`);

    if (bridge) {
        bridge.send('VKWebAppStorageSet', { key: key, value: 'true' })
            .then(() => {
                console.log(`💾 Сохранено в VK Storage: ${key}=true`);
            })
            .catch(err => {
                console.error(`❌ Ошибка сохранения в VK Storage:`, err);
            });
    }
}

// ===== ОБНОВЛЕНИЕ КНОПКИ =====
function updateMemoryButtonState(level, unlocked) {
    const selector = `.memory-btn[data-level="${level}"]`;
    const btn = document.querySelector(selector);
    if (!btn) {
        console.warn(`⚠️ Кнопка для уровня ${level} не найдена`);
        return;
    }

    console.log(`🔄 Обновление кнопки уровня ${level}: разблокировано = ${unlocked}`);

    if (unlocked) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.dataset.unlocked = 'true';
        // Восстанавливаем href
        const originalHref = btn.dataset.originalHref;
        if (originalHref) {
            btn.href = originalHref;
        }
        // Восстанавливаем текст
        const originalText = btn.dataset.originalText;
        if (originalText) {
            btn.innerHTML = originalText;
        }
    } else {
        btn.classList.add('locked');
        btn.classList.remove('unlocked');
        btn.dataset.unlocked = 'false';
        if (!btn.dataset.originalHref) {
            btn.dataset.originalHref = btn.href || '';
        }
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
        }
        btn.removeAttribute('href');
        if (!btn.innerHTML.includes('🔒')) {
            btn.innerHTML = `🔒 ${btn.dataset.originalText}`;
        }
    }
}

// ===== ЗАГРУЗКА СТАТУСОВ =====
async function loadAllMemoryStatuses() {
    console.log('🔄 Загрузка статусов разблокировки памяти...');
    for (let level = 1; level <= 9; level++) {
        const unlocked = await isMemoryLevelUnlocked(level);
        updateMemoryButtonState(level, unlocked);
    }
    console.log('✅ Статусы памяти загружены');
}

// ===== МОДАЛКИ =====
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

// ===== ПОКАЗ РЕКЛАМЫ (упрощённо, как в hunt-unlock.js) =====
function showRewardedAdForMemory(level) {
    const bridge = window.vkBridge;

    if (!bridge) {
        showMemoryErrorModal('Реклама недоступна без подключения к интернету. Проверьте соединение.');
        return;
    }

    clearMemoryAdResources();
    memoryAdResolved = false;

    console.log(`📺 Запуск рекламы для уровня ${level}`);

    // Показываем рекламу – награда выдаётся сразу в then
    bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then(function(data) {
            memoryAdResolved = true;
            clearMemoryAdResources();
            console.log('✅ Реклама за вознаграждение показана, награда выдана:', data);
            // Скрываем модалку загрузки
            hideMemoryLoadingModal();
            // Разблокируем уровень
            setMemoryLevelUnlocked(level);
            updateMemoryButtonState(level, true);
            loadAllMemoryStatuses(); // обновить все кнопки
            showMemorySuccessModal();
        })
        .catch(function(error) {
            memoryAdResolved = true;
            clearMemoryAdResources();
            console.log("❌ Ошибка или реклама не досмотрена:", error);
            hideMemoryLoadingModal();
            showMemoryErrorModal('Реклама недоступна. Попробуйте позже.');
        });
}

// ===== ОБРАБОТЧИК КЛИКА НА ЗАБЛОКИРОВАННУЮ КНОПКУ =====
function handleMemoryButtonClick(e) {
    const btn = e.target.closest('.memory-btn');
    if (!btn) return;

    const level = parseInt(btn.dataset.level);
    if (!level) return;

    // Если кнопка разблокирована – разрешаем переход
    if (btn.dataset.unlocked === 'true') return;

    e.preventDefault();
    console.log(`🔘 Клик по заблокированной кнопке уровня ${level}`);
    currentMemoryUnlockLevel = level;
    showMemoryUnlockModal(level);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация memory-unlock.js');

    // Загружаем статусы
    loadAllMemoryStatuses();

    // Делегирование на контейнере с кнопками
    const container = document.querySelector('.memory-menu-grid');
    if (container) {
        container.addEventListener('click', handleMemoryButtonClick);
        console.log('✅ Обработчик клика навешен на .memory-menu-grid');
    } else {
        console.warn('⚠️ Контейнер .memory-menu-grid не найден');
    }

    // Обработчики модалок
    const confirmBtn = document.getElementById('memoryUnlockConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (!currentMemoryUnlockLevel) return;
            console.log(`✅ Подтверждена разблокировка уровня ${currentMemoryUnlockLevel}`);
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

// Перезагрузка статусов после инициализации VK
window.onVKReady = window.onVKReady || function() {};
const originalOnVKReady = window.onVKReady;
window.onVKReady = function() {
    if (typeof originalOnVKReady === 'function') originalOnVKReady();
    console.log('🔄 VK готов, перезагружаем статусы памяти');
    loadAllMemoryStatuses();
};