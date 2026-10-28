// ============================================================
// App.js — VK Bridge, синхронизация, реклама
// ============================================================
var id,  name1;
if (typeof vkBridge !== 'undefined') window.vkBridge = vkBridge;

const __PLATFORM = window.__PLATFORM || {
    isOK: false, isVK: true, platform: 'vk', userId: 0, storagePrefix: '', launchParams: {}
};
const STORAGE_PREFIX = __PLATFORM.storagePrefix;
const IS_OK_PLATFORM = __PLATFORM.isOK;

let syncTimer = null;
let _unloadSyncDone = false;
// ====== USER ID ======
function getid() {
    if (__PLATFORM.userId) {
        id = __PLATFORM.userId;
        try { sessionStorage.setItem("id", id); } catch (e) {}
        return;
    }
    vkBridge.send("VKWebAppGetUserInfo")
        .then((e) => {
            id = e.id;
            name1 = e.first_name;
            try { sessionStorage.setItem("id", id); } catch (err) {}
        })
        .catch(() => {});
}

// ====== VK STORAGE KEYS (с префиксом платформы) ======
// Прогресс  лежит в отдельных ключах: <prefix>s и <prefix>c_<catId>
// (см. game.js → getProgressStorageEntries / getProgressStorageKeys)
const VK_STORAGE_KEYS = {
    THEME: STORAGE_PREFIX + 'riddles_theme_v1',
    SOUND: STORAGE_PREFIX + 'riddles_sound_v1'
};

// ====== SAVE ======
function saveToVKStorage(key, value) {
    if (typeof vkBridge === 'undefined') return Promise.resolve();
    return vkBridge.send('VKWebAppStorageSet', {
        key: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
    }).catch((err) => { console.warn(`Storage save ${key}:`, err); });
}

// ====== LOAD (сырые строки, без JSON.parse) ======
function loadRawManyFromVKStorage(keys) {
    if (typeof vkBridge === 'undefined' || !keys || !keys.length) return Promise.resolve({});
    const chunks = [];
    for (let i = 0; i < keys.length; i += 10) chunks.push(keys.slice(i, i + 10));

    return Promise.all(chunks.map((chunk) =>
        vkBridge.send('VKWebAppStorageGet', { keys: chunk })
            .then((data) => (data && Array.isArray(data.keys)) ? data.keys : [])
            .catch(() => [])
    )).then((lists) => {
        const out = {};
        lists.forEach((list) => {
            list.forEach((item) => {
                if (item && typeof item.key === 'string') out[item.key] = item.value;
            });
        });
        return out;
    });
}

// ====== SYNC ALL ======
function syncAllDataToVK() {
    if (typeof vkBridge === 'undefined') return Promise.resolve();
    const tasks = [];

    if (typeof window.getProgressStorageEntries === 'function') {
        const entries = window.getProgressStorageEntries() || {};
        for (const key in entries) {
            if (Object.prototype.hasOwnProperty.call(entries, key)) {
                tasks.push(saveToVKStorage(key, String(entries[key])));
            }
        }
    }

    const theme = safeGetLS(VK_STORAGE_KEYS.THEME, 'light');
    const sound = safeGetLS(VK_STORAGE_KEYS.SOUND, '1');
    tasks.push(saveToVKStorage(VK_STORAGE_KEYS.THEME, theme));
    tasks.push(saveToVKStorage(VK_STORAGE_KEYS.SOUND, sound));

    return Promise.all(tasks).catch((err) => { console.warn('⚠️ Sync error:', err); });
}

// ====== SAFE localStorage ======
function safeGetLS(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return v != null ? v : fallback;
    } catch (e) { return fallback; }
}
function safeSetLS(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
}

function loadAllDataFromVK() {
    const progressKeys = (typeof window.getProgressStorageKeys === 'function')
        ? window.getProgressStorageKeys()
        : [];
    const allKeys = [VK_STORAGE_KEYS.THEME, VK_STORAGE_KEYS.SOUND].concat(progressKeys);

    return loadRawManyFromVKStorage(allKeys).then((map) => {
        if (progressKeys.length && typeof window.mergeVKProgress === 'function') {
            const progress = {};
            for (let i = 0; i < progressKeys.length; i++) {
                const k = progressKeys[i];
                if (map[k] != null) progress[k] = map[k];
            }
            window.mergeVKProgress(progress);
        }

        const VALID_THEMES = ['light', 'dark', 'blue', 'green'];
        const theme = map[VK_STORAGE_KEYS.THEME];
        if (typeof theme === 'string' && VALID_THEMES.indexOf(theme) !== -1) {
            safeSetLS(VK_STORAGE_KEYS.THEME, theme);
            if (typeof window.applyTheme === 'function') window.applyTheme(theme, { silent: true });
        }

        const sound = map[VK_STORAGE_KEYS.SOUND];
        if (typeof sound === 'string' && (sound === '0' || sound === '1')) {
            safeSetLS(VK_STORAGE_KEYS.SOUND, sound);
            if (typeof window.applySound === 'function') window.applySound(sound);
        }

        syncAllDataToVK();
        return true;
    }).catch((err) => { console.warn('⚠️ Load error:', err); return false; });
}

// ====== DEBOUNCE ======
function triggerSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { syncTimer = null; syncAllDataToVK(); }, 3000);
}
function immediateSync() {
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
    syncAllDataToVK();
}


function unloadSyncOnce() {
    if (_unloadSyncDone) return;
    _unloadSyncDone = true;
    immediateSync();
}
window.addEventListener('pagehide', unloadSyncOnce);
window.addEventListener('beforeunload', unloadSyncOnce);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') unloadSyncOnce();
    else _unloadSyncDone = false;
});

// ====== REWARDED ADS ======
let _adPreloadTimer = null;
let _rewardBusy = false;

function checkAdsAvailable(adFormat) {
    if (typeof vkBridge === 'undefined') return Promise.resolve(false);
    return vkBridge.send('VKWebAppCheckNativeAds', { ad_format: adFormat })
        .then((data) => {
            console.log('[Check ' + adFormat + ']', data);
            return !!(data && data.result === true);
        })
        .catch((err) => {
            console.warn('[Check ' + adFormat + ' ERROR]', err);
            return false;
        });
}

function preloadRewardedAd() {
    if (typeof vkBridge === 'undefined') return;
    checkAdsAvailable('reward');
    checkAdsAvailable('interstitial');
}

function showRewardedAd() {
    if (typeof vkBridge === 'undefined') return Promise.resolve(false);
    if (_rewardBusy) return Promise.resolve(false);
    _rewardBusy = true;

    const tryShow = (format) => new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) { settled = true; console.warn('[Show ' + format + ' TIMEOUT]'); resolve(false); }
        }, 90000);

        vkBridge.send('VKWebAppShowNativeAds', { ad_format: format, use_waterfall: true })
            .then((data) => {
                console.log('[Show ' + format + ']', data);
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(!!(data && (data.result === true || data.result === 1)));
                }
            })
            .catch((err) => {
                console.warn('[Show ' + format + ' ERROR]', err);
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(false);
                }
            });
    });

    return (async () => {
        let ready = false;
        const start = Date.now();
        while (Date.now() - start < 8000) {
            if (await checkAdsAvailable('reward')) { ready = true; break; }
            await new Promise(r => setTimeout(r, 700));
        }

        if (ready) {
            const ok = await tryShow('reward');
            if (ok) {
                preloadRewardedAd();
                _rewardBusy = false;
                return true;
            }
        }

        const interReady = await checkAdsAvailable('interstitial');
        if (interReady) {
            const ok = await tryShow('interstitial');
            if (ok) {
                preloadRewardedAd();
                _rewardBusy = false;
                return true;
            }
        }

        _rewardBusy = false;
        return false;
    })();
}
// ====== BANNER ADS ======
let _bannerRetryTimer = null;
let _bannerVisible = false;

function showBannerAd() {
    if (typeof vkBridge === 'undefined') return;

    // ✅ ПРОСТО ВЫЗЫВАЕМ МЕТОД:
    vkBridge.send('VKWebAppShowBannerAd', {
        // Здесь можно указать параметры, если нужно
    })
    .then((data) => {
        if (data && data.result === true) {
            _bannerVisible = true;
            console.log('Banner shown');
        } else {
            _bannerVisible = false;
        }
    })
    .catch((err) => {
        console.warn('Banner show error:', err);
        // Для отладки можно вывести подробности:
        // console.warn('Banner error details:', err.error_data || err);
        _bannerVisible = false;
    });
}

function checkAndRetryBanner() {
    if (_bannerVisible) return; // Баннер уже виден — не трогаем
    // Если баннер не виден — пробуем показать снова
    showBannerAd();
}

function startBannerRetry() {
    if (_bannerRetryTimer) clearInterval(_bannerRetryTimer);
    // Первый показ сразу
    showBannerAd();
    // Ретрай каждые 5 минут (300 000 мс)
    _bannerRetryTimer = setInterval(checkAndRetryBanner, 5 * 60 * 1000);
}


window.preloadRewardedAd = preloadRewardedAd;
window.showRewardedAd = showRewardedAd;
window.syncAllDataToVK = syncAllDataToVK;
window.loadAllDataFromVK = loadAllDataFromVK;
window.triggerSync = triggerSync;
window.immediateSync = immediateSync;

// ====== INIT ======
(function () {
    if (typeof vkBridge === 'undefined') return;
    if (window.__riddlesInitStarted) return;

function runInit() {
    vkBridge.send('VKWebAppInit', {}).then(() => {
        window.__riddlesInitStarted = true;
        getid();
        const tryLoad = (attempts) => {
            const ready = typeof window.getProgressStorageEntries === 'function'
                && typeof window.getProgressStorageKeys === 'function'
                && typeof window.mergeVKProgress === 'function';
            if (ready) {
                loadAllDataFromVK();
                preloadRewardedAd();
            } else if (attempts < 100) {
                setTimeout(() => tryLoad(attempts + 1), 50);
            }
        };
        tryLoad(0);
    }).catch(() => {});
}

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }
})();