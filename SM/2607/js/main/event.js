// ============================================================
//  EVENT MANAGER – полностью изолированный ивент
//  Синхронизирован с Game через BoardCore
// ============================================================

const EventManager = {
    _activeEvent: null,
    _eventState: null,
    _timerInterval: null,
    _eventItemTypeIndex: null,

    _eventItemData: [],
    _eventMaxLevels: [],

    rows: 7,
    cols: 9,
    board: [],
    itemAnimations: [],
    stars: [],
    score: 0,
    isPaused: false,
    isRunning: false,
    _saveTimer: null,
    _backgroundDirty: false,
    _updatePending: false,
    selectedItem: null,
    dragStart: null,
    dragTarget: null,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    scaleX: 1,
    scaleY: 1,
    cellWidth: 0,
    cellHeight: 0,
    canvas: null,
    ctx: null,
    _fpsLimit: 30,
    _lastFrameTime: 0,
    _backgroundCanvas: null,
    _backgroundCtx: null,
    _spriteCache: {},
    _dataUrlCache: {},   // кэш data URL для предметов
    pulseItems: [],
    selectedCell: null,
    hintAnimations: [],
    hintPhase: 0,
    _animationFrameId: null,
    _loopActive: false,
    hoverCell: null,
    processingClick: false,
    _clickLock: false,
    _dragCanvasX: 0,
    _dragCanvasY: 0,
    _dragClientX: 0,
    _dragClientY: 0,
    _onGlobalMouseMove: null,
    _onGlobalMouseUp: null,
    _onGlobalTouchMove: null,
    _onGlobalTouchEnd: null,
    _resizeHandler: null,
    _emergencyTimer: null,
    particlesRunning: false,
    inactivityTimer: null,
    inactivityTimeout: 10000,
    _originalInfoContainer: null,
    _dragGhostId: 'event-drag-ghost',

    _lastGiftTime: 0,
    giftPending: false,
    giftBtn: null,
    _giftCooldown: 24 * 60 * 60 * 1000,
    _adAvailable: false,
    _giftRemaining: 0,
     collectionCompleted: false,   
    boardFullyOpened: false, 

    
startEvent(eventId) {
  const config = getEventConfig(eventId);
if (!config) return false;
// Вычисляем даты старта и конца (как в getActiveEvent)
const start = getEventStartDate(config).getTime();
const end = start + config.durationDays * 24 * 60 * 60 * 1000;
this._activeEvent = { ...config, _start: start, _end: end };
    this._giftCooldown = (config.giftCooldownHours || 24) * 60 * 60 * 1000;

    // 1. Загружаем состояние ДО определения размеров
    this._loadState();

        const size = computeBoardSize();
        this._fpsLimit = Device.isMobile ? 30 : 120;
        this.inactivityTimeout = Device.isMobile ? 15000 : 10000;

        this._dragGhostId = 'event-drag-ghost';

        if (window.EVENT_ITEM_DATA) {
     this._eventItemData = structuredClone(window.EVENT_ITEM_DATA);
        } else {
            console.warn('[EventManager] EVENT_ITEM_DATA не найден, создаём заглушку');
            this._eventItemData = [];
        }

        this._eventItemTypeIndex = this._getEventItemTypeIndex(config.id);

        // Вычисляем максимальные уровни
        this._eventMaxLevels = [];
        for (let i = 0; i < this._eventItemData.length; i++) {
            const item = this._eventItemData[i];
            if (!item) continue;
            const levels = new Set();
            if (item.initialLevel !== undefined) levels.add(item.initialLevel);
            if (item.levelNames) {
                for (const key of Object.keys(item.levelNames)) {
                    const lv = parseInt(key, 10);
                    if (!isNaN(lv)) levels.add(lv);
                }
            }
            if (item.spawnRules) {
                for (const key of Object.keys(item.spawnRules)) {
                    const lv = parseInt(key, 10);
                    if (!isNaN(lv)) levels.add(lv);
                }
            }
            if (levels.size === 0) levels.add(1);
            this._eventMaxLevels[i] = Math.max(...levels);
        }

        if (typeof CollectionManager !== 'undefined') {
            CollectionManager.registerEventItems(config.id, this._eventItemData, this._eventMaxLevels);
        }    
        if (typeof CollectionManager !== 'undefined' && this._eventState.openedLevels) {
            for (const level of this._eventState.openedLevels) {
                CollectionManager.onItemCreated(this._eventItemTypeIndex, level, this._activeEvent.id);
            }
        }
    this._initEventBoard(config, size.rows, size.cols);
    this._setupUI();
    this.updateScoreOnly();
    this._updateGlobalProgressBar();
    this._originalInfoContainer = ModalManager._infoContainer;
    ModalManager._infoContainer = document.getElementById('event-info-modal-container');
    this._adAvailable = Platform.isRewardedAdAvailable();
        if (typeof Platform.preloadRewardedAd === 'function') {
            Platform.preloadRewardedAd();
        }
    this.isRunning = true;
    ResizeManager.init(this);
    BoardCore.startInactivityTimer(this);
    this.updateGiftAndAdButton();
    this._startTimer();
    BoardCore.animateLoop(this);
    this._renderEventProgress();
    // Проверяем условия для модалок (если они уже выполнены)
    this._checkCollectionComplete();
    this._checkBoardFullyOpened();
        

        return true;
    },

exitEvent() {

      // ★ НЕМЕДЛЕННОЕ СОХРАНЕНИЕ ПРИ ВЫХОДЕ ★
    this._saveState();

    if (this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
    }
        if (this._saveTimer) {
        clearTimeout(this._saveTimer);
        this._saveTimer = null;
    }
    this.isRunning = false;
    if (this._animationFrameId) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
        this._loopActive = false;
    }
    if (this._emergencyTimer) {
        clearTimeout(this._emergencyTimer);
        this._emergencyTimer = null;
    }
        this.isPaused = false;
    this.hidePauseOverlay();
            const pauseBtn = document.getElementById('event-pause-btn');
        if (pauseBtn) pauseBtn.textContent = '⏸';
    this._removeGlobalListeners();
    ModalManager.closeAll();
    
            try {
                            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => {
                this._saveState();
            }, 30000);

   // ★ Удаление глобальных обработчиков pointer
    if (this._globalPointerMove) {
        document.removeEventListener('pointermove', this._globalPointerMove);
        this._globalPointerMove = null;
    }
    if (this._globalPointerUp) {
        document.removeEventListener('pointerup', this._globalPointerUp);
        this._globalPointerUp = null;
    }

    // ★ Удаление обработчиков resize/orientation
    if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
        this._resizeHandler = null;
    }
    if (this._orientationHandler) {
        window.removeEventListener('orientationchange', this._orientationHandler);
        this._orientationHandler = null;
    }


            } catch (e) {
                console.error('[EventManager] Ошибка сохранения состояния в exitEvent:', e);
            }
            this._activeEvent = null;
            this._eventState = null;
    this._eventItemTypeIndex = null;
    this._eventItemData = [];
    this._eventMaxLevels = [];
       this._spriteCache = {}; 
       this._dataUrlCache = null;
    if (this._originalInfoContainer) {
        ModalManager._infoContainer = this._originalInfoContainer;
        this._originalInfoContainer = null;
    }
    ResizeManager.init(Game);
    this._cleanupUI();
    clearTimeout(this.inactivityTimer);

    // ★ ДОБАВЛЯЕМ СБРОС СОСТОЯНИЯ ПОДАРКОВ ★
    this._giftRemaining = 0;
    this.giftPending = false;
    this._lastGiftTime = 0;
    this.giftBtn = null;
    this.adBtn = null;
},

_loadState() {
     // ---- Проверка активности ивента , обнуление прогресса полностью, если ивент не активен (закончился) ----
    const now = Date.now();
    const start = this._activeEvent._start;
    const end = this._activeEvent._end;
    if (now < start || now > end) {
        // Ивент не активен – сбрасываем состояние
        this._eventState = {
            openedLevels: [],
            freeClaimed: false,
            lastFreeClaimDate: 0,
            board: null,
            rows: this.rows || 7,
            cols: this.cols || 9,
            score: 0,
            lastGiftTime: 0,
            giftRemaining: 0,
            collectionCompleted: false,
            boardFullyOpened: false
        };
        return;
    }

    const saved = Storage.getEventState(this._activeEvent.id);
console.log('[EventManager] loaded state:', saved);

    if (saved && typeof saved === 'object') {
        this._eventState = saved;
        this._lastGiftTime = saved.lastGiftTime || 0;
        this._giftRemaining = saved.giftRemaining !== undefined ? saved.giftRemaining : 0;
        // ★ Гарантируем корректные поля
        if (!Array.isArray(this._eventState.openedLevels)) {
            this._eventState.openedLevels = [];
        }
        if (typeof this._eventState.freeClaimed !== 'boolean') {
            this._eventState.freeClaimed = false;
        }
        if (typeof this._eventState.lastFreeClaimDate !== 'number') {
            this._eventState.lastFreeClaimDate = 0;
        }
        if (!this._eventState.board) {
            this._eventState.board = null;
        }
        if (typeof this._eventState.score !== 'number') {
            this._eventState.score = 0;
        }
        if (typeof this._eventState.rows !== 'number') {
            this._eventState.rows = this.rows || 7;
        }
        if (typeof this._eventState.cols !== 'number') {
            this._eventState.cols = this.cols || 9;
        }
                if (typeof this._eventState.collectionCompleted !== 'boolean') {
                this._eventState.collectionCompleted = false;
            }
            if (typeof this._eventState.boardFullyOpened !== 'boolean') {
                this._eventState.boardFullyOpened = false;
            }
    } else {
        this._eventState = {
            openedLevels: [],
            freeClaimed: false,
            lastFreeClaimDate: 0,
            board: null,
            rows: this.rows || 7,
            cols: this.cols || 9,
            score: 0,
            lastGiftTime: 0,
            giftRemaining: 0,
        };
        this._lastGiftTime = 0;
        this._giftRemaining = 0;
    }
},

_saveState() {
      if (!this._eventState) {
        console.warn('[EventManager] _saveState вызван, но _eventState отсутствует');
        return;
    }
    // Глубокая копия состояния и доски, чтобы сохранить текущий снимок
    const state = structuredClone(this._eventState);
    state.board = structuredClone(this.board);
    state.rows = this.rows;
    state.cols = this.cols;
    state.score = this.score;
    state.lastGiftTime = this._lastGiftTime;
    state.giftRemaining = this._giftRemaining;

    Storage.saveEventState(this._activeEvent.id, state);
},

    _initEventBoard(config, rows, cols) {
        this.rows = rows;
        this.cols = cols;

        if (this._eventState.board &&
            this._eventState.board.length === rows &&
            this._eventState.board[0]?.length === cols) {
            this.board = this._eventState.board;
        } else {
            const board = [];
            for (let r = 0; r < rows; r++) {
                board[r] = [];
                for (let c = 0; c < cols; c++) {
                    board[r][c] = { locked: true, covered: true, row: r, col: c };
                }
            }

            const openCount = config.boardSettings.initialOpenCount || 5;
            const side = config.boardSettings.initialOpenSide || 'bottom';
            let openCells = [];
            if (side === 'bottom') {
                const startCol = Math.floor((cols - openCount) / 2);
                for (let i = 0; i < openCount; i++) {
                    openCells.push({ row: rows - 1, col: startCol + i });
                }
            } else if (side === 'top') {
                const startCol = Math.floor((cols - openCount) / 2);
                for (let i = 0; i < openCount; i++) {
                    openCells.push({ row: 0, col: startCol + i });
                }
            } else if (side === 'left') {
                const startRow = Math.floor((rows - openCount) / 2);
                for (let i = 0; i < openCount; i++) {
                    openCells.push({ row: startRow + i, col: 0 });
                }
            } else if (side === 'right') {
                const startRow = Math.floor((rows - openCount) / 2);
                for (let i = 0; i < openCount; i++) {
                    openCells.push({ row: startRow + i, col: cols - 1 });
                }
            }

            for (let i = 0; i < openCells.length; i++) {
                const { row, col } = openCells[i];
                if (i === 0) {
                    board[row][col] = {
                        type: this.imageNames[this._eventItemTypeIndex] || '🍀',
                        typeIndex: this._eventItemTypeIndex,
                        level: 1,
                        merged: false,
                        row, col,
                        locked: false,
                        covered: false
                    };
                    if (!this._eventState.openedLevels.includes(1)) {
                        this._eventState.openedLevels.push(1);
                        if (typeof CollectionManager !== 'undefined') {
                            CollectionManager.onItemCreated(this._eventItemTypeIndex, 1, this._activeEvent.id);
                        }
                    }
                } else {
                    board[row][col] = { locked: false, covered: false, row, col };
                }
            }

            const dist = this._computeDistances(rows, cols, openCells);
            const maxLevel = config.maxLevel;
            const distribution = config.boardSettings.levelsDistribution || [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = board[r][c];
                    if (cell.locked) {
                        const d = dist[r][c];
                        let level = 1;
                        for (const rule of distribution) {
                            if (d === rule.distance) {
                                level = rule.minLevel + Math.floor(Math.random() * (rule.maxLevel - rule.minLevel + 1));
                                break;
                            }
                        }
                        if (level > maxLevel) level = maxLevel;
                        board[r][c] = {
                            type: this.imageNames[this._eventItemTypeIndex] || '🍀',
                            typeIndex: this._eventItemTypeIndex,
                            level: level,
                            merged: false,
                            row: r, col: c,
                            locked: true,
                            covered: true
                        };
                    }
                }
            }

            this.board = board;
            this.rows = rows;
            this.cols = cols;

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (!this.board[r][c].locked) {
                     BoardCore.uncoverNeighbors(this, r, c, false);
                    }
                }
            }

            clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this._saveState();
}, 30000);;
        }



        const tryInit = () => {
            BoardCore.initCanvas(this, 'event-board', 'event-canvas');
            if (!this.canvas || this.canvas.width === 0) {
                requestAnimationFrame(() => {
                    setTimeout(tryInit, 50);
                });
            }
        };
        tryInit();
    },

 
    _computeDistances(rows, cols, openCells) {
        const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
        const queue = [];
        for (const cell of openCells) {
            dist[cell.row][cell.col] = 0;
            queue.push(cell);
        }
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        while (queue.length) {
            const { row, col } = queue.shift();
            for (const [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === Infinity) {
                    dist[nr][nc] = dist[row][col] + 1;
                    queue.push({ row: nr, col: nc });
                }
            }
        }
        return dist;
    },

    _getEventItemTypeIndex(eventId) {
        for (let i = 0; i < this._eventItemData.length; i++) {
            if (this._eventItemData[i] && this._eventItemData[i].name === eventId) {
                return i;
            }
        }
        const newIndex = this._eventItemData.length;
        this._eventItemData.push({
            id: newIndex,
            name: eventId,
            categoryKey: 'category_events',
            displayName: { ru: 'Ивентовый предмет', en: 'Event item', tr: 'Etkinlik eşyası' },
            levelNames: {},
            initialLevel: 1,
            spawnable: false,
            spawnLevels: [],
            spawnRules: null,
            specialCombinations: []
        });
        this._eventMaxLevels[newIndex] = this._activeEvent.maxLevel || 10;
        return newIndex;
    },

    get imageNames() {
        return this._eventItemData.map(item => item ? item.name : 'unknown');
    },

    // ===== СПЕЦИФИЧНЫЕ ДЛЯ ИВЕНТА МЕТОДЫ (НЕ В BOARD CORE) =====

updateGiftAndAdButton() {
    const now = Date.now();
    if (!this.isRunning || this.isPaused) {
        if (this.giftBtn) this.giftBtn.style.display = 'none';
        if (this.adBtn) this.adBtn.style.display = 'none';
        return;
    }

    // Если остались предметы – показываем подарок всегда
    if (this._giftRemaining > 0) {
        this.giftPending = true;
        if (this.giftBtn) {
            this.giftBtn.style.display = 'flex';
            this.giftBtn.classList.add('pulse-attention');
        }
        if (this.adBtn) this.adBtn.style.display = 'none';
        return;
    }

    // Иначе проверяем кулдаун и рекламу
    const giftAvailable = (now - this._lastGiftTime >= this._giftCooldown);
    if (giftAvailable) {
        this.giftPending = true;
        if (this.giftBtn) {
            this.giftBtn.style.display = 'flex';
            this.giftBtn.classList.add('pulse-attention');
        }
        if (this.adBtn) this.adBtn.style.display = 'none';
        return;
    }

    // Если кулдаун ещё не прошёл, проверяем рекламу
    if (this._adAvailable) {
        this.giftPending = false;
        if (this.giftBtn) this.giftBtn.style.display = 'none';
        if (this.adBtn) {
            this.adBtn.style.display = 'flex';
        }
    } else {
        this.giftPending = false;
        if (this.giftBtn) this.giftBtn.style.display = 'none';
        if (this.adBtn) this.adBtn.style.display = 'none';
    }
},

onGiftClick() {
    if (this.isPaused) return;
    if (!this.giftPending && this._giftRemaining === 0) return;

    // Если подарок ещё не активирован – устанавливаем 3 предмета
    if (this._giftRemaining === 0 && this.giftPending) {
        this._giftRemaining = 3;
    }

    // ---- Случайный текст (как в game.js) ----
    const texts = [
        getText('gift_text1', 'Гуляя по лесу, вы нашли что-то полезное!'),
        getText('gift_text2', 'Кажется, что-то блестит под старым пнём…'),
        getText('gift_text3', 'Приподняв корягу, вы нашли что-то полезное!'),
        getText('gift_text4', 'Под ворохом листьев вы нашли что-то полезное!')
    ];
    const randomText = texts[Math.floor(Math.random() * texts.length)];

    const frameUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/kletkaramka.png') || '';
    const typeIndex = this._eventItemTypeIndex;
    const level = 1;
    const imgSrc = BoardCore.getItemImageDataUrl(this, typeIndex, level);
    if (!imgSrc) {
        showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, 0, 0, 'gift_error', 2000);
        return;
    }

    // Генерируем сетку с ячейками для выбора
    let gridHtml = `
        <div style="text-align:center; margin-bottom:0.8rem; font-size:clamp(1rem, 2vw, 1.5rem); color:#4a3a2a;">
            ${randomText}
        </div>
        <div class="item-info-grid" style="justify-content:center; gap:0.8rem; flex-wrap:wrap;">
    `;
    for (let i = 0; i < this._giftRemaining; i++) {
        gridHtml += `
            <div class="item-info-cell gift-select-cell" data-index="${i}" style="cursor:pointer; width:clamp(4rem, 10vmin, 8rem); height:clamp(4rem, 10vmin, 8rem);">
                <img src="${imgSrc}" style="width:90%; height:90%; object-fit:contain;">
            </div>
        `;
    }
    gridHtml += '</div>';

    let selectedIndex = null;

    const modal = ModalManager.showCenterModal({
        title: getText('gift_title', 'Подарок'),
        body: gridHtml,
        buttons: [
            {
                text: getText('gift_get', 'Получить'),
                class: 'gift-get-btn',
                disabled: true,
                onClick: () => {
                    if (selectedIndex === null) return;
                    ModalManager.closeCenterModal();
                    this.receiveGift(typeIndex, level);
                }
            }
        ]
    });

    const cells = modal.querySelectorAll('.gift-select-cell');
    cells.forEach((cell, idx) => {
        cell.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            cells.forEach(c => {
                c.classList.remove('selected');
                c.style.backgroundImage = 'none';
                c.style.border = '';
            });
            cell.classList.add('selected');
            cell.style.backgroundImage = `url(${frameUrl})`;
            cell.style.backgroundSize = '100% 100%';
            cell.style.border = 'none';
            selectedIndex = idx;
            const getBtn = modal.querySelector('.gift-get-btn');
            if (getBtn) {
                getBtn.disabled = false;
                getBtn.style.opacity = '1';
                getBtn.style.pointerEvents = 'auto';
            }
        });
    });

    const getBtn = modal.querySelector('.gift-get-btn');
    if (getBtn) {
        getBtn.disabled = true;
        getBtn.style.opacity = '0.5';
        getBtn.style.pointerEvents = 'none';
    }

    
},

receiveGift(typeIndex, level) {
   
    let freeCell = this.findFreeCell();
    if (!freeCell) {
        ModalManager.showErrorModal(
            getText('no_space', 'Нет места'),
            getText('no_space_text', 'Расчисти место, чтобы было куда это положить')
        );
        return;
    }

   // ★ НОВЫЙ БЛОК: всегда обновляем кулдаун, уменьшаем счётчик ★
this._giftRemaining -= 1;
this._lastGiftTime = Date.now(); // всегда обновляем время последнего получения

if (this._giftRemaining <= 0) {
    // Предметы закончились – скрываем кнопку
    this._giftRemaining = 0;
    this.giftPending = false;
    if (this.giftBtn) {
        this.giftBtn.style.display = 'none';
        this.giftBtn.classList.remove('pulse-attention');
    }
} else {
    // Ещё остались предметы – показываем кнопку с пульсацией
    this.giftPending = true;
    if (this.giftBtn) {
        this.giftBtn.style.display = 'flex';
        this.giftBtn.classList.add('pulse-attention');
    }
}
clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this._saveState();
}, 30000);; // сохраняем состояние (включая new _giftRemaining и _lastGiftTime)

    // Создаём предмет на доске
    const newItem = {
        type: this.imageNames[typeIndex] || '🍀',
        typeIndex: typeIndex,
        level: level,
        merged: false,
        row: freeCell.row,
        col: freeCell.col,
        locked: false,
    };
                if (!this._eventState.openedLevels.includes(level)) {
                    this._eventState.openedLevels.push(level);
                    if (typeof CollectionManager !== 'undefined') {
                        CollectionManager.onItemCreated(typeIndex, level, this._activeEvent.id);
                    }
                    this._renderEventProgress();
                }
    const giftBtn = document.getElementById('event-gift-btn');
    let startX, startY;
    if (giftBtn && this.canvas) {
        const rect = giftBtn.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        startX = (rect.left + rect.width / 2 - canvasRect.left) * this.scaleX;
        startY = (rect.top + rect.height / 2 - canvasRect.top) * this.scaleY;
        if (startX < this.canvas.width * 0.2) {
            startX = this.canvas.width * 0.9;
        }
        if (startY > this.canvas.height * 0.5) {
            startY = this.canvas.height * 0.2;
        }
    } else {
        startX = this.canvas.width * 0.9;
        startY = this.canvas.height * 0.2;
    }

    BoardCore.addItemAnimationFromPoint(this, startX, startY, freeCell.row, freeCell.col, newItem);
    this.updateUI();
       

    if (typeof CollectionManager !== 'undefined') {
        CollectionManager.onItemCreated(typeIndex, level, this._activeEvent.id);
    }

    this.updateGiftAndAdButton();
},

    _setupUI() {
        const eventScene = document.getElementById('scene-event');
        if (eventScene) {
            eventScene.classList.add('active');
            eventScene.style.display = 'flex';
            eventScene.style.zIndex = '10';
        }

        const orderArea = document.getElementById('event-order-area');
        if (orderArea) {
            orderArea.style.display = 'flex';
            orderArea.style.flexDirection = 'column';
            orderArea.style.alignItems = 'center';
            orderArea.style.justifyContent = 'flex-start';
            orderArea.style.flexWrap = 'nowrap';
            orderArea.innerHTML = '';
            const timerDiv = document.createElement('div');
            timerDiv.id = 'event-timer';
            timerDiv.style.cssText = 'font-size: clamp(0.8rem, 2vw, 1.2rem); color: #2a1f14; text-align: center; padding: 0.2rem; width:100%;';
            orderArea.appendChild(timerDiv);
            const chainDiv = document.createElement('div');
            chainDiv.id = 'event-chain';
            chainDiv.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; padding: 4px; width:100%;';
            orderArea.appendChild(chainDiv);
            this._eventChainContainer = chainDiv;
        }

        const bgImg = document.getElementById('event-bg-img');
        if (bgImg) {
            bgImg.src = `images/back/events/${this._activeEvent.id}.jpg`;
        }

const rightPanel = document.getElementById('event-right-panel');
if (!rightPanel) {
    console.warn('[EventManager] event-right-panel не найден');
    return;
}
if (rightPanel) {
    rightPanel.innerHTML = '';

    // 1. Крестик (закрыть ивент)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tb-btn';
    closeBtn.id = 'event-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (typeof App !== 'undefined') App.toggleEvent();
    });
    rightPanel.appendChild(closeBtn);

    // 2. Кнопка паузы (теперь сразу после крестика)
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'tb-btn';
    pauseBtn.id = 'event-pause-btn';
    pauseBtn.textContent = '⏸';
    pauseBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        this.togglePause();
    });
    rightPanel.appendChild(pauseBtn);

    // 3. Подарок
    const giftBtn = document.createElement('button');
    giftBtn.className = 'tb-btn';
    giftBtn.id = 'event-gift-btn';
    const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
    giftBtn.innerHTML = `<img src="${podarokUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🎁';">`;
    giftBtn.style.display = 'none';
    giftBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (this.isPaused) {
            showPausedMessage();
            return;
        }
        this.onGiftClick();
    });
    rightPanel.appendChild(giftBtn);
    this.giftBtn = giftBtn;

    // 4. Реклама
    const adBtn = document.createElement('button');
    adBtn.className = 'tb-btn';
    adBtn.id = 'event-ad-btn';
    const tvUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/tv.png') || '';
    adBtn.innerHTML = `<img src="${tvUrl}" style="width:90%; height:90%; object-fit:contain;">`;
    adBtn.style.display = 'none';
    adBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (this.isPaused) {
            showPausedMessage();
            return;
        }
        this.onAdClick();
    });
    rightPanel.appendChild(adBtn);
    this.adBtn = adBtn;
}
        this.updateUI();
        BoardCore.bindEvents(this); // вместо this.bindEvents()
        BoardCore.updateInfoPanel(this);
        this._renderEventProgress();
      BoardCore.findHintPair(this);
      BoardCore.startInactivityTimer(this);
      this._updateGlobalProgressBar(); 
    },

    _cleanupUI() {
        const eventScene = document.getElementById('scene-event');
       if (eventScene) {
        eventScene.classList.remove('active');
        eventScene.style.display = 'none';   // <-- явно скрываем
        eventScene.style.zIndex = '';        // <-- сбрасываем перекрытие
    }
        const orderArea = document.getElementById('event-order-area');
        if (orderArea) {
            orderArea.innerHTML = '';
            orderArea.style.display = '';
            orderArea.style.flexDirection = '';
            orderArea.style.alignItems = '';
            orderArea.style.justifyContent = '';
            orderArea.style.flexWrap = '';
        }
        const bgImg = document.getElementById('event-bg-img');
        if (bgImg) {
            bgImg.src = '';
        }
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        clearTimeout(this.inactivityTimer);
    },


    // event.js – внутри EventManager

    /**
     * Генерирует 3 случайных предмета для рулетки (разные уровни одного типа).
     * @returns {Array<{typeIndex: number, level: number, imageUrl: string}>}
     */
    _generateRouletteItems() {
        const typeIndex = this._eventItemTypeIndex;
        const maxLevel = this._eventMaxLevels[typeIndex] || 1;
        const levels = [];
        for (let i = 1; i <= maxLevel; i++) {
            levels.push(i);
        }
        // перемешиваем и берём до 3
        const shuffled = levels.sort(() => Math.random() - 0.5);
        const count = Math.min(3, shuffled.length);
        const pool = [];
        for (let i = 0; i < count; i++) {
            const level = shuffled[i];
            const imageUrl = BoardCore.getItemImageDataUrl(this, typeIndex, level);
            pool.push({ typeIndex, level, imageUrl });
        }
        // Если меньше 3, дублируем последний
        while (pool.length < 3) {
            const last = pool[pool.length - 1];
            pool.push({ ...last });
        }
        return pool;
    },

    onAdClick() {
            if (!this._adAvailable) return;
        const itemsPool = this._generateRouletteItems();
        if (itemsPool.length === 0) return;

        Platform.showRewardRoulette(itemsPool, (selectedItem) => {
            // Спавн на доску ивента
            const freeCell = this.findFreeCell();
            if (!freeCell) {
                ModalManager.showErrorModal(
                    getText('no_space', 'Нет места'),
                    getText('no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
                return;
            }

            const adBtn = document.getElementById('event-ad-btn');
            let startX, startY;
            if (adBtn && this.canvas) {
                const rect = adBtn.getBoundingClientRect();
                const canvasRect = this.canvas.getBoundingClientRect();
                startX = (rect.left + rect.width / 2 - canvasRect.left) * this.scaleX;
                startY = (rect.top + rect.height / 2 - canvasRect.top) * this.scaleY;
            } else {
                startX = this.canvas ? this.canvas.width / 2 : 0;
                startY = this.canvas ? this.canvas.height / 2 : 0;
            }

            const newItem = {
                type: this.imageNames[selectedItem.typeIndex] || '🍀',
                typeIndex: selectedItem.typeIndex,
                level: selectedItem.level,
                merged: false,
                row: freeCell.row,
                col: freeCell.col,
                locked: false,
            };
                            if (!this._eventState.openedLevels.includes(selectedItem.level)) {
                    this._eventState.openedLevels.push(selectedItem.level);
                    if (typeof CollectionManager !== 'undefined') {
                        CollectionManager.onItemCreated(selectedItem.typeIndex, selectedItem.level, this._activeEvent.id);
                    }
                    this._renderEventProgress();
                }

            BoardCore.addItemAnimationFromPoint(this, startX, startY, freeCell.row, freeCell.col, newItem);
            this.updateUI();
              

            if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(selectedItem.typeIndex, selectedItem.level, this._activeEvent.id);
            }
            clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this._saveState();
}, 30000);;
        });
    },

 
_removeGlobalListeners() {
if (this._globalPointerMove) {
    document.removeEventListener('pointermove', this._globalPointerMove);
    this._globalPointerMove = null;
}
if (this._globalPointerUp) {
    document.removeEventListener('pointerup', this._globalPointerUp);
    this._globalPointerUp = null;
}
},

    // ===== СПЕЦИФИЧНАЯ ЛОГИКА ИВЕНТА (КЛИКИ, ОБЪЕДИНЕНИЕ, СПАВН) =====

    handleClick(row, col) {
        if (this.hintAnimations.length > 0) {
            this.hintAnimations = [];
          BoardCore.resetInactivityTimer(this);
        }

        if (this.isPaused || this.processingClick) return;

        const cell = this.board[row]?.[col];
        if (!cell || cell.locked || !cell.type) {
            this.selectedCell = null;
            BoardCore.updateInfoPanel(this);
            return;
        }

        if (this.selectedCell) {
            const { row: selRow, col: selCol } = this.selectedCell;
            if (selRow === row && selCol === col) {
                const itemData = this._eventItemData[cell.typeIndex];
                if (itemData && itemData.spawnable === true && itemData.spawnLevels && itemData.spawnLevels.includes(cell.level)) {
                    this.performSpawn(row, col);
                } else {
                    this.selectedCell = null;
                    BoardCore.updateInfoPanel(this);
                }
                return;
            } else {
                if (!cell.locked) {
                    this.selectedCell = { row, col };
                    AudioManager.play('select');
                    this.showItemInfo(row, col);
                } else {
                    this.selectedCell = null;
                    BoardCore.updateInfoPanel(this);
                }
                return;
            }
        } else {
            if (!cell.locked) {
                this.selectedCell = { row, col };
                AudioManager.play('select');
                this.showItemInfo(row, col);
            }
        }
    },

combineItems(r1, c1, r2, c2) {
    // 🔍 Получаем исходный и целевой предметы
    const sourceItem = this.dragStart ? this.dragStart.item : this.board[r1]?.[c1];
    const targetCell = this.board[r2]?.[c2];

    // 🔢 Нормализуем уровни (защита от NaN)
    if (sourceItem) {
        sourceItem.level = Number(sourceItem.level);
        if (isNaN(sourceItem.level)) sourceItem.level = 1;
    }
    if (targetCell) {
        targetCell.level = Number(targetCell.level);
        if (isNaN(targetCell.level)) targetCell.level = 1;
    }

    if (!sourceItem || !targetCell) {
        this.board[r1][c1] = sourceItem || { locked: false, row: r1, col: c1 };
        return;
    }

    // 🔋 Определяем генераторы и батарейки
    const isSourceGen = (sourceItem.charges !== undefined);
    const isTargetGen = (targetCell && targetCell.charges !== undefined);
    const isSourceBattery = (sourceItem.typeIndex === 8);
    const isTargetBattery = (targetCell && targetCell.typeIndex === 8);

    // 🚫 Запрет объединения двух генераторов, если один на перезарядке
    if (isSourceGen && isTargetGen) {
        const sourceOnCooldown = BoardCore.isGeneratorOnCooldown(this, sourceItem);
        const targetOnCooldown = BoardCore.isGeneratorOnCooldown(this, targetCell);
        if (sourceOnCooldown || targetOnCooldown) {
            showFloatingMessage(this.canvas, this.scaleX, this.scaleY,
                this.cellWidth, this.cellHeight, r1, c1, 'on_cooldown', 2000);
            this.board[r1][c1] = sourceItem;
            this.dragStart = null;
            this.dragTarget = null;
            return;
        }
    }

    // 🔋 Батарейка + генератор на перезарядке – сброс кулдауна
    if (isSourceGen && isTargetBattery && sourceItem.charges === 0 && sourceItem.cooldownEnd > Date.now()) {
        sourceItem.charges = sourceItem.maxCharges || MAX_CHARGES;
        sourceItem.cooldownEnd = 0;
        this.board[r2][c2] = { locked: false, row: r2, col: c2 };
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedCell = { row: r1, col: c1 };
        this.showItemInfo(r1, c1);
        AudioManager.play('merge');
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._saveState(), 30000);
        this.updateUI();
        this._drawBackground();
        BoardCore.drawBoard(this);
        return;
    }
    if (isSourceBattery && isTargetGen && targetCell.charges === 0 && targetCell.cooldownEnd > Date.now()) {
        targetCell.charges = targetCell.maxCharges || MAX_CHARGES;
        targetCell.cooldownEnd = 0;
        this.board[r1][c1] = { locked: false, row: r1, col: c1 };
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedCell = { row: r2, col: c2 };
        this.showItemInfo(r2, c2);
        AudioManager.play('merge');
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._saveState(), 30000);
        this.updateUI();
        this._drawBackground();
        BoardCore.drawBoard(this);
        return;
    }

    // ================================================================
    // ВЕТКА 1: ЦЕЛЕВАЯ КЛЕТКА ЗАБЛОКИРОВАНА (закрыта)
    // ================================================================
    if (targetCell.locked === true) {
        // Проверяем наличие открытого соседа
        let hasOpenNeighbor = false;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r2 + dr, nc = c2 + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    const neighbor = this.board[nr]?.[nc];
                    if (neighbor && neighbor.locked === false) {
                        hasOpenNeighbor = true;
                        break;
                    }
                }
            }
            if (hasOpenNeighbor) break;
        }
        if (!hasOpenNeighbor) {
            this.board[r1][c1] = sourceItem;
            this.dragStart = null;
            this.dragTarget = null;
            return;
        }

        // Проверка на совпадение типов и уровней
        if (sourceItem.type !== targetCell.type || sourceItem.level !== targetCell.level) {
            this.board[r1][c1] = sourceItem;
            this.dragStart = null;
            this.dragTarget = null;
            return;
        }

        const nextLevel = sourceItem.level + 1;
        const realMax = this._eventMaxLevels[sourceItem.typeIndex] || 1;
        if (nextLevel > realMax) {
            showFloatingMessage(this.canvas, this.scaleX, this.scaleY,
                this.cellWidth, this.cellHeight, r2, c2, 'limit_reached', 3000);
            this.board[r1][c1] = sourceItem;
            this.dragStart = null;
            this.dragTarget = null;
            return;
        }

        // 🆕 Создаём новый предмет
        this.board[r2][c2] = {
            type: sourceItem.type,
            typeIndex: sourceItem.typeIndex,
            level: nextLevel,
            merged: true,
            row: r2, col: c2,
            locked: false,
        };
        this._backgroundDirty = true;

        // 🧬 Инициализация генератора (если применимо)
        BoardCore.initGeneratorFields(this, this.board[r2][c2], sourceItem.typeIndex, nextLevel);

        // 📦 Открываем соседние клетки (снимаем коробки)
        BoardCore.uncoverNeighbors(this, r2, c2, true);

        // 🆕 ДОБАВЛЯЕМ УРОВНИ ОТКРЫТЫХ СОСЕДЕЙ
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const d of dirs) {
            const nr = r2 + d[0], nc = c2 + d[1];
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                const neighbor = this.board[nr][nc];
                if (neighbor && !neighbor.locked && neighbor.type && neighbor.level !== undefined) {
                    if (!this._eventState.openedLevels.includes(neighbor.level)) {
                        this._eventState.openedLevels.push(neighbor.level);
                        if (typeof CollectionManager !== 'undefined') {
                            CollectionManager.onItemCreated(neighbor.typeIndex, neighbor.level, this._activeEvent.id);
                        }
                        this._renderEventProgress();
                    }
                }
            }
        }

        // 🆕 ДОБАВЛЯЕМ УРОВЕНЬ НОВОГО ПРЕДМЕТА (nextLevel) – ЭТО БЫЛО ПРОПУЩЕНО!
        if (!this._eventState.openedLevels.includes(nextLevel)) {
            this._eventState.openedLevels.push(nextLevel);
            if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(sourceItem.typeIndex, nextLevel, this._activeEvent.id);
            }
            this._renderEventProgress();
        }

        // 🧹 Очистка исходной клетки, обновление UI, анимации, сохранение
        this.board[r1][c1] = { locked: false, row: r1, col: c1 };
        this.selectedCell = { row: r2, col: c2 };
        this.showItemInfo(r2, c2);
        AudioManager.play('merge');
        BoardCore.spawnConfetti(this, r2, c2);
        BoardCore.addPulse(this, r2, c2, 0.8, 1.2);
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._saveState(), 30000);
        this.updateUI();
        this._drawBackground();
        BoardCore.drawBoard(this);
        this.dragStart = null;
        this.dragTarget = null;
        // Проверяем условия победы после объединения
this._checkCollectionComplete();
this._checkBoardFullyOpened();
        return;
    }

    // ================================================================
    // ВЕТКА 2: ЦЕЛЕВАЯ КЛЕТКА НЕ ЗАБЛОКИРОВАНА (открыта)
    // ================================================================
    if (!targetCell.type) {
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    if (sourceItem.type !== targetCell.type || sourceItem.level !== targetCell.level) {
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    const nextLevel = sourceItem.level + 1;
    const realMax = this._eventMaxLevels[sourceItem.typeIndex] || 1;
    if (nextLevel > realMax) {
        showFloatingMessage(this.canvas, this.scaleX, this.scaleY,
            this.cellWidth, this.cellHeight, r2, c2, 'limit_reached', 3000);
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    // 🆕 Создаём новый предмет
    this.board[r2][c2] = {
        type: sourceItem.type,
        typeIndex: sourceItem.typeIndex,
        level: nextLevel,
        merged: true,
        row: r2, col: c2,
        locked: false,
    };

    // 🧬 Инициализация генератора
    BoardCore.initGeneratorFields(this, this.board[r2][c2], sourceItem.typeIndex, nextLevel);

    // 📦 Открываем соседние клетки
    BoardCore.uncoverNeighbors(this, r2, c2, true);

    // 🆕 Добавляем уровни открытых соседей
    const dirs2 = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const d of dirs2) {
        const nr = r2 + d[0], nc = c2 + d[1];
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            const neighbor = this.board[nr][nc];
            if (neighbor && !neighbor.locked && neighbor.type && neighbor.level !== undefined) {
                if (!this._eventState.openedLevels.includes(neighbor.level)) {
                    this._eventState.openedLevels.push(neighbor.level);
                    if (typeof CollectionManager !== 'undefined') {
                        CollectionManager.onItemCreated(neighbor.typeIndex, neighbor.level, this._activeEvent.id);
                    }
                    this._renderEventProgress();
                }
            }
        }
    }

    // 🆕 Добавляем уровень нового предмета (уже было, оставляем)
    if (!this._eventState.openedLevels.includes(nextLevel)) {
        this._eventState.openedLevels.push(nextLevel);
        if (typeof CollectionManager !== 'undefined') {
            CollectionManager.onItemCreated(sourceItem.typeIndex, nextLevel, this._activeEvent.id);
        }
        this._renderEventProgress();
    }

    // 🧹 Очистка, обновление UI, анимации, сохранение
    this.board[r1][c1] = { locked: false, row: r1, col: c1 };
    this.selectedCell = { row: r2, col: c2 };
    this.showItemInfo(r2, c2);
    AudioManager.play('merge');
    BoardCore.spawnConfetti(this, r2, c2);
    BoardCore.addPulse(this, r2, c2, 0.8, 1.2);
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveState(), 30000);
    this.updateUI();
    this._drawBackground();
    BoardCore.drawBoard(this);
    this.dragStart = null;
    this.dragTarget = null;
    // Проверяем условия победы после объединения
this._checkCollectionComplete();
this._checkBoardFullyOpened();
},
 
  showItemInfo(row, col) {
    if (typeof ModalManager === 'undefined') return;

    // ---- Убеждаемся, что контейнер правильный для ивента ----
    let targetContainer = document.getElementById('event-info-modal-container');
    // console.log('[event.showItemInfo] targetContainer:', targetContainer ? targetContainer.id : 'null');
   
    if (targetContainer && ModalManager._infoContainer !== targetContainer) {
        ModalManager._infoContainer = targetContainer;
       //  console.log('[event.showItemInfo] Установлен контейнер:', targetContainer.id);
    }
    // console.log('[event.showItemInfo] ModalManager._infoContainer:', ModalManager._infoContainer ? ModalManager._infoContainer.id : 'null');
        const cell = this.board[row]?.[col];
        if (!cell || cell.locked || !cell.type) {
            this.selectedCell = null;
            BoardCore.updateInfoPanel(this);
            return;
        }

        const typeIdx = cell.typeIndex;
        const item = this._eventItemData[typeIdx];
        if (!item) return;
        const lang = currentLang || 'ru';
        const name = item.displayName ? item.displayName[lang] : ('Предмет ' + typeIdx);

        const canSpawn = item.spawnable === true && item.spawnLevels && item.spawnLevels.includes(cell.level);
        const shortText = canSpawn
            ? getText('press_to_spawn', 'НАЖМИТЕ, чтобы получить предмет')
            : getText('combine_to_upgrade', 'ОБЪЕДИНИТЕ для улучшения');

       const imgSrc = BoardCore.getItemImageDataUrl(this, typeIdx, cell.level);
        const cellHtml = `
            <div class="info-item-preview" style="width:clamp(2rem,8vh,8rem); height:clamp(2rem,8vh,8rem); background:#99c9ff; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <img src="${imgSrc || ''}" style="width:90%; height:90%; object-fit:contain;" alt="">
            </div>
        `;
        const bodyHtml = `
            <div style="display:flex; align-items:center; gap:clamp(0.5rem,1vw,1.5rem); height:100%; padding:0.2rem; justify-content:center; width:100%;">
                ${cellHtml}
                <div style="flex:1; text-align:center; font-size:inherit; line-height:1.3;">${shortText}</div>
            </div>
        `;

        ModalManager.showInfoModal({
            title: name,
            description: bodyHtml,
            showHelp: true,
helpAction: () => {
    const fullHtml = this.buildItemInfoHTML(row, col); // возвращает DOM-элемент
    ModalManager.showCenterModal({
        title: name,
        bodyElement: fullHtml,   // ← именно bodyElement
        buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }],
         frameName: this._activeEvent.frameName || null 
    });
},
            showTrash: true,
            trashAction: () => {
                ModalManager.confirmDelete(
                    { name: name },
                    () => {
                        BoardCore.deleteItem(this, row, col);
                    }
                );
            }
        });
    },

    buildItemInfoHTML(row, col) {
        const cell = this.board[row]?.[col];
        if (!cell || !cell.type) return '';
        return this.buildItemInfoHTMLFromCell(cell);
    },

// event.js – замените метод buildItemInfoHTMLFromCell

buildItemInfoHTMLFromCell(cell) {
    const typeIdx = cell.typeIndex;
    const level = cell.level;
    const item = this._eventItemData[typeIdx];
    if (!item) return document.createDocumentFragment();

    const maxLevel = this._eventMaxLevels[typeIdx] || 1;
    const fragment = document.createDocumentFragment();

    const chainContainer = document.createElement('div');
    chainContainer.className = 'item-info-grid';
    chainContainer.style.cssText = 'justify-content:center; gap:0.3rem;';

    for (let lv = 1; lv <= maxLevel; lv++) {
        const isDiscovered = this._eventState.openedLevels.includes(lv);
        const isCurrent = (lv === level);

        const cellDiv = document.createElement('div');
        cellDiv.className = 'item-info-cell';
        cellDiv.style.cssText = `width:clamp(4rem, 10vmin, 8rem); height:clamp(4rem, 10vmin, 8rem); flex-shrink:0;${isCurrent ? ' border: 3px solid #ac7d4f; box-shadow: 0 0 0 2px #d4a373;' : ''}`;

        if (isDiscovered) {
            const img = document.createElement('img');
            img.src = BoardCore.getItemImageDataUrl(this, typeIdx, lv) || '';
            img.style.cssText = 'width:90%; height:90%; object-fit:contain;';
            cellDiv.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.style.cssText = 'font-size:clamp(1rem, 2vw, 1.5rem); color:#aaa;';
            span.textContent = '?';
            cellDiv.appendChild(span);
        }

        chainContainer.appendChild(cellDiv);

        if (lv < maxLevel) {
            const arrow = document.createElement('span');
            arrow.style.cssText = 'font-size:clamp(0.8rem, 1.5vw, 1.2rem); color:#2a1f14;';
            arrow.textContent = '→';
            chainContainer.appendChild(arrow);
        }
    }

    fragment.appendChild(chainContainer);
    return fragment;
},


    performSpawn(row, col) {
        if (this.processingClick) {
            console.warn('⚠️ performSpawn: уже выполняется');
            return;
        }
        if (this.isPaused) {
            return;
        }

        this.processingClick = true;
        clearTimeout(this._emergencyTimer);
        this._emergencyTimer = setTimeout(() => {
            if (this.processingClick) {
                this.processingClick = false;
                this._emergencyTimer = null;
            }
        }, 10000);

        BoardCore.updateCooldowns(this);
        try {
            const cell = this.board[row]?.[col];
            if (!cell || cell.locked || !cell.type) {
                this.processingClick = false;
                return;
            }

            const level = cell.level;
            const typeIdx = cell.typeIndex;
            const itemData = this._eventItemData[typeIdx];
            if (!itemData) {
                this.processingClick = false;
                return;
            }

  if (BoardCore.isGeneratorOnCooldown(this, cell)) {
    showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, row, col, 'on_cooldown', 1500);
    this.processingClick = false;
    return;
}

            const ruleObj = BoardCore.getSpawnRulesForLevel(this, itemData, level)
            if (!ruleObj) {
                this.processingClick = false;
                return;
            }
            const types = ruleObj.types || [];
            if (types.length === 0) {
                this.processingClick = false;
                return;
            }

            const totalWeight = types.reduce((sum, t) => sum + (t.weight || 1), 0);
            let rand = Math.random() * totalWeight;
            let selected = types[0];
            for (const t of types) {
                rand -= (t.weight || 1);
                if (rand <= 0) {
                    selected = t;
                    break;
                }
            }

            const typeIdxNew = selected.type;
            const newLevel = selected.level;
            if (newLevel > (this._eventMaxLevels[typeIdxNew] || 0)) {
                this.processingClick = false;
                return;
            }

            const freeCells = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const cellAt = this.board[r]?.[c];
                    if (!cellAt || !cellAt.type) {
                        freeCells.push({ row: r, col: c });
                    }
                }
            }
            if (freeCells.length === 0) {
                this.processingClick = false;
                return;
            }
            freeCells.sort((a, b) => {
                const distA = Math.abs(a.row - row) + Math.abs(a.col - col);
                const distB = Math.abs(b.row - row) + Math.abs(b.col - col);
                return distA - distB;
            });
            const target = freeCells[0];

            const newItem = {
                type: this.imageNames[typeIdxNew] || '🍀',
                typeIndex: typeIdxNew,
                level: newLevel,
                merged: false,
                row: target.row,
                col: target.col,
                locked: false,
            };
                            if (!this._eventState.openedLevels.includes(newLevel)) {
                                this._eventState.openedLevels.push(newLevel);
                                if (typeof CollectionManager !== 'undefined') {
                                    CollectionManager.onItemCreated(typeIdxNew, newLevel, this._activeEvent.id);
                                }
                                this._renderEventProgress();
                            }
            if (cell.charges !== undefined && cell.charges !== Infinity) {
                cell.charges -= 1;
                if (cell.charges === 0) {
                    cell.cooldownEnd = Date.now() + COOLDOWN_MS;
                }
            }

          BoardCore.addItemAnimation(this, row, col, target.row, target.col, newItem);
      BoardCore.addPulse(this, row, col, 0.5, 1.12);
            AudioManager.play('spawn');
            this.showItemInfo(row, col);
            this.updateUI();

        } catch (err) {
            console.error('❌ Ошибка в performSpawn:', err);
            this.processingClick = false;
        }
        // Проверяем условия победы после объединения
            this._checkCollectionComplete();
            this._checkBoardFullyOpened();
    },

    // ===== ПРОГРЕСС ИВЕНТА =====

    _renderEventProgress() {
        const chain = document.getElementById('event-chain');
        if (!chain) return;
        const maxLevel = this._activeEvent.maxLevel;
        const opened = this._eventState.openedLevels || [];
       const isPortrait = Device.isPortrait;
        const itemsPerRow = isPortrait ? 5 : 3;
        const itemTypeIndex = this._eventItemTypeIndex;
        let html = '';
        for (let lv = 1; lv <= maxLevel; lv++) {
            const isOpen = opened.includes(lv);
           const src = isOpen ? BoardCore.getItemImageDataUrl(this, itemTypeIndex, lv) : '';
            html += `<div class="event-level-cell" style="
                        width: clamp(30px, 7vmin, 80px);
                        height: clamp(30px, 7vmin, 80px);
                        border: 2px solid ${isOpen ? '#ac7d4f' : '#888'};
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: ${isOpen ? '#f0e6d3' : '#d9c5a6'};
                        font-size: clamp(1rem, 2vw, 1.5rem);
                        color: #2a1f14;
                    ">
                        ${isOpen ? `<img src="${src}" style="width:95%; height:95%; object-fit:contain;">` : '?'}
                    </div>`;
            if (lv % itemsPerRow === 0 && lv < maxLevel) {
                html += `<div style="width:100%;"></div>`;
            }
        }
        chain.innerHTML = html;
        this._updateTimer();
           },

_updateTimer() {
    const timerDiv = document.getElementById('event-timer');
    if (!timerDiv) return;
    const now = Date.now();
    const end = this._activeEvent._end; // используем вычисленный конец
    const diff = end - now;
    if (diff <= 0) {
        timerDiv.textContent = 'Ивент завершён';
        return;
    }
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        let text;
        if (days > 0) {
            text = `${days}д ${hours}ч`;
        } else {
            text = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        }
        timerDiv.textContent = text;
    },

    _startTimer() {
        this._updateTimer();
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = setInterval(() => this._updateTimer(), 1000);
    },

    // ===== ВСПОМОГАТЕЛЬНЫЕ =====

    findFreeCell() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r]?.[c];
                if (!cell || !cell.type) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    },

    spawnItemFromPoint(startX, startY, row, col, typeIndex, level) {
          if (this.isPaused) return; 
        const newItem = {
            type: this.imageNames[typeIndex] || '🍀',
            typeIndex: typeIndex,
            level: level,
            merged: false,
            row, col,
            locked: false,
        };
        this.board[row][col] = newItem;
        this.updateUI();
          this._drawBackground(this); // перерисовываем фон
       BoardCore.drawBoard(this);
          
    },

  // ===== ФОН (специфичный) =====

    _drawBackground() {
           if (!this.canvas) return; 
        if (!this._backgroundCanvas ||
            this._backgroundCanvas.width !== this.canvas.width ||
            this._backgroundCanvas.height !== this.canvas.height) {
            this._backgroundCanvas = document.createElement('canvas');
            this._backgroundCanvas.width = this.canvas.width;
            this._backgroundCanvas.height = this.canvas.height;
            this._backgroundCtx = this._backgroundCanvas.getContext('2d');
        }

        const ctx = this._backgroundCtx;
        const cw = this.cellWidth;
        const ch = this.cellHeight;
        const boardWidth = this.canvas.width;
        const boardHeight = this.canvas.height;

        if (Device.isMobile) {
            ctx.fillStyle = '#8b6b4d';
            ctx.fillRect(0, 0, boardWidth, boardHeight);
        } else {
            const woodBase = '#8b6b4d';
            const woodLight = '#a8865e';
            const grad = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
            grad.addColorStop(0, woodBase);
            grad.addColorStop(0.5, woodLight);
            grad.addColorStop(1, '#6f4f32');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, boardWidth, boardHeight);
            ctx.save();
            ctx.strokeStyle = 'rgba(60, 40, 20, 0.15)';
            const hatchLineWidth = Math.max(0.5, Math.min(cw, ch) * 0.03);
            ctx.lineWidth = hatchLineWidth * 0.8;
            for (let i = 0; i < boardWidth; i += 8 + Math.random() * 16) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 20, boardHeight);
                ctx.stroke();
            }
            for (let i = 0; i < boardHeight; i += 8 + Math.random() * 16) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(boardWidth, i + 20);
                ctx.stroke();
            }
            ctx.restore();
        }

        const cellSize = Math.min(cw, ch);
        let strokeWidth = 3;
        if (cellSize < 40) strokeWidth = 0.8;
        else if (cellSize < 60) strokeWidth = 1.5;
        else if (cellSize < 80) strokeWidth = 2;

        const hatchColor = 'rgba(40, 30, 20, 0.12)';
        const strokeColor = '#2a1f14';
        const hatchLineWidth2 = Math.max(0.5, strokeWidth * 0.4);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * cw;
                const y = r * ch;
                const cell = this.board[r][c];
                const isLocked = cell && cell.locked === true;
                let fillColor;
                fillColor = (r + c) % 2 === 0 ? '#d9c5a6' : '#c9b18c';
if (isLocked) fillColor = (r + c) % 2 === 0 ? '#a38564' : '#92785b';

                const radius = Math.min(cw, ch) * 0.06;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.arcTo(x + cw, y, x + cw, y + ch, radius);
                ctx.arcTo(x + cw, y + ch, x, y + ch, radius);
                ctx.arcTo(x, y + ch, x, y, radius);
                ctx.arcTo(x, y, x + cw, y, radius);
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();

                         if (!Device.isMobile) {
                    ctx.clip();
                    const step = 10;
                    const offset = (r + c) % 2 === 0 ? 2 : 0;
                    ctx.strokeStyle = hatchColor;
                    ctx.lineWidth = hatchLineWidth2;
                    for (let i = -ch; i < cw + ch; i += step) {
                        ctx.beginPath();
                        ctx.moveTo(x + i + offset, y - ch);
                        ctx.lineTo(x + i + ch + offset, y + ch);
                        ctx.stroke();
                    }
                    for (let i = -ch; i < cw + ch; i += step) {
                        ctx.beginPath();
                        ctx.moveTo(x - ch + i + offset, y + ch + i);
                        ctx.lineTo(x + ch + i + offset, y - ch + i);
                        ctx.stroke();
                    }
                    ctx.restore();
                } else {
                    ctx.restore();
                }
            }
        }
        this._backgroundDirty = false;
    },

    _getItemData(typeIndex) {
    return this._eventItemData[typeIndex] || null;
},

    // ---- Быстрое обновление счёта (синхронно) ----
updateScoreOnly() {
    const pointsImg = `<img src="${App.pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;">`;
    const score = (typeof Game !== 'undefined' && Game.score !== undefined) ? Game.score : Storage.getScore();
    const scoreEl = document.getElementById('event-score');
    if (scoreEl) scoreEl.innerHTML = pointsImg + ' ' + score;
},


// ---- Полное обновление UI (счёт сразу, остальное – отложенно) ----
updateUI() {
    // 1. Счёт – сразу
    this.updateScoreOnly();

    // 2. Всё остальное – через requestAnimationFrame
    if (this._updatePending) return;
    this._updatePending = true;
    requestAnimationFrame(() => {
        this._updatePending = false;
        this._renderFullUI();
    });
},

// ---- Внутренний метод полного обновления (всё, кроме счёта) ----
_renderFullUI() {
    this.updateScoreOnly();
    this._updateGlobalProgressBar();
    this.updateGiftAndAdButton();
    BoardCore.updateInfoPanel(this);
},

_updateGlobalProgressBar() {
    const fill = document.getElementById('event-progress-fill');
    if (!fill) return;
    const progress = Experience.getProgress(); // 0..1
    const percent = Math.round(progress * 100);
    fill.style.width = percent + '%';

    // Устанавливаем иконку подарка (если ещё не установлена)
    const giftIcon = document.getElementById('event-progress-gift');
    if (giftIcon && !giftIcon.src) {
        const podarokUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/podarok.png') || '';
        giftIcon.src = podarokUrl;
    }
},

    // ---- Пауза ----
showPauseOverlay() {
    const overlay = document.getElementById('event-overlay-pause');
    if (overlay) {
        overlay.classList.add('active');
        overlay.style.pointerEvents = 'auto'; // разрешаем клики
    }
},
hidePauseOverlay() {
    const overlay = document.getElementById('event-overlay-pause');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.pointerEvents = 'none'; // блокируем, когда скрыт
    }
},

togglePause() {
      if (!this.isRunning) return;
    const pauseBtn = document.getElementById('event-pause-btn');
    if (this.isPaused) {
        this.isPaused = false;
        this.hidePauseOverlay();
         // снятие паузы – перезапустить таймер

        BoardCore.startInactivityTimer(this);
        if (pauseBtn) pauseBtn.textContent = '⏸';
    } else {
        // пауза – очистить таймер
        clearTimeout(this.inactivityTimer);
        // Сброс состояний (как было)
        if (this.isDragging && this.dragStart) {
            this.board[this.dragStart.row][this.dragStart.col] = this.dragStart.item;
        }
        this.isDragging = false;
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedItem = null;
        BoardCore.updateDragGhost(this, 0, 0, null);
        this.selectedCell = null;
        this.hoverCell = null;
        if (typeof ModalManager !== 'undefined') {
            BoardCore.updateInfoPanel(this);
            ModalManager.closeCenterModal();
        }
        this.hintAnimations = [];
          this.isPaused = true;
        this._removeGlobalListeners();
        this.showPauseOverlay();
        if (pauseBtn) pauseBtn.textContent = '▶';
        App.saveFullProgress();
    }
    return this.isPaused;
},

// ===== ПРОВЕРКА УСЛОВИЙ ПОБЕДЫ =====

_checkCollectionComplete() {
    if (this._eventState.collectionCompleted) return;
    const opened = this._eventState.openedLevels || [];
    const maxLevel = this._activeEvent.maxLevel;
    // Проверяем, что все уровни от 1 до maxLevel открыты
    let allOpened = true;
    for (let lv = 1; lv <= maxLevel; lv++) {
        if (!opened.includes(lv)) { allOpened = false; break; }
    }
    if (allOpened) {
        this._eventState.collectionCompleted = true;
        this._saveState();
        this._showCollectionCompleteModal();
    }
},

_checkBoardFullyOpened() {
    if (this._eventState.boardFullyOpened) return;
    // Проверяем, что все клетки не locked и не covered
    let allOpen = true;
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell.locked || cell.covered) { allOpen = false; break; }
        }
        if (!allOpen) break;
    }
    if (allOpen) {
        this._eventState.boardFullyOpened = true;
        this._saveState();
        this._showBoardFullyOpenedModal();
    }
},

// ===== МОДАЛКИ ПОБЕДЫ =====

_showCollectionCompleteModal() {
    const sceneConfig = getCurrentSceneConfig();
    const availableTypes = sceneConfig.availableTypes || [];
    if (availableTypes.length === 0) return;

    const getRandomItem = () => {
        const typeIndex = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const maxLvl = Game.maxLevels[typeIndex] || 1;
        const level = Math.min(Math.floor(Math.random() * maxLvl) + 1, 7);
        return { typeIndex, level };
    };
    const item1 = getRandomItem();
    const item2 = getRandomItem();

    // Отправляем награду сразу
    this._sendToInventory([item1, item2]);

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
            <p style="font-size:clamp(1rem,2vw,1.5rem);">${getText('event_complete_text', 'Ура! Собран весь комплект! Интересно, что будет, если открыть все клетки...')}</p>
            ${cellHtml}
            <p style="font-size:clamp(0.9rem,1.8vw,1.3rem); margin-top:0.5rem; color:#4a3a2a;">
                ${getText('prize_sent', 'Награда отправлена в корзинку с припасами!')}
            </p>
        </div>
    `;

    ModalManager.showCenterModal({
        title: getText('all_done', 'Невероятно!'),
        body: bodyHtml,
        buttons: [
            {
                text: getText('pause_resume', 'Продолжить'),
                onClick: () => {
                    ModalManager.closeCenterModal();
                }
            }
        ]
    });
},

_showBoardFullyOpenedModal() {
    const sceneConfig = getCurrentSceneConfig();
    const availableTypes = sceneConfig.availableTypes || [];
    const generators = availableTypes.filter(typeIndex => {
        const item = ITEM_DATA[typeIndex];
        return item && item.spawnable && item.spawnLevels && item.spawnLevels.length > 0;
    });
    if (generators.length === 0) return;
    const typeIndex = generators[Math.floor(Math.random() * generators.length)];
    const item = ITEM_DATA[typeIndex];
    const levels = item.spawnLevels.filter(lv => lv <= 7);
    if (levels.length === 0) return;
    const level = levels[Math.floor(Math.random() * levels.length)];

    // Отправляем награду сразу
    this._sendToInventory([{ typeIndex, level }]);

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
            <p style="font-size:clamp(1rem,2vw,1.5rem);">${getText('secret_text', 'Эта полянка оказалась интереснее, чем показалось в начале!')}</p>
            ${cellHtml}
            <p style="font-size:clamp(0.9rem,1.8vw,1.3rem); margin-top:0.5rem; color:#4a3a2a;">
                ${getText('prize_sent', 'Награда отправлена в корзинку с припасами!')}
            </p>
        </div>
    `;

    ModalManager.showCenterModal({
        title: getText('secret', 'Секретная награда'),
        body: bodyHtml,
        buttons: [
            {
                text: getText('pause_resume', 'Продолжить'),
                onClick: () => {
                    ModalManager.closeCenterModal();
                }
            }
        ]
    });
},

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


};

window.EventManager = EventManager;