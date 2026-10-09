var score, id, token, name1;

// ====== ПЛАТФОРМА (VK / OK) ======
const __PLATFORM = window.__PLATFORM || {
    isOK: false, isVK: true, platform: 'vk',
    userId: 0, storagePrefix: '', launchParams: {}
};
const IS_OK_PLATFORM   = __PLATFORM.isOK;

// Глобальный vkBridge (для консоли и фрейма)
"undefined"!=typeof vkBridge&&(window.vkBridge=vkBridge);

// ====== ИДЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЯ ======
function getid() {
    // Если userId уже известен из launch-параметров (OK) — используем его
if (__PLATFORM.userId && __PLATFORM.userId > 0) {
        id = __PLATFORM.userId;
        sessionStorage.setItem("id", id);
        console.log(`✅ UserID из launch-параметров: ${id}`);
        return;
    }
    // Иначе запрашиваем через VK Bridge (работает и на VK, и на OK)
    vkBridge.send("VKWebAppGetUserInfo")
        .then((e) => {
            id = e.id;
            name1 = e.first_name;
            sessionStorage.setItem("id", id);
        })
        .catch(() => {});
}
getid();

// ============================================================
// ====== БАННЕР С РЕТРАЕМ (VK + OK) — как в «Словарексе» =====
// ============================================================
let __bannerShown = false;
let __bannerRetryTimer = null;
let __bannerAttempts = 0;
const __BANNER_MAX = 3;
const __BANNER_DELAY = 5 * 60 * 1000;   // 5 минут

// Простой показ баннера
function showBannerAd() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' })
        .then((data) => {
            if (data && data.result) {
                document.body.classList.add('has-vk-banner');
                console.log('✅ Баннерная реклама отобразилась');
            }
        })
        .catch((error) => console.warn('❌ Ошибка показа баннера:', error));
}

// Показ баннера с ретраями
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
                document.body.classList.add('has-vk-banner');
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

// Проверка и показ баннера (если баннера ещё нет — показать)
function checkAndShowBanner() {
    if (typeof vkBridge === 'undefined') return;
    vkBridge.send('VKWebAppCheckBannerAd', {})
        .then((data) => {
            if (!data || !data.result) {
                showBannerWithRetry();
            }
        })
        .catch(() => {
            showBannerWithRetry();
        });
}
// ====== ИНИЦИАЛИЗАЦИЯ VK BRIDGE + ПОДПИСКА НА СОБЫТИЯ ======
var __initVKBridgeDone = false;
function initVKBridge() {
    if (__initVKBridgeDone) return;
    __initVKBridgeDone = true;

    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }

    vkBridge.send('VKWebAppInit', {})
        .then(() => {
            console.log('✅ VK Bridge инициализирован (App.js)');

            // Показываем баннер после инициализации (как в «Словарексе»)
            setTimeout(function () {
                        showBannerWithRetry();  // + ретрай-страховка
            }, 500);

            // Подписка на события VK Bridge
            try {
                vkBridge.subscribe((e) => {
                    const type = e.detail.type;

                    if (type === 'VKWebAppViewHide') {
                        console.log('📱 Приложение свёрнуто');
                        if (typeof pauseGame === 'function') pauseGame();
                    }
                    if (type === 'VKWebAppViewRestore') {
                        console.log('📱 Приложение восстановлено');
                        if (typeof resumeGame === 'function') resumeGame();
                    }
                    if (type === 'VKWebAppUpdateConfig') {
                        console.log('📱 Обновлена конфигурация VK');
                    }
                    if (type === 'VKWebAppBannerAdClosedByUser') {
                        console.log('ℹ️ Баннер закрыт, пробуем снова через 30 сек');
                        setTimeout(checkAndShowBanner, 30000);
                    }
                });
            } catch (err) {
                console.warn('⚠️ Не удалось подписаться на VK события:', err);
            }
        })
        .catch((error) => {
            console.warn('❌ Ошибка инициализации VK Bridge:', error);
        });
}

// ====== ПРИГЛАСИТЬ ДРУЗЕЙ (в OK кнопка скрыта, поэтому просто выходим) ======
function share2() {
    if (IS_OK_PLATFORM) {
        // В OK кнопка вообще скрыта — сюда управление не придёт.
        // Но на всякий случай: ничего не показываем, просто тихо выходим.
        return;
    }
    vkBridge.send("VKWebAppShowInviteBox", {});
}

// Совместимость со старым именем
function infr() { share2(); }
