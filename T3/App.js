// ====== ПЛАТФОРМА (VK / OK) ======
const __P = window.__PLATFORM || {
    isVK: true, isOK: false, platform: 'vk',
    userId: 0, storagePrefix: '', launchParams: {}
};
const STORAGE_PREFIX   = __P.storagePrefix;   // '' для VK, 'ok_' для OK
const IS_OK_PLATFORM   = __P.isOK;

let vkInitialized = false;
let lastAdShowTime = 0; 
const APP_ID = 54659768;  
let vkUserId = __P.userId || null;
const ServToken = '36bb7f1c36bb7f1c36bb7f1c6335f975a4336bb36bb7f1c5cf8d7250dc913db99e9ea4d';
const CLIENT_SECRET = 'p0sFumHyX0ZUHVyt3hoc';  
// ======================== VK STORAGE ========================
const VK_STORAGE_KEYS = {
    TOTAL_SCORE: 'tetris_total_score_v1',
    SCROLLS_PROGRESS: 'tetris_scrolls_v1',
    COLLECTIONS_PROGRESS: 'tetris_collections_v1',
    PLAYED_DIFFICULTIES: 'tetris_difficulties_v1',
    DAILY_BONUS: 'tetris_daily_bonus_v1',
    HIGHSCORE: 'tetris_highscore_v1'
};


function saveToVKStorage(key, value) {
    if (typeof vkBridge === 'undefined') return Promise.resolve();
    const prefixedKey = STORAGE_PREFIX + key;  
    return vkBridge.send('VKWebAppStorageSet', {
        key: prefixedKey,
        value: typeof value === 'string' ? value : JSON.stringify(value)
    }).then(() => console.log(`✅ Сохранено в VK Storage: ${prefixedKey}`))
    .catch(error => console.warn(`❌ Ошибка сохранения ${prefixedKey}:`, error));
}

function loadFromVKStorage(key) {
    if (typeof vkBridge === 'undefined') return Promise.resolve(null);
    const prefixedKey = STORAGE_PREFIX + key;   
    return vkBridge.send('VKWebAppStorageGet', { keys: [prefixedKey] })
        .then(data => {
            if (data && data.keys && data.keys.length > 0) {
                const value = data.keys[0].value;
                try { return JSON.parse(value); } catch { return value; }
            }
            return null;
        })
        .catch(error => { console.warn(`❌ Ошибка загрузки ${prefixedKey}:`, error); return null; });
}

function syncAllDataToVK() {
    console.log('🔄 Синхронизация данных с VK Storage...');
    const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
    const scrollsProgress = JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
    const collectionsProgress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    const dailyBonusDate = localStorage.getItem('dailyBonusDate') || null;
    const highscore = parseInt(localStorage.getItem('vkHighscore') || localStorage.getItem('localHighscore') || '0');
    return Promise.all([
        saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, totalScore),
        saveToVKStorage(VK_STORAGE_KEYS.SCROLLS_PROGRESS, scrollsProgress),
        saveToVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS, collectionsProgress),
        saveToVKStorage(VK_STORAGE_KEYS.PLAYED_DIFFICULTIES, playedDifficulties),
        saveToVKStorage(VK_STORAGE_KEYS.DAILY_BONUS, dailyBonusDate),
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, highscore)
    ]).then(() => console.log('✅ Полная синхронизация завершена'))
    .catch(error => console.warn('⚠️ Ошибка синхронизации:', error));
}

function loadAllDataFromVK() {
    console.log('🔄 Загрузка данных из VK Storage...');
    return Promise.all([
        loadFromVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE),
        loadFromVKStorage(VK_STORAGE_KEYS.SCROLLS_PROGRESS),
        loadFromVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS),
        loadFromVKStorage(VK_STORAGE_KEYS.PLAYED_DIFFICULTIES),
        loadFromVKStorage(VK_STORAGE_KEYS.DAILY_BONUS),
        loadFromVKStorage(VK_STORAGE_KEYS.HIGHSCORE)
    ]).then(([totalScore, scrollsProgress, collectionsProgress, playedDifficulties, dailyBonusDate, highscore]) => {
        let loaded = false;
        if (totalScore !== null && totalScore !== undefined) {
            const merged = Math.max(parseInt(localStorage.getItem('totalScore') || '0'), parseInt(totalScore) || 0);
            if (merged > parseInt(localStorage.getItem('totalScore') || '0')) {
                localStorage.setItem('totalScore', merged);
                loaded = true;
                console.log(`✅ Общий счёт загружен из VK: ${merged}`);
            }
        }
        if (scrollsProgress && typeof scrollsProgress === 'object') {
            const current = JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
            const merged = { ...current };
            let changed = false;
            for (const key in scrollsProgress) {
                if (scrollsProgress[key] && !merged[key]) { merged[key] = true; changed = true; }
            }
            if (changed) {
                localStorage.setItem('scrollsProgress', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Свитки объединены: ${Object.keys(merged).length}`);
            }
        }
        if (collectionsProgress && typeof collectionsProgress === 'object') {
            const current = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
            const merged = { ...current };
            let changed = false;
            for (const key in collectionsProgress) {
                if (collectionsProgress[key] && !merged[key]) { merged[key] = true; changed = true; }
            }
            if (changed) {
                localStorage.setItem('collectionsProgress', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Коллекции объединены: ${Object.keys(merged).length}`);
            }
        }
        if (playedDifficulties && Array.isArray(playedDifficulties)) {
            const current = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
            const merged = [...new Set([...current, ...playedDifficulties])];
            if (merged.length > current.length) {
                localStorage.setItem('playedDifficulties', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Сложности объединены: ${merged.join(', ')}`);
            }
        }
        if (dailyBonusDate && typeof dailyBonusDate === 'string') {
            const current = localStorage.getItem('dailyBonusDate');
            if (!current || dailyBonusDate > current) {
                localStorage.setItem('dailyBonusDate', dailyBonusDate);
                loaded = true;
                console.log(`✅ Дата бонуса загружена: ${dailyBonusDate}`);
            }
        }
        if (highscore !== null && highscore !== undefined) {
            const current = parseInt(localStorage.getItem('vkHighscore') || localStorage.getItem('localHighscore') || '0');
            const merged = Math.max(current, parseInt(highscore) || 0);
            if (merged > current) {
                localStorage.setItem('vkHighscore', merged);
                localStorage.setItem('localHighscore', merged);
                window.vkHighscore = merged;
                loaded = true;
                console.log(`✅ Рекорд загружен из VK: ${merged}`);
                if (typeof updateRecordText === 'function') updateRecordText(`Рекорд: ${merged}`);
            }
        }
        if (!loaded) console.log('ℹ️ В VK Storage нет новых данных');
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
        if (typeof updateCollectionsProgress === 'function') updateCollectionsProgress();
        if (typeof updateScrollsProgress === 'function') updateScrollsProgress();
        setTimeout(syncAllDataToVK, 1000);
        return loaded;
    }).catch(error => { console.warn('⚠️ Ошибка загрузки из VK:', error); return false; });
}

// ======================== ИНИЦИАЛИЗАЦИЯ VK ========================
function initVKSDK() {
    const ready = window.__vkBridgeReady || Promise.resolve(window.vkBridge);
    ready.then(function (bridge) {
        if (!bridge) {
            console.warn('VK Bridge не найден');
            updateRecordText('Рекорд: 0');
            updateHighscoreDisplay();
            return;
        }
        window.vkBridge = bridge;

        return bridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK SDK инициализирован (' + (IS_OK_PLATFORM ? 'OK' : 'VK') + ')');
                vkInitialized = true;
                return bridge.send('VKWebAppGetLaunchParams');
            })
            .then((launchParams) => {
                // userId: __PLATFORM приоритетнее launchParams
                const userId = __P.userId ||
                               launchParams.vk_user_id ||
                               launchParams.vk_original_vk_id ||
                               launchParams.vk_ok_user_id ||
                               launchParams.viewer_id;
                if (userId) {
                    vkUserId = userId;
                    window.vkUserId = userId;
                    localStorage.setItem('vk_user_id', userId);
                    console.log('👤 ID пользователя:', userId);
                }
                // Загружаем рекорд и остальные данные
                loadVKHighScore();
                return loadAllDataFromVK();
            })
            .then(() => {
                if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
                if (typeof updateCollectionsProgress === 'function') updateCollectionsProgress();
                if (typeof updateDailyBonusStatus === 'function') updateDailyBonusStatus();
                showBannerWithRetry();
                console.log('✅ Все данные загружены');
            });
    }).catch((err) => {
        console.warn('⚠️ Ошибка initVKSDK:', err);
        vkInitialized = false;
        const savedId = localStorage.getItem('vk_user_id');
        if (savedId) {
            vkUserId = savedId;
            window.vkUserId = savedId;
        }
        updateRecordText('Рекорд: 0');
        updateHighscoreDisplay();
    });
}

// ======================== РЕКОРДЫ ========================
function saveVKScore(scoreValue) {
    console.log(`💾 saveVKScore: ${scoreValue}`);
    if (!vkInitialized || !vkUserId || scoreValue <= 0) {
        saveLocalScore(scoreValue);
        return;
    }

    // 1. Локально обновляем сразу, если улучшение
    const currentLocal = parseInt(localStorage.getItem('localHighscore') || '0');
    if (scoreValue > currentLocal) {
        window.vkHighscore = scoreValue;
        localStorage.setItem('localHighscore', scoreValue);
        localStorage.setItem('vkHighscore', scoreValue);
        updateRecordText(`Рекорд: ${scoreValue}`);
        updateHighscoreDisplay();
    }

    // 2. В VK API — только если реально улучшили отправленное значение
    const lastSent = parseInt(localStorage.getItem('tetris_lastSentScore') || '0');
    if (scoreValue <= lastSent) {
        return;   // уже отправляли больше — не спамим API
    }

    // 3. VK Storage обновляем всегда (это дёшево) — но не блокируем UI
    saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, scoreValue);

    // 4. API отправляем только на улучшение
    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'secure.addAppEvent',
        request_id: 'addScore_' + Date.now(),
        params: {
            client_secret: CLIENT_SECRET,
            user_id: vkUserId,
            activity_id: 2,
            value: scoreValue,
            v: '5.131',
            global: 1,
            access_token: ServToken
        }
    })
    .then(() => {
        localStorage.setItem('tetris_lastSentScore', String(scoreValue));
        console.log(`✅ ${scoreValue} отправлено в лидерборд (${IS_OK_PLATFORM ? 'OK' : 'VK'})`);
    })
    .catch(err => {
        console.warn('⚠️ secure.addAppEvent не сработал:', err);
    });
}

function saveLocalScore(scoreValue) {
    const current = parseInt(localStorage.getItem('localHighscore') || '0');
    if (scoreValue > current) {
        localStorage.setItem('localHighscore', scoreValue);
        localStorage.setItem('vkHighscore', scoreValue);
        window.vkHighscore = scoreValue;
        updateRecordText(`Рекорд: ${scoreValue}`);
        updateHighscoreDisplay();
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, scoreValue);
    }
}

function loadVKHighScore() {
    // Локальный рекорд — база
    const localHS = Math.max(
        parseInt(localStorage.getItem('vkHighscore') || '0'),
        parseInt(localStorage.getItem('localHighscore') || '0')
    );

    // Из VK Storage (с префиксом ok_ в OK)
    loadFromVKStorage(VK_STORAGE_KEYS.HIGHSCORE).then(s => {
        const storageScore = parseInt(s) || 0;
        console.log(`🏆 VK Storage рекорд (${IS_OK_PLATFORM ? 'OK' : 'VK'}): ${storageScore}`);
        applyHighscore(Math.max(storageScore, localHS));
    }).catch(() => {
        applyHighscore(localHS);
    });
}

function applyHighscore(score) {
    const s = Math.max(0, parseInt(score) || 0);
    window.vkHighscore = s;
    localStorage.setItem('vkHighscore', s);
    localStorage.setItem('localHighscore', s);
    const lastSent = parseInt(localStorage.getItem('tetris_lastSentScore') || '0');
    if (s > lastSent) localStorage.setItem('tetris_lastSentScore', String(s));
    updateRecordText(`Рекорд: ${s}`);
    updateHighscoreDisplay();
    return s;
}

function updateRecordText(text) {
    const topEl = document.getElementById('yandex-highscore-top');
    const sideEl = document.getElementById('yandex-highscore-side');
    if (topEl) topEl.innerText = text;
    if (sideEl) sideEl.innerText = text;
}

function updateHighscoreDisplay() {
    let current = 0;
    if (typeof window.vkHighscore !== 'undefined' && window.vkHighscore > 0) {
        current = window.vkHighscore;
    } else {
        current = Math.max(parseInt(localStorage.getItem('vkHighscore') || '0'), parseInt(localStorage.getItem('localHighscore') || '0'));
        window.vkHighscore = current;
    }
    const text = 'Рекорд: ' + current;
    const side = document.getElementById('yandex-highscore-side');
    const top = document.getElementById('yandex-highscore-top');
    if (side) side.innerHTML = text;
    if (top) top.innerHTML = text;
    console.log('🏆 Рекорд обновлён в интерфейсе:', current);
}


function showVKLeaderboard() {
    if (IS_OK_PLATFORM) return;                       // в ОК — тихо ничего
    if (typeof vkBridge === 'undefined' || !vkBridge.send) return;

    let highScore = Math.max(
        window.vkHighscore || 0,
        parseInt(localStorage.getItem('vkHighscore') || '0'),
        parseInt(localStorage.getItem('localHighscore') || '0')
    );
    if (highScore < 1) highScore = 1;

    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: highScore,
        global: 1
    }).catch(function () {});
}

// ======================== ПРИГЛАШЕНИЕ ДРУЗЕЙ ========================
function inviteFriends() {
    // В ОК ничего не делаем — там своё нативное окно
    if (IS_OK_PLATFORM) return;
    // В VK просто отправляем команду мосту, без модалок и swal
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppShowInviteBox').catch(function () {});
    }
}

// ======================== ОБЩИЙ ПРОГРЕСС ========================
function saveTotalProgress() {
    if (typeof player === 'undefined' || !player) return;
    const current = player.score || 0;
    const total = parseInt(localStorage.getItem('totalScore') || '0') + current;
    localStorage.setItem('totalScore', total);
    window.totalScore = total;
    saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, total);
    console.log(`📊 Общий прогресс: +${current} = ${total} очков`);
}


// ======================== КОЛЛЕКЦИИ ========================
function claimCollectionItemWithSync(itemId) {
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    if (progress[itemId]) return false;
    progress[itemId] = true;
    localStorage.setItem('collectionsProgress', JSON.stringify(progress));
    saveToVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS, progress);
    console.log(`🖼️ Картинка ${itemId} открыта и синхронизирована`);
    return true;
}

// ======================== ЗАПУСК ========================
initVKSDK();

/* ===== БАННЕР С РЕТРАЕМ (VK + OK) ===== */
let __bannerShown = false;
let __bannerRetryTimer = null;
let __bannerAttempts = 0;
const __BANNER_MAX = 3;
const __BANNER_DELAY = 5000;

function showBannerWithRetry() {
    if (__bannerShown) return;
    if (typeof vkBridge === 'undefined') return;
    if (__bannerRetryTimer) return;

    __bannerAttempts++;
    const n = __bannerAttempts;
    console.log('🎯 Banner attempt #' + n);

    vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' })
        .then(function (data) {
            const ok = data && (data.result === true || data.result === 1);
            if (ok) {
                __bannerShown = true;
                console.log('✅ Banner shown #' + n);
                return;
            }
            console.warn('⚠️ Banner not shown #' + n, data);
            scheduleBannerRetry(n);
        })
        .catch(function (err) {
            console.warn('❌ Banner error #' + n, err);
            scheduleBannerRetry(n);
        });
}

function scheduleBannerRetry(attemptNo) {
    if (__bannerShown) return;
    if (attemptNo >= __BANNER_MAX) {
        console.warn('⛔ Banner retry limit (' + __BANNER_MAX + ')');
        return;
    }
    __bannerRetryTimer = setTimeout(function () {
        __bannerRetryTimer = null;
        showBannerWithRetry();
    }, __BANNER_DELAY);
    console.log('🔁 Banner retry in ' + (__BANNER_DELAY / 1000) + 's (#' + (attemptNo + 1) + ')');
}

// ======================== КАСТОМНАЯ МОДАЛКА ========================
function showCustomModal({ title, text, type = 'info', button = 'OK', timer = null }) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100012;
        display: flex;
        justify-content: center;
        align-items: center;
        background: url('1.jpg') no-repeat center center fixed;
        background-size: cover;
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.1);
        z-index: -1;
    `;
    modal.appendChild(overlay);
    
    const icons = {
        success: '✅',
        error: '❌',
             warning: '⚠️'
    };
    
    modal.innerHTML += `
        <div  class="modal-content" style="background: rgba(20, 20, 30, 0.92); border: 2px solid ${type === 'success' ? 'rgba(34, 197, 94, 0.4)' : type === 'error' ? 'rgba(239, 68, 68, 0.4)' : type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(52, 211, 153, 0.3)'}; width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                     <h2 style="color: ${type === 'success' ? '#34d399' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#34d399'};  text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                ${title}
            </h2>
            <p style="color: #94a3b8;  font-family: 'Russo One', sans-serif; line-height: 1.6;">
                ${text}
            </p>
            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="width: 100%;  font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">
                ${button}
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (timer) {
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, timer);
    }
    
    // Закрытие по клику вне модалки
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Экспорт
window.showCustomModal = showCustomModal;