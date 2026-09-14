// ============================================================
// platform.js — единая точка определения платформы (VK / OK)
// Загружается ПЕРВЫМ, до App.js и game.js
// ============================================================
(function () {
    'use strict';

    // 1. Разбираем URL-параметры, которые прокидывает ВК/ОК
    const searchParams = new URLSearchParams(window.location.search);
    const launchParams = {};
    for (const [k, v] of searchParams) launchParams[k] = v;

    // 2. Определяем платформу: если пришёл vk_client=ok — это ОК
    const isOK = launchParams.vk_client === 'ok';
    const platform = isOK ? 'ok' : 'vk';

    // 3. userId берём из launch-параметров (для OK — vk_ok_user_id)
    const userId = parseInt(
        launchParams.vk_ok_user_id ||
        launchParams.viewer_id ||
        launchParams.user_id ||
        '0'
    );

    // 4. Префикс для ВСЕХ хранилищ (localStorage + VK Storage).
    //    VK — пустой (""), OK — "ok_" — так прогресс разделён.
    const storagePrefix = isOK ? 'ok_' : '';

    // 5. Публикуем в window, чтобы использовать во всех модулях
    window.__PLATFORM = {
        isOK,
        isVK: !isOK,
        platform,          // 'vk' | 'ok'
        userId,            // id игрока (число)
        storagePrefix,     // '' | 'ok_'
        launchParams
    };

    console.log(
        `%c🎮 Платформа: ${platform.toUpperCase()}`,
        'color:#e94560;font-weight:bold;font-size:14px;',
        `| UserID: ${userId} | Префикс хранилища: "${storagePrefix || '(нет)'}"`
    );
})();