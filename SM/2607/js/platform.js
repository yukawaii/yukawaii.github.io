// ============================================================
//  PLATFORM  —  реализация для VK (через vk-bridge)
//  Все методы синхронны для чтения/записи (localStorage),
//  но при инициализации и сохранении выполняют асинхронную
//  синхронизацию с VK Storage.
// ============================================================
const Platform = {
    type: 'vk',
    initialized: false,
    _userId: null,
    _userName: null,
    _readyCallback: null,

    // ---------- Инициализация ----------
    init(callback) {
        this._readyCallback = callback || null;

        if (typeof vkBridge === 'undefined') {
            console.warn('[Platform] VK Bridge не найден – работаем в standalone');
            this.type = 'standalone';
            this.initialized = true;
            if (this._readyCallback) this._readyCallback();
            return;
        }

        // 1. Инициализация VK Bridge
        vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('[Platform] VK Bridge инициализирован');
                return vkBridge.send('VKWebAppGetUserInfo');
            })
            .then((user) => {
                this._userId = user.id;
                this._userName = user.first_name;
                sessionStorage.setItem('id', user.id);
                console.log(`[Platform] Пользователь: ${this._userName} (id=${this._userId})`);

                // 2. Загружаем все данные из VK Storage в localStorage
                return this._loadAllFromVK();
            })
            .then(() => {
                this.initialized = true;
                if (this._readyCallback) this._readyCallback();
            })
            .catch((err) => {
                console.warn('[Platform] Ошибка инициализации VK:', err);
                // Всё равно считаем инициализированным (работаем с localStorage)
                this.initialized = true;
                if (this._readyCallback) this._readyCallback();
            });
    },

    // ---------- Синхронные методы (для Storage) ----------
    saveData(key, value) {
        // Пишем в localStorage синхронно
        localStorage.setItem('cafe_' + key, JSON.stringify(value));
        // Асинхронно отправляем в VK Storage
        this._saveToVK(key, value);
    },

    loadData(key) {
        const raw = localStorage.getItem('cafe_' + key);
        return raw ? JSON.parse(raw) : null;
    },

    // ---------- Получение данных пользователя ----------
    getPlayerId() {
        return this._userId ? 'vk_' + this._userId : 'guest_' + (localStorage.getItem('cafe_player_id') || 'default');
    },
    getUserName() {
        return this._userName || 'Гость';
    },

    // ---------- Реклама и соц. функции ----------
    showRewardedAd() {
        if (typeof vkBridge === 'undefined') return Promise.resolve(false);
        return vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
            .then(() => true)
            .catch(() => false);
    },

    showInvite() {
        if (typeof vkBridge === 'undefined') return;
        vkBridge.send('VKWebAppShowInviteBox', {});
    },

    showLeaderBoard(score) {
        if (typeof vkBridge === 'undefined') return;
        vkBridge.send('VKWebAppShowLeaderBoardBox', {
            app_id: 54634418,
            user_result: score || 0,
            global: 1
        }).catch(err => console.warn('LeaderBoard error:', err));
    },

    // ---------- Отправка/получение очков (таблица лидеров) ----------
    sendScore(score) {
        if (typeof vkBridge === 'undefined' || !this._userId) return Promise.resolve();
        return vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'secure.addAppEvent',
            request_id: 'cafe_' + Date.now(),
            params: {
                client_secret: 'qp47UOdcqJmW94rKknxR', // из примера
                user_id: this._userId,
                activity_id: 1,
                value: Math.floor(score),
                v: '5.131',
                access_token: 'a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec'
            }
        }).catch(err => console.warn('sendScore error:', err));
    },

    getScore() {
        if (typeof vkBridge === 'undefined' || !this._userId) return Promise.resolve(0);
        return vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'apps.getScore',
            request_id: 'cafe_get_' + Date.now(),
            params: {
                user_id: this._userId,
                v: '5.131',
                access_token: 'f2380f3ff2380f3ff2380f3fcaf179a88dff238f2380f3f98141885cf86ef093e89c993'
            }
        }).then(data => data.response || 0).catch(() => 0);
    },

    // ---------- Принудительная синхронизация всех данных ----------
    syncAllData() {
        // Собираем все ключи, которые используем
        const keys = ['progress', 'galaxy', 'achievements', 'theme', 'sound'];
        const data = {};
        keys.forEach(k => {
            const raw = localStorage.getItem('cafe_' + k);
            if (raw) data[k] = JSON.parse(raw);
        });
        // Отправляем в VK Storage
        return Promise.all(Object.entries(data).map(([key, value]) =>
            this._saveToVK(key, value)
        )).then(() => console.log('[Platform] Полная синхронизация завершена'));
    },

    // ---------- Внутренние методы ----------
    _saveToVK(key, value) {
        if (typeof vkBridge === 'undefined') return Promise.resolve();
        return vkBridge.send('VKWebAppStorageSet', {
            key: key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
        }).catch(err => console.warn(`[Platform] Ошибка сохранения ${key} в VK:`, err));
    },

    _loadFromVK(key) {
        if (typeof vkBridge === 'undefined') return Promise.resolve(null);
        return vkBridge.send('VKWebAppStorageGet', { keys: [key] })
            .then(data => {
                if (data && data.keys && data.keys.length) {
                    const val = data.keys[0].value;
                    try { return JSON.parse(val); } catch { return val; }
                }
                return null;
            })
            .catch(() => null);
    },

    _loadAllFromVK() {
        const keys = ['progress', 'galaxy', 'achievements', 'theme', 'sound'];
        return Promise.all(keys.map(k => this._loadFromVK(k)))
            .then(results => {
                keys.forEach((k, i) => {
                    if (results[i] !== null) {
                        localStorage.setItem('cafe_' + k, JSON.stringify(results[i]));
                        console.log(`[Platform] Загружено из VK: ${k}`);
                    }
                });
            });
    }
};

// Глобальный доступ
window.Platform = Platform;