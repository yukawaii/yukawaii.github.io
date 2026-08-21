// ============================================================
//  PUZZ MANAGER  — интеграция с JigsawPuzzle (с сохранением состояния)
// ============================================================

const PUZZ_INITIAL_ATTEMPTS = 23;
const PUZZ_ROWS = 3;
const PUZZ_COLS = 3;

const PuzzManager = {
    _config: null,
    _currentLevel: 0,
    _state: null,
    _modalElement: null,
    _puzzleInstance: null,
    _initialized: false,
    _starAnimationTimer: null,
    _attemptsLabel: null,
    _attemptsMobile: null,
    _skipWinOnLoad: false,      // флаг, чтобы принудительно не показывать готовую картинку
  _storageTimer: null,  // ★ новое поле
    _readyInterval: null,   // ★ интервал проверки готовности пазла
    _overlayHidden: false,   // флаг, что оверлей уже скрыт




    init() {
        if (this._initialized) return;
        this._initialized = true;
    },

    openPuzzle(configId) {
        const config = PUZZ_CONFIGS.find(c => c.id === configId);
        if (!config) {
            console.warn('[PuzzManager] Конфиг не найден:', configId);
            return;
        }
        this._config = config;
        this._currentLevel = this._getFirstUnlockedLevel();
        this._skipWinOnLoad = false;
        this._loadState();
        this._showModal();
    },

    _getFirstUnlockedLevel() {
        const state = this._loadGlobalState();
        for (let i = 0; i < this._config.levels; i++) {
            if (!state.levels[i]?.completed) return i;
        }
        return this._config.levels - 1;
    },

_loadGlobalState() {
    const key = 'cafe_puzz_' + this._config.id;
    let saved = Storage.get(key);
    if (!saved) {
        const levels = Array.from({ length: this._config.levels }, () => ({
            completed: false,
            attempts: PUZZ_INITIAL_ATTEMPTS,
            savedPuzzle: null
        }));
        saved = { levels, secretRewardClaimed: false };
        Storage.set(key, saved);
        return saved;
    }
    if (!saved.levels || saved.levels.length !== this._config.levels) {
        const levels = Array.from({ length: this._config.levels }, () => ({
            completed: false,
            attempts: PUZZ_INITIAL_ATTEMPTS,
            savedPuzzle: null
        }));
        saved = { levels, secretRewardClaimed: saved.secretRewardClaimed || false };
        Storage.set(key, saved);
    }
    for (const level of saved.levels) {
        if (level.savedPuzzle === undefined) level.savedPuzzle = null;
    }
    if (saved.secretRewardClaimed === undefined) saved.secretRewardClaimed = false;
    return saved;
},

    _saveGlobalState(state) {
        Storage.set('cafe_puzz_' + this._config.id, state);
    },

    _loadState() {
        const global = this._loadGlobalState();
        if (this._currentLevel >= global.levels.length) {
            this._currentLevel = global.levels.length - 1;
        }
        this._state = global.levels[this._currentLevel];
        if (!this._state) {
            this._state = {
                completed: false,
                attempts: PUZZ_INITIAL_ATTEMPTS,
                savedPuzzle: null
            };
            global.levels[this._currentLevel] = this._state;
            this._saveGlobalState(global);
        }
        if (!this._state.savedPuzzle) {
            this._state.savedPuzzle = null;
        }
    },

    _saveState() {
        const global = this._loadGlobalState();
        global.levels[this._currentLevel] = this._state;
        this._saveGlobalState(global);
    },

 _savePuzzleState() {
    //    console.log('[PuzzManager] _savePuzzleState вызван, _puzzleInstance:', !!this._puzzleInstance);
        if (this._puzzleInstance && this._puzzleInstance.puzzle && this._puzzleInstance.puzzle.prng) {
            try {
                const puzzle = this._puzzleInstance.puzzle;
             //   console.log('[PuzzManager] polyPieces.length:', puzzle.polyPieces.length);
                if (puzzle.polyPieces && puzzle.polyPieces.length === 1) {
                 //   console.log('[PuzzManager] Пазл собран, сбрасываем savedPuzzle');
                    this._state.savedPuzzle = null;
                    this._saveState();
                    return;
                }
                const data = puzzle.getStateData();
                const savedString = JSON.stringify(data);
             //   console.log('[PuzzManager] Сохраняем состояние, длина строки:', savedString.length);
                this._state.savedPuzzle = savedString;
                this._saveState();
            } catch (e) {
                console.warn('[PuzzManager] Ошибка сохранения состояния:', e);
            }
        } else {
            console.warn('[PuzzManager] _savePuzzleState: экземпляр пазла отсутствует');
        }
    },

_showCompletedImage(puzzleContainer) {
    // ★ Скрываем глобальный оверлей (если он есть)
    const globalOverlay = document.getElementById('puzzle-loading-overlay');
    if (globalOverlay) {
        globalOverlay.style.display = 'none';
        globalOverlay.style.opacity = '0';
        console.log('[PuzzManager] Оверлей скрыт при показе готовой картинки');
    }
    if (puzzleContainer && puzzleContainer._puzzleContainer) {
        puzzleContainer = puzzleContainer._puzzleContainer;
    }
    if (!puzzleContainer) return;

    // Явно делаем контейнер видимым
    puzzleContainer.style.display = 'block';

    // Полностью очищаем контейнер
    puzzleContainer.innerHTML = '';

    const img = document.createElement('img');
    const levelIndex = this._currentLevel + 1;
    img.src = `images/puzz/${this._config.id}/${levelIndex}.jpg`;
    img.alt = 'Готовый пазл';

    img.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 95%;
        max-height: 95%;
          ${Device.isLowPerformance ? '' : 'box-shadow: 0 4px 12px rgba(42, 31, 20, 0.25);'}
        border-radius: 4px;
        display: block;
        opacity: 0;
        transition: opacity 0.3s;
    `;

    const onLoad = () => {
        const rect = puzzleContainer.getBoundingClientRect();
        const w = rect.width || puzzleContainer.clientWidth || 400;
        const h = rect.height || puzzleContainer.clientHeight || 400;
        const ratio = img.naturalWidth / img.naturalHeight;
        let displayW = w * 0.95;
        let displayH = displayW / ratio;
        if (displayH > h * 0.95) {
            displayH = h * 0.95;
            displayW = displayH * ratio;
        }
        img.style.width = displayW + 'px';
        img.style.height = displayH + 'px';
        img.style.opacity = '1';
    };

    img.onload = onLoad;
    if (img.complete) {
        // Если картинка загружена из кеша, даём браузеру время пересчитать размеры
        setTimeout(onLoad, 50);
    }

    puzzleContainer.appendChild(img);   
    // Форсируем перерисовку
    requestAnimationFrame(() => {});
},

   _showModal() {
    // ★ Проверяем, что сохранённый элемент модалки всё ещё в DOM
    if (this._modalElement && !document.body.contains(this._modalElement)) {
        this._modalElement = null;
        this._centerPanel = null;
        this._leftPanel = null;
        this._puzzleContainer = null;
        this._attemptsLabel = null;
        this._attemptsMobile = null;
    }
        // ---- Если модалка уже открыта – обновляем только центральную часть ----
        if (this._modalElement && this._centerPanel) {
            const titleEl = this._modalElement.querySelector('.modal-title');
            if (titleEl) {
                titleEl.textContent = getText(this._config.nameKey, this._config.nameKey) + ' - ' + getText('puzz_level', 'Уровень') + ' ' + (this._currentLevel + 1);
            }

            if (this._attemptsLabel) {
                this._attemptsLabel.textContent = getText('puzz_attempts', 'Попыток: ') + this._state.attempts;
            }
            const attemptsMobile = this._modalElement.querySelector('.puzzle-attempts-mobile');
            if (attemptsMobile) {
                attemptsMobile.textContent = getText('puzz_attempts', 'Попыток: ') + this._state.attempts;
            }

            this._updateChests(this._leftPanel);

            if (this._puzzleInstance) {
                this._puzzleInstance.destroy();
                this._puzzleInstance = null;
            }

            const oldContainer = this._centerPanel.querySelector('#puzzle-container');
            if (oldContainer) oldContainer.remove();

            const newContainer = document.createElement('div');
            newContainer.id = 'puzzle-container';
            newContainer.style.cssText = 'width:100%; height:100%; position:relative; overflow:hidden; background:#d9c5a6; border-radius:8px; border:3px solid #2a1f14;';

            this._centerPanel.appendChild(newContainer);
            this._puzzleContainer = newContainer;

            // ★ Проверяем, нужно ли показать готовую картинку
      // Показываем готовую картинку ТОЛЬКО если уровень пройден, нет сохранённого состояния и не стоит флаг пропуска
if (this._state.completed && !this._state.savedPuzzle && !this._skipWinOnLoad) {
    this._showCompletedImage(newContainer);
    return;
}
// Если есть сохранённое состояние – пазл будет восстановлен в _initPuzzle

            this._initPuzzle(this._puzzleContainer);
            return;
        }

        // ---- Первый запуск: создаём модалку полностью ----
        if (this._puzzleInstance) {
            this._savePuzzleState();
            this._puzzleInstance.destroy();
            this._puzzleInstance = null;
        }
        if (this._modalElement) {
            ModalManager.closeCenterModal();
            this._modalElement = null;
        }
        if (this._starAnimationTimer) {
            clearTimeout(this._starAnimationTimer);
            this._starAnimationTimer = null;
        }

        const modalContent = document.createElement('div');
        modalContent.className = 'puzzle-modal';
        modalContent.style.cssText = `
            display: flex;
            flex-direction: row;
            gap: 1rem;
            padding: 0.5rem;
            width: 100%;
            max-width: 900px;
            height: 85vh;
            max-height: 90vh;
            min-height: 500px;
            background: var(--modal-bg);
            border-radius: var(--modal-radius);
            border: var(--modal-border-width) solid var(--modal-border-color);
            box-shadow: var(--modal-shadow);
            overflow: hidden;
            position: relative;
        `;

        const attemptsMobile = document.createElement('div');
        attemptsMobile.className = 'puzzle-attempts-mobile';
        attemptsMobile.textContent = getText('puzz_attempts', 'Попыток: ') + this._state.attempts;
        modalContent.prepend(attemptsMobile);
        this._attemptsMobile = attemptsMobile;

        const leftPanel = this._createLeftPanel();
        modalContent.appendChild(leftPanel);
        this._leftPanel = leftPanel;

        const centerPanel = this._createCenterPanel();
        modalContent.appendChild(centerPanel);
        this._centerPanel = centerPanel;
        this._puzzleContainer = centerPanel._puzzleContainer;

        // Удаляем старый оверлей, чтобы при первом показе создать увеличенный
const oldOverlay = document.getElementById('puzzle-loading-overlay');
if (oldOverlay) oldOverlay.remove();

        this._modalElement = ModalManager.showCenterModal({
            title: getText(this._config.nameKey, this._config.nameKey) + ' - ' + getText('puzz_level', 'Уровень') + ' ' + (this._currentLevel + 1),
            bodyElement: modalContent,
            buttons: [],
onClose: () => {
    ModalManager.closeCenterModal();
      this._clearTimers(); // ← очищаем все таймеры
  // ★ Удаляем оверлей
    const overlay = document.getElementById('puzzle-loading-overlay');
    if (overlay) overlay.remove();

    if (this._storageTimer) {
        clearTimeout(this._storageTimer);
        this._storageTimer = null;
    }
    if (this._readyInterval) {
        clearInterval(this._readyInterval);
        this._readyInterval = null;
    }
    this._savePuzzleState();

    // Уничтожаем экземпляр пазла
    if (this._puzzleInstance) {
        this._puzzleInstance.destroy();
        this._puzzleInstance = null;
    }

    // Сбрасываем таймер анимации звёзд
    if (this._starAnimationTimer) {
        clearTimeout(this._starAnimationTimer);
        this._starAnimationTimer = null;
    }

    // Обнуляем все ссылки, чтобы при повторном открытии всё создалось заново
    this._modalElement = null;
    this._centerPanel = null;
    this._leftPanel = null;
    this._puzzleContainer = null;
    this._attemptsLabel = null;
    this._attemptsMobile = null;
    this._skipWinOnLoad = false;
}
        });

        setTimeout(() => this._initPuzzle(this._puzzleContainer), 0);
    },

_createOverlay() {
    let overlay = document.getElementById('puzzle-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'puzzle-loading-overlay';
        document.body.appendChild(overlay);
        console.log('[PuzzManager] Оверлей создан в body');
    }
    return overlay;
},

    _createLeftPanel() {
        const panel = document.createElement('div');
        panel.className = 'puzzle-left-panel';
        panel.style.cssText = `
            flex: 0 0 clamp(80px, 15vw, 120px);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
            overflow-y: auto;
            padding: 0.5rem;
            background: rgba(0,0,0,0.05);
            border-radius: 8px;
        `;

        const globalState = this._loadGlobalState();
        for (let i = 0; i < this._config.levels; i++) {
            const chest = document.createElement('div');
            chest.className = 'chest-item';
            chest.dataset.level = i;
            const isCompleted = globalState.levels[i]?.completed || false;
            const isUnlocked = (i === 0) || (globalState.levels[i - 1]?.completed === true);
            const isCurrent = (i === this._currentLevel);

            let content;
            if (isCompleted) content = '✅';
            else if (isUnlocked) content = '📦';
            else content = '🔒';

chest.style.cssText = `
    width: clamp(50px, 10vw, 80px);
    height: clamp(50px, 10vw, 80px);
    background: #c9b18c;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: ${isUnlocked ? 'pointer' : 'default'};
    transition: transform 0.15s;
    opacity: ${isUnlocked ? '1' : '0.5'};
`;
if (isCurrent) chest.classList.add('current');

            chest.innerHTML = `
                <div style="font-size: clamp(1.5rem, 4vw, 2.5rem);">${content}</div>
                <div style="font-size: 0.6rem; margin-top: 2px;">${i + 1}</div>
            `;
            panel.appendChild(chest);
        }

        panel.addEventListener('click', (e) => {
            const chest = e.target.closest('.chest-item');
            if (!chest) return;
            const level = parseInt(chest.dataset.level);
            if (isNaN(level)) return;
            const globalState = this._loadGlobalState();
            const isUnlocked = (level === 0) || (globalState.levels[level - 1]?.completed === true);
            if (!isUnlocked) return;
            if (this._currentLevel !== level) {
                this._savePuzzleState();
                this._currentLevel = level;
                this._loadState();
                this._skipWinOnLoad = false; // при переключении сбрасываем
                this._showModal();
            }
        });

        const attemptsLabel = document.createElement('div');
        attemptsLabel.className = 'puzzle-attempts-label';
        attemptsLabel.textContent = getText('puzz_attempts', 'Попыток: ') + this._state.attempts;
        panel.prepend(attemptsLabel);
        this._attemptsLabel = attemptsLabel;

const resetBtn = document.createElement('button');
resetBtn.className = 'puzzle-reset-btn modal-btn';
resetBtn.textContent = '↻';
resetBtn.style.cssText = `
    margin-top: auto;
    width: clamp(30px, 4vw, 50px);
    height: clamp(30px, 4vw, 50px);
    border-radius: 50%;
    font-size: clamp(1.2rem, 2vw, 2rem);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;


resetBtn.addEventListener('click', () => {
    if (this._puzzleInstance) {
        this._puzzleInstance.destroy();
        this._puzzleInstance = null;
    }
    this._state.savedPuzzle = null;
    this._saveState();
    this._skipWinOnLoad = true;
    const container = this._puzzleContainer;
    if (container) {
        container.innerHTML = '';
        this._initPuzzle(container);
       this._showLoadingOverlay();  // теперь оверлей отображается
    }
});
panel.appendChild(resetBtn);

        return panel;
    },

    _createCenterPanel() {
        const panel = document.createElement('div');
        panel.className = 'puzzle-center-panel';
        panel.style.cssText = `
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 0.5rem;
            min-width: 0;
            min-height: 0;
            position: relative;
        `;

        const puzzleContainer = document.createElement('div');
        puzzleContainer.id = 'puzzle-container';
        puzzleContainer.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background: #d9c5a6;
            border-radius: 8px;
            border: 3px solid #2a1f14;
        `;
        panel.appendChild(puzzleContainer);
        panel._puzzleContainer = puzzleContainer;
        return panel;
    },



    _initPuzzle(puzzleContainer) {
      //   console.log('[PuzzManager] _initPuzzle: completed=', this._state.completed,    'savedPuzzle=', !!this._state.savedPuzzle,     '_skipWinOnLoad=', this._skipWinOnLoad);
  // ★ Очищаем все старые таймеры перед созданием нового пазла
    this._clearTimers();
    this._overlayHidden = false; // сбрасываем флаг

        if (puzzleContainer && puzzleContainer._puzzleContainer) {
            puzzleContainer = puzzleContainer._puzzleContainer;
        }
        if (!puzzleContainer) {
            console.error('[PuzzManager] Контейнер для пазла не найден');
            return;
        }
 // Проверяем, нужно ли показать готовую картинку
    if (this._state.completed && !this._state.savedPuzzle && !this._skipWinOnLoad) {
        this._showCompletedImage(puzzleContainer);
        this._hideLoadingOverlay();
        return;
    }

        this._showLoadingOverlay();

          // ★ Добавляем проверку размеров контейнера; если они нулевые – скрываем и показываем заново после ре-рендера
    const rect = puzzleContainer.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        this._hideLoadingOverlay();
        requestAnimationFrame(() => this._showLoadingOverlay());
    }

        const levelIndex = this._currentLevel + 1;
        const imageUrl = `images/puzz/${this._config.id}/${levelIndex}.jpg`;
        const self = this;
        this._puzzleInstance = new JigsawPuzzle(puzzleContainer, {
            image: imageUrl,
            numPieces: PUZZ_ROWS * PUZZ_COLS,
            rows: PUZZ_ROWS,
            cols: PUZZ_COLS,
            allowRotation: false,
            attempts: this._state.attempts,          
      onAttempt: (used, remaining) => {
    self._state.attempts = remaining;
    self._updateAttemptsDisplay();
    self._saveState();
    self._savePuzzleState(); 
},
    onNoAttempts: () => self._showNoAttemptsMessage(),          

onWin: () => {
    self._hideLoadingOverlay();
    const levelCompleted = self._state.completed;

    if (!levelCompleted) {
        self._state.completed = true;
        self._state.savedPuzzle = null;
        self._saveState();
        const leftPanel = self._modalElement?.querySelector('.puzzle-left-panel');
        if (leftPanel) self._updateChests(leftPanel);

        self._showStarAnimation(() => {
            self._skipWinOnLoad = false;
            self._handleWinReward();
        });
    } else {
        self._state.savedPuzzle = null;
        self._saveState();
        self._showStarAnimation(() => {
            self._skipWinOnLoad = false;
            self._showCompletedImage(self._puzzleContainer);
        });
    }
},
            onReady: () => {
            // ---- Восстановление или старт ----
            if (self._state.savedPuzzle) {
                self._puzzleInstance.start();
                setTimeout(() => self._restorePuzzleState(), 300);
            } else {
                self._puzzleInstance.start();
            }
            self._updateAttemptsDisplay();

            // ★ Интервал проверки готовности
            self._readyInterval = setInterval(() => {
                if (!self._puzzleInstance) {
                    clearInterval(self._readyInterval);
                    self._readyInterval = null;
                    return;
                }
                const state = self._puzzleInstance.state;
                console.log('[PuzzManager] Ожидание готовности, state:', state);
                if (state >= 50 && !self._overlayHidden) {
                    self._hideLoadingOverlay();
                    self._overlayHidden = true;
                    clearInterval(self._readyInterval);
                    self._readyInterval = null;
                    console.log('[PuzzManager] Пазл готов, оверлей скрыт');
                }
            }, 100);

            // ★ Защитный таймаут (10 секунд)
            setTimeout(() => {
                if (self._readyInterval) {
                    clearInterval(self._readyInterval);
                    self._readyInterval = null;
                    if (!self._overlayHidden) {
                        self._hideLoadingOverlay();
                        self._overlayHidden = true;
                        console.warn('[PuzzManager] Таймаут ожидания готовности, оверлей скрыт принудительно');
                    }
                }
            }, 10000); // ← увеличено до 10 секунд

            // ★ Сохранение начального состояния после «Заново»
            if (self._skipWinOnLoad) {
                if (self._storageTimer) clearTimeout(self._storageTimer);
                self._storageTimer = setTimeout(() => {
                    console.log('[PuzzManager] onReady: сохранение начального состояния (после разбрасывания)');
                    self._savePuzzleState();
                    self._skipWinOnLoad = false;
                    self._storageTimer = null;
                }, 2000);
            }
        }
    });



        this._puzzleInstance._blockWin = true;
        this._puzzleInstance._skipWinOnLoad = this._skipWinOnLoad;
    },
/*
_showLoadingOverlay() {
    const container = this._puzzleContainer;
    if (!container) {
        console.warn('[PuzzManager] Контейнер для оверлея отсутствует');
        return;
    }
    const rect = container.getBoundingClientRect();
    // ★ Ждём, пока контейнер получит корректные координаты
    if (rect.width < 50 || rect.height < 50 || rect.left < 1 || rect.top < 1) {
        requestAnimationFrame(() => this._showLoadingOverlay());
        return;
    }
    const overlay = this._createOverlay();
    // Применяем тёмный фон и белый текст
    overlay.style.cssText = `
        position: fixed !important;
        top: ${rect.top}px !important;
        left: ${rect.left}px !important;
        width: ${rect.width}px !important;
        height: ${rect.height}px !important;
        background: #b08a6e !important;   
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        color: #4a3a2a !important;
        font-size: 2rem !important;
        font-weight: bold !important;
        pointer-events: none !important;
        opacity: 1 !important;
        border-radius: 8px !important;
        transition: opacity 0.3s !important;
    `;
    // Локализованный текст
    overlay.textContent = getText('loading', 'Загрузка...');
    console.log('[PuzzManager] Оверлей показан с fixed позиционированием, размеры:', rect);
},*/

_showLoadingOverlay() {
    const container = this._puzzleContainer;
    if (!container) {
        console.warn('[PuzzManager] Контейнер для оверлея отсутствует');
        return;
    }
    const rect = container.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        requestAnimationFrame(() => this._showLoadingOverlay());
        return;
    }

    let overlay = document.getElementById('puzzle-loading-overlay');
    const isFirst = !overlay; // если оверлея нет – это первый показ

    if (!isFirst) {
        // Оверлей уже существует – обновляем позицию без увеличения
        overlay.style.cssText = `
            position: fixed !important;
            top: ${rect.top}px !important;
            left: ${rect.left}px !important;
            width: ${rect.width}px !important;
            height: ${rect.height}px !important;
            background: #b08a6e !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            color: #4a3a2a !important;
            font-size: 2rem !important;
            font-weight: bold !important;
            pointer-events: none !important;
            opacity: 1 !important;
            border-radius: 8px !important;
            transition: opacity 0.3s !important;
        `;
        overlay.textContent = getText('loading', 'Загрузка...');
    } else {
        // Первый показ – создаём с увеличением 20%
        overlay = document.createElement('div');
        overlay.id = 'puzzle-loading-overlay';
        document.body.appendChild(overlay);
        const padding = 0.20;
        const left = rect.left - rect.width * padding / 2;
        const top = rect.top - rect.height * padding / 2;
        const width = rect.width * (1 + padding);
        const height = rect.height * (1 + padding);
        overlay.style.cssText = `
            position: fixed !important;
            top: ${top}px !important;
            left: ${left}px !important;
            width: ${width}px !important;
            height: ${height}px !important;
            background: #b08a6e !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            color: #4a3a2a !important;
            font-size: 2rem !important;
            font-weight: bold !important;
            pointer-events: none !important;
            opacity: 1 !important;
            border-radius: 8px !important;
            transition: opacity 0.3s !important;
        `;
        overlay.textContent = getText('loading', 'Загрузка...');
        console.log('[PuzzManager] Оверлей создан с увеличением 20%');
    }
},

_hideLoadingOverlay() {
    const overlay = document.getElementById('puzzle-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
},

_handleWinReward() {
    const global = this._loadGlobalState();
    const allCompleted = global.levels.every(l => l.completed);
    const isLastLevel = (this._currentLevel === this._config.levels - 1);

    if (allCompleted && isLastLevel && !global.secretRewardClaimed) {
        global.secretRewardClaimed = true;
        this._saveGlobalState(global);
        this._showSecretRewardModal();
        return;
    }

    this._showLevelRewardModal();
},

// ===== НАГРАДЫ ЗА ПАЗЛЫ =====

_sendToInventory(items) {
    const inventory = Storage.getInventory() || [];
    for (const item of items) {
        inventory.push({ typeIndex: item.typeIndex, level: item.level });
    }
    Storage.saveInventory(inventory);
    if (typeof Game !== 'undefined' && Game.updateInventoryButton) {
        Game.updateInventoryButton();
    }
},


_showLevelRewardModal() {
    const sceneConfig = getCurrentSceneConfig();
    const availableTypes = sceneConfig.availableTypes || [];
    if (availableTypes.length === 0) {
        this._showModal();
        return;
    }

    const getRandomItem = () => {
        const typeIndex = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const maxLvl = Game.maxLevels[typeIndex] || 1;
        const level = Math.min(Math.floor(Math.random() * maxLvl) + 1, 7);
        return { typeIndex, level };
    };
    const item1 = getRandomItem();
    const item2 = getRandomItem();

    const img1 = BoardCore.getItemImageDataUrl(Game, item1.typeIndex, item1.level);
    const img2 = BoardCore.getItemImageDataUrl(Game, item2.typeIndex, item2.level);
    const cellHtml = `
        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
            <div class="item-info-cell" style="width:clamp(4rem,10vmin,8rem); height:clamp(4rem,10vmin,8rem);">
                <img src="${img1}" style="width:90%; height:90%; object-fit:contain;">
            </div>
            <div class="item-info-cell" style="width:clamp(4rem,10vmin,8rem); height:clamp(4rem,10vmin,8rem);">
                <img src="${img2}" style="width:90%; height:90%; object-fit:contain;">
            </div>
        </div>
    `;
    const bodyHtml = `
        <div style="text-align:center; padding:0.5rem;">
            <p style="font-size:clamp(1rem,2vw,1.5rem);">${getText('puzz_done1', 'Ух, какой хороший получился пазл!')}</p>
            <p style="font-size:clamp(1rem,2vw,1.5rem);">${getText('puzz_done2', 'Интересно, что будет, если собрать их все...')}</p>
            ${cellHtml}
            <p style="font-size:clamp(0.9rem,1.8vw,1.3rem); margin-top:0.5rem; color:#4a3a2a;">
                ${getText('prize_sent', 'Награда отправлена в корзинку с припасами!')}
            </p>
        </div>
    `;

    // Отправляем награду без всплывающего уведомления (оно уже есть в модалке)
  this._sendToInventory([item1, item2]);

    ModalManager.showCenterModal({
        title: getText(this._config.nameKey, 'Пазл'),
        body: bodyHtml,
        buttons: [
            {
                text: getText('pause_resume', 'Продолжить'),
                onClick: () => {
                    ModalManager.closeCenterModal();
                    this._showModal();
                }
            }
        ]
    });
},

_showSecretRewardModal() {
    const sceneConfig = getCurrentSceneConfig();
    const availableTypes = sceneConfig.availableTypes || [];
    const generators = availableTypes.filter(typeIndex => {
        const item = ITEM_DATA[typeIndex];
        return item && item.spawnable && item.spawnLevels && item.spawnLevels.length > 0;
    });
    if (generators.length === 0) {
        this._showModal();
        return;
    }
    const typeIndex = generators[Math.floor(Math.random() * generators.length)];
    const item = ITEM_DATA[typeIndex];
    const levels = item.spawnLevels.filter(lv => lv <= 7);
    if (levels.length === 0) {
        this._showModal();
        return;
    }
    const level = levels[Math.floor(Math.random() * levels.length)];
    const img = BoardCore.getItemImageDataUrl(Game, typeIndex, level);
    const cellHtml = `
        <div style="display:flex; justify-content:center; margin:0.5rem 0;">
            <div class="item-info-cell" style="width:clamp(4rem,10vmin,8rem); height:clamp(4rem,10vmin,8rem);">
                <img src="${img}" style="width:90%; height:90%; object-fit:contain;">
            </div>
        </div>
    `;
    const bodyHtml = `
        <div style="text-align:center; padding:0.5rem;">
            <p style="font-size:clamp(1rem,2vw,1.5rem);">${getText('secret_text', 'Эта полянка оказалась интереснее, чем казалось!')}</p>
            ${cellHtml}
            <p style="font-size:clamp(0.9rem,1.8vw,1.3rem); margin-top:0.5rem; color:#4a3a2a;">
                ${getText('prize_sent', 'Награда отправлена в корзинку с припасами!')}
            </p>
        </div>
    `;

    this._sendToInventory([{ typeIndex, level }]);

    ModalManager.showCenterModal({
        title: getText('secret', 'Секретная награда'),
        body: bodyHtml,
        buttons: [
            {
                text: getText('pause_resume', 'Продолжить'),
                onClick: () => {
                    ModalManager.closeCenterModal();
                    this._showModal();
                }
            }
        ]
    });
},

_restorePuzzleState() {
   // console.log('[PuzzManager] _restorePuzzleState вызван');
    if (!this._puzzleInstance || !this._puzzleInstance.puzzle) {
        console.warn('[PuzzManager] _restorePuzzleState: нет экземпляра');
        return;
    }
    const savedDataStr = this._state.savedPuzzle;
  //  console.log('[PuzzManager] savedDataStr:', savedDataStr ? 'есть' : 'null');
    
    // ★ Убираем проверку на completed – разрешаем восстановление всегда, если есть данные
    if (!savedDataStr) {
   //     console.log('[PuzzManager] Нет данных для восстановления');
        return;
    }
    
  //  console.log('[PuzzManager] Восстанавливаем состояние (completed=' + this._state.completed + ')');
    try {
   const savedData = JSON.parse(savedDataStr);
        this._puzzleInstance.restore(savedData);
        this._updateAttemptsDisplay();
    } catch (e) {
        console.warn('[PuzzManager] Ошибка восстановления состояния:', e);
    }
},

    _updateAttemptsDisplay() {
        const text = getText('puzz_attempts', 'Попыток: ') + this._state.attempts;
        if (this._attemptsLabel) {
            this._attemptsLabel.textContent = text;
        }
        if (this._attemptsMobile) {
            this._attemptsMobile.textContent = text;
        }
    },

    _showNoAttemptsMessage() {
    const container = this._puzzleContainer;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const message = getText('noattempts', 'Нет попыток');

    // Удаляем старые сообщения, чтобы не накапливались
    const old = document.querySelector('.floating-message.no-attempts');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'floating-message no-attempts';
    el.textContent = message;
    el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
        z-index: 999999;
        pointer-events: none;
        font-size: clamp(1.2rem, 2.5vw, 2rem);
        background: var(--modal-bg, #efe2cc);
        border: 3px solid #2a1f14;
        border-radius: 12px;
        padding: 0.6rem 1.5rem;
        box-shadow: 3px 3px 0 #2a1f14;
        font-weight: 700;
        color: #4a3a2a;
        transition: none;
        white-space: nowrap;
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
        el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        el.style.transform = 'translate(-50%, -50%) scale(1)';
        el.style.opacity = '1';
    });

    setTimeout(() => {
        el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        el.style.transform = 'translate(-50%, -50%) scale(0.5)';
        el.style.opacity = '0';
    }, 1500);

    setTimeout(() => {
        el.remove();
    }, 2000);
},

    _updateChests(leftPanel) {
        const chests = leftPanel.querySelectorAll('.chest-item');
        const globalState = this._loadGlobalState();
        chests.forEach((chest) => {
            const i = parseInt(chest.dataset.level);
            const isCompleted = globalState.levels[i]?.completed || false;
            const isUnlocked = (i === 0) || (globalState.levels[i - 1]?.completed === true);
            const isCurrent = (i === this._currentLevel);

            let content;
            if (isCompleted) content = '✅';
            else if (isUnlocked) content = '📦';
            else content = '🔒';

            const iconDiv = chest.querySelector('div:first-child');
            if (iconDiv) iconDiv.textContent = content;
            chest.style.borderColor = isCurrent ? '#e62a38' : '#2a1f14';
            chest.style.boxShadow = isCurrent ? '0 0 0 3px #e62a38, 2px 2px 0 #2a1f14' : '2px 2px 0 #2a1f14';
            chest.style.cursor = isUnlocked ? 'pointer' : 'default';
            chest.style.opacity = isUnlocked ? '1' : '0.5';
        });
    },

_showStarAnimation(onComplete) {
    const container = this._modalElement?.querySelector('#puzzle-container');
    if (!container) {
        if (onComplete) onComplete();
        return;
    }

    // Удаляем старый контейнер звёзд, если есть
    const oldStarContainer = container.querySelector('.star-container');
    if (oldStarContainer) oldStarContainer.remove();

    const starContainer = document.createElement('div');
    starContainer.className = 'star-container';
    starContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
    `;
    container.appendChild(starContainer);

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
  const starCount = Device.isLowPerformance ? 4 : (Device.isMobile ? 6 : 15);
for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        const size = 10 + Math.random() * 20;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        star.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
            opacity: 0;
            transform: scale(0);
            animation: starBurst 1.5s ease-out forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        starContainer.appendChild(star);
    }

    if (!document.getElementById('puzz-star-style')) {
        const style = document.createElement('style');
        style.id = 'puzz-star-style';
        style.textContent = `
            @keyframes starBurst {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                30% { opacity: 1; transform: scale(1.5) rotate(180deg); }
                100% { opacity: 0; transform: scale(0.5) rotate(360deg) translateY(-100px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Очищаем старый таймер, если есть
    if (this._starAnimationTimer) {
        clearTimeout(this._starAnimationTimer);
        this._starAnimationTimer = null;
    }

   this._starAnimationTimer = setTimeout(() => {
    starContainer.remove();
    this._starAnimationTimer = null;
    // Даём браузеру время на удаление элементов и пересчёт размеров
    setTimeout(() => {
        if (onComplete) onComplete();
    }, 50);
}, 3000);
}, 

_clearTimers() {
    if (this._readyInterval) {
        clearInterval(this._readyInterval);
        this._readyInterval = null;
    }
    if (this._storageTimer) {
        clearTimeout(this._storageTimer);
        this._storageTimer = null;
    }
    // Сбрасываем флаг, так как таймеры очищены
    this._overlayHidden = false;
},


};

window.PuzzManager = PuzzManager;