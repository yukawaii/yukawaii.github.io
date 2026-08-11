// ============================================================
//  PLATFORM  —  реализация для VK (через vk-bridge)
//  с поддержкой рекламы и соц. функций
// ============================================================
const Platform = {
    type: 'vk',
    initialized: false,
    _userId: null,
    _userName: null,
    _readyCallback: null,

    // --- Реклама ---
    _bannerAdShown: false,
    _rewardedAdAvailable: false,
    _rewardedResolve: null,
    _rewardedReject: null,
    _rewardedSubscription: null,

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

                return this._loadAllFromVK();
            })
            .then(() => {
                // ★ Предзагрузка рекламы за вознаграждение
                return this.checkRewardedAd();
            })
            .then((available) => {
                this._rewardedAdAvailable = available;
                console.log(`[Platform] Реклама за вознаграждение ${available ? 'доступна' : 'недоступна'}`);
                this.initialized = true;
                if (this._readyCallback) this._readyCallback();
            })
            .catch((err) => {
                console.warn('[Platform] Ошибка инициализации VK:', err);
                this.initialized = true;
                if (this._readyCallback) this._readyCallback();
            });
    },

    // ---------- Синхронные методы (для Storage) ----------
    saveData(key, value) {
        localStorage.setItem('cafe_' + key, JSON.stringify(value));
        this._saveToVK(key, value);
    },

    loadData(key) {
        const raw = localStorage.getItem('cafe_' + key);
        return raw ? JSON.parse(raw) : null;
    },

    // ---------- Баннерная реклама (новая) ----------
    checkBannerAd() {
        if (typeof vkBridge === 'undefined') return Promise.resolve(false);
        return vkBridge.send('VKWebAppCheckBannerAd', {})
            .then(data => data.result === true)
            .catch(() => false);
    },

    showBannerAd() {
        if (this._bannerAdShown) return;
        if (typeof vkBridge === 'undefined') return;

        this.checkBannerAd().then(available => {
            if (available) {
                vkBridge.send('VKWebAppShowBannerAd', {})
                    .then(() => {
                        console.log('[Platform] Баннер показан');
                        this._bannerAdShown = true;
                    })
                    .catch(err => console.warn('[Platform] Ошибка показа баннера:', err));
            } else {
                console.log('[Platform] Баннерная реклама недоступна');
            }
        });
    },

    // ---------- Реклама за вознаграждение (новая, расширенная) ----------
    checkRewardedAd() {
        if (typeof vkBridge === 'undefined') return Promise.resolve(false);
        return vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
            .then(data => data.result === true)
            .catch(() => false);
    },

    isRewardedAdAvailable() {
        return this._rewardedAdAvailable;
    },

    showRewardedAd() {
        if (!this._rewardedAdAvailable || typeof vkBridge === 'undefined') {
            return Promise.resolve(false);
        }

        return new Promise((resolve, reject) => {
            this._rewardedResolve = resolve;
            this._rewardedReject = reject;

            this._rewardedSubscription = (e) => {
                if (e.detail.type === 'VKWebAppNativeAdRewarded') {
                    if (this._rewardedResolve) {
                        this._rewardedResolve(true);
                        this._rewardedResolve = null;
                        this._rewardedReject = null;
                    }
                    if (this._rewardedSubscription) {
                        vkBridge.unsubscribe(this._rewardedSubscription);
                        this._rewardedSubscription = null;
                    }
                }
            };
            vkBridge.subscribe(this._rewardedSubscription);

            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
                .then(() => {
                    setTimeout(() => {
                        if (this._rewardedResolve) {
                            this._rewardedResolve(false);
                            this._rewardedResolve = null;
                            this._rewardedReject = null;
                            if (this._rewardedSubscription) {
                                vkBridge.unsubscribe(this._rewardedSubscription);
                                this._rewardedSubscription = null;
                            }
                        }
                    }, 30000);
                })
                .catch(err => {
                    if (this._rewardedReject) {
                        this._rewardedReject(err);
                        this._rewardedResolve = null;
                        this._rewardedReject = null;
                    }
                    if (this._rewardedSubscription) {
                        vkBridge.unsubscribe(this._rewardedSubscription);
                        this._rewardedSubscription = null;
                    }
                });
        });
    },

    // ---------- Социальные функции (восстановлены) ----------
    showInvite() {
        if (typeof vkBridge === 'undefined') return;
        vkBridge.send('VKWebAppShowInviteBox', {});
    },

    showLeaderBoard(score) {
        if (typeof vkBridge === 'undefined') return;
        vkBridge.send('VKWebAppShowLeaderBoardBox', {
            app_id: 54634418,   // ← замените на свой app_id
            user_result: score || 0,
            global: 1
        }).catch(err => console.warn('LeaderBoard error:', err));
    },

    // (закомментировано, но оставляем для справки)
    /*
    sendScore(score) {
        if (typeof vkBridge === 'undefined' || !this._userId) return Promise.resolve();
        return vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'secure.addAppEvent',
            request_id: 'cafe_' + Date.now(),
            params: {
                client_secret: 'qp47UOdcqJmW94rKknxR',
                user_id: this._userId,
                activity_id: 1,
                value: Math.floor(score),
                v: '5.131',
                access_token: 'a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec'
            }
        }).catch(err => console.warn('sendScore error:', err));
    },
    */

    // (закомментировано, но оставляем)
    /*
    syncAllData() {
        const keys = ['progress', 'settings'];
        const data = {};
        keys.forEach(k => {
            const raw = localStorage.getItem('cafe_' + k);
            if (raw) data[k] = JSON.parse(raw);
        });
        return Promise.all(Object.entries(data).map(([key, value]) =>
            this._saveToVK(key, value)
        )).then(() => console.log('[Platform] Полная синхронизация завершена'));
    },
    */

    // ---------- Внутренние методы ----------
    _saveToVK(key, value) {
        if (typeof vkBridge === 'undefined') return Promise.resolve();
        return vkBridge.send('VKWebAppStorageSet', {
            key: key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
        }).catch(err => console.warn(`[Platform] Ошибка сохранения ${key}:`, err));
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
        const keys = ['progress', 'settings'];
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

window.Platform = Platform;