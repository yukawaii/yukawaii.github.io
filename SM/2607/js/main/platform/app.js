// ============================================================
//  APP  – инициализация и управление жизненным циклом
// ============================================================
const App = {
    initialized: false,
    _loadTimeout: null,

    currentSubscene: 'dialogue',
    subsceneButtonItem: null,
    _hasPendingDialog: false,
       pointsUrl: '', 
       isEventMode: false,
_previousScene: 'dialogue',
_enteringEvent: false,
  
    init() {
        if (this.initialized) return;
        this.initialized = true;
        updateDeviceState();
           // ★ ОДИН РАЗ – сохранение при закрытии страницы ★
window.addEventListener('beforeunload', () => {
    App.saveFullProgress();
    Platform._clearPeriodicAdCheck();
    if (App._autoSaveInterval) {
        clearInterval(App._autoSaveInterval);
        App._autoSaveInterval = null;
    }
     if (App._eventTimerInterval) {
        clearInterval(App._eventTimerInterval);
        App._eventTimerInterval = null;
    }
     // ★ Очистка интервалов RaceManager
    if (typeof RaceManager !== 'undefined' && RaceManager._badgeUpdateInterval) {
        clearInterval(RaceManager._badgeUpdateInterval);
        RaceManager._badgeUpdateInterval = null;
    }
    if (typeof RaceManager !== 'undefined' && RaceManager._timerInterval) {
        clearInterval(RaceManager._timerInterval);
        RaceManager._timerInterval = null;
    }


});

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
    } else if (sceneName === 'dialogue' || sceneName === 'game') {
        BackgroundManager.setMode(sceneName);
        BackgroundManager.update(sceneId);
        if (typeof QuestManager !== 'undefined') {
            QuestManager.onSceneChange(sceneId);
        }
    }

    if (sceneName === 'game') {
        setTimeout(() => {
            ResizeManager.handleResize();
        }, 650);
         // 🏁 Обновляем кнопку гонки при переходе в игру
        if (typeof RaceManager !== 'undefined') {
            setTimeout(() => RaceManager._updateButtonVisibility(), 50);
        }
    }
 // 🧩 Обновляем кнопку пазла
    if (typeof App !== 'undefined') {
        setTimeout(() => App._updateButtonsVisibility(), 50);
    }

    // ---- Кнопка ивента ----
    if (sceneName === 'dialogue') {
        const activeEvent = getActiveEvent();
        const eventBtn = document.getElementById('event-btn');
        if (activeEvent && !this.isEventMode) {
            if (eventBtn) {
                eventBtn.style.display = 'flex';
                const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${activeEvent.id}.png`);
                eventBtn.innerHTML = iconUrl
    ? `<span class="icon-wrapper"><img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;"></span>`
    : '🎃';

     // ★  обновление таймера кнопки ивента
            this._updateEventButtonTimer();
            }
        } else {
            if (eventBtn) eventBtn.style.display = 'none';
        }

        // ★ НОВОЕ: скрываем контейнер диалога, если диалог не активен и нет отложенного
        const container = document.querySelector('.dialogue-container');
        if (container) {
            const isActive = DialogueController.isActive || false;
            const hasPending = DialogueController.hasPendingDialog ? DialogueController.hasPendingDialog() : false;
            if (!isActive && !hasPending) {
                container.style.display = 'none';
                container.classList.remove('dialog-appear', 'fade-out-scale');
            }
        }
    }
});
                // Инициализация менеджера фона
                BackgroundManager.init();
        

        AudioManager.init();

        if (typeof PuzzManager !== 'undefined') {
            PuzzManager.init();
        }
    
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

        this._initButtons();

      document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ---- Game ----
        if (Game.isRunning && !Game.isPaused && !Game.isDragging && !Game.processingClick) {
            Game.togglePause();
            const btn = document.getElementById('game-pause-btn');
            if (btn) btn.textContent = '▶';
        }
        // ---- Event ----
        if (typeof EventManager !== 'undefined' && EventManager.isRunning && !EventManager.isPaused) {
            EventManager.togglePause();
            const btn = document.getElementById('event-pause-btn');
            if (btn) btn.textContent = '▶';
            // Сохраняем состояние
            try {
                App.saveFullProgress();
            } catch (e) {
                console.error('[App] Ошибка сохранения при visibilitychange (event):', e);
            }
        }
    }
});
        // ★  обработчик потери фокуса окна ★ перключение с браузера на другое 
          window.addEventListener('blur', () => {
                    // ---- Game ----
                    if (Game.isRunning && !Game.isPaused && !Game.isDragging && !Game.processingClick) {
                        Game.togglePause();
                        const btn = document.getElementById('game-pause-btn');
                        if (btn) btn.textContent = '▶';
                    }
                    // ---- Event ----
                    if (typeof EventManager !== 'undefined' && EventManager.isRunning && !EventManager.isPaused) {
                        EventManager.togglePause();
                        const btn = document.getElementById('event-pause-btn');
                        if (btn) btn.textContent = '▶';
                        try {
                            App.saveFullProgress();
                        } catch (e) {
                            console.error('[App] Ошибка сохранения при blur (event):', e);
                        }
                    }
                });

        let resizeTimer;
   window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        ResizeManager.handleResize();
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
            
if (this.isEventMode && typeof EventManager !== 'undefined') {
    const { rows, cols, isMobile } = computeBoardSize();
    if (isMobile) {
        ResizeManager.reshapeBoard(EventManager, rows, cols, {
            onSave: () => EventManager._saveState(),
            onUIUpdate: () => EventManager.updateUI()
        });
    }
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
//автосохранение каждые 5 мин
this._autoSaveInterval = setInterval(() => {
    if (typeof Game !== 'undefined' && Game.isRunning) {
        App.saveFullProgress();
    }
}, 300000);  // 5 минут

// Интервал для обновления таймера на кнопке ивента (раз в минуту)
this._eventTimerInterval = setInterval(() => {
    this._updateEventButtonTimer();
}, 600000); // 10 мин


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

        // Получаем URL для иконки очков и сохраняем в App
        this.pointsUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/points.png') || '';

         // ★ Устанавливаем иконки кнопок после загрузки спрайтов ★
    this._updateButtonIcons();

        // Показываем меню
      const prog = Storage.getProgress();
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) {
            menuScore.innerHTML = `<img src="${this.pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${prog.score || 0}`;
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

        // Повтор через 2 минут, если всё ещё не показан
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
  

 // ---- Вспомогательные методы для кнопки переключения ----
    _showSubsceneToggle() {
        document.querySelectorAll('.subscene-toggle-wrapper').forEach(el => {
            el.classList.add('visible');
        });
    },
    _hideSubsceneToggle() {
        document.querySelectorAll('.subscene-toggle-wrapper').forEach(el => {
            el.classList.remove('visible');
        });
    },


toggleSubscene() {
    if (this.subsceneButtonItem) return;

    // ---- Переключение из игры в диалог ----
    if (this.currentSubscene === 'game') {
        const pending = DialogueController.getPendingDialog();
        if (pending) {
            // Если есть отложенный диалог – запускаем его
             this.currentSubscene = 'dialogue';
            DialogueController.startDialog(pending, () => {
                this.onDialogueComplete();
            });
            this.stopPulseOnToggleButton();
            this._hasPendingDialog = false;
                        // ❌ refresh здесь НЕ НУЖЕН – после завершения диалога onDialogueComplete() вызовет refresh
            return;
        }

        // Обычное переключение на диалог (без отложенного диалога)
        this.currentSubscene = 'dialogue';
        App.saveFullProgress();
        SceneManager.show('dialogue');

        if (typeof Game !== 'undefined' && Game.updateUI) {
            Game.updateUI();
        }

        // Скрываем диалоговое окно (оно неактивно)
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

        // ★ обновить кноппку коллекций (проверка есть ли у уигрока 2 уровень для оторажения)
    if (typeof CollectionManager !== 'undefined') {
                CollectionManager.updateButtonVisibility();
            }
        this.updateSubsceneButton();
        this.stopPulseOnToggleButton();
          this._showSubsceneToggle(); 
          DialogueController.showPanel();

        return;
    }

// ---- Переключение из ивента/диалога в игру (или выход из ивента) ----
// Если мы в ивенте – выходим из него
if (this.isEventMode) {
    const targetScene = this._previousScene || 'dialogue';
    EventManager.exitEvent();
    this.isEventMode = false;
    this._enteringEvent = false;

    // Восстанавливаем сцену без перезапуска игры
    if (targetScene === 'game') {
        Game.isRunning = true; // ← ПЕРЕНЕСЕНО СЮДА
        if (Game.isRunning) {
            SceneManager.show('game');
            if (Game.isPaused) {
                Game.togglePause();
                const btn = document.getElementById('game-pause-btn');
                if (btn) btn.textContent = '⏸';
            }
            BoardCore.initCanvas(Game, 'game-board', 'game-canvas');
            Game._drawBackground();
            BoardCore.drawBoard(Game);
            Game.updateUI();
            ResizeManager.handleResize();
        } else {
            this.startGame(); // fallback
        }
        this.currentSubscene = 'game';
    } else {
        SceneManager.show('dialogue');
        if (typeof Game !== 'undefined' && Game.updateUI) {
            Game.updateUI();
        }
        this.currentSubscene = 'dialogue';
    }

    App.saveFullProgress();
    this.updateSubsceneButton();
    this.clearSubsceneButtonItem();
    this.updatePulseState();
    document.querySelectorAll('.subscene-toggle-btn').forEach(btn => btn.style.display = 'flex');

    // Восстанавливаем кнопку ивента
    const activeEvent = getActiveEvent();
    const eventBtn = document.getElementById('event-btn');
    if (activeEvent && eventBtn) {
        const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${activeEvent.id}.png`);
        eventBtn.innerHTML = iconUrl
    ? `<span class="icon-wrapper"><img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;"></span>`
    : '🎃';
        eventBtn.style.display = 'flex';
    } else if (eventBtn) {
        eventBtn.style.display = 'none';
    }
  this._showSubsceneToggle();
    return;
}

    // ---- Обычное переключение из диалога в игру ----
    this.currentSubscene = 'game';
    SceneManager.show('game');
    App.saveFullProgress(); 
    DialogueController.hidePanel(); // ★ скрыть диалоговую панель
    this._showSubsceneToggle();     // ★ показать кнопку переключения в игре
    // Принудительная перерисовка доски
if (typeof Game !== 'undefined' && Game.canvas) {
    BoardCore.initCanvas(Game, 'game-board', 'game-canvas');
    Game._drawBackground();
    BoardCore.drawBoard(Game);
}

    if (typeof Game !== 'undefined' && Game.isPaused) {
        Game.togglePause();
        const btn = document.getElementById('game-pause-btn');
        if (btn) btn.textContent = '⏸';
    }

    // Даём время на отрисовку, затем обновляем размеры и UI
    setTimeout(() => {
        ResizeManager.handleResize();
        if (typeof Game !== 'undefined' && Game.updateUI) {
            Game.updateUI();
        }
        this.updateSubsceneButton();
        this.updatePulseState();
        this.clearSubsceneButtonItem();

    }, 650);
},


toggleEvent() {
   // console.log('[App] toggleEvent вызван, _enteringEvent:', this._enteringEvent, 'isEventMode:', this.isEventMode);
    if (this._enteringEvent) return;
    this._enteringEvent = true;

    const activeEvent = getActiveEvent();
    if (!activeEvent) {
        const btn = document.getElementById('event-btn');
        if (btn) btn.style.display = 'none';
        this._enteringEvent = false;
        return;
    }

// ---- ВЫХОД ИЗ ИВЕНТА ----
if (this.isEventMode) {
    const targetScene = this._previousScene || 'dialogue';
    EventManager.exitEvent();
    ModalManager.closeAll();
    App.saveFullProgress();
    this.isEventMode = false;

    if (targetScene === 'game') {
        // Восстанавливаем игру
        Game.isRunning = true; // <-- ВАЖНО: восстановить флаг
        SceneManager.show('game');
        if (Game.isPaused) {
            Game.togglePause();
            const btn = document.getElementById('game-pause-btn');
            if (btn) btn.textContent = '⏸';
        }
        BoardCore.initCanvas(Game, 'game-board', 'game-canvas');
        Game._drawBackground();
        BoardCore.drawBoard(Game);
        Game.updateUI();
        ResizeManager.handleResize();
    } else {
        SceneManager.show('dialogue');
        DialogueController.showPanel(); // ★ показать панель (теперь она точно скрыта)
        if (typeof Game !== 'undefined' && Game.updateUI) {
            Game.updateUI();
        }
          DialogueController.showPanel(); 
    }

    this.currentSubscene = targetScene === 'game' ? 'game' : 'dialogue';
    this.updateSubsceneButton();
    this.clearSubsceneButtonItem();
    document.querySelectorAll('.subscene-toggle-btn').forEach(btn => btn.style.display = 'flex');

    // Восстанавливаем кнопку ивента
    const activeEvent = getActiveEvent();
    const eventBtn = document.getElementById('event-btn');
    if (activeEvent && eventBtn) {
        const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${activeEvent.id}.png`);
        eventBtn.innerHTML = iconUrl
    ? `<span class="icon-wrapper"><img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;"></span>`
    : '🎃';
        eventBtn.style.display = 'flex';
          this._updateEventButtonTimer(); 
    } else if (eventBtn) {
        eventBtn.style.display = 'none';
    }
  this._showSubsceneToggle();  // ← показываем кнопку переключения
    this._enteringEvent = false;
    return;
}

    // ---- ВХОД В ИВЕНТ ----
    this._previousScene = SceneManager.current;

if (SceneManager.current === 'game') {
    if (Game.isRunning) {
        Game.saveBoardState();
        App.saveFullProgress();  // ← добавляем
        Game.isRunning = false;
    }
}

    document.querySelectorAll('.subscene-toggle-btn').forEach(btn => btn.style.display = 'none');
this._hideSubsceneToggle();     // ← скрываем кнопку переключения
    const success = EventManager.startEvent(activeEvent.id);
    if (success) {
        this.isEventMode = true;
        SceneManager.show('event');
         DialogueController.hidePanel(); // ★ скрыть
        const eventBtn = document.getElementById('event-btn');
        if (eventBtn) {
            eventBtn.innerHTML = '✕';
            eventBtn.style.display = 'flex';
            // ★ Удаляем бейдж
    const badge = eventBtn.querySelector('.time-badge');
    if (badge) badge.remove();
        }
    
    } else {
        document.querySelectorAll('.subscene-toggle-btn').forEach(btn => btn.style.display = 'flex');
        SceneManager.show(this._previousScene);
        this.isEventMode = false;
        const eventBtn = document.getElementById('event-btn');
        if (eventBtn) {
            const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${activeEvent.id}.png`);
            eventBtn.innerHTML = iconUrl
    ? `<span class="icon-wrapper"><img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;"></span>`
    : '🎃';
        }
    }
    this._enteringEvent = false;
},

    // ---- Обновление кнопки переключения ----

updateSubsceneButton() {
    const buttons = document.querySelectorAll('.subscene-toggle-btn');
    const isGame = this.currentSubscene === 'game';
    const iconSrc = isGame ? 'stroika' : 'gotovka';
    const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/${iconSrc}.png`) || '';

    // Получаем содержимое для иконки (предмет или стандартная иконка)
    let newContent;
    if (this.subsceneButtonItem) {
        const imgSrc = BoardCore.getItemImageDataUrl(Game, this.subsceneButtonItem.typeIndex, this.subsceneButtonItem.level);
        newContent = `<img src="${imgSrc}" alt="">`;
    } else {
        newContent = `<img src="${iconUrl}" alt="">`;
    }

    buttons.forEach(btn => {
        // Находим или создаём обёртку для иконки
        let wrapper = btn.querySelector('.icon-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('span');
            wrapper.className = 'icon-wrapper';
            btn.innerHTML = ''; // очищаем
            btn.appendChild(wrapper);
        }

        // Если содержимое не изменилось, ничего не делаем
        const currentContent = wrapper.innerHTML;
        if (currentContent === newContent) {
            // но нужно обновить класс has-item, если изменился режим
            btn.classList.toggle('has-item', !!this.subsceneButtonItem);
            return;
        }

        // Если есть старое изображение – запускаем анимацию исчезновения
        const oldImg = wrapper.querySelector('img');
        if (oldImg) {
            oldImg.classList.add('fade-out-scale');
            // После окончания анимации удаляем старый контент и вставляем новый с появлением
            const onFadeOut = () => {
                oldImg.removeEventListener('animationend', onFadeOut);
                // Вставляем новый контент
                wrapper.innerHTML = newContent;
                const newImg = wrapper.querySelector('img');
                if (newImg) {
                    newImg.classList.add('fade-in-scale');
                    // Убираем класс после анимации, чтобы не мешать
                    newImg.addEventListener('animationend', () => {
                        newImg.classList.remove('fade-in-scale');
                    }, { once: true });
                }
                btn.classList.toggle('has-item', !!this.subsceneButtonItem);
            };
            oldImg.addEventListener('animationend', onFadeOut, { once: true });
        } else {
            // Если старого изображения нет – сразу вставляем с анимацией появления
            wrapper.innerHTML = newContent;
            const newImg = wrapper.querySelector('img');
            if (newImg) {
                newImg.classList.add('fade-in-scale');
                newImg.addEventListener('animationend', () => {
                    newImg.classList.remove('fade-in-scale');
                }, { once: true });
            }
            btn.classList.toggle('has-item', !!this.subsceneButtonItem);
        }
    });

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
    const vedroUrl = SpriteAtlas.getSpriteDataURL('items', 'items/level1/vedro.png') || '';
    const shetkaUrl = SpriteAtlas.getSpriteDataURL('items', 'items/level4/shetka.png') || '';
    const k5Url = SpriteAtlas.getSpriteDataURL('chara', 'chara/pokupateli/k5.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🧑%3C/text%3E%3C/svg%3E';
    const stroikaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/stroika.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🔨%3C/text%3E%3C/svg%3E';
    const korzinaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/korzina.png') ||
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23d9c5a6"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="%232a1f14"%3E🧺%3C/text%3E%3C/svg%3E';

    // Массив с данными для правил
    const rulesData = [
        { img: vedroUrl, textKey: 'help_rule1' },
        { img: shetkaUrl, textKey: 'help_rule2' },
        { img: k5Url, textKey: 'help_rule3' },
        { img: stroikaUrl, textKey: 'help_rule4' },
        { img: korzinaUrl, textKey: 'help_rule5' }
    ];

    const itemsPerPage = 2;
    const totalPages = Math.ceil(rulesData.length / itemsPerPage);
    let currentPage = 0;

    const renderPage = (page) => {
        const start = page * itemsPerPage;
        const end = Math.min(start + itemsPerPage, rulesData.length);

        // Контейнер для правил
        const rulesContainer = document.createElement('div');
        rulesContainer.className = 'help-rules-container';
        rulesContainer.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';

        for (let i = start; i < end; i++) {
            const ruleData = rulesData[i];
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'help-rule';
            ruleDiv.style.cssText = 'display:flex; align-items:center; gap:0.5rem;';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'item-info-cell';
            imgContainer.style.cssText = 'width:clamp(4rem,10vmin,8rem); height:clamp(4rem,10vmin,5rem); flex-shrink:0;';
            const img = document.createElement('img');
            img.src = ruleData.img;
            img.style.cssText = 'width:90%; height:90%; object-fit:contain;';
            imgContainer.appendChild(img);
            ruleDiv.appendChild(imgContainer);

            const textSpan = document.createElement('span');
            textSpan.className = 'help-rule-text';
            textSpan.textContent = getText(ruleData.textKey);
            ruleDiv.appendChild(textSpan);

            rulesContainer.appendChild(ruleDiv);
        }

        // Панель навигации
        const navPanel = document.createElement('div');
        navPanel.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-top:1rem; width:100%; flex-wrap:wrap;';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display:flex; align-items:center; gap:0.5rem;';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'modal-btn modal-btn-secondary';
        prevBtn.id = 'help-prev-btn';
        prevBtn.textContent = '◀';
        prevBtn.disabled = (page === 0);
        if (page === 0) {
            prevBtn.style.opacity = '0.4';
            prevBtn.style.pointerEvents = 'none';
        }
        prevBtn.addEventListener('pointerdown', () => {
            if (currentPage > 0) {
                currentPage--;
                ModalManager.closeCenterModal();
                renderPage(currentPage);
            }
        });
        leftGroup.appendChild(prevBtn);

        const indicator = document.createElement('span');
        indicator.style.cssText = 'font-size:clamp(0.9rem,2vh,1.4rem); color:#4a3a2a; font-weight:700; min-width:3rem; text-align:center;';
        indicator.textContent = `${page + 1} / ${totalPages}`;
        leftGroup.appendChild(indicator);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'modal-btn modal-btn-secondary';
        nextBtn.id = 'help-next-btn';
        nextBtn.textContent = '▶';
        nextBtn.disabled = (page === totalPages - 1);
        if (page === totalPages - 1) {
            nextBtn.style.opacity = '0.4';
            nextBtn.style.pointerEvents = 'none';
        }
        nextBtn.addEventListener('pointerdown', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                ModalManager.closeCenterModal();
                renderPage(currentPage);
            }
        });
        leftGroup.appendChild(nextBtn);

        const okBtn = document.createElement('button');
        okBtn.className = 'modal-btn';
        okBtn.id = 'help-ok-btn';
        okBtn.textContent = getText('ok', 'OK');
        okBtn.style.margin = '0';
        okBtn.addEventListener('pointerdown', () => {
            ModalManager.closeCenterModal();
        });

        navPanel.appendChild(leftGroup);
        navPanel.appendChild(okBtn);

        // Собираем всё в контейнер
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'width:100%;';
        modalContent.appendChild(rulesContainer);
        modalContent.appendChild(navPanel);

        ModalManager.showCenterModal({
            title: getText('help_title'),
            bodyElement: modalContent,
            buttons: []
        });
    };

    renderPage(currentPage);
},

    // app.js – внутри App

    _onTvClick() {
  if (typeof Game === 'undefined' || !Game.isRunning) return;
        const itemsPool = Game.generateRouletteItems();
        if (itemsPool.length === 0) {
            ModalManager.showErrorModal('', 'Нет доступных предметов для розыгрыша');
            return;
        }

        Platform.showRewardRoulette(itemsPool, (selectedItem) => {
            const freeCell = BoardCore.findFreeCell(Game);
            if (!freeCell) {
                ModalManager.showErrorModal(
                    getText('no_space', 'Нет места'),
                    getText('no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
                return;
            }

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

            Game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col,
                                    selectedItem.typeIndex, selectedItem.level);
        });
    },


    _spawnItemFromTv(typeIndex, level) {
        const freeCell = BoardCore.findFreeCell(Game);
        if (!freeCell) {
            ModalManager.showErrorModal(
                getText('no_space', 'Нет места'),
                getText('no_space_text', 'Расчисти место, чтобы было куда это положить')
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
                // ---- 1. Полный сброс EventManager ----
                if (typeof EventManager !== 'undefined') {
                        // ★ ОТМЕНЯЕМ ТАЙМЕР СОХРАНЕНИЯ
                        if (EventManager._saveTimer) {
                            clearTimeout(EventManager._saveTimer);
                            EventManager._saveTimer = null;
                        }

                        // ---- Очистка всех данных для всех boardId ----
                        // Получаем все ключи из localStorage
                        for (const key of Object.keys(localStorage)) {
                            if (key.startsWith('cafe_board_') || key.startsWith('cafe_orders_')) {
                                localStorage.removeItem(key);
                            }
                        }
                    // Если ивент активен – выходим из него
                    if (typeof App !== 'undefined' && App.isEventMode) {
                        EventManager.exitEvent();  App.isEventMode = false;
                    }
                    // Принудительная очистка всех внутренних данных и остановка циклов
                    if (EventManager._timerInterval) {
                        clearInterval(EventManager._timerInterval); EventManager._timerInterval = null;
                    }
                    if (EventManager._animationFrameId) {
                        cancelAnimationFrame(EventManager._animationFrameId);
                        EventManager._animationFrameId = null;   EventManager._loopActive = false;
                    }
                    EventManager._activeEvent = null;
                    EventManager._eventState = null;
                    EventManager._eventItemTypeIndex = null;
                    EventManager._eventItemData = [];
                    EventManager._eventMaxLevels = [];
                    EventManager.board = [];
                    EventManager.rows = 0;
                    EventManager.cols = 0;
                    EventManager.isRunning = false;
                    EventManager.isPaused = false;
                    EventManager.score = 0;
                    EventManager._lastGiftTime = 0;
                    EventManager.giftPending = false;
                    EventManager._giftRemaining = 0;
                    EventManager.itemAnimations = [];
                    EventManager.pulseItems = [];
                    EventManager.stars = [];
                    EventManager.hintAnimations = [];
                    EventManager._spriteCache = {};
                    EventManager._dataUrlCache = {};
                     for (const cfg of EVENT_CONFIGS) {
                        Storage.clearEventState(cfg.id);                      
                    }
                    // Очистка UI ивента
                    const eventScene = document.getElementById('scene-event');
                    if (eventScene) eventScene.classList.remove('active');
                    const orderArea = document.getElementById('event-order-area');
                    if (orderArea) orderArea.innerHTML = '';
                    const bgImg = document.getElementById('event-bg-img');
                    if (bgImg) bgImg.src = '';
                    const canvas = document.getElementById('event-canvas');
                    if (canvas) { const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
    
                }
                        // Сброс пазлов
                        if (typeof PUZZ_CONFIGS !== 'undefined' && Array.isArray(PUZZ_CONFIGS)) {
                            PUZZ_CONFIGS.forEach(config => {
                                Storage.set('cafe_puzz_' + config.id, null);   });
                        }
                        // ---- Сброс гонок (RaceManager) ----
                        if (typeof RaceManager !== 'undefined') {
                            // Если есть активная гонка – завершаем её
                            if (RaceManager._activeRace) {
                                RaceManager._activeRace.state.ended = true;
                                RaceManager._saveState();  RaceManager._activeRace = null;
                            }
                            // Останавливаем таймер обновления
                            if (RaceManager._interval) {  clearInterval(RaceManager._interval);
                                RaceManager._interval = null;
                            }
                            // Удаляем все сохранённые состояния гонок из Storage
                            if (typeof RACE_CONFIGS !== 'undefined' && Array.isArray(RACE_CONFIGS)) {
                                for (const config of RACE_CONFIGS) {
                                    const key = 'cafe_race_' + config.id;
                                    Storage.set(key, null); // удаляем запись
                                }
                            }
                            // Сбрасываем внутренние флаги
                            RaceManager._modalOpen = false;
                            RaceManager._button = null;  RaceManager._initialized = false;
                            // Обновляем кнопку (она должна скрыться)
                            if (typeof RaceManager._updateButtonVisibility === 'function') {
                                RaceManager._updateButtonVisibility();
                            }
                        }

                // ---- 2. Остановка основной игры ----
                if (typeof Game !== 'undefined' && Game.cleanup) { Game.cleanup();  }
                Storage.clearBoard();  
                // ---- 4. Сброс прогресса (включая коллекции) ----
                const newProgress = {
                    score: 0, level: 1,highestScore: 0,  totalCombines: 0,
                    ordersUnlocked: false,  interiorStates: {},
                    inventory: [],   collection: { discovered: {}, stickerRemoved: {} },
                    eventItemsMap: {}, sceneStarted: {},
                    lastGiftTime: 0,exp: 0,  dialogueIndex: 0,
                };
                Storage.saveProgress(newProgress);

                // ---- 5. Сброс внутренних данных CollectionManager ----
                if (typeof CollectionManager !== 'undefined') {
                    CollectionManager._discovered = {};
                    CollectionManager._stickerRemoved = {};
                    CollectionManager._eventItemsMap = {};
                    CollectionManager._categories = {};
                    CollectionManager._categoryList = [];
                    CollectionManager._currentCategory = null;
                    CollectionManager._modalInstance = null;
                    // Кнопка коллекции пока скрыта (уровень 1)
                    if (CollectionManager._button) {
                        CollectionManager._button.style.display = 'none';
                    }
                }

                // ---- 6. Сброс интерьеров ----
                if (typeof InteriorManager !== 'undefined') {
                    InteriorManager.clearInteriors();
                }
                InteriorManager._imageCache.clear();

                // ---- 7. Сброс диалогов и квестов ----
                DialogueController.resetAllDialogs();
                if (typeof QuestManager !== 'undefined') {
                    QuestManager.reset();
                }

                // ---- 8. Сброс состояния App ----
                App._hasPendingDialog = false;
                    App.stopPulseOnToggleButton();
                App.subsceneButtonItem = null;
                App.currentSubscene = 'game';
                App.updateSubsceneButton();
                App.isEventMode = false;
                App._enteringEvent = false;
                Storage.clearSceneStarted();
               

                // ---- 9. Закрыть все модалки ----
                if (typeof ModalManager !== 'undefined') {
                    ModalManager.closeAll();
                }

                // ---- 10. Сброс заказов ----
                if (typeof OrderManager !== 'undefined' && OrderManager.reset) {
                    OrderManager.reset();
                }

                // ---- 11. Обновить кнопку корзинки ----
                if (typeof Game !== 'undefined' && Game.updateInventoryButton) {
                    Game.updateInventoryButton();
                }

                // ---- 12. Скрыть кнопку ивента ----
                const eventBtn = document.getElementById('event-btn');
                if (eventBtn) eventBtn.style.display = 'none';

                // ---- 13. Переключение в меню ----
                SceneManager.show('menu');
                const menuScore = document.getElementById('menu-score-display');
                if (menuScore) {
                    menuScore.innerHTML = `<img src="${App.pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> 0`;
                }

                // ---- 14. Обновить фон ----
                if (typeof BackgroundManager !== 'undefined') {
                    BackgroundManager.setMode('menu');
                }
                //обовить кнопку коллекций
                if (typeof CollectionManager !== 'undefined') {
                            CollectionManager.updateButtonVisibility();
                        }

             
                        //  сбрасываем состояние заказов (если они были)
                        if (typeof OrderManager !== 'undefined' && OrderManager.reset) {
                            OrderManager.reset();
                        }

             /*   // ---- 15. Принудительное сохранение (на всякий случай) ----
                if (typeof App.saveFullProgress === 'function') {
                    App.saveFullProgress();
                }*/

                // ---- 16. Перезагрузка Game (чтобы очистить кешированные данные) ----
                // Это гарантирует, что при следующем запуске игры доска будет создана заново
                if (typeof Game !== 'undefined') {
                    Game._spriteCache = {};
                    Game._backgroundCanvas = null;
                    Game._backgroundCtx = null;
                    // Если игра не запущена, то ничего не делаем
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

        document.getElementById('dialogue-home-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isRunning) { Game.isRunning = false; }
            this.stopPulseOnToggleButton();
            App.saveFullProgress(); 
            SceneManager.show('menu');
             });
        document.getElementById('game-home-btn')?.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isRunning) { Game.isRunning = false; }
            App.saveFullProgress(); 
            SceneManager.show('menu');
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


document.getElementById('event-overlay-resume-btn')?.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (typeof EventManager !== 'undefined' && EventManager.isPaused) {
        EventManager.togglePause();
        const btn = document.getElementById('event-pause-btn');
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

// ================================================================
//  startGame() – запуск игры (доска, диалоги, кнопки)
//  🔹 Вызывается из меню (кнопка "Играть") или после выхода из ивента
// ================================================================
startGame() {
    // 🎵 Включаем фоновую музыку
    AudioManager.playMusic();
    // 📱 Определяем мобильное устройство для адаптации
            const { rows, cols, isMobile } = computeBoardSize();
            Game.isMobile = isMobile;
        // ★★★ ПОЛУЧАЕМ ТЕКУЩУЮ СЦЕНУ И ЕЁ boardId ★★★
        const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;
        const config = getSceneConfig(sceneId);
        const boardId = config.boardId || null;
        // ★★★ ПЕРЕДАЁМ boardId В GAME (через глобальную переменную или напрямую) ★★★
        // Можно сохранить в Game, но Game ещё не инициализирован,
        // поэтому используем глобальную переменную для storage.js
        window._currentBoardId = boardId;
    // 📦 Получаем контейнеры для панелей (правая панель игры и диалога)
    const rightPanel = document.getElementById('right-panel');
    const rightPanelDialogue = document.getElementById('right-panel-dialogue');
                // 🌟 Инициализация коллекции (система достижений/открытий)
            //    Должна быть до загрузки доски, чтобы onItemCreated работал корректно
            CollectionManager.init(Game);
                ResizeManager.init(Game);
            QuestManager.init(Game);

// 1. Обновление видимости
this._updateButtonsVisibility();

// 2. Установка ссылки на инвентарь (если кнопка уже есть)
Game.inventoryBtn = document.getElementById('inventory-btn');
Game.updateInventoryButton();

    // 📜 Инициализация прокрутки для панелей (если контент не помещается)
    const gamePanel = document.getElementById('right-panel');
    if (gamePanel && typeof ScrollablePanel !== 'undefined') {
        ScrollablePanel.init(gamePanel);
    }
    const dialoguePanel = document.getElementById('right-panel-dialogue');
    if (dialoguePanel && typeof ScrollablePanel !== 'undefined') {
        ScrollablePanel.init(dialoguePanel);
    }  

    // 🖼️ Обновляем видимость кнопки коллекции (в зависимости от прогресса)
    CollectionManager.updateButtonVisibility();

      // 🎨 Настройка контейнера доски (flex, чтобы канвас правильно масштабировался)
    const board = document.getElementById('game-board');
    if (board) {
        board.style.flex = '1 1 auto';
        board.style.minWidth = '0';
        board.style.minHeight = '0';
    }

    // 🔄 Колбэки для обновления UI при изменении счёта/уровня
    Game.onScoreUpdate = (score) => {
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) menuScore.innerHTML = `<img src="${this.pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${score}`;
        QuestManager.checkAll();
    };
    Game.onLevelUpdate = (level) => {
        if (typeof Game.updateProgressBar === 'function') {
            Game.updateProgressBar();
        }
        QuestManager.checkAll();
    };

    // ⏸️ Скрываем оверлей паузы (на случай, если он остался с прошлого раза)
    Game.hideOverlay('pause');

    // ================================================================
    // 2️⃣  ЗАПУСК ИГРЫ (загрузка спрайтов, доски)
    //     🔹 Всё, что требует загрузки, выполняется в колбэке
    // ================================================================
    Game.init(rows, cols, true, () => {
            // ⚙️ Инициализация менеджеров (заказы, ресайз, квесты) – они не требуют загрузки спрайтов
            OrderManager.init(Game);
           // console.log('[OrderManager] init called, game.maxLevels =', Game.maxLevels);
// 🏁 Инициализация менеджера гонок
if (typeof RaceManager !== 'undefined') {
    // Даём время на полную отрисовку правой панели
    setTimeout(() => {
        RaceManager.init(Game);
        // Дополнительное обновление через 200 мс
        setTimeout(() => RaceManager._updateButtonVisibility(), 200);
    }, 400);}

        // ✅ КОЛБЭК ВЫПОЛНИТСЯ ПОСЛЕ ЗАГРУЗКИ ВСЕХ СПРАЙТОВ И ДОСКИ
        //    Здесь мы управляем диалогами, фоном, интерьерами и UI
        const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;
        // -------------------------------------------------------------
        // 2.1  УПРАВЛЕНИЕ ДИАЛОГАМИ (интро, отложенные)
        // -------------------------------------------------------------
        // 🔹 Проверяем, есть ли отложенный диалог (например, после выполнения квеста)
        let pending = DialogueController.getPendingDialog();
        // 🔹 Если отложенного нет, проверяем, не первый ли запуск сцены
        if (!pending && !Storage.isSceneStarted(sceneId)) {
            const config = getCurrentSceneConfig();
            // Ищем диалог с trigger: 'scene_start' и auto: true
            const introDialog = config.dialogues?.find(d => d.trigger === 'scene_start' && d.auto);
            if (introDialog && !introDialog._shown) {
                // Помечаем как показанный, чтобы при следующем заходе не повторялся
                introDialog._shown = true;    pending = introDialog;
                // Отмечаем сцену как запущенную (чтобы при повторном входе не искать интро)
                Storage.markSceneStarted(sceneId);
            } else {     // Если интро-диалога нет, просто отмечаем сцену
                Storage.markSceneStarted(sceneId);
            }
        }

        // -------------------------------------------------------------
        // 2.2  ПЕРЕКЛЮЧЕНИЕ СЦЕНЫ И ЗАПУСК ДИАЛОГА
        // -------------------------------------------------------------

        if (!this.isEventMode) {
            if (pending) {
                // 📖 Есть диалог – запускаем его (он сам переключит сцену на 'dialogue')
                DialogueController.startDialog(pending, () => {
                    // После завершения диалога обновляем кнопку переключения
                    App.updateSubsceneButton();
                });
                          } else {
                // 🚫 Нет диалога – просто показываем сцену диалога с фоном, но без контейнера
                App.currentSubscene = 'dialogue';
                App.updateSubsceneButton();
                SceneManager.show('dialogue');
                // Скрываем контейнер диалога (он будет пустым, если диалог неактивен)
                const container = document.querySelector('.dialogue-container');
                if (container) {  container.style.display = 'none';
                    container.classList.remove('dialog-appear', 'fade-out-scale');
                }
                  this._showSubsceneToggle();     // ← показываем кнопку переключения
                  DialogueController.showPanel();
            }
        }
        // -------------------------------------------------------------
        // 2.3  ОБНОВЛЕНИЕ ФОНА И ИНТЕРЬЕРОВ
        // -------------------------------------------------------------
        if (typeof BackgroundManager !== 'undefined') {
            BackgroundManager.update(sceneId);
        } else if (typeof InteriorManager !== 'undefined') {
            InteriorManager.onSceneChange(sceneId);
        }
        // -------------------------------------------------------------
        // 2.4  ОБНОВЛЕНИЕ КНОПКИ "ИГРАТЬ" В МЕНЮ
        // -------------------------------------------------------------
        const playBtn = document.getElementById('menu-play-btn');
        if (playBtn) { playBtn.textContent = getText('menu_play', 'Играть');
            playBtn.disabled = false;
        }
                // -------------------------------------------------------------
                // 2.5  ОБНОВЛЕНИЕ КНОПКИ ИВЕНТА (если активен)
                // -------------------------------------------------------------
                const activeEvent = getActiveEvent();
                const eventBtn = document.getElementById('event-btn');
                if (activeEvent && !this.isEventMode) {
                    if (eventBtn) {
                        eventBtn.style.display = 'flex';
                        const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${activeEvent.id}.png`);
                        eventBtn.innerHTML = iconUrl
                            ? `<span class="icon-wrapper"><img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;"></span>`
                            : '🎃';
                        // ★ Добавляем обновление таймера
                        this._updateEventButtonTimer();
                    }
                } else {  if (eventBtn) eventBtn.style.display = 'none';
                }

        // -------------------------------------------------------------
        // 2.6  ОБНОВЛЕНИЕ UI, ПОДСКАЗОК И ПЕРЕРИСОВКА
        // -------------------------------------------------------------
        ModalManager._infoContainer = document.getElementById('info-modal-container');
        Game.updateUI();
        Game.updateInventoryButton();
        BoardCore.updateInfoPanel(Game);
        BoardCore.findHintPair(Game);
        BoardCore.startInactivityTimer(Game);
        Game.checkGiftButton();

        // 🔄 Если мы на сцене game (может быть после выхода из ивента) – перерисовываем доску
        if (SceneManager.current === 'game') {
           // BoardCore.initCanvas(Game, 'game-board', 'game-canvas');
            Game._drawBackground();
            BoardCore.drawBoard(Game);
            Game.updateUI();
            ResizeManager.handleResize();
        }
        // 💾 Сохраняем прогресс после всех изменений
        App.saveFullProgress();
    });

},



saveFullProgress() {
    const progress = Storage.getProgress();
            // Другие данные (счёт, уровень, опыт) можно сохранять и когда игра не запущена,
            // так как они могут меняться вне игры (например, через инвентарь или квесты)
            if (typeof Game !== 'undefined') {
                progress.score = Game.score || 0;
                progress.level = Game.level || 1;
                if (typeof Experience !== 'undefined') {
                    progress.exp = Experience.getExp();
                }
                progress.lastGiftTime = Game._lastGiftTime || 0;
            }


        // 3. Коллекция Storage.saveProgress  сохранит коллекцию.
       if (typeof CollectionManager !== 'undefined') {
            if (!progress.collection) progress.collection = {};
            progress.collection.discovered = CollectionManager._discovered || {};
            progress.collection.stickerRemoved = CollectionManager._stickerRemoved || {};
            progress.eventItemsMap = CollectionManager._eventItemsMap || {};
        }

            // 4. Инвентарь (берём из хранилища, чтобы не потерять изменения)
        progress.inventory = Storage.getInventory();

        // 5. Состояния интерьеров (если менялись)
        if (typeof InteriorManager !== 'undefined') {
            progress.interiorStates = InteriorManager.getStates?.() || progress.interiorStates;
        }

        // 6. Заказы (если менеджер заказов умеет сохранять)
        if (typeof OrderManager !== 'undefined' && OrderManager.getState) {
            progress.ordersState = OrderManager.getState();
        }

        // 7. Квесты
        if (typeof QuestManager !== 'undefined' && QuestManager.getState) {
            progress.questState = QuestManager.getState();
        }

        // 8. Время последнего подарка и другие флаги
        if (typeof Game !== 'undefined') {
            progress.lastGiftTime = Game._lastGiftTime;
        }

        // 9. Сцены (если есть состояния)
        if (typeof DialogueController !== 'undefined') {
            progress.dialogueIndex = DialogueController.getCurrentIndex?.() || 0;
        }
                  
            if (typeof PuzzManager !== 'undefined' && PuzzManager._puzzleInstance) {
                PuzzManager._savePuzzleState();
            }
            //10 ивенты
          if (typeof EventManager !== 'undefined' && EventManager.isRunning) {
                try {
                    EventManager._saveState();
                } catch (e) {
                    console.error('[App] Ошибка сохранения состояния ивента:', e);
                }
            }

             // Доска и заказы сохраняются отдельно через свои методы
        if (typeof Game !== 'undefined' && Game.saveBoardState) {
            Game.saveBoardState();
        }
        if (typeof OrderManager !== 'undefined' && OrderManager.saveState) {
            OrderManager.saveState();
        }
        // Сохраняем
        Storage.saveProgress(progress);
    },



_initButtons() {
    // ---- Кнопка подарка (игра) ----
    const giftBtn = document.getElementById('gift-btn');
    if (giftBtn) {
        giftBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isPaused) { showPausedMessage(); return; }
            Game.onGiftClick();
        });
    }

    
    // ---- Кнопка пазла (puzzle) ----
    const puzzleBtn = document.getElementById('puzzle-btn');
    if (!puzzleBtn) {
        const rightPanel = document.getElementById('right-panel');
        if (rightPanel) {
            const btn = document.createElement('button');
            btn.id = 'puzzle-btn';
            btn.className = 'tb-btn';
            const iconUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/puzzle.png') || '🧩';
            btn.innerHTML = `<img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🧩';">`;
            btn.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                // Открываем первый доступный пазл-ивент (id: 0)
                if (typeof PuzzManager !== 'undefined') {
                    PuzzManager.openPuzzle(0);
                }
            });
            rightPanel.appendChild(btn);
        }
    }

    // ---- Кнопка телевизора (реклама) ----
    const tvBtn = document.getElementById('tv-btn');
    if (tvBtn) {
        tvBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isPaused) { showPausedMessage(); return; }
            this._onTvClick();
        });
    }

    // ---- Кнопка квестов ----
    const questBtn = document.getElementById('quest-btn');
    if (questBtn) {
        questBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            Game.onQuestClick();
        });
    }

    // ---- Кнопка корзинки (инвентарь) ----
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) {
        invBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (Game.isPaused) { showPausedMessage(); return; }
            if (typeof ModalManager !== 'undefined') {
                ModalManager.showInventoryModal();
            }
        });
        Game.inventoryBtn = invBtn;
    }

    // ---- Кнопка коллекции (диалоговая панель) ----
    const collectionBtn = document.getElementById('collection-btn');
    if (collectionBtn) {
        collectionBtn.addEventListener('pointerdown', () => {
            if (typeof CollectionManager !== 'undefined') {
                CollectionManager.openCollectionModal();
            }
        });
    }

    // ---- Кнопка ивента (диалоговая панель) ----
    const eventBtn = document.getElementById('event-btn');
    if (eventBtn) {
        eventBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            this.toggleEvent();
        });
    }
},

_updateButtonIcons() {

    // ---- Кнопка пазла ----
const puzzleBtn = document.getElementById('puzzle-btn');
if (puzzleBtn) {
    const iconUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/puzzle.png') || '🧩';
    puzzleBtn.innerHTML = `<img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🧩';">`;
}
    // Кнопка подарка
    const giftBtn = document.getElementById('gift-btn');
    if (giftBtn) {
        const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
        giftBtn.innerHTML = `<img src="${podarokUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🎁';">`;
    }
    // Кнопка телевизора
    const tvBtn = document.getElementById('tv-btn');
    if (tvBtn) {
        const tvUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/tv.png') || '';
        tvBtn.innerHTML = `<img src="${tvUrl}" style="width:90%; height:90%; object-fit:contain;">`;
    }
    // Кнопка квестов
    const questBtn = document.getElementById('quest-btn');
    if (questBtn) {
        const questUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/kvest.png') || '';
        questBtn.innerHTML = `<img src="${questUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='📋';">`;
    }
    // Кнопка корзинки
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) {
        const korzinaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/korzina.png') || '';
        invBtn.innerHTML = `<img src="${korzinaUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🧺';">`;
    }
    // Кнопка коллекции
    const collectionBtn = document.getElementById('collection-btn');
    if (collectionBtn) {
        const colectUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/colect.png') || '';
        collectionBtn.innerHTML = `<img src="${colectUrl}" style="width:90%; height:90%; object-fit:contain;">`;
    }
    // Иконки "домой"
    const menuUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/menu.png') || '';
    document.querySelectorAll('#dialogue-home-btn img, #game-home-btn img').forEach(img => {
        if (img) img.src = menuUrl;
    });
    // Иконки подарка в прогресс-баре
    const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
    document.querySelectorAll('.progress-gift-icon').forEach(img => {
        if (img) img.src = podarokUrl;
    });

    //кнопка ивента 
     // ★ Обновляем таймер (если кнопка видна)
    this._updateEventButtonTimer();
},

// Добавьте в объект App после метода _updateButtonIcons (или в любое подходящее место)

_updateEventButtonTimer() {
    const eventBtn = document.getElementById('event-btn');
    if (!eventBtn) return;

    const activeEvent = getActiveEvent();
    if (!activeEvent) {
        const badge = eventBtn.querySelector('.time-badge');
        if (badge) badge.remove();
        return;
    }

    const now = Date.now();
    const end = activeEvent._end;
    const diff = end - now;

    if (diff <= 0) {
        const badge = eventBtn.querySelector('.time-badge');
        if (badge) badge.remove();
        return;
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    let timeText;
    if (days > 0) {
        timeText = days + 'д';
    } else {
        timeText = hours + 'ч';
    }

    let badge = eventBtn.querySelector('.time-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'time-badge';
        eventBtn.style.position = 'relative';
        eventBtn.appendChild(badge);
    }
    badge.textContent = timeText;
},

_updateButtonsVisibility() {
    // Подарок – показываем, если есть спавнер или подарок ожидает
    const giftBtn = document.getElementById('gift-btn');
    if (giftBtn) {
        // Видимость будет обновляться через Game.checkGiftButton()
        // но можно оставить как есть, т.к. Game.checkGiftButton сам управляет display
        // Поэтому ничего не делаем – Game обновит сам.
    }

    // Телевизор – зависит от доступности рекламы
    const tvBtn = document.getElementById('tv-btn');
    if (tvBtn) {
        tvBtn.style.display = Platform.isRewardedAdAvailable() ? 'flex' : 'none';
    }

    const puzzleBtn = document.getElementById('puzzle-btn');
if (puzzleBtn) {
    const hasConfigs = typeof PUZZ_CONFIGS !== 'undefined' && PUZZ_CONFIGS.length > 0;
    puzzleBtn.style.display = hasConfigs ? 'flex' : 'none';
}

    // Квесты – обновит Game.checkQuestButton()
    // Инвентарь – обновит Game.updateInventoryButton()
    // Коллекция – обновит CollectionManager.updateButtonVisibility()
    // Ивент – обновит обработчик события
},




        
};