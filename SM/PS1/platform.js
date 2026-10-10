// ============================================================
// platform.js — единая точка определения платформы (VK / OK)
// Загружается ПЕРВЫМ, до App.js и game.js
// ============================================================
(function () {
    'use strict';
    // 1. Разбираем URL-параметры
    const searchParams = new URLSearchParams(window.location.search);
    const launchParams = {};
    for (const [k, v] of searchParams) launchParams[k] = v;
    const isOK = launchParams.vk_client === 'ok';
    const platform = isOK ? 'ok' : 'vk';
    const userId = parseInt(
        launchParams.vk_ok_user_id ||
        launchParams.viewer_id ||
        launchParams.user_id ||
        '0'
    );
    // Префикс для ВСЕХ хранилищ. VK — "", OK — "ok_"
    const storagePrefix = isOK ? 'ok_' : '';
    window.__PLATFORM = {
        isOK,
        isVK: !isOK,
        platform,
        userId,
        storagePrefix,
        launchParams
    };
    // ============================================================
    // 2. АВТОПРЕФИКС LOCALSTORAGE (только для OK)
    //    Никаких ручных замен setItem/getItem в коде игры!
    //    sessionStorage НЕ трогаем (там хранится id и прочее).
    // ============================================================
    if (storagePrefix) {
        const rawGet    = Storage.prototype.getItem;
        const rawSet    = Storage.prototype.setItem;
        const rawRemove = Storage.prototype.removeItem;
        function prefixed(key) {
            if (typeof key !== 'string') return key;
            if (key.indexOf(storagePrefix) === 0) return key; // уже с префиксом — не дублируем
            return storagePrefix + key;
        }
        Storage.prototype.getItem = function (key) {
            if (this === localStorage) return rawGet.call(this, prefixed(key));
            return rawGet.call(this, key);
        };
        Storage.prototype.setItem = function (key, value) {
            if (this === localStorage) return rawSet.call(this, prefixed(key), value);
            return rawSet.call(this, key, value);
        };
        Storage.prototype.removeItem = function (key) {
            if (this === localStorage) return rawRemove.call(this, prefixed(key));
            return rawRemove.call(this, key);
        };
    }
    // ============================================================
    // 3. АВТОПРЕФИКС VK STORAGE (для OK)
    //    Патчим vkBridge.send, как только SDK появится.
    //    Никакого defineProperty — иначе SDK VK видит
    //    "window.vkBridge уже существует" и не подгружается сам.
    // ============================================================
    if (storagePrefix) {
        let _vkStoragePatched = false;
        function patchVKStorage() {
            if (_vkStoragePatched) return true;
            const bridge = window.vkBridge;
            if (!bridge || typeof bridge.send !== 'function') return false;
            const origSend = bridge.send.bind(bridge);
            bridge.send = function (method, params) {
                if (params && typeof params === 'object') {
                    if (method === 'VKWebAppStorageSet' && typeof params.key === 'string') {
                        if (params.key.indexOf(storagePrefix) !== 0) {
                            params = Object.assign({}, params, { key: storagePrefix + params.key });
                        }
                    }
                    if (method === 'VKWebAppStorageGet' && Array.isArray(params.keys)) {
                        params = Object.assign({}, params, {
                            keys: params.keys.map(function (k) {
                                return (typeof k === 'string' && k.indexOf(storagePrefix) !== 0)
                                    ? storagePrefix + k
                                    : k;
                            })
                        });
                    }
                }
                return origSend(method, params);
            };
            _vkStoragePatched = true;
               return true;
        }
        // Первая попытка — SDK уже мог загрузиться
        if (!patchVKStorage()) {
            // Если нет — ждём появления vkBridge (опрос каждые 100 мс, до 30 сек)
            let _attempts = 0;
            const _timer = setInterval(function () {
                _attempts++;
                if (patchVKStorage() || _attempts > 300) {
                    clearInterval(_timer);
                    if (_attempts > 300) {
                        console.warn('⚠️ vkBridge так и не появился за 30 сек');
                    }
                }
            }, 100);
        }
    }
    // ============================================================
    // 4. В OK СКРЫВАЕМ НЕДОСТУПНЫЕ КНОПКИ
    //    Никаких тостов и модалок. Просто прячем элементы.
    //    Работает через CSS — срабатывает мгновенно, даже если
    //    DOM ещё не готов.
    // ============================================================
    if (isOK) {
        const css = document.createElement('style');
        css.id = 'ok-hide-unavailable';
        css.textContent = [
            '#menuInviteBtn,',      // 👥 пригласить друзей (меню)
            '#startShareBtn,',      // 👥 пригласить друзей (стартовый экран, если есть)
            '#topBtn,',             // топ игроков
            '#shareBtn,',           // поделиться (в игре)
            '#infrBtn,',            // пригласить друзей в игру (в игре)
            '#leaderboardBtn,',     // лидерборд
            '.ok-hidden { display: none !important; visibility: hidden !important; pointer-events: none !important; }'
        ].join('\n');
        (document.head || document.documentElement).appendChild(css);
        // На случай, если кнопки создаются динамически — подчистим и через DOM,
        // и повторим пару раз после загрузки.
        const HIDE_IDS = ['menuInviteBtn', 'startShareBtn', 'topBtn', 'shareBtn', 'infrBtn', 'leaderboardBtn'];
        function hideNow() {
            HIDE_IDS.forEach(function (id) {
                const el = document.getElementById(id);
                if (el) {
                    el.style.setProperty('display', 'none', 'important');
                    el.setAttribute('aria-hidden', 'true');
                }
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideNow);
        } else {
            hideNow();
        }
        // Повторные попытки — кнопки могут создаваться после init()
        setTimeout(hideNow, 500);
        setTimeout(hideNow, 2000);
        setTimeout(hideNow, 5000);
    }
})();