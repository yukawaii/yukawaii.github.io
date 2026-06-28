// vk-init.js — УПРОЩЁННАЯ ВЕРСИЯ
(function() {
    console.log('🚀 VK Init: Запуск...');
    
    window.__isVK = false;
    
    // Проверка через vkBridge
    if (typeof vkBridge !== 'undefined') {
        window.__isVK = true;
        console.log('✅ VK Init: Определено через vkBridge');
    }
    
    // Проверка через URL-параметры
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('vk_platform') || urlParams.get('vkid')) {
            window.__isVK = true;
            console.log('✅ VK Init: Определено по URL-параметрам');
        }
    } catch (e) {}
    
    // Проверка через parent (с try/catch)
    try {
        if (window.parent && window.parent !== window) {
            window.__isVK = true;
            console.log('✅ VK Init: Определено через parent');
        }
    } catch (e) {
        // Ошибка доступа к parent — значит мы в iframe
        window.__isVK = true;
        console.log('✅ VK Init: Определено через iframe');
    }
    
    // Проверка через User-Agent
    if (navigator.userAgent.includes('VKAndroidApp') || 
        navigator.userAgent.includes('VKiPhoneApp') ||
        navigator.userAgent.includes('VKMobileApp')) {
        window.__isVK = true;
        console.log('✅ VK Init: Определено через User-Agent');
    }
    
    console.log('📊 VK Init: __isVK =', window.__isVK);
    
    // Если ВК — инициализируем Bridge
    if (window.__isVK) {
        console.log('🌐 VK Init: Инициализируем Bridge...');
        
        const initVK = function() {
            if (typeof vkBridge === 'undefined') {
                console.log('⏳ VK Init: Ожидаем vkBridge...');
                setTimeout(initVK, 100);
                return;
            }
            
            console.log('✅ VK Init: vkBridge загружен!');
            window.vkBridge = vkBridge;
            
            vkBridge.send('VKWebAppInit', {})
                .then(() => {
                    console.log('✅ VK Init: Bridge инициализирован!');
                    window.__vkReady = true;
                    document.dispatchEvent(new CustomEvent('vk-ready'));
                })
                .catch((error) => {
                    console.warn('⚠️ VK Init: Ошибка:', error);
                    // Пробуем ещё раз через 2 секунды
                    setTimeout(() => {
                        vkBridge.send('VKWebAppInit', {}).catch(() => {});
                    }, 2000);
                });
        };
        
        initVK();
    } else {
        console.log('ℹ️ VK Init: Запуск вне ВК');
        window.__vkReady = true;
        document.dispatchEvent(new CustomEvent('vk-ready'));
    }
})();