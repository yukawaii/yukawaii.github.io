// ============================================================
//  APP  – инициализация и управление жизненным циклом
// ============================================================
const App = {
    initialized: false,
    _loadTimeout: null,
    _platformReady: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Установить язык
        setLanguage(currentLang);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.dataset.lang;
            if (lang === currentLang) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        SceneManager.init();
        AudioManager.init();

        // Прогресс-бар (имитация)
        let progress = 0;
        const loadBar = document.getElementById('load-progress');
        const loadInterval = setInterval(() => {
            progress += Math.random() * 8 + 2;
            if (progress > 95) progress = 95;
            if (loadBar) loadBar.style.width = Math.min(progress, 95) + '%';
        }, 200);

        // Таймаут 60 секунд – принудительно показываем меню
        this._loadTimeout = setTimeout(() => {
            console.warn('[App] Таймаут загрузки – показываем меню');
            clearInterval(loadInterval);
            if (loadBar) loadBar.style.width = '100%';
            // Принудительно переходим в меню, даже если платформа не готова
            this.onPlatformReady();
        }, 10000);

        // Инициализация платформы
        Platform.init(() => {
            this._platformReady = true;
            clearTimeout(this._loadTimeout);
            clearInterval(loadInterval);
            if (loadBar) loadBar.style.width = '100%';
            setTimeout(() => {
                this.onPlatformReady();
            }, 400);
        });

        // Привязка UI
        this.bindUI();

        // Обработка видимости (пауза при сворачивании)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (Game.isRunning && !Game.isPaused && !Game.isGameOver) {
                    Game.togglePause();
                    const btn = document.getElementById('game-pause-btn');
                    if (btn) btn.textContent = '▶';
                }
            }
        });

        // Ресайз
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (SceneManager.current === 'game') Game.resize();
            }, 300);
        });

        // Запрет контекстного меню и pull-to-refresh
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('touchmove', e => {
            if (e.target.closest('#game-wrapper')) e.preventDefault();
        }, { passive: false });

        console.log('[App] Инициализация завершена');
    },

    onPlatformReady() {
        // Если меню уже показано – выходим
        if (SceneManager.current === 'menu') return;

        // Загружаем прогресс из localStorage (уже синхронизирован с VK)
        const prog = Storage.getProgress();
        const menuScore = document.getElementById('menu-score-display');
        if (menuScore) menuScore.textContent = '⭐ ' + (prog.score || 0);

        SceneManager.show('menu');
        this.bindMenuEvents();

        // Если был таймаут – очищаем
        if (this._loadTimeout) {
            clearTimeout(this._loadTimeout);
            this._loadTimeout = null;
        }
    },

    bindUI() {
        // Кнопки языка
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (setLanguage(lang)) {
                    document.querySelectorAll('.lang-btn').forEach(b =>
                        b.classList.toggle('active', b.dataset.lang === lang)
                    );
                    localStorage.setItem('cafe_lang', lang);
                    const menuScore = document.getElementById('menu-score-display');
                    if (menuScore) menuScore.textContent = '⭐ ' + (Storage.getProgress().score || 0);
                    if (SceneManager.current === 'dialogue') DialogueController.showDialogue();
                }
            });
        });

        // Кнопка "Играть"
        document.getElementById('menu-play-btn')?.addEventListener('click', () => {
            this.startGameFlow();
        });

        // Кнопка "Сброс"
        document.getElementById('menu-reset-btn')?.addEventListener('click', () => {
            if (confirm(getText('menu_reset_confirm', 'Сбросить весь прогресс?'))) {
                Storage.saveProgress({ score: 0, level: 1, highestScore: 0, totalCombines: 0 });
                const menuScore = document.getElementById('menu-score-display');
                if (menuScore) menuScore.textContent = '⭐ 0';
                if (SceneManager.current === 'game') Game.reset();
            }
        });

        // Диалог
        document.getElementById('dialogue-continue-btn')?.addEventListener('click', () => {
            DialogueController.next();
        });

        // Пауза
        document.getElementById('game-pause-btn')?.addEventListener('click', () => {
            if (Game.isRunning && !Game.isGameOver) {
                const paused = Game.togglePause();
                const btn = document.getElementById('game-pause-btn');
                if (btn) btn.textContent = paused ? '▶' : '⏸';
            }
        });

        // Домой
        document.getElementById('game-home-btn')?.addEventListener('click', () => {
            if (Game.isRunning) {
                clearInterval(Game.timerInterval);
                Game.isRunning = false;
            }
            SceneManager.show('menu');
        });

        // Возобновить из паузы
        document.getElementById('overlay-resume-btn')?.addEventListener('click', () => {
            if (Game.isPaused) {
                Game.togglePause();
                const btn = document.getElementById('game-pause-btn');
                if (btn) btn.textContent = '⏸';
            }
        });

        // Следующий уровень
        document.getElementById('overlay-next-btn')?.addEventListener('click', () => {
            Game.nextLevel();
        });
    },

    bindMenuEvents() {
        // Дополнительные события для меню (при необходимости)
    },

    startGameFlow() {
        DialogueController.start(() => {
            this.startGame();
        });
    },

    startGame() {
        const isMobile = window.innerWidth < 768 || window.innerHeight < 600;
        Game.isMobile = isMobile;
        const rows = isMobile ? Game.mobileRows : 9;
        const cols = isMobile ? Game.mobileCols : 9;

        SceneManager.show('game');
        Game.init(rows, cols);

        Game.onScoreUpdate = () => {
            const menuScore = document.getElementById('menu-score-display');
            if (menuScore) menuScore.textContent = '⭐ ' + Game.score;
        };
        Game.onLevelUpdate = () => {
            document.getElementById('game-level').textContent = Game.level;
        };
        Game.onTimerUpdate = () => {
            document.getElementById('game-timer').textContent = Math.max(0, Game.timer);
        };

        Game.hideOverlay('pause');
        Game.hideOverlay('gameover');
        setTimeout(() => Game.resize(), 50);
    }
};