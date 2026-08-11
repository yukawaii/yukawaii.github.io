// ============================================================
//  APP  – инициализация и управление жизненным циклом
// ============================================================
const App = {
    initialized: false,
    _loadTimeout: null,

    currentSubscene: 'dialogue',
    subsceneButtonItem: null,
    _hasPendingDialog: false,
  
    init() {
        if (this.initialized) return;
        this.initialized = true;

                Platform.init(() => {
            clearTimeout(this._loadTimeout);
            clearInterval(loadInterval);
            if (loadBar) loadBar.style.width = '100%';
            setTimeout(() => {
                this.onPlatformReady();
            }, 400);
        });

        setLanguage(currentLang);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.dataset.lang;
            if (lang === currentLang) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        SceneManager.init();
SceneManager.on('show', (sceneName) => {
    const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;

    if (sceneName === 'menu') {
        BackgroundManager.setMode('menu');
        // Для меню фон не нужен – можно ничего не делать
    } else if (sceneName === 'dialogue' || sceneName === 'game') {
        // Обновляем фон и интерьеры СРАЗУ (без задержки), чтобы анимация шла плавно
        BackgroundManager.setMode(sceneName);
        BackgroundManager.update(sceneId);
        if (typeof QuestManager !== 'undefined') {
            QuestManager.onSceneChange(sceneId);
        }
    }

    if (sceneName === 'game') {
        // Перерисовка доски – тяжёлая операция, её откладываем на 650 мс
        setTimeout(() => {
            ResizeManager.handleResize();
        }, 650);
    }
});
                // Инициализация менеджера фона
                BackgroundManager.init();
        

        AudioManager.init();
    
        if (typeof ModalManager !== 'undefined') {
            ModalManager.init();
        } else {
            console.warn('[App] ModalManager не загружен');
        }

        let progress = 0;
        const loadBar = document.getElementById('load-progress');
        const loadInterval = setInterval(() => {
            progress += Math.random() * 8 + 2;
            if (progress > 95) progress = 95;
            if (loadBar) loadBar.style.width = Math.min(progress, 95) + '%';
        }, 200);

        this._loadTimeout = setTimeout(() => {
            console.warn('[App] Таймаут загрузки – показываем меню');
            clearInterval(loadInterval);
            if (loadBar) loadBar.style.width = '100%';
            this.onPlatformReady();
        }, 10000);



        this.bindUI();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (Game.isRunning && !Game.isPaused && !Game.isDragging && !Game.processingClick) {
                    Game.togglePause();
                    const btn = document.getElementById('game-pause-btn');
                    if (btn) btn.textContent = '▶';
                }
            }
        });
        // ★ НОВЫЙ обработчик потери фокуса окна ★ перключение с браузера на другое 
            window.addEventListener('blur', () => {
                // Если игра запущена, не на паузе и не завершена – ставим паузу
              if (Game.isRunning && !Game.isPaused && !Game.isDragging && !Game.processingClick) {
                    Game.togglePause();
                    const btn = document.getElementById('game-pause-btn');
                    if (btn) btn.textContent = '▶';
                }
            });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (SceneManager.current === 'game') {
                    ResizeManager.handleResize();
                }
            }, 300);
        });
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        const current = SceneManager.current;
        if (current === 'game' || current === 'dialogue') {
            ResizeManager.handleResize();
            const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;
            // Вместо BackgroundManager.update(sceneId) вызываем перезагрузку интерьеров
            if (typeof InteriorManager !== 'undefined') {
                InteriorManager.reloadInteriors(sceneId);
            }
            
            // Фон обновится сам через _handleOrientationChange
        }
    }, 400);
});

        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('touchmove', e => {
            if (e.target.closest('#game-wrapper')) e.preventDefault();
        }, { passive: false });

       // console.log('[App] Инициализация завершена');
    },

onPlatformReady() {
    const sceneId = currentSceneId;
    const loadBar = document.getElementById('load-progress');

    // Функция обновления прогресса
    const updateProgress = (pct) => {
        if (loadBar) loadBar.style.width = Math.min(pct, 100) + '%';
    };

    // 1. Загружаем спрайты предметов
    const loadSprites = new Promise((resolve) => {
        // Предварительная инициализация Game для загрузки спрайтов
        Game.itemData = window.ITEM_DATA;
        Game.maxLevels = getMaxLevelsForItems();
        Game.loadSprites(() => {
            updateProgress(70);
            resolve();
        });
    });

    // 2. Загружаем фоновое изображение для текущей сцены
    const loadBg = BackgroundManager.preloadBackgroundImage(sceneId)
        .then(() => updateProgress(85));

    // 3. Загружаем интерьеры для текущей сцены
    const loadInteriors = InteriorManager.preloadInteriorImagesForScene(sceneId)
        .then(() => updateProgress(95));

    // Ждём завершения всех загрузок
    Promise.all([loadSprites, loadBg, loadInteriors]).then(() => {
        updateProgress(100);

        // Показываем меню
        const prog = Storage.getProgress();
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) {
          const pointsUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/points.png') || '';
menuScore.innerHTML = `<img src="${pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${prog.score || 0}`;
        }
        SceneManager.show('menu');
        this.bindMenuEvents();
        // ★★★ Баннерная реклама ★★★
            this._scheduleBannerAd();

        // Очищаем таймаут, если он ещё не сработал
        if (this._loadTimeout) {
            clearTimeout(this._loadTimeout);
            this._loadTimeout = null;
        }

        // Скрываем экран загрузки (на всякий случай)
        document.getElementById('scene-loading')?.classList.remove('active');
    });
},

// --- Баннерная реклама с повторными попытками ---
    _scheduleBannerAd() {
        const showBanner = () => {
            if (Platform._bannerAdShown) return;
            Platform.showBannerAd();
        };

        // Первая попытка сразу
        setTimeout(showBanner, 1000);

        // Повтор через 1 минуту, если ещё не показан
        setTimeout(() => {
            if (!Platform._bannerAdShown) {
                showBanner();
            }
        }, 60000);

        // Повтор через 2 минуты, если всё ещё не показан
        setTimeout(() => {
            if (!Platform._bannerAdShown) {
                showBanner();
            }
        }, 120000);
    },

    // ---- Управление отложенными диалогами ----

    setPendingDialog(has) {
        this._hasPendingDialog = has;
            },

    startPulseOnToggleButton() {
        document.querySelectorAll('.subscene-toggle-btn').forEach(btn => {
            btn.classList.add('pulse-attention');
        });
    },

    stopPulseOnToggleButton() {
        document.querySelectorAll('.subscene-toggle-btn').forEach(btn => {
            btn.classList.remove('pulse-attention');
        });
    },

    onDialogueComplete() {
       
        this._hasPendingDialog = false;
             this.clearSubsceneButtonItem();
    },

    // ---- Переключение подсцен ----
updatePulseState() {
    if (this.currentSubscene === 'dialogue') {
        this.startPulseOnToggleButton();
    } else {
        this.stopPulseOnToggleButton();
    }
},
    toggleSubscene() {
        if (this.subsceneButtonItem) return;
        if (this.currentSubscene === 'game') {
            const pending = DialogueController.getPendingDialog();
            if (pending) {
                DialogueController.startDialog(pending, () => {
                    this.onDialogueComplete();
                });
                this.stopPulseOnToggleButton();
                this._hasPendingDialog = false;
                this._pendingDialogStarted = false;
            } else {
                this.currentSubscene = 'dialogue';
                SceneManager.show('dialogue');
                 // ---- ОБНОВЛЕНИЕ СЧЁТА ----
                if (typeof Game !== 'undefined' && Game.updateUI) {
                        Game.updateUI();
                    }

                const container = document.querySelector('.dialogue-container');
                if (container) {
                    container.style.display = 'none';
                    container.classList.remove('dialog-appear', 'fade-out-scale');
                }
                const continueBtn = document.getElementById('dialogue-continue-btn');
                if (continueBtn) continueBtn.style.display = 'none';
                const textEl = document.getElementById('dialogue-text');
                if (textEl) textEl.textContent = '';
                const imgEl = document.querySelector('.dialogue-character img');
                if (imgEl) imgEl.style.display = 'none';
                const speaker = document.querySelector('.dialogue-speaker');
                if (speaker) speaker.textContent = '';

                this.updateSubsceneButton();
                this.stopPulseOnToggleButton();
            }
  } else {
            this.currentSubscene = 'game';
            SceneManager.show('game');
            // Откладываем тяжёлые операции на 650 мс (после завершения анимации)
                // Снимаем паузу сразу, если она активна
                if (typeof Game !== 'undefined' && Game.isPaused) {
                    Game.togglePause();
                    const btn = document.getElementById('game-pause-btn');
                    if (btn) btn.textContent = '⏸';
                }
                // Остальные тяжёлые операции оставляем с задержкой
                setTimeout(() => {
                    ResizeManager.handleResize();
                    if (typeof Game !== 'undefined' && Game.updateUI) {
                        Game.updateUI();
                    }
                this.updateSubsceneButton();
                this.updatePulseState();
                this.clearSubsceneButtonItem();
            }, 650);
        }

        
    },

    // ---- Обновление кнопки переключения ----

updateSubsceneButton() {
    const buttons = document.querySelectorAll('.subscene-toggle-btn');
    const isGame = this.currentSubscene === 'game';
    const iconSrc = isGame ? 'stroika' : 'gotovka';
    const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/${iconSrc}.png`) || '';
    if (this.subsceneButtonItem) {
        const imgSrc = Game.getItemImageDataUrl(this.subsceneButtonItem.typeIndex, this.subsceneButtonItem.level);
        buttons.forEach(btn => {
            btn.innerHTML = `<img src="${imgSrc}" alt="">`;
            btn.classList.add('has-item');
        });
    } else {
        buttons.forEach(btn => {
            btn.innerHTML = `<img src="${iconUrl}" alt="">`;
            btn.classList.remove('has-item');
        });
    }
    this.updatePulseState();
},

    setSubsceneButtonItem(typeIndex, level) {
        this.subsceneButtonItem = { typeIndex, level };
        this.updateSubsceneButton();
    },

    clearSubsceneButtonItem() {
        this.subsceneButtonItem = null;
        this.updateSubsceneButton();
    },

    handleSubsceneButtonClick() {
        if (this.subsceneButtonItem) {
            const success = Game.spawnItemFromButton(this.subsceneButtonItem.typeIndex, this.subsceneButtonItem.level);
            if (success) {
                this.clearSubsceneButtonItem();
            }
        } else {
            this.toggleSubscene();
        }
    },

showHelpModal() {
    // --- Получаем картинки из атласов ---
    const vedroUrl = Game.getItemImageDataUrl(4, 1);   // ведро уровень 1 (typeIndex 4)
    const shetkaUrl = Game.getItemImageDataUrl(3, 4);  // щётка уровень 4 (typeIndex 3)
    const k5Url = SpriteAtlas.getSpriteDataURL('chara', 'chara/pokupateli/k5.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🧑%3C/text%3E%3C/svg%3E';
    const stroikaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/stroika.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🔨%3C/text%3E%3C/svg%3E';
    const korzinaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/korzina.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🧺%3C/text%3E%3C/svg%3E';

    const rules = [
        `<div class="help-rule">
            <div class="item-info-cell" style="width:clamp(2.5rem,5vmin,4rem); height:clamp(2.5rem,5vmin,4rem); flex-shrink:0;">
                <img src="${vedroUrl}" style="width:80%; height:80%; object-fit:contain;">
            </div>
            <span class="help-rule-text">${getText('help_rule1')}</span>
        </div>`,
        `<div class="help-rule">
            <div class="item-info-cell" style="width:clamp(2.5rem,5vmin,4rem); height:clamp(2.5rem,5vmin,4rem); flex-shrink:0;">
                <img src="${shetkaUrl}" style="width:80%; height:80%; object-fit:contain;">
            </div>
            <span class="help-rule-text">${getText('help_rule2')}</span>
        </div>`,
        `<div class="help-rule">
            <div class="item-info-cell" style="width:clamp(2.5rem,5vmin,4rem); height:clamp(2.5rem,5vmin,4rem); flex-shrink:0;">
                <img src="${k5Url}" style="width:80%; height:80%; object-fit:contain;">
            </div>
            <span class="help-rule-text">${getText('help_rule3')}</span>
        </div>`,
        `<div class="help-rule">
            <div class="item-info-cell" style="width:clamp(2.5rem,5vmin,4rem); height:clamp(2.5rem,5vmin,4rem); flex-shrink:0;">
                <img src="${stroikaUrl}" style="width:80%; height:80%; object-fit:contain;">
            </div>
            <span class="help-rule-text">${getText('help_rule4')}</span>
        </div>`,
        `<div class="help-rule">
            <div class="item-info-cell" style="width:clamp(2.5rem,5vmin,4rem); height:clamp(2.5rem,5vmin,4rem); flex-shrink:0;">
                <img src="${korzinaUrl}" style="width:80%; height:80%; object-fit:contain;">
            </div>
            <span class="help-rule-text">${getText('help_rule5')}</span>
        </div>`
    ];

    const itemsPerPage = 2;
    const totalPages = Math.ceil(rules.length / itemsPerPage);
    let currentPage = 0;

    const renderPage = (page) => {
        const start = page * itemsPerPage;
        const end = Math.min(start + itemsPerPage, rules.length);
        let contentHtml = '<div class="help-rules-container">';
        for (let i = start; i < end; i++) {
            contentHtml += rules[i];
        }
        contentHtml += '</div>';

        const indicator = `${page + 1} / ${totalPages}`;

        const bodyHtml = `
            <div style="width:100%;">
                ${contentHtml}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-top:1rem; width:100%; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <button class="modal-btn modal-btn-secondary" id="help-prev-btn" ${page === 0 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>
                        ◀
                    </button>
                    <span style="font-size:clamp(0.9rem,2vh,1.4rem); color:#4a3a2a; font-weight:700; min-width:3rem; text-align:center;">${indicator}</span>
                    <button class="modal-btn modal-btn-secondary" id="help-next-btn" ${page === totalPages - 1 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>
                        ▶
                    </button>
                </div>
                <button class="modal-btn" id="help-ok-btn" style="margin:0;">${getText('ok', 'OK')}</button>
            </div>
        `;

        ModalManager.showCenterModal({
            title: getText('help_title'),
            body: bodyHtml,
            buttons: []
        });

        setTimeout(() => {
            const prevBtn = document.getElementById('help-prev-btn');
            const nextBtn = document.getElementById('help-next-btn');
            const okBtn = document.getElementById('help-ok-btn');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 0) {
                        currentPage--;
                        ModalManager.closeCenterModal();
                        renderPage(currentPage);
                    }
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages - 1) {
                        currentPage++;
                        ModalManager.closeCenterModal();
                        renderPage(currentPage);
                    }
                });
            }
            if (okBtn) {
                okBtn.addEventListener('click', () => {
                    ModalManager.closeCenterModal();
                });
            }
        }, 50);
    };

    renderPage(currentPage);
},

   // --- Обработчик клика по кнопке телевизора ---
    _onTvClick() {
        // Модалка "Рулетка"
        const bodyHtml = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.8rem; padding:0.5rem;">
                <div style="font-size:clamp(1rem,2vw,1.4rem); text-align:center;">
                    ${getText('reward_ad_prompt', 'Посмотри рекламу и получи случайный предмет!')}
                </div>
                <button id="reward-ad-watch-btn" class="modal-btn" style="font-size:clamp(2rem,4vw,3rem); padding:0.3rem 1rem;">
                    📺
                </button>
            </div>
        `;

        const modal = ModalManager.showCenterModal({
            title: getText('reward_ad_title', 'Рулетка'),
            body: bodyHtml,
            buttons: [] // только крестик закрытия
        });

        // Обработчик кнопки просмотра
        const watchBtn = modal.querySelector('#reward-ad-watch-btn');
        if (watchBtn) {
            watchBtn.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                // Запускаем рекламу
                Platform.showRewardedAd()
                    .then((rewarded) => {
                        if (rewarded) {
                            // Успешно посмотрел – выдаём предмет
                            ModalManager.closeCenterModal();
                            this._giveRandomRewardFromTv();
                            // После выдачи, возможно, реклама больше не доступна – обновим кнопку
                            this._updateTvButtonVisibility();
                        } else {
                            // Не досмотрел или ошибка
                            ModalManager.closeCenterModal();
                            ModalManager.showErrorModal(
                                getText('reward_ad_error_title', 'Ошибка'),
                                getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                            );
                            // Обновим доступность на всякий случай
                            this._updateTvButtonVisibility();
                        }
                    })
                    .catch((err) => {
                        console.warn('Ошибка показа рекламы за вознаграждение:', err);
                        ModalManager.closeCenterModal();
                        ModalManager.showErrorModal(
                            getText('reward_ad_error_title', 'Ошибка'),
                            getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                        );
                        this._updateTvButtonVisibility();
                    });
            });
        }
    },

    // --- Выдача случайного предмета из кнопки телевизора ---
    _giveRandomRewardFromTv() {
        const sceneCfg = getCurrentSceneConfig();
        const availableTypes = sceneCfg.availableTypes || [];
        // Фильтруем только те, что могут спавниться (но можно и любые, главное чтобы были в itemData)
        const spawnableTypes = availableTypes.filter(idx => {
            const item = Game.itemData[idx];
            return item && item.spawnable === true;
        });
        if (spawnableTypes.length === 0) {
            // Если нет спавнящихся – берём все доступные
            const fallback = availableTypes.length ? availableTypes : [0];
            const typeIdx = fallback[Math.floor(Math.random() * fallback.length)];
            const level = 1;
            this._spawnItemFromTv(typeIdx, level);
            return;
        }
        const randomType = spawnableTypes[Math.floor(Math.random() * spawnableTypes.length)];
        const level = 1; // всегда 1
        this._spawnItemFromTv(randomType, level);
    },

    _spawnItemFromTv(typeIndex, level) {
        const freeCell = Game.findFreeCell();
        if (!freeCell) {
            ModalManager.showErrorModal(
                getText('inventory_no_space_title', 'Нет места'),
                getText('inventory_no_space_text', 'Расчисти место, чтобы было куда это положить')
            );
            return;
        }

        // Координаты кнопки телевизора для анимации
        const tvBtn = document.getElementById('tv-btn');
        let startX, startY;
        if (tvBtn && Game.canvas) {
            const rect = tvBtn.getBoundingClientRect();
            const canvasRect = Game.canvas.getBoundingClientRect();
            startX = (rect.left + rect.width / 2 - canvasRect.left) * Game.scaleX;
            startY = (rect.top + rect.height / 2 - canvasRect.top) * Game.scaleY;
        } else {
            startX = Game.canvas ? Game.canvas.width / 2 : 0;
            startY = Game.canvas ? Game.canvas.height / 2 : 0;
        }

        Game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col, typeIndex, level);
        Game.updateUI();
    },

    // --- Обновление видимости кнопки телевизора ---
    _updateTvButtonVisibility() {
        const tvBtn = document.getElementById('tv-btn');
        if (!tvBtn) return;
        const available = Platform.isRewardedAdAvailable();
        tvBtn.style.display = available ? 'flex' : 'none';
    },


// ---- Привязка UI ----

    bindUI() {
      document.getElementById('menu-settings-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            ModalManager.showSettingsModal();
        });
        document.getElementById('menu-help-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            this.showHelpModal();
        });

       document.getElementById('menu-play-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            this.startGameFlow();
        });
   

                //кнопка сброса 
document.getElementById('menu-reset-btn')?.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (confirm(getText('menu_reset_confirm', 'Сбросить весь прогресс?'))) {
        // Остановка игры
        if (typeof Game !== 'undefined' && Game.cleanup) {
            Game.cleanup();
        }
            Storage.clearBoard();
        // Сброс данных с явной очисткой интерьеров
        const newProgress = {
            score: 0,
            level: 1,
            highestScore: 0,
            totalCombines: 0,
            ordersUnlocked: false,
            interiorStates: {} ,
              inventory: [] ,
                collection: { discovered: {}, stickerRemoved: {} } 
        };
        Storage.saveProgress(newProgress);
        if (typeof InteriorManager !== 'undefined') {
            InteriorManager.clearInteriors();
        }

        // Сброс диалогов и квестов
        DialogueController.resetAllDialogs();
        QuestManager.reset();

        // Сброс состояния App
        App._hasPendingDialog = false;
        App._pendingDialogStarted = false;
        App.stopPulseOnToggleButton();
        App.subsceneButtonItem = null;
        App.currentSubscene = 'game';
        App.updateSubsceneButton();
        Storage.clearSceneStarted();
        // Закрытие модалок
        if (typeof ModalManager !== 'undefined') {
            ModalManager.closeAll();
        }

             // После сброса обновить кнопку корзинки
        if (typeof Game !== 'undefined' && Game.updateInventoryButton) {
            Game.updateInventoryButton();
        }
        // Переключение в меню
        SceneManager.show('menu');
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) menuScore.innerHTML = `<img src="images/ui/points.png" style="width:1.5em;height:1.5em;vertical-align:middle;"> 0`;

        // Сброс заказов
        if (typeof OrderManager !== 'undefined' && OrderManager.reset) {
            OrderManager.reset();
        }

        // Обновление фона
        if (typeof BackgroundManager !== 'undefined') {
            BackgroundManager.setMode('menu');
        }
       }
});
           document.querySelectorAll('.subscene-toggle-btn').forEach(btn => {
                btn.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0) return;
                    this.handleSubsceneButtonClick(e);
                });
            });
        document.getElementById('dialogue-continue-btn')?.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                DialogueController.next();
            });
            // обработчик для кнопки корзинки:
            this.inventoryBtn = document.getElementById('inventory-btn');
            if (this.inventoryBtn) {
                this.inventoryBtn.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0) return;
                    if (typeof ModalManager !== 'undefined') {
                        ModalManager.showInventoryModal();
                    }
                });
            }

        document.getElementById('dialogue-home-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isRunning) { Game.isRunning = false; }
            SceneManager.show('menu');
            this.stopPulseOnToggleButton();
            setTimeout(() => {
                if (typeof Game !== 'undefined' && Game.saveBoardState) {
                    Game.saveBoardState();
                }
            }, 650);
        });
        document.getElementById('game-home-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isRunning) { Game.isRunning = false; }
            SceneManager.show('menu');
            // Сохраняем после анимации
            setTimeout(() => {
                if (typeof Game !== 'undefined' && Game.saveBoardState) {
                    Game.saveBoardState();
                }
            }, 650);
        });
       document.getElementById('game-pause-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isRunning) {
                const paused = Game.togglePause();
                const btn = document.getElementById('game-pause-btn');
                if (btn) btn.textContent = paused ? '▶' : '⏸';
            }
        });    
       document.getElementById('overlay-resume-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isPaused) {
                Game.togglePause();
                const btn = document.getElementById('game-pause-btn');
                if (btn) btn.textContent = '⏸';
            }
        });  
    },

    bindMenuEvents() {
        // Дополнительные события для меню (при необходимости)
    },

    startGameFlow() {
        this.startGame();
    },

startGame() {
    AudioManager.playMusic();
    const isMobile = window.innerWidth < 768 || window.innerHeight < 600;
    Game.isMobile = isMobile;

    const rows = 7;
    const cols = 9;
// ★ Получаем панели один раз
const rightPanel = document.getElementById('right-panel');
const rightPanelDialogue = document.getElementById('right-panel-dialogue');

    // ★ Загружаем доску из сохранения (если есть)
    Game.init(rows, cols, true); // true = загрузить сохранённую доску
    // Инициализация менеджеров (они используют Game)
    OrderManager.init(Game);
    ResizeManager.init(Game);
    QuestManager.init(Game);

            // ★ Кнопка подарка
let giftBtn = document.getElementById('gift-btn');
if (giftBtn) giftBtn.remove();
giftBtn = document.createElement('button');
giftBtn.id = 'gift-btn';
giftBtn.className = 'tb-btn';
const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
giftBtn.innerHTML = `<img src="${podarokUrl}" style="width:70%; height:70%; object-fit:contain;" onerror="this.outerHTML='🎁';">`;
giftBtn.style.display = 'none';
giftBtn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    Game.onGiftClick();
});
if (rightPanel) rightPanel.appendChild(giftBtn);

 // ★ Кнопка телевизора (реклама за вознаграждение)
        let tvBtn = document.getElementById('tv-btn');
        if (tvBtn) tvBtn.remove();
        tvBtn = document.createElement('button');
        tvBtn.id = 'tv-btn';
        tvBtn.className = 'tb-btn';
       const tvUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/tv.png') || '';
tvBtn.innerHTML = `<img src="${tvUrl}" style="width:70%; height:70%; object-fit:contain;">`;
        // Видимость – только если реклама доступна
        tvBtn.style.display = Platform.isRewardedAdAvailable() ? 'flex' : 'none';
        tvBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            this._onTvClick();
        });
        if (rightPanel) rightPanel.appendChild(tvBtn);


// ★ Кнопка квестов
let questBtn = document.getElementById('quest-btn');
if (questBtn) questBtn.remove();
questBtn = document.createElement('button');
questBtn.id = 'quest-btn';
questBtn.className = 'tb-btn';
const questUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/kvest.png') || '';
questBtn.innerHTML = `<img src="${questUrl}" style="width:70%; height:70%; object-fit:contain;" onerror="this.outerHTML='📋';">`;
questBtn.style.display = 'none';
questBtn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    Game.onQuestClick();
});
if (rightPanel) rightPanel.appendChild(questBtn);

// ★ Кнопка коллекции в диалоговой панели
if (rightPanelDialogue) {
    let collectionBtn = document.getElementById('collection-btn');
    if (collectionBtn) collectionBtn.remove();
    collectionBtn = document.createElement('button');
    collectionBtn.id = 'collection-btn';
    collectionBtn.className = 'tb-btn';
   const colectUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/colect.png') || '';
collectionBtn.innerHTML = `<img src="${colectUrl}" style="width:70%; height:70%; object-fit:contain;">`;
    collectionBtn.addEventListener('pointerdown', () => {
        if (typeof CollectionManager !== 'undefined') {
            CollectionManager.openCollectionModal();
        }
    });
    rightPanelDialogue.appendChild(collectionBtn);
}    

// Замена иконок home на атлас
const menuUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/menu.png') || '';
document.querySelectorAll('#dialogue-home-btn img, #game-home-btn img').forEach(img => {
    if (img) img.src = menuUrl;
});

// Замена иконок подарка в прогресс-баре на атлас
const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
document.querySelectorAll('.progress-gift-icon').forEach(img => {
    if (img) img.src = podarokUrl;
});

    CollectionManager.init(Game);     
    CollectionManager.updateButtonVisibility();
    // ★ Адаптация размеров
    ResizeManager.handleResize();

    const board = document.getElementById('game-board');
    if (board) {
        board.style.flex = '1 1 auto';
        board.style.minWidth = '0';
        board.style.minHeight = '0';
    }

    // ★ Колбэки для обновления UI
    Game.onScoreUpdate = (score) => {
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) menuScore.innerHTML = `<img src="images/ui/points.png" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${score}`;
        QuestManager.checkAll();
    };
        Game.onLevelUpdate = (level) => {
            // Уровень больше не отображается цифрой, обновляем прогресс-бар
            if (typeof Game.updateProgressBar === 'function') {
                Game.updateProgressBar();  }
            QuestManager.checkAll();
        };

    // ★ Скрываем оверлеи паузы и окончания игры
    Game.hideOverlay('pause');

    // ★★★ ОБРАБОТКА ИНТРО-ДИАЛОГА ПРИ ПЕРВОМ ЗАПУСКЕ СЦЕНЫ ★★★
    const sceneId = currentSceneId;
    const config = getCurrentSceneConfig();

    // Проверяем, была ли эта сцена уже запущена (сохраняется в Storage)
    if (!Storage.isSceneStarted(sceneId)) {
        // Ищем интро-диалог с trigger: 'scene_start' и auto: true
        const introDialog = config.dialogues?.find(d => d.trigger === 'scene_start' && d.auto);
        if (introDialog) {
            // Отмечаем сцену как запущенную, чтобы при перезагрузке не показывать повторно
            Storage.markSceneStarted(sceneId);
            // Запускаем диалог
            DialogueController.startDialog(introDialog, () => {
                if (typeof App !== 'undefined') {
                    App.onDialogueComplete();
                }
                // После завершения интро-диалога можно включить кнопку подсказки и прочее
                // (по желанию)
            });
        } else {
            // Если интро-диалога нет – просто отмечаем сцену как запущенную
            Storage.markSceneStarted(sceneId);
        }
    } else {
        // Сцена уже запускалась – интро-диалог не показываем
        // (можно дополнительно проверить, не требуется ли показать другие диалоги)
    }

    // ★ В конце – обновляем кнопки и UI
    Game.updateUI();
    Game.updateInventoryButton();
    Game.updateInfoPanel();
    Game.findHintPair();
    Game.startInactivityTimer();
    Game.checkGiftButton();
}

        
};