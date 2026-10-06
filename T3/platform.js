// platform.js — определение платформы VK / OK
(function () {
    'use strict';

    const searchParams = new URLSearchParams(window.location.search);
    const launchParams = {};
    for (const [k, v] of searchParams) launchParams[k] = v;

    const vkOK = launchParams.vk_client === 'ok';
    const hasVK = !!(launchParams.vk_app_id || launchParams.vk_client_id ||
                     launchParams.vk_platform || launchParams.vk_user_id ||
                     launchParams.vk_client);

    const isOK = vkOK;
    const isVK = hasVK && !isOK;
    const platform = isOK ? 'ok' : 'vk';

    const userId = parseInt(
        launchParams.vk_user_id ||
        launchParams.vk_ok_user_id ||
        launchParams.viewer_id ||
        launchParams.user_id ||
        '0'
    ) || 0;

    // Префикс разделяет прогресс между VK и OK на одном устройстве
    const storagePrefix = isOK ? 'ok_' : '';

    window.__PLATFORM = {
        isOK, isVK, platform, userId, storagePrefix, launchParams
    };

    const cls = document.documentElement.classList;
    cls.toggle('is-vk', isVK);
    cls.toggle('is-ok', isOK);

    // ========== Патч localStorage для игровых ключей ==========
    // Список ключей, которые должны иметь префикс в OK.
    // Всё остальное (не из списка) идёт «как есть».
    const KEYS_TO_PREFIX = [
        'totalScore',
        'scrollsProgress',
        'collectionsProgress',
        'playedDifficulties',
        'dailyBonusDate',
        'vkHighscore',
        'localHighscore',
        'vk_user_id',
        'gameLanguage'
    ];

    if (storagePrefix) {
        const origGet    = localStorage.getItem.bind(localStorage);
        const origSet    = localStorage.setItem.bind(localStorage);
        const origRemove = localStorage.removeItem.bind(localStorage);
        const wrap = (key) => KEYS_TO_PREFIX.includes(key) ? storagePrefix + key : key;
        localStorage.getItem    = function (key) { return origGet(wrap(key)); };
        localStorage.setItem    = function (key, value) { return origSet(wrap(key), value); };
        localStorage.removeItem = function (key) { return origRemove(wrap(key)); };
    }

    console.log(`%c🎮 Платформа: ${platform.toUpperCase()}`,
        'color:#e94560;font-weight:bold;font-size:14px;',
        `| UserID: ${userId} | Префикс хранилища: "${storagePrefix || '(нет)'}"`);
})();