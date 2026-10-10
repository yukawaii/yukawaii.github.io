// ===== РАСПОЗНАВАНИЕ ПЛАТФОРМЫ (VK / OK) + АВТО-ПРЕФИКС localStorage =====
(function () {
    'use strict';

    var params = new URLSearchParams(window.location.search);
    var launchParams = {};
    params.forEach(function (value, key) { launchParams[key] = value; });

    var isOK = launchParams.vk_client === 'ok';
    var platform = isOK ? 'ok' : 'vk';
    var userId = parseInt(
        launchParams.vk_ok_user_id ||
        launchParams.viewer_id ||
        launchParams.user_id ||
        '0', 10
    ) || 0;
    var storagePrefix = isOK ? 'ok_' : '';

    window.__PLATFORM = {
        isOK: isOK,
        isVK: !isOK,
        platform: platform,
        userId: userId,
        storagePrefix: storagePrefix,
        launchParams: launchParams
    };

    // Алиасы для остальных модулей
    window.STORAGE_PREFIX = storagePrefix;
    window.IS_OK_PLATFORM = isOK;

    // ===== АВТО-ПРЕФИКС для localStorage =====
    // Все вызовы localStorage.getItem/setItem/removeItem/key/length
    // прозрачно работают с префиксом платформы. Код игры менять НЕ надо.
    if (storagePrefix && typeof Storage !== 'undefined') {
        var _getItem = Storage.prototype.getItem;
        var _setItem = Storage.prototype.setItem;
        var _removeItem = Storage.prototype.removeItem;

        Storage.prototype.getItem = function (key) {
            return _getItem.call(this, storagePrefix + key);
        };
        Storage.prototype.setItem = function (key, value) {
            return _setItem.call(this, storagePrefix + key, value);
        };
        Storage.prototype.removeItem = function (key) {
            return _removeItem.call(this, storagePrefix + key);
        };

        // key(i) / length — на всякий случай, хотя в игре не используются
        var _key = Storage.prototype.key;
        Storage.prototype.key = function (i) {
            var k = _key.call(this, i);
            if (k && k.indexOf(storagePrefix) === 0) {
                return k.substring(storagePrefix.length);
            }
            return k;
        };

    }

    console.log('🌐 Платформа:', platform, '| user_id:', userId, '| prefix:', storagePrefix || '(нет)');
})();