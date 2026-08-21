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
                return this.checkRewardedAd();
            })
            .then((available) => {
                this._rewardedAdAvailable = available;
                console.log(`[Platform] Реклама за вознаграждение ${available ? 'доступна' : 'недоступна'}`);
                  this._startPeriodicAdCheck(); 
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
    const payload = {
        data: value,
        _timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    this._saveToVK(key, payload);
},

loadData(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
},

    // ---------- БАННЕРНАЯ РЕКЛАМА ----------
    /**
     * Проверяет доступность баннерной рекламы
     * @returns {Promise<boolean>}
     */
    checkBannerAd() {
        if (typeof vkBridge === 'undefined') return Promise.resolve(false);
        return vkBridge.send('VKWebAppCheckBannerAd', {})
            .then(data => data.result === true)
            .catch(() => false);
    },

    /**
     * Показывает баннерную рекламу
     */
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

    // ---------- РЕКЛАМА ЗА ВОЗНАГРАЖДЕНИЕ ----------

    // В Platform.js, после инициализации
_startPeriodicAdCheck() {
    // Проверяем каждые 60 секунд
    this._adCheckInterval = setInterval(() => {
        this.checkRewardedAd()
            .then((available) => {
                this._rewardedAdAvailable = available;
                // Здесь можно обновить UI кнопки, если она видна
               if (typeof App !== 'undefined' && typeof App._updateTvButtonVisibility === 'function') {
                            App._updateTvButtonVisibility();
                        }
            })
            .catch(() => { /* Игнорируем ошибки проверки */ });
    }, 200000);
},

// Не забудьте очистить интервал при выходе
_clearPeriodicAdCheck() {
    if (this._adCheckInterval) {
        clearInterval(this._adCheckInterval);
        this._adCheckInterval = null;
    }
},

    /**
     * Проверяет, есть ли предзагруженные материалы для рекламы за вознаграждение.
     * Если материалов нет, VK Bridge отправит запрос на их загрузку.
     * @param {boolean} useWaterfall - использовать ли водопадную загрузку (опционально)
     * @returns {Promise<boolean>} - true если реклама доступна для показа
     * 
     * Документация: https://dev.vk.com/ru/bridge/VKWebAppCheckNativeAds
     */
checkRewardedAd() {
    if (typeof vkBridge === 'undefined') return Promise.resolve(false);
    return vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then((data) => {
            const available = data.result === true;
            this._rewardedAdAvailable = available;
            return available;
        })
        .catch(() => {
            this._rewardedAdAvailable = false;
            return false;
        });
},

    /**
     * Возвращает текущий статус доступности рекламы за вознаграждение
     * @returns {boolean}
     */
    isRewardedAdAvailable() {
        return this._rewardedAdAvailable;
    },

    /**
     * Предзагружает рекламные материалы (если ещё не загружены)
     * Вызов checkRewardedAd() уже делает предзагрузку,
     * но этот метод можно вызвать отдельно для принудительной загрузки
     * @returns {Promise<boolean>}
     */
    preloadRewardedAd() {
        return this.checkRewardedAd();
    },

    /**
     * Показывает рекламу за вознаграждение.
     * Возвращает Promise, который резолвится с true, если пользователь досмотрел
     * рекламу и получил награду, и с false в противном случае.
     * 
     * Документация: https://dev.vk.com/ru/games/monetization/ad/implementation
     * 
     * @returns {Promise<boolean>}
     */
  showRewardedAd() {
    if (!this._rewardedAdAvailable || typeof vkBridge === 'undefined') {
        return Promise.resolve(false);
    }
 
        return new Promise((resolve) => { 
            this._rewardedResolve = resolve;
          
            // Подписываемся на событие получения награды
            this._rewardedSubscription = (e) => {
                if (e.detail.type === 'VKWebAppNativeAdRewarded') {
                    console.log('[Platform] Награда за просмотр рекламы получена!');
                    if (this._rewardedResolve) {
                        this._rewardedResolve(true);
                        this._rewardedResolve = null;
                       
                    }
                    if (this._rewardedSubscription) {
                        vkBridge.unsubscribe(this._rewardedSubscription);
                        this._rewardedSubscription = null;
                    }
                }
            };
            vkBridge.subscribe(this._rewardedSubscription);

           vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
            .then((data) => {
                // ★★★ НОВАЯ ПРОВЕРКА ★★★
                if (data && data.result === true) {
                    console.log('[Platform] Реклама показана, ожидаем завершения...');
                    // Таймаут оставляем
                    setTimeout(() => {
                        if (this._rewardedResolve) {
                            console.warn('[Platform] Таймаут ожидания награды');
                            this._rewardedResolve(false);
                            this._cleanupRewardedListeners();
                        }
                    }, 60000);
                } else {
                    // ★★★ РЕКЛАМА НЕ ПОКАЗАНА ★★★
                    console.warn('[Platform] Реклама не показана (result: false)');
                    this._cleanupRewardedListeners();
                    resolve(false); // Не награждаем пользователя
                }
            })
            .catch((err) => {
                // ★★★ ОБРАБОТКА ОШИБОК ★★★
                console.warn('[Platform] Ошибка показа рекламы:', err);
                this._cleanupRewardedListeners();
                // В случае ошибки тоже не награждаем
                resolve(false);
            });
    });
},

// Вспомогательный метод для очистки
_cleanupRewardedListeners() {
    if (this._rewardedSubscription) {
        vkBridge.unsubscribe(this._rewardedSubscription);
        this._rewardedSubscription = null;
    }
    this._rewardedResolve = null;

},

// platform.js – добавить в объект Platform

    /**
     * Показывает «рулетку» с рекламой: три случайных предмета, после просмотра – один в награду.
     * @param {Array<{typeIndex: number, level: number, imageUrl: string}>} itemsPool – массив из 3 предметов
     * @param {Function} onReward – колбэк, вызываемый с выбранным предметом после успешной рекламы
     */
    showRewardRoulette(itemsPool, onReward) {
        if (!this.isRewardedAdAvailable()) {
            ModalManager.showErrorModal(
                getText('reward_ad_error_title', 'Ошибка'),
                getText('reward_ad_error_text', 'Реклама временно недоступна, попробуйте позже.')
            );
            return;
        }
        if (!itemsPool || itemsPool.length < 1) return;

        // --- 1. Модалка с тремя предметами и кнопкой "📺" ---
        let gridHtml = '<div class="item-info-grid" style="justify-content:center; gap:0.8rem; flex-wrap:wrap;">';
        for (const item of itemsPool) {
            gridHtml += `
                <div class="item-info-cell" style="width:clamp(4rem, 10vmin, 8rem); height:clamp(4rem, 10vmin, 8rem);">
                    <img src="${item.imageUrl}" style="width:90%; height:90%; object-fit:contain;">
                </div>
            `;
        }
        gridHtml += '</div>';

        const bodyHtml = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.8rem; padding:0.5rem;">
                <div style="font-size:clamp(1rem,2vw,1.4rem); text-align:center;">
                    ${getText('reward_ad_prompt', 'Посмотри рекламу и получи случайный предмет!')}
                </div>
                ${gridHtml}
                <button id="reward-roulette-watch-btn" class="modal-btn" style="font-size:clamp(2rem,4vw,3rem); padding:0.3rem 1rem;">
                    📺
                </button>
            </div>
        `;

        let modal = ModalManager.showCenterModal({
            title: getText('reward_ad_title', 'Рулетка'),
            body: bodyHtml,
            buttons: [] // только крестик
        });

        const watchBtn = modal.querySelector('#reward-roulette-watch-btn');
        if (!watchBtn) return;

        watchBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;

            // закрываем модалку с рулеткой
            ModalManager.closeCenterModal();

            // показываем рекламу
            this.showRewardedAd()
                .then((rewarded) => {
                    if (rewarded) {
                        // --- 2. Успешно – выбираем случайный предмет из пула ---
                        const selected = itemsPool[Math.floor(Math.random() * itemsPool.length)];
                        // --- 3. Модалка выигрыша ---
                        this._showRewardResultModal(selected, onReward);
                    } else {
                        ModalManager.showErrorModal(
                            getText('reward_ad_error_title', 'Ошибка'),
                            getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                        );
                    }
                })
                .catch((err) => {
                    console.warn('[Platform] Ошибка в рекламе:', err);
                    ModalManager.showErrorModal(
                        getText('reward_ad_error_title', 'Ошибка'),
                        getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                    );
                });
        });
    },

    /**
     * Внутренний метод – показывает модалку с выигрышем.
     * @param {Object} item – выбранный предмет { typeIndex, level, imageUrl }
     * @param {Function} onReward – колбэк при нажатии «Получить»
     */
    _showRewardResultModal(item, onReward) {
        // Случайный текст из четырёх вариантов
        const texts = [
            getText('gift_text1', 'Гуляя по лесу, вы нашли что-то полезное!'),
            getText('gift_text2', 'Кажется, что-то блестит под старым пнём…'),
            getText('gift_text3', 'Приподняв корягу, вы нашли что-то полезное!'),
            getText('gift_text4', 'Под ворохом листьев вы нашли что-то полезное!')
        ];
        const randomText = texts[Math.floor(Math.random() * texts.length)];

        const bodyHtml = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
                <div style="width: clamp(4rem, 10vw, 8rem); height: clamp(4rem, 10vw, 8rem); 
                            background: #d9c5a6; border-radius: 12px; border: 3px solid #2a1f14; 
                            display:flex; align-items:center; justify-content:center; 
                            box-shadow: 2px 2px 0 #2a1f14;">
                    <img src="${item.imageUrl}" style="width:90%; height:90%; object-fit:contain;">
                </div>
                <div style="font-size: clamp(1rem, 2vw, 1.5rem); text-align:center; color: #4a3a2a;">${randomText}</div>
            </div>
        `;

        ModalManager.showCenterModal({
            title: getText('gift_title', 'Подарок'),
            body: bodyHtml,
            buttons: [
                {
                    text: getText('gift_get', 'Получить'),
                    onClick: () => {
                        ModalManager.closeCenterModal();
                        if (onReward) onReward(item);
                    }
                }
            ]
        });
    },

    // ---------- Социальные функции ----------
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

    // ---------- Внутренние методы ----------
_saveToVK(key, value, retries = 3) {
    if (typeof vkBridge === 'undefined') return Promise.resolve();

    const attempt = (tryCount) => {
        return vkBridge.send('VKWebAppStorageSet', {
            key: key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
        }).catch(err => {
            if (tryCount < retries) {
                // Экспоненциальная задержка: 500ms, 1000ms, 2000ms...
                const delay = 500 * Math.pow(2, tryCount);
                console.warn(`[Platform] Ошибка сохранения ${key} (попытка ${tryCount+1}/${retries}), повтор через ${delay}ms`, err);
                return new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => attempt(tryCount + 1));
            } else {
                console.error(`[Platform] Не удалось сохранить ${key} после ${retries} попыток`, err);
                return Promise.reject(err);
            }
        });
    };

    return attempt(0);
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
    const fixedKeys = [
        'cafe_meta', 'cafe_board', 'cafe_inventory',
        'cafe_collection', 'cafe_interiors',
        'cafe_orders', 'cafe_quests', 'cafe_settings'
    ];

    // Динамически добавляем все ключи из localStorage, начинающиеся с 'cafe_event_'
    const allKeys = fixedKeys.slice();
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cafe_event_')) {
            allKeys.push(key);
        }
    }

    return Promise.all(allKeys.map(k => this._loadFromVK(k)))
        .then(results => {
            allKeys.forEach((k, i) => {
                const vkData = results[i];
                if (vkData === null) return;
                const localRaw = localStorage.getItem(k);
                let localData = localRaw ? JSON.parse(localRaw) : null;
                let vkTimestamp = vkData._timestamp || 0;
                let localTimestamp = localData?._timestamp || 0;
                if (!localData || vkTimestamp > localTimestamp) {
                    localStorage.setItem(k, JSON.stringify(vkData));
                }
            });
        });
}


};

window.Platform = Platform;