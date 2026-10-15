// ============================================================
// platform.js — определение платформы (VK / OK)
// Загружается ПЕРВЫМ, до app.js
// ============================================================
(function () {
    'use strict';

    const searchParams = new URLSearchParams(window.location.search);
    const launchParams = {};
    for (const [k, v] of searchParams) launchParams[k] = v;

    const isOK = launchParams.vk_client === 'ok';
    const platform = isOK ? 'ok' : 'vk';

    const userId = parseInt(
        launchParams.vk_user_id ||     
        launchParams.vk_ok_user_id ||   
        launchParams.viewer_id ||
        launchParams.user_id ||
        '0'
    );

    // Префикс разделяет прогресс: OK = "ok_", VK = ""
    const storagePrefix = isOK ? 'ok_' : '';

    window.__PLATFORM = {
        isOK, isVK: !isOK, platform, userId, storagePrefix, launchParams
    };
// Запрашиваем userInfo через VK Bridge (работает и в VK, и в OK)
window.getVKUserId = function () {
    if (typeof vkBridge === 'undefined') {
        return Promise.resolve(window.__PLATFORM.userId || 0);
    }
    if (window.__PLATFORM.userId) {
        return Promise.resolve(window.__PLATFORM.userId);
    }
    const timeout = new Promise(r => setTimeout(() => r(0), 5000));
    const req = vkBridge.send('VKWebAppGetUserInfo')
        .then(u => {
            const id = (u && u.id) || 0;
            window.__PLATFORM.userId = id;
            window.__PLATFORM.userName = (u && (u.first_name || '')) || '';
            console.log('✅ UserID получен через VK Bridge:', id, window.__PLATFORM.userName);
            return id;
        })
        .catch(err => {
            console.warn('⚠️ VKWebAppGetUserInfo error:', err);
            return 0;
        });
    return Promise.race([req, timeout]);
};
    console.log(
        `%c🎮 Платформа: ${platform.toUpperCase()}`,
        'color:#e94560;font-weight:bold;',
        `| UserID: ${userId} | Префикс: "${storagePrefix || '(нет)'}"`
    );
})();