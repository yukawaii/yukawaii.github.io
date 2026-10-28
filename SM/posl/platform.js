// ============================================================
// platform.js — определение платформы VK / OK
// Загружается ПЕРВЫМ, до App.js и game.js
// ============================================================
(function () {
    'use strict';
    const searchParams = new URLSearchParams(window.location.search);
    const launchParams = {};
    for (const [k, v] of searchParams) launchParams[k] = v;

    const isOK = launchParams.vk_client === 'ok';
    const platform = isOK ? 'ok' : 'vk';
    const userId = parseInt(
        launchParams.vk_ok_user_id || launchParams.viewer_id || launchParams.user_id || '0'
    );
    const storagePrefix = isOK ? 'ok_' : '';

    window.__PLATFORM = { isOK, isVK: !isOK, platform, userId, storagePrefix, launchParams };

    console.log(
        `%c🎮 Платформа: ${platform.toUpperCase()}`,
        'color:#e94560;font-weight:bold;font-size:14px;',
        `| UserID: ${userId} | Префикс: "${storagePrefix || '(нет)'}"`
    );
})();