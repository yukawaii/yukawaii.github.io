// ============================================================
//  GAME  —  пульсацией, без багов
// ============================================================

const MAX_CHARGES = 20;           // максимальное количество спавнов
const COOLDOWN_MS = 120000;       // 2 минуты перезарядки

const Game = {
    rows: 7,
    cols: 9,
    mobileRows: 7,
    mobileCols: 9,
    isMobile: false,
processingClick: false,
_clickLock: false,
    board: [],
    itemAnimations: [],
    stars: [],   
    score: 0,
    level: 1,
      isPaused: false,
    isRunning: false,
    selectedItem: null,
    dragStart: null,         // { row, col, item } – исходный предмет
    dragTarget: null,
    isDragging: false,
       dragOffsetX: 0,
    dragOffsetY: 0,
    scaleX: 1,
    scaleY: 1,
    cellWidth: 0,
    cellHeight: 0,
    boardSize: 0,
    canvas: null,
    ctx: null,
    _fpsLimit: 30,          // для мобильных
_lastFrameTime: 0,
_backgroundCanvas: null,
_backgroundCtx: null,

    _lastGiftTime: 0,
    _giftCooldown: 120000, // 2 минуты
    giftPending: false,          // флаг, что подарок ожидает получения
    inventoryBtn: null,
       
       // --- АНИМАЦИОННЫЕ ДАННЫЕ ---
    pulseItems: [],         // [{ row, col, progress, speed }] – для пульсации
    selectedCell: null,   // { row, col } или null
frameImage: null,
hintAnimations: [],   // для подсказки – два предмета, которые можно объединить
_animationFrameId: null,
_loopActive: false,
  allSpecialCombinations: [],
spawnLevels: window.spawnLevels || [],
   itemData: window.ITEM_DATA || [],
    // imageNames, spawnableFlags, spawnLevels теперь вычисляются из itemData (для совместимости)
    get imageNames() { return this.itemData.map(item => item.name); },
    get spawnableFlags() { return this.itemData.map(item => item.spawnable); },
    get spawnLevels() { return this.itemData.map(item => item.spawnLevels); },
inactivityTimer: null,
inactivityTimeout: 10000, // 10 секунд
hintPhase: 0,
    // --- hover (без зажатия) ---
    hoverCell: null,         // { row, col }
    webImage: null,
    itemTypes: [         '🥔', '🌶️', '🌿', '🧹',     ],
    maxLevels: [],
    spriteMap: {},
    spritesLoaded: false,
      sceneConfig: {        availableTypes: null,        maxSpawnLevel: 1,        maxMergeLevel: 3,        maxMergeLevelPerType: {},    },
    onScoreUpdate: null,
    onLevelUpdate: null,
  
    // ---------- ЗАГРУЗКА СПРАЙТОВ ----------
loadSprites(callback) {
    if (this.spritesLoaded) { callback && callback(); return; }

    // ---- ВЫЧИСЛЯЕМ МАКСИМАЛЬНЫЕ УРОВНИ ИЗ ITEM_DATA ----
    const computedMaxLevels = window.getMaxLevelsForItems ? window.getMaxLevelsForItems() : null;
    if (!computedMaxLevels || computedMaxLevels.length === 0) {
        console.warn('[Game] getMaxLevelsForItems не дала результата, используем fallback 5');
        // fallback на случай, если функция недоступна
        for (let i = 0; i < this.imageNames.length; i++) {
            this.maxLevels[i] = 5;
        }
    } else {
        this.maxLevels = computedMaxLevels;
    }

    const types = this.imageNames; // <-- ЕДИНСТВЕННОЕ ОБЪЯВЛЕНИЕ
    let totalChecks = 0;
    let loadedCount = 0;
    let anyLoaded = false;

    // ---- ПОДСЧИТЫВАЕМ ОБЩЕЕ КОЛИЧЕСТВО ПРОВЕРОК ----
    for (let typeIndex = 0; typeIndex < types.length; typeIndex++) {
        const maxLv = this.maxLevels[typeIndex] || 1;
        totalChecks += maxLv;
    }

    this.spriteMap = {};

    types.forEach((name, typeIndex) => {
        const maxLv = this.maxLevels[typeIndex] || 1;
        for (let level = 1; level <= maxLv; level++) {
            const path = `images/level${level}/${name}.png`;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const key = level + '_' + typeIndex;
                this.spriteMap[key] = img;
                anyLoaded = true;
                loadedCount++;
                checkCompletion();
            };
            img.onerror = () => {
                loadedCount++;
                checkCompletion();
            };
            img.src = path;
        }
    });

    const checkCompletion = () => {
        if (loadedCount === totalChecks) {
            this.loadWebImage(() => {
                this.loadFrameImage(() => {
                    this.loadBoxImage(() => {
                        this.spritesLoaded = true;
                        if (!anyLoaded) {
                            console.warn('[Game] Ни одно изображение не загрузилось. Проверьте пути и CORS.');
                        }
                        callback && callback();
                    });
                });
            });
        }
    };

    // Таймаут для страховки
    setTimeout(() => {
        if (!this.spritesLoaded) {
            console.warn('[Game] Таймаут загрузки спрайтов, используем эмодзи');
            this.loadWebImage(() => {
                this.loadFrameImage(() => {
                    this.spritesLoaded = true;
                    callback && callback();
                });
            });
        }
    }, 5000);
},


loadFrameImage(callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        this.frameImage = img;
        callback && callback();
    };
    img.onerror = () => {
        console.warn('[Game] Не удалось загрузить kletkaramka.png');
        callback && callback();
    };
    img.src = 'images/kletkaramka.png';
},

loadBoxImage(callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        this.boxImage = img;
        callback && callback();
    };
    img.onerror = () => {
        console.warn('[Game] Не удалось загрузить box.png');
        callback && callback();
    };
    img.src = 'images/ui/box.png';
},

loadWebImage(callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        this.webImage = img;
        callback && callback();
    };
    img.onerror = () => {
        console.warn('[Game] Не удалось загрузить web.png, паутинка не будет отображаться');
        callback && callback();
    };
    img.src = 'images/web.png';
},

getSpriteData(item) {
    const level = item.level || 1;
    const typeIndex = item.typeIndex || 0;
    const name = this.imageNames[typeIndex];
    if (!name) return null;
    // Имя спрайта в атласе (с учётом префикса уровня)
    // При "Append folder name" имя будет "levelX_name", где X – уровень
    const spriteName = `level${level}_${name}`;
    const sprite = SpriteAtlas.getSprite('items', spriteName);
    if (sprite) return sprite;
    // fallback на случай, если атлас не загружен – используем старую картинку
    const img = this.spriteMap[`${level}_${typeIndex}`];
    if (img) {
        return { image: img, sx: 0, sy: 0, sw: img.width, sh: img.height };
    }
    return null;
}, 

    getSpriteImage(item) {
        const key = (item.level || 1) + '_' + (item.typeIndex || 0);
        return this.spriteMap[key] || null;
    },

    updateSceneConfig(newConfig) {
        Object.assign(this.sceneConfig, newConfig);
        this.init(this.rows, this.cols);
    },

    // ---------- ИНИЦИАЛИЗАЦИЯ ----------
init(rows, cols, loadFromSave = false) {
    this.rows = rows || (this.isMobile ? this.mobileRows : 9);
    this.cols = cols || (this.isMobile ? this.mobileCols : 9);
    this.isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
this._fpsLimit = this.isMobile ? 30 : 120;

    let sceneCfg = getCurrentSceneConfig();
    const playerLevel = this.level || 1;
    sceneCfg = adjustConfigByPlayerLevel(sceneCfg, playerLevel);

    this.allSpecialCombinations = [];
    for (const item of this.itemData) {
        if (item.specialCombinations && Array.isArray(item.specialCombinations)) {
            this.allSpecialCombinations.push(...item.specialCombinations);
        }
    }

    this.sceneConfig.availableTypes = sceneCfg.availableTypes || null;
    this.sceneConfig.maxSpawnLevel = sceneCfg.maxSpawnLevel || 1;
   this.sceneConfig.maxMergeLevel = sceneCfg.maxMergeLevel || 3;
    this.sceneConfig.maxMergeLevelPerType = {};

    // --- Загрузка прогресса и опыта ---
    const prog = Storage.getProgress();
    this.score = prog.score || 0;
    this._lastGiftTime = prog.lastGiftTime || 0;  
    Experience.init(this);
    this.level = Experience.getLevel();

    // --- Подписка на повышение уровня (очищаем старые подписки) ---
                Experience.clearCallbacks();
                Experience.onLevelUp((newLevel, oldLevel) => {
                    console.log(`🎉 Уровень повышен: ${oldLevel} → ${newLevel}`);
                    this.spawnConfetti(0, 0);
                    Experience.giveLevelReward(newLevel);
                    this.updateUI();
                });

 
    // --- Сброс состояний ---
    this.isRunning = false;
    this.isPaused = false;
       this.selectedItem = null;
    this.dragStart = null;
    this.dragTarget = null;
    this.isDragging = false;
    this.hoverCell = null;
    this.pulseItems = [];
    this.stars = [];
    this.particlesRunning = false;
    this.itemAnimations = [];
    this.selectedCell = null;
    this.hintAnimations = [];
    this.processingClick = false;
  //  this._lastGiftTime = 0; //кулдаун подарка 2 мин
    this._giftCooldown = 120000;      
    
      // Создаём или загружаем доску
if (loadFromSave) {
    const savedBoard = Storage.loadBoard();
    if (savedBoard && savedBoard.board && savedBoard.rows === this.rows && savedBoard.cols === this.cols) {
        this.board = savedBoard.board;
      //  console.log('[Game] Доска загружена из сохранения');
            // ★ Инициализация полей генераторов для загруженной доски (если отсутствуют)
                    for (let r = 0; r < this.rows; r++) {
                        for (let c = 0; c < this.cols; c++) {
                            const cell = this.board[r]?.[c];
                            if (cell && cell.typeIndex !== undefined && cell.level !== undefined) {
                                // Если поле charges отсутствует – инициализируем заново
                                if (cell.charges === undefined) {
                                    this.initGeneratorFields(cell, cell.typeIndex, cell.level);
                                }
                            }
                        }
                    }

        // ★ Восстановление поля covered и пересчёт соседей (для старых сохранений) ★        
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const cell = this.board[r][c];
                        if (cell.locked) {
                            if (cell.covered === undefined) {
                               cell.covered = (r < 2 || r >= this.rows - 2 || c < 2 || c >= this.cols - 2);
                            }
                        } else {
                            cell.covered = false;
                        }
                    }
                }
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        if (!this.board[r][c].locked) {
                            this.uncoverNeighbors(r, c);
                        }
                    }
                }

 // ★ Для всех существующих предметов вызываем onItemCreated ★
for (let r = 0; r < this.rows; r++) {
    for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r]?.[c];
        if (cell && cell.type && !cell.locked) {
            if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(cell.typeIndex, cell.level);
            }
        }
    }
}
    } else {
            // Если сохранение невалидно – создаём новую доску
            this._initBoard();
            Storage.saveBoard({ board: this.board, rows: this.rows, cols: this.cols });
        }
    } else {
        this._initBoard();
        // Сохраняем начальную доску
        Storage.saveBoard({ board: this.board, rows: this.rows, cols: this.cols });
    }

    if (this.particlesContainer) {
        this.particlesContainer.destroy();
        this.particlesContainer = null;
    }

    // --- Создание доски ---
   // this._initBoard();

 // --- Загрузка спрайтов и запуск ---
this.loadSprites(() => {
    this.initCanvas();
    this._drawBackground();
        this.inventoryBtn = document.getElementById('inventory-btn');
    this.updateUI();
    this.updateInventoryButton();
    this.updateInfoPanel();
    this.findHintPair();
    this.startInactivityTimer();
    this.checkGiftButton();
    this.isRunning = true;
    this.animateLoop();

    const playBtn = document.getElementById('menu-play-btn');
    if (playBtn) {
        playBtn.textContent = getText('loading', 'Загрузка...');
        playBtn.disabled = true;
    }
                    if (typeof CollectionManager !== 'undefined') {
                            CollectionManager.init(this);
                            CollectionManager.updateButtonVisibility(); // ★ collections
                        }
    const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;

    const showDialogue = () => {
        if (typeof App !== 'undefined') {
            App.currentSubscene = 'dialogue';
            App.updateSubsceneButton();
        }

        // Показываем сцену
        SceneManager.show('dialogue');

        // Сразу синхронно обновляем фон – интерьеры добавятся в том же кадре
        if (typeof BackgroundManager !== 'undefined') {
            BackgroundManager.update(sceneId);
        } else if (typeof InteriorManager !== 'undefined') {
            InteriorManager.onSceneChange(sceneId);
        }

        // Запуск диалогов
        if (typeof DialogueController !== 'undefined' && DialogueController.checkTrigger) {
            DialogueController.checkTrigger('scene_start', this, () => {});
        }
        const pending = DialogueController.getPendingDialog();
        if (pending) {
            DialogueController.startDialog(pending, () => {});
        }
        if (typeof DialogueController.showToggleButton === 'function') {
            DialogueController.showToggleButton();
        }

        // Возвращаем кнопку
        if (playBtn) {
            playBtn.textContent = getText('menu_play', 'Играть');
            playBtn.disabled = false;
        }
    };
    // ★ Предзагружаем интерьеры и фон, затем показываем сцену ★
    if (typeof InteriorManager !== 'undefined' && typeof BackgroundManager !== 'undefined') {
        InteriorManager.preloadInteriorImagesForScene(sceneId)
            .then(() => BackgroundManager.preloadBackgroundImage(sceneId))
            .then(showDialogue)
            .catch(() => showDialogue());
    } else if (typeof InteriorManager !== 'undefined') {
        InteriorManager.preloadInteriorImagesForScene(sceneId)
            .then(showDialogue)
            .catch(() => showDialogue());
    } else {
        showDialogue();
    }
}); 
},

_initBoard() {
    // 9 открытых клеток – центральные 3 строки, 3 столбца
    const centerRowStart = Math.floor((this.rows - 3) / 2);
    const centerColStart = Math.floor((this.cols - 3) / 2);

    const available = this.sceneConfig.availableTypes;
    const typeIndices = available || this.imageNames.map((_, i) => i);

    // ---- 1. Определяем РЕДКИЕ типы из заказов ----
    const sceneCfg = getCurrentSceneConfig();
    const ordersCfg = sceneCfg.orders || {};
    let allOrderTypes = [];
    if (Array.isArray(ordersCfg.allowedTypes)) {
        if (typeof ordersCfg.allowedTypes[0] === 'number') {
            allOrderTypes = ordersCfg.allowedTypes.slice();
        } else if (typeof ordersCfg.allowedTypes[0] === 'object' && ordersCfg.allowedTypes[0].type !== undefined) {
            allOrderTypes = ordersCfg.allowedTypes.map(entry => entry.type);
        }
    }
    const rareTypes = allOrderTypes.filter(t => !typeIndices.includes(t));

    // ---- 2. Заполняем пул типов (как было) ----
    const totalCells = this.rows * this.cols;
    let pool = [];
    while (pool.length < totalCells) {
        for (let idx of typeIndices) {
            if (pool.length < totalCells) {
                pool.push(idx);
                pool.push(idx);
            }
        }
    }
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // ---- 3. Создаём доску ----
    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
        this.board[r] = [];
        for (let c = 0; c < this.cols; c++) {
            const typeIndex = pool[idx++];
            const type = this.imageNames[typeIndex] || '🍀';
            const isUnlocked = (r >= centerRowStart && r < centerRowStart + 3 &&
                               c >= centerColStart && c < centerColStart + 3);
            this.board[r][c] = {
                type: type,
                typeIndex: typeIndex,
                level: 1,
                merged: false,
                row: r,
                col: c,
                locked: !isUnlocked,
            };
        }
    }

    // ---- 4. Настройка крайних клеток (только самая внешняя граница) и проставление covered ----
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell.locked) {
                // Проверяем, находится ли клетка на самой внешней границе
                const isOuterEdge = (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1);
                if (isOuterEdge) {
                    // Редкие предметы
                    let newTypeIndex;
                    let newLevel;
                    if (rareTypes.length > 0) {
                        newTypeIndex = rareTypes[Math.floor(Math.random() * rareTypes.length)];
                        newLevel = 2 + Math.floor(Math.random() * 2); // 2 или 3
                    } else {
                        newTypeIndex = cell.typeIndex;
                        newLevel = Math.random() < 0.5 ? 1 : 2;
                    }
                    cell.typeIndex = newTypeIndex;
                    cell.type = this.imageNames[newTypeIndex] || '🍀';
                    cell.level = newLevel;
                } else {
                    // Внутренние закрытые клетки – оставляем тип из пула, уровень 1 (уже установлен)
                }
                // Все locked клетки получают коробку (покрытие)
                cell.covered = true;
            } else {
                cell.covered = false;
            }
        }
    }

    // ---- 5. Снимаем коробки с соседей открытых клеток ----
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            if (!this.board[r][c].locked) {
                this.uncoverNeighbors(r, c);
            }
        }
    }

    // ---- 6. Инициализация генераторов и коллекций для открытых клеток ----
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell && !cell.locked && cell.type) {
                if (typeof CollectionManager !== 'undefined') {
                    CollectionManager.onItemCreated(cell.typeIndex, cell.level);
                }
                this.initGeneratorFields(cell, cell.typeIndex, cell.level);
            }
        }
    }
},

uncoverNeighbors(row, col, animate = false) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (let d of dirs) {
        const nr = row + d[0];
        const nc = col + d[1];
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
        const cell = this.board[nr][nc];
        if (cell && cell.locked && cell.covered === true) {
            if (animate) {
                this.showBoxDisappear(nr, nc);
                // covered не меняем здесь – будет изменён в showBoxDisappear
            } else {
                cell.covered = false;
            }
        }
    }
},

    // ---------- КАНВАС И СОБЫТИЯ ----------
initCanvas() {
    const container = document.getElementById('game-board');
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const rect = container.getBoundingClientRect();
    const availWidth = rect.width;
    const availHeight = rect.height;

    const cellSizeByWidth = availWidth / this.cols;
    const cellSizeByHeight = availHeight / this.rows;
    let cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
    if (cellSize < 10) cellSize = 10;

    const canvasWidth = cellSize * this.cols;
    const canvasHeight = cellSize * this.rows;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    this.cellWidth = cellSize;
    this.cellHeight = cellSize;
    this.boardSize = Math.max(canvasWidth, canvasHeight);

    // Масштабируем контекст для работы в логических координатах
    this.ctx.scale(dpr, dpr);

    // Пересчитываем scaleX и scaleY для координат мыши
    const canvasRect = canvas.getBoundingClientRect();
    this.scaleX = canvas.width / (canvasRect.width * dpr); // или canvasRect.width уже с dpr?
    // Проще: scaleX = canvasWidth / canvasRect.width; (так как canvasRect.width в CSS пикселях)
    // но лучше так:
    this.scaleX = canvasWidth / canvasRect.width;
    this.scaleY = canvasHeight / canvasRect.height;

    this.bindEvents();
},

bindEvents() {
    const canvas = this.canvas;
    if (!canvas) return;

    // --- Вспомогательные функции ---
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: (clientX - rect.left) * this.scaleX,
            y: (clientY - rect.top) * this.scaleY,
            clientX: clientX,
            clientY: clientY
        };
    };

    const getCell = (x, y) => {
        const col = Math.floor(x / this.cellWidth);
        const row = Math.floor(y / this.cellHeight);
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        return null;
    };

    // --- Переменные для отслеживания состояния ---
    let startX = 0, startY = 0;
    let startRow = -1, startCol = -1;
    let startItem = null;
    let isDragging = false;
    const DRAG_THRESHOLD = 8;

    // --- Глобальные обработчики (добавляются динамически) ---
    const onGlobalMouseMove = (e) => {
        const pos = getPos(e);
        // Сохраняем координаты для призрака и для проверки заказов
        this._dragCanvasX = pos.x;
        this._dragCanvasY = pos.y;
        this._dragClientX = pos.clientX;
        this._dragClientY = pos.clientY;
        onMove(e);
    };

    const onGlobalMouseUp = (e) => {
        // Сохраняем координаты на случай, если в onEnd потребуются
        // (хотя onEnd получит e с координатами)
        onEnd(e);
        document.removeEventListener('mousemove', onGlobalMouseMove);
        document.removeEventListener('mouseup', onGlobalMouseUp);
    };

    const onGlobalTouchMove = (e) => {
        const touch = e.touches[0];
        if (touch) {
            const pos = getPos(e);
            this._dragCanvasX = pos.x;
            this._dragCanvasY = pos.y;
            this._dragClientX = pos.clientX;
            this._dragClientY = pos.clientY;
        }
        onMove(e);
    };

    const onGlobalTouchEnd = (e) => {
        const touch = e.changedTouches[0];
        if (touch) {
            // Получаем координаты из touch
            const rect = canvas.getBoundingClientRect();
            this._dragClientX = touch.clientX;
            this._dragClientY = touch.clientY;
            // Пересчитываем canvas-координаты для призрака (если нужно)
            this._dragCanvasX = (touch.clientX - rect.left) * this.scaleX;
            this._dragCanvasY = (touch.clientY - rect.top) * this.scaleY;
        }
        onEnd(e);
        document.removeEventListener('touchmove', onGlobalTouchMove);
        document.removeEventListener('touchend', onGlobalTouchEnd);
    };
            // Сохраняем ссылки на обработчики, чтобы можно было удалить их позже
            this._onGlobalMouseMove = onGlobalMouseMove;
            this._onGlobalMouseUp = onGlobalMouseUp;
            this._onGlobalTouchMove = onGlobalTouchMove;
            this._onGlobalTouchEnd = onGlobalTouchEnd;

    // --- Обработчик начала нажатия (только на canvas) ---
    const onStart = (e) => {
        if (this.hintAnimations.length > 0) {
            this.hintAnimations = [];
            this.resetInactivityTimer();
        }
        e.preventDefault();
        if (this.isPaused || !this.isRunning) return;

        const pos = getPos(e);
        const cell = getCell(pos.x, pos.y);
        if (!cell) return;
        const { row, col } = cell;
        const item = this.board[row]?.[col];
       if (!item || !item.type) return; 

        startX = pos.x;
        startY = pos.y;
        startRow = row;
        startCol = col;
        startItem = item.locked ? null : item;
        isDragging = false;
        canvas.style.cursor = 'grabbing';

        // Сохраняем начальные координаты (на случай, если движение не начнётся)
        this._dragCanvasX = pos.x;
        this._dragCanvasY = pos.y;
        this._dragClientX = pos.clientX;
        this._dragClientY = pos.clientY;

        document.addEventListener('mousemove', onGlobalMouseMove);
        document.addEventListener('mouseup', onGlobalMouseUp);
        document.addEventListener('touchmove', onGlobalTouchMove);
        document.addEventListener('touchend', onGlobalTouchEnd);
    };

    // --- Обработчик движения (глобальный) ---
            const onMove = (e) => {
                e.preventDefault();
                if (this.isPaused) return;

                const pos = getPos(e);
                this._dragCanvasX = pos.x;
                this._dragCanvasY = pos.y;
                this._dragClientX = pos.clientX;
                this._dragClientY = pos.clientY;

                // ★ Обновляем hoverCell для пульсации при наведении ★
                const cell = getCell(pos.x, pos.y);
                if (cell) {
                    const { row, col } = cell;
                    const target = this.board[row]?.[col];
                    if (target && target.type && !target.locked) {
                        this.hoverCell = { row, col };
                    } else {
                        this.hoverCell = null;
                    }
                } else {
                    this.hoverCell = null;
                }

                if (startItem && !isDragging) {
                    const dx = pos.x - startX;
                    const dy = pos.y - startY;
                    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                        this.selectedCell = null;
                        isDragging = true;
                        this.isDragging = true;
                        this.dragStart = { row: startRow, col: startCol, item: startItem };
                        this.board[startRow][startCol] = { locked: false, row: startRow, col: startCol };
                        this.dragOffsetX = startX - (startCol * this.cellWidth + this.cellWidth / 2);
                        this.dragOffsetY = startY - (startRow * this.cellHeight + this.cellHeight / 2);
                        this.selectedItem = { row: startRow, col: startCol, item: startItem };
                        this.hoverCell = null;
                    }
                }

                if (this.isDragging) {
                    this.updateDragGhost(this._dragClientX, this._dragClientY, this.dragStart.item);

                    if (cell) {
                        const { row, col } = cell;
                        const target = this.board[row]?.[col];
                        let canMerge = false;
                        if (this.dragStart && this.dragStart.item) {
                            canMerge = true;
                        }
                       this.dragTarget = canMerge ? { row, col, item: target } : null;  
                    } else {
                        this.dragTarget = null;
                    }
                }
            };;

    // --- Обработчик окончания (глобальный) ---
   const onEnd = (e) => {
    this.resetInactivityTimer();
    e.preventDefault();

    try {
        // Если игра на паузе или завершена – просто выходим
        if (this.isPaused) {
            // Обработчики всё равно будут удалены в finally
            return;
        }

        // ---- Случай: клик без перетаскивания ----
        if (!isDragging && startRow !== -1 && startCol !== -1) {
            if (!this._clickLock) {
                this._clickLock = true;
                this.handleClick(startRow, startCol);
                this.drawAll();
                setTimeout(() => { this._clickLock = false; }, 50);
            }
            // Сброс всех состояний
            this.dragStart = null;
            this.dragTarget = null;
            this.selectedItem = null;
            this.isDragging = false;
            canvas.style.cursor = 'grab';

            
            startItem = null;
            startRow = -1;
            startCol = -1;
            isDragging = false;
            this.hoverCell = null;
            return;
        }

        // ---- Случай: перетаскивание ----
        if (isDragging) {
            // Проверка дропа на заказы
            if (this.dragStart && this.dragStart.item) {
                const clientX = this._dragClientX || 0;
                const clientY = this._dragClientY || 0;
                const droppedOnOrder = OrderManager.checkDrop(
                    this.dragStart.item,
                    clientX,
                    clientY
                );
               if (droppedOnOrder) {
                        // Сброс и выход
                        this.dragStart = null;
                        this.dragTarget = null;
                        this.selectedItem = null;
                        this.isDragging = false;
                        canvas.style.cursor = 'grab';
                        startItem = null;
                        startRow = -1;
                        startCol = -1;
                        isDragging = false;
                        this.hoverCell = null;
                        this.updateDragGhost(0, 0, null);   // ← скрыть призрак
                        return;
                    }
            }

            // Логика перетаскивания на доске
            if (this.dragTarget && this.dragStart) {
                const { row: r1, col: c1 } = this.dragStart;
                const { row: r2, col: c2 } = this.dragTarget;
                if (r1 !== r2 || c1 !== c2) {
                    const targetCell = this.board[r2]?.[c2];
                    const sourceItem = this.dragStart.item;
                    if (targetCell !== undefined) {
                        if (!targetCell.type) {
                            // Перемещение в пустую клетку
                            this.board[r2][c2] = sourceItem;
                            this.board[r1][c1] = { locked: false, row: r1, col: c1 };
                            this.selectedCell = { row: r2, col: c2 };
                            this.showItemInfo(r2, c2);
                            // Сброс и выход
                            this.dragStart = null;
                            this.dragTarget = null;
                            this.isDragging = false;
                            canvas.style.cursor = 'grab';
                            startItem = null;
                            startRow = -1;
                            startCol = -1;
                            isDragging = false;
                            this.hoverCell = null;                             
                              this.updateDragGhost(0, 0, null);   // ← скрыть призрак
                              this.saveBoardState(); 
                            return;
                        } else {
                            // Попытка объединения
                            this.combineItems(r1, c1, r2, c2);
                        }
                    } else {
                        this.board[r1][c1] = sourceItem;
                    }
                } else {
                    this.board[r1][c1] = this.dragStart.item;
                }
            } else {
                if (this.dragStart) {
                    this.board[this.dragStart.row][this.dragStart.col] = this.dragStart.item;
                }
            }

            // Общий сброс после перетаскивания
            this.dragStart = null;
            this.dragTarget = null;
            this.selectedItem = null;
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        }

        // Финальная очистка (для всех случаев)
        startItem = null;
        startRow = -1;
        startCol = -1;
        isDragging = false;
        this.hoverCell = null;
        this.updateDragGhost(0, 0, null);

    } finally {
        // Удаляем глобальные обработчики в любом случае (даже если было исключение)
        if (this._onGlobalMouseMove) {
            document.removeEventListener('mousemove', this._onGlobalMouseMove);
        }
        if (this._onGlobalMouseUp) {
            document.removeEventListener('mouseup', this._onGlobalMouseUp);
        }
        if (this._onGlobalTouchMove) {
            document.removeEventListener('touchmove', this._onGlobalTouchMove);
        }
        if (this._onGlobalTouchEnd) {
            document.removeEventListener('touchend', this._onGlobalTouchEnd);
        }
    }
};

    // --- Привязка событий ---
    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const me = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        canvas.dispatchEvent(me);
    }, { passive: false });

    canvas.style.cursor = 'grab';
},

handleClick(row, col) {
    // Сброс подсказки
    if (this.hintAnimations.length > 0) {
        this.hintAnimations = [];
        this.resetInactivityTimer();
    }

    if (this.isPaused || this.processingClick) return;

    const cell = this.board[row]?.[col];
    if (!cell || cell.locked || !cell.type) {
        this.selectedCell = null;
        this.updateInfoPanel();
        return;
    }

    if (this.selectedCell) {
        const { row: selRow, col: selCol } = this.selectedCell;
        if (selRow === row && selCol === col) {
            // Клик на уже выделенную клетку – проверяем возможность спавна
            const itemData = this.itemData[cell.typeIndex];
            if (itemData && itemData.spawnable === true && itemData.spawnLevels && itemData.spawnLevels.includes(cell.level)) {
                this.performSpawn(row, col); // здесь нет установки processingClick
            } else {
                this.selectedCell = null;
                this.updateInfoPanel();
            }
            return;
        } else {
            // Выделение другой клетки
            if (!cell.locked) {
                this.selectedCell = { row, col };
                AudioManager.play('select');
                this.showItemInfo(row, col);
            } else {
                this.selectedCell = null;
                this.updateInfoPanel();
            }
            return;
        }
    } else {
        // Нет выделения – устанавливаем
        if (!cell.locked) {
            this.selectedCell = { row, col };
            AudioManager.play('select');
            this.showItemInfo(row, col);
        }
    }
},

// Вспомогательный метод – получить путь к картинке предмета
getImageSrc(typeIndex, level) {
    const name = this.imageNames[typeIndex];
    if (!name) return null;
    return `images/level${level}/${name}.png`;
},

// Обновить панель информации в зависимости от выделения
updateInfoPanel() {
    if (typeof ModalManager === 'undefined') return;
    if (this.selectedCell) {
        const { row, col } = this.selectedCell;
        this.showItemInfo(row, col);  // покажет инфо о предмете
    } else {
        // Подсказка: нет выделения
        const hintTitle = getText('hint_title', 'Подсказка');
        const hintText = getText('hint_press_item', 'НАЖМИТЕ на предмет');

        const questionHtml = `<div class="info-question-mark">?</div>`;

        const bodyHtml = `
            <div style="
                display: flex;
                align-items: center;
                gap: clamp(0.5rem, 1vw, 1.5rem);
                height: 100%;
                padding: 0.2rem;
                justify-content: center;
                width: 100%;
            ">
                ${questionHtml}
                <div style="
                    flex: 1;
                    text-align: center;
                    font-size: inherit;
                    line-height: 1.3;
                ">
                    ${hintText}
                </div>
            </div>
        `;

        ModalManager.showInfoModal({
            title: hintTitle,
            description: bodyHtml,
            showHelp: false,
            showTrash: false,
        });
    }
},

// Показать инфо-модалку для выделенной клетки
showItemInfo(row, col) {
    if (typeof ModalManager === 'undefined') return;
    const cell = this.board[row]?.[col];
    if (!cell || cell.locked || !cell.type) {
          this.selectedCell = null;   // ← сбрасываем выделение
        this.updateInfoPanel(); 
        return;
    }

    const typeIdx = cell.typeIndex;
    const item = this.itemData[typeIdx];
    if (!item) return;
    const name = getItemName(typeIdx, cell.level);
    const canSpawn = item.spawnable === true && item.spawnLevels && item.spawnLevels.includes(cell.level);
    const shortText = canSpawn
        ? getText('press_to_spawn', 'НАЖМИТЕ, чтобы получить предмет')
        : getText('combine_to_upgrade', 'ОБЪЕДИНИТЕ для улучшения');

    const imgSrc = this.getImageSrc(typeIdx, cell.level);
    const cellHtml = `
        <div class="info-item-preview" style="
            width: clamp(2rem, 8vh, 8rem);
            height: clamp(2rem, 8vh, 8rem);
            background: #99c9ff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <img src="${imgSrc}" style="width: 80%; height: 80%; object-fit: contain;" alt="">
        </div>
    `;

    const bodyHtml = `
        <div style="
            display: flex;
            align-items: center;
            gap: clamp(0.5rem, 1vw, 1.5rem);
            height: 100%;
            padding: 0.2rem;
            justify-content: center;
            width: 100%;
        ">
            ${cellHtml}
            <div style="
                flex: 1;
                text-align: center;
                font-size: inherit;
                line-height: 1.3;
            ">
                ${shortText}
            </div>
        </div>
    `;

    ModalManager.showInfoModal({
        title: name,
        description: bodyHtml,
        showHelp: true,
        helpAction: () => {
            const fullHtml = this.buildItemInfoHTML(row, col);
            ModalManager.showCenterModal({
                title: name,
                body: fullHtml,
                buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }]
            });
        },
        showTrash: true,
        trashAction: () => {
            ModalManager.confirmDelete(
                { name: name },
                () => {
                    this.deleteItem(row, col);
                }
            );
        },
    });
},

buildItemInfoHTML(row, col) {
    const cell = this.board[row]?.[col];
     if (!cell || !cell.type) return ''; 
    return this.buildItemInfoHTMLFromCell(cell);
},

buildItemInfoHTMLFromCell(cell) {
    const typeIdx = cell.typeIndex;
    const level = cell.level;
    const item = this.itemData[typeIdx];
    if (!item) return '';

    // ---- ЦЕПОЧКА УРОВНЕЙ (вместо "Уровень" и списка предметов на доске) ----
    const maxLevel = this.maxLevels[typeIdx] || 1;
    let chainHtml = '<div class="item-info-grid" style="justify-content:center; gap:0.3rem;">';
    for (let lv = 1; lv <= maxLevel; lv++) {
        const isDiscovered = typeof CollectionManager !== 'undefined' && CollectionManager.isDiscovered(typeIdx, lv);
        const isCurrent = (lv === level);

        let innerContent;
        if (isDiscovered) {
            const src = this.getImageSrc(typeIdx, lv);
            innerContent = `<img src="${src}" class="item-info-img" alt="">`;
        } else {
            innerContent = `<span style="font-size:clamp(1rem, 2vw, 1.5rem); color:#aaa;">?</span>`;
        }

        // Инлайн-стиль для выделения текущего уровня
        let style = 'width:clamp(2.5rem, 5vmin, 4rem); height:clamp(2.5rem, 5vmin, 4rem); flex-shrink:0;';
        if (isCurrent) {
            style += ' border: 3px solid #ac7d4f; box-shadow: 0 0 0 2px #d4a373;';
        }
        chainHtml += `<div class="item-info-cell" style="${style}">${innerContent}</div>`;

        if (lv < maxLevel) {
            chainHtml += `<span style="font-size:clamp(0.8rem, 1.5vw, 1.2rem); color:#2a1f14;">→</span>`;
        }
    }
    chainHtml += '</div>';

    // ---- БЛОК: Можно получить из ----
    const sources = this._getItemSources(typeIdx, level);
    let sourcesHtml = '';
    if (sources.length > 0) {
        sourcesHtml += `<div class="item-info-spawn-title">~ ${getText('can_get_from', 'Можно получить из')} ~</div>`;
        sourcesHtml += `<div class="item-info-combos">`;
        sources.forEach(source => {
            const src = source[0];
            sourcesHtml += this._renderSourceCell(src.typeIndex, src.level);
        });
        sourcesHtml += `</div>`;
    }

    // ---- БЛОК: Выдаёт (для спавнящихся предметов) ----
    let spawnHtml = '';
    const canSpawn = item.spawnable === true && item.spawnLevels && item.spawnLevels.includes(level);
    if (canSpawn) {
        const results = this._getSpawnResults(typeIdx, level);
        if (results.length > 0) {
            spawnHtml += `<div class="item-info-spawn-title">~ ${getText('gives', 'Выдаёт')} ~</div>`;
            spawnHtml += `<div class="item-info-combos">`;
            results.forEach(r => {
                spawnHtml += this._renderSourceCell(r.typeIndex, r.level);
            });
            spawnHtml += `</div>`;
        }

        const nextLevel = level + 1;
        if (item.spawnLevels && item.spawnLevels.includes(nextLevel)) {
            const resultsCurrent = this._getSpawnResults(typeIdx, level);
            const resultsNext = this._getSpawnResults(typeIdx, nextLevel);
            const newItems = resultsNext.filter(rNext => {
                return !resultsCurrent.some(rCur => rCur.typeIndex === rNext.typeIndex && rCur.level === rNext.level);
            });
            if (newItems.length > 0) {
                spawnHtml += `<div class="item-info-spawn-title">~ ${getText('next_level_gives', 'Следующий уровень выдаёт')} ~</div>`;
                spawnHtml += `<div class="item-info-combos">`;
                newItems.forEach(r => {
                    spawnHtml += this._renderSourceCell(r.typeIndex, r.level);
                });
                spawnHtml += `</div>`;
            }
        }
    }

    // Собираем всё вместе (без строки "Уровень")
    return chainHtml + sourcesHtml + spawnHtml;
},

_getItemImageHTML(typeIndex, level, size = '2rem') {
    const name = this.imageNames[typeIndex] || 'unknown';
    const src = `images/level${level}/${name}.png`;
    return `<img src="${src}" style="width:${size}; height:${size}; object-fit:contain; border-radius: 4px;" alt="${name}">`;
},

_getItemSources(typeIdx, level) {
    const sources = [];
    for (const srcItem of this.itemData) {
        if (!srcItem.spawnable) continue;
        const rules = srcItem.spawnRules;
        if (!rules) continue;

        // Перебираем все уровни спауна этого источника
        for (const [spawnLevel, rule] of Object.entries(rules)) {
            // spawnLevel — строка, преобразуем в число
            const srcLevel = parseInt(spawnLevel, 10);
            if (isNaN(srcLevel)) continue;

            const types = rule.types || [];
            // Проверяем, есть ли среди types нужный нам предмет
            const found = types.some(t => t.type === typeIdx && t.level === level);
            if (found) {
                // Добавляем источник, если ещё нет
                const exists = sources.some(s => s[0].typeIndex === srcItem.id && s[0].level === srcLevel);
                if (!exists) {
                    sources.push([{ typeIndex: srcItem.id, level: srcLevel }]);
                }
                break; // выходим из цикла по уровням, так как уже нашли совпадение
            }
        }
    }
    return sources; // дубликатов не будет, так как мы проверяем exists
},

_renderItemCell(typeIndex, level, label) {
    const name = this.imageNames[typeIndex] || 'unknown';
    const src = `images/level${level}/${name}.png`;
    return `
        <div class="item-info-cell">
            <img src="${src}" class="item-info-img" alt="">
            <span class="item-info-badge">${label}</span>
        </div>
    `;
},

_renderSourceCell(typeIndex, level) {
    const name = this.imageNames[typeIndex] || 'unknown';
    const src = `images/level${level}/${name}.png`;
    return `
        <div class="item-info-cell clickable" onclick="Game.openItemInfo(${typeIndex}, ${level})">
            <img src="${src}" class="item-info-img" alt="">
        </div>
    `;
},

// Возвращает массив { typeIndex, level } предметов, которые может выдать данный предмет на указанном уровне
_getSpawnResults(typeIdx, level) {
    const itemData = this.itemData[typeIdx];
    if (!itemData) return [];
    const rule = this._getSpawnRulesForLevel(itemData, level);
    if (!rule) return [];

    const results = [];
    for (const t of (rule.types || [])) {
        const resultLevel = t.level !== undefined ? t.level : 1;  // если level не указан, считаем 1
        if (resultLevel <= (this.maxLevels[t.type] || 0)) {
            results.push({ typeIndex: t.type, level: resultLevel });
        }
    }
    // убираем дубликаты
    const seen = new Set();
    return results.filter(r => {
        const key = `${r.typeIndex}-${r.level}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
},

// Открыть модалку с инфой о предмете по данным (без координат)
openItemInfo(typeIndex, level) {
    this.showItemInfoByData(typeIndex, level);
},

showItemInfoByData(typeIndex, level) {
    if (typeof ModalManager === 'undefined') return;
    const item = this.itemData[typeIndex];
    if (!item) return;
    const name = getItemName(typeIndex, level);
    const cell = {
        typeIndex: typeIndex,
        level: level,
        locked: false,
        type: this.imageNames[typeIndex] || '?',
    };
    const fullHtml = this.buildItemInfoHTMLFromCell(cell);
    ModalManager.showCenterModal({
        title: name,
        body: fullHtml,
        buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }]
    });
},



performSpawn(row, col) {
    if (this.processingClick) {
        console.warn('⚠️ performSpawn: уже выполняется');
        return;
    }
    if (this.isPaused) {
        console.warn('⏸ performSpawn: игра на паузе, спавн невозможен');
        return;
    }

    this.processingClick = true;
    //аварийный сброс, если анимации зависли
    clearTimeout(this._emergencyTimer);
this._emergencyTimer = setTimeout(() => {
    if (this.processingClick) {
        console.warn('⏰ Аварийный сброс processingClick (зависание)');
        this.processingClick = false;
        this._emergencyTimer = null;
    }
}, 10000);
//конец аварийного сброса анимаций, если зависли


    this.updateCooldowns();
    try {
        const cell = this.board[row]?.[col];
        if (!cell || cell.locked || !cell.type) {
            console.log('❌ 1: клетка невалидна');
            this.processingClick = false;
            return;
        }

        const level = cell.level;
        const typeIdx = cell.typeIndex;
        const itemData = this.itemData[typeIdx];
        if (!itemData) {
            console.log('❌ 2: нет itemData');
            this.processingClick = false;
            return;
        }

         // ---- Проверка генератора ----
        if (cell.charges !== undefined) {
            if (cell.charges === 0 && cell.cooldownEnd > Date.now()) {
                // На перезарядке – показываем сообщение
                this.showFloatingMessage(row, col, 'on_cooldown', 1500);
                this.processingClick = false;
                return;
            }
            // Если заряды конечны и > 0, или бесконечны – разрешаем
        }

   // ---- Получение правила спавна ----
        const ruleObj = this._getSpawnRulesForLevel(itemData, level);
        if (!ruleObj) {
            this.processingClick = false;
            return;
        }
        const types = ruleObj.types || [];
        if (types.length === 0) {
            console.log('❌ 4: rule.types пуст');
            this.processingClick = false;
            return;
        }

        // --- Выбор типа с весами ---
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

        // Проверка макс. уровня
        if (newLevel > (this.maxLevels[typeIdxNew] || 0)) {
            console.log('❌ 5: уровень', newLevel, '> max для типа', typeIdxNew);
            this.processingClick = false;
            return;
        }

        // Поиск свободной клетки
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
            console.log('❌ 6: нет свободных клеток');
            this.processingClick = false;
            return;
        }

        freeCells.sort((a, b) => {
            const distA = Math.abs(a.row - row) + Math.abs(a.col - col);
            const distB = Math.abs(b.row - row) + Math.abs(b.col - col);
            return distA - distB;
        });

        const target = freeCells[0];

        // --- Создаём предмет ---
  const newItem = {
            type: this.imageNames[typeIdxNew] || '🍀',
            typeIndex: typeIdxNew,
            level: newLevel,
            merged: false,
            row: target.row,
            col: target.col,
            locked: false,
        };

          // ---- Уменьшение зарядов (если не бесконечный) ----
        if (cell.charges !== undefined && cell.charges !== Infinity) {
            cell.charges -= 1;
            if (cell.charges === 0) {
                // Установить перезарядку
                cell.cooldownEnd = Date.now() + COOLDOWN_MS;
            }
        }

        // --- Анимация ---
        this.addItemAnimation(row, col, target.row, target.col, newItem);
        this.addPulse(row, col, 0.5, 1.12);
        AudioManager.play('spawn');
        this.showItemInfo(row, col);
        this.updateUI();

  /*      // ★ Аварийный сброс (если анимация по какой-то причине не завершится) ★
     setTimeout(() => {
            if (this.processingClick) {
                console.warn('⏰ Аварийный сброс processingClick');
                this.processingClick = false;
            }
        }, 10000);*/

    } catch (err) {
        console.error('❌ Ошибка в performSpawn:', err);
        this.processingClick = false;
    }
},

findHintPair() {
    // Ищем открытую клетку с предметом и заблокированную соседнюю клетку,
    // у которых одинаковый тип и уровень (можно объединить)
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (!cell || cell.locked || !cell.type) continue;  
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                    const neighbor = this.board[nr]?.[nc];
                    if (!neighbor || !neighbor.locked || !neighbor.type) continue;
                    // ★★★ Новая проверка: не подсказывать клетки под коробкой ★★★
                if (neighbor.covered === true) continue;
                                  if (cell.type === neighbor.type && cell.level === neighbor.level) {
                        // ★★★ ПРОВЕРКА: можно ли объединить до следующего уровня? ★★★
                        if (this.canMergeToLevel(cell.typeIndex, cell.level)) {
                            this.hintAnimations = [
                                { row: r, col: c, targetRow: nr, targetCol: nc },
                                { row: nr, col: nc, targetRow: r, targetCol: c }
                            ];
                            this.hintPhase = 0;
                           // console.log('🔍 Подсказка найдена (открытая + заблокированная):', r, c, '->', nr, nc);
                            return;
                        }
                    }
                }
            }
        }
    }
 
    // Если заблокированных нет – ищем два открытых предмета одинакового типа и уровня
    for (let r1 = 0; r1 < this.rows; r1++) {
        for (let c1 = 0; c1 < this.cols; c1++) {
            const cell1 = this.board[r1]?.[c1];
            if (!cell1 || cell1.locked) continue;
            for (let r2 = 0; r2 < this.rows; r2++) {
                for (let c2 = 0; c2 < this.cols; c2++) {
                    if (r1 === r2 && c1 === c2) continue;
                    const cell2 = this.board[r2]?.[c2];
                    if (!cell2 || cell2.locked) continue;
                    if (cell1.type === cell2.type && cell1.level === cell2.level) {
                        // ★★★ ПРОВЕРКА: можно ли объединить до следующего уровня? ★★★
                        if (this.canMergeToLevel(cell1.typeIndex, cell1.level)) {
                            this.hintAnimations = [
                                { row: r1, col: c1, targetRow: r2, targetCol: c2 },
                                { row: r2, col: c2, targetRow: r1, targetCol: c1 }
                            ];
                            this.hintPhase = 0;
                          //  console.log('🔍 Подсказка найдена (открытые):', r1, c1, '->', r2, c2);
                            return;
                        }
                    }
                }
            }
        }
    }
    // Если ничего не нашли – очищаем
    this.hintAnimations = [];
},

spawnStars(row, col) {
    const cx = col * this.cellWidth + this.cellWidth / 2;
    const cy = row * this.cellHeight + this.cellHeight / 2;
   const count = this.isMobile ? 3 : 6;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50; // в 2 раза больше
        const size = 4 + Math.random() * 6;
        this.stars.push({
            x: cx,
            y: cy,
            endX: cx + Math.cos(angle) * distance,
            endY: cy + Math.sin(angle) * distance,
            size: size,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            alpha: 1,
        });
    }
},

// Найти метод startInactivityTimer и заменить его на:
startInactivityTimer() {
    // Не запускаем, если игра не запущена или сцена не игровая
    if (!this.isRunning || SceneManager.current !== 'game') {
        clearTimeout(this.inactivityTimer);
        return;
    }
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
        // Проверяем ещё раз, активна ли игра
        if (this.isRunning && !this.isDragging && !this.processingClick && SceneManager.current === 'game') {
            this.findHintPair();
        }
        // Перезапускаем таймер
        this.startInactivityTimer();
    }, this.inactivityTimeout);
},

resetInactivityTimer() {
    // Сбрасываем таймер при любом действии игрока
    clearTimeout(this.inactivityTimer);
    this.startInactivityTimer();
}, 

deleteItem(row, col) {
    const cell = this.board[row]?.[col];
    if (!cell || !cell.type) return;
    this.spawnStars(row, col);
    this.board[row][col] = { locked: false, row, col };
    this.selectedCell = null;
    this.saveBoardState();
    this.updateUI();
   this.updateInfoPanel(); 
},

/**
 * Показать всплывающее сообщение над клеткой
 * @param {number} row - строка клетки
 * @param {number} col - столбец клетки
 * @param {string} messageKey - ключ локализации
 * @param {number} duration - время отображения (мс)
 */
showFloatingMessage(row, col, messageKey, duration = 3000) {
    const message = getText(messageKey, messageKey);
    if (!message) return;

    // Удаляем предыдущее сообщение, если есть
    const old = document.querySelector('.floating-message');
    if (old) old.remove();

    // Вычисляем экранные координаты центра клетки
    const canvasRect = this.canvas.getBoundingClientRect();
    const cellCenterX = col * this.cellWidth + this.cellWidth / 2;
    const cellCenterY = row * this.cellHeight + this.cellHeight / 2;
    const x = canvasRect.left + cellCenterX / this.scaleX;
    const y = canvasRect.top + cellCenterY / this.scaleY;

    // Создаём элемент
    const el = document.createElement('div');
    el.className = 'floating-message';
    el.textContent = message;
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    document.body.appendChild(el);

    // Запускаем анимацию появления
    requestAnimationFrame(() => {
        el.classList.add('show');
    });

    // Через duration-200 мс запускаем исчезновение
    setTimeout(() => {
        el.classList.remove('show');
        el.classList.add('hide');
    }, duration - 200);

    // Удаляем из DOM после завершения анимации
    setTimeout(() => {
        el.remove();
    }, duration + 300);
},

    // ---------- АНИМАЦИИ кофетти) ----------
spawnConfetti(row, col) {
    if (this.particlesRunning) return;
    this.particlesRunning = true;

    const colors = ['#ffb07c', '#90d1fd', '#4f8d08', '#fa9be2', '#ffaa66', '#ffe066', '#79f87f', '#695ff5'];
    const count = 40;
    const particles = [];

    // Центр клетки (в пикселях canvas)
    const cx = col * this.cellWidth + this.cellWidth / 2;
    const cy = row * this.cellHeight + this.cellHeight / 2;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const size = 3 + Math.random() * 5;
        particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            size: size,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: 0.006 + Math.random() * 0.012,
            gravity: 0.05,
        });
    }

    // Анимация конфетти
    const animateConfetti = () => {
        if (particles.length === 0) {
            this.particlesRunning = false;
            this.pulseItems = this.pulseItems.filter(p => !(p.row === row && p.col === col));
            return;
        }
        // Обновляем частицы
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            p.size *= 0.99;
            if (p.life <= 0 || p.size < 0.2) {
                particles.splice(i, 1);
            }
        }
        // Рисуем частицы поверх всего
        const ctx = this.ctx;
        ctx.save();
        for (const p of particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            if (!this.isMobile) {
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 4;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        // Продолжаем, пока есть частицы
        requestAnimationFrame(animateConfetti);
    };

    animateConfetti();
},

addItemAnimation(fromRow, fromCol, toRow, toCol, item) {
    const level = Number(item.level);
    if (isNaN(level)) {
        console.warn('addItemAnimation: item.level is NaN, устанавливаем 1');
        item.level = 1;
    }

    const startX = fromCol * this.cellWidth + this.cellWidth / 2;
    const startY = fromRow * this.cellHeight + this.cellHeight / 2;
    const endX = toCol * this.cellWidth + this.cellWidth / 2;
    const endY = toRow * this.cellHeight + this.cellHeight / 2;
    this.itemAnimations.push({
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        progress: 0,
        speed: 0.025,
        // Сохраняем поля отдельно, а не ссылку на объект
        itemType: item.type,
        itemTypeIndex: item.typeIndex,
        itemLevel: item.level,
        toRow: toRow,
        toCol: toCol,
        added: false,
        scale: 0.1,
        targetScale: 0.85,
    });
},


    // Добавляем пульсацию для предмета
addPulse(row, col, duration = 0.3, maxScale = 1.2) {
      if (this.pulseItems.length > 5) return; // не больше 5 пульсаций одновременно
    const existing = this.pulseItems.find(p => p.row === row && p.col === col);
    if (existing) return;
    // Скорость зависит от длительности (чем короче, тем быстрее)
    const speed = 1 / (duration * 25); // примерная эмпирика
    this.pulseItems.push({
        row,
        col,
        progress: 0,
        speed: speed,
        direction: 1,
        maxScale: maxScale,
    });
},

 // ---------- ОБМЕН МЕСТАМИ С АНИМАЦИЕЙ ----------
    swapItems(r1, c1, r2, c2) {
        const sourceItem = this.board[r1][c1];
        const targetItem = this.board[r2][c2];
        if (!sourceItem || !targetItem) return;

        // Очищаем клетки
        this.board[r1][c1] = { locked: false, row: r1, col: c1 };
        this.board[r2][c2] = { locked: false, row: r2, col: c2 };

        // Анимация sourceItem → (r2,c2)
        this.itemAnimations.push({
            startX: c1 * this.cellWidth + this.cellWidth / 2,
            startY: r1 * this.cellHeight + this.cellHeight / 2,
            endX: c2 * this.cellWidth + this.cellWidth / 2,
            endY: r2 * this.cellHeight + this.cellHeight / 2,
            progress: 0,
            speed: 0.025,
            itemObject: sourceItem,
            toRow: r2,
            toCol: c2,
            added: false,
            scale: 0.1,
            targetScale: 0.85,
        });

        // Анимация targetItem → (r1,c1)
        this.itemAnimations.push({
            startX: c2 * this.cellWidth + this.cellWidth / 2,
            startY: r2 * this.cellHeight + this.cellHeight / 2,
            endX: c1 * this.cellWidth + this.cellWidth / 2,
            endY: r1 * this.cellHeight + this.cellHeight / 2,
            progress: 0,
            speed: 0.025,
            itemObject: targetItem,
            toRow: r1,
            toCol: c1,
            added: false,
            scale: 0.1,
            targetScale: 0.85,
        });

        AudioManager.play('merge'); // звук объединения (или другой)
        this.saveBoardState();
        this.updateUI();
    },

 updatePulses() {
    for (let i = this.pulseItems.length - 1; i >= 0; i--) {
        const p = this.pulseItems[i];
        p.progress += p.speed * p.direction;
        
        if (p.direction === 1 && p.progress >= 1) {
            p.direction = -1;
            p.progress = 1;
        } else if (p.direction === -1 && p.progress <= 0) {
            // Анимация завершена - удаляем
            this.pulseItems.splice(i, 1);
            continue;
        }
        
        // Проверяем, существует ли ещё предмет
        const item = this.board[p.row]?.[p.col];
        if (!item) {
            this.pulseItems.splice(i, 1);
        }
    }
},

 // ---------- ОБНОВЛЕНИЕ АНИМАЦИЙ (изменённый метод) ----------
    updateItemAnimations() {
        for (let i = this.itemAnimations.length - 1; i >= 0; i--) {
            const anim = this.itemAnimations[i];
            anim.progress += anim.speed;
            if (anim.progress >= 1) {
                anim.progress = 1;
                if (!anim.added) {
                    if (anim.itemObject) {
                        // Используем готовый объект (обмен)
                        const item = anim.itemObject;
                        this.board[anim.toRow][anim.toCol] = item;
                        // Не вызываем initGeneratorFields и CollectionManager,
                        // так как предмет уже существует
                    } else {
                        // Стандартное создание предмета (спавн, перемещение из корзинки)
                        const newItem = {
                            type: anim.itemType,
                            typeIndex: anim.itemTypeIndex,
                            level: anim.itemLevel,
                            merged: false,
                            row: anim.toRow,
                            col: anim.toCol,
                            locked: false,
                        };
                        this.board[anim.toRow][anim.toCol] = newItem;
                        this.initGeneratorFields(newItem, newItem.typeIndex, newItem.level);
                        if (typeof CollectionManager !== 'undefined') {
                            CollectionManager.onItemCreated(newItem.typeIndex, newItem.level);
                        }
                    }
                    anim.added = true;
                    this.addPulse(anim.toRow, anim.toCol, 0.5, 1.1);
                    this.spawnStars(anim.toRow, anim.toCol);
                    this.saveBoardState();
                }
                // Удаляем анимацию
                this.itemAnimations.splice(i, 1);
                if (this.itemAnimations.length === 0) {
                    this.processingClick = false;
                }
            }
        }
    },

    // ---------- ЦИКЛ ОТРИСОВКИ ----------
animateLoop() {
    if (this._loopActive) return;
    this._loopActive = true;

    const loop = (timestamp) => {
        if (!this.isRunning) {
            this._loopActive = false;
            this._animationFrameId = null;
            return;
        }

        // Ограничение FPS
        if (timestamp - this._lastFrameTime < 1000 / this._fpsLimit) {
            this._animationFrameId = requestAnimationFrame(loop);
            return;
        }
        this._lastFrameTime = timestamp;

        if (!this.isPaused) {
            this.updateCooldowns();
            this.updatePulses();
            this.updateItemAnimations();
            if (this.hintAnimations.length > 0) {
                this.hintPhase = (this.hintPhase + 0.006) % 1;
            }
        }

        this.drawAll();

        // Продолжаем цикл
        if (this.isRunning) {
            this._animationFrameId = requestAnimationFrame(loop);
        } else {
            this._loopActive = false;
            this._animationFrameId = null;
        }
    };

    this._animationFrameId = requestAnimationFrame(loop);
},

drawAll() {
    if (!this.ctx) return;
   this.drawBoard();

    // --- Подсказка: два предмета тянутся друг к другу (синхронно и зеркально) ---
if (this.hintAnimations.length === 2) {
    const h1 = this.hintAnimations[0];
    const h2 = this.hintAnimations[1];
    const phase = this.hintPhase;

    const moveDuration = 2;
    const pauseDuration = 1 - moveDuration;

    let effectivePhase = 0;
    let isPaused = false;

    if (phase < moveDuration) {
        const t = phase / moveDuration;
        effectivePhase = t * 2;
    } else {
        isPaused = true;
        effectivePhase = 0;
    }

    const amplitude = Math.min(this.cellWidth, this.cellHeight) * 0.06;
    const scaleAmp = 0.03;
    const offset = isPaused ? 0 : amplitude * Math.sin(effectivePhase * Math.PI * 2);
    const scale = isPaused ? 1 : 1 + scaleAmp * Math.sin(effectivePhase * Math.PI * 2);

    // Первый предмет
    const cell1 = this.board[h1.row]?.[h1.col];
   // ★★★ Не рисуем, если клетка заблокирована и скрыта коробкой ★★★
    if (cell1 && cell1.type && !(cell1.locked && cell1.covered === true)) {
        const x1 = h1.col * this.cellWidth + this.cellWidth / 2;
        const y1 = h1.row * this.cellHeight + this.cellHeight / 2;
        const tx1 = h1.targetCol * this.cellWidth + this.cellWidth / 2;
        const ty1 = h1.targetRow * this.cellHeight + this.cellHeight / 2;
        const dx1 = tx1 - x1, dy1 = ty1 - y1;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        if (len1 > 0) {
            const shiftX1 = (dx1 / len1) * offset;
            const shiftY1 = (dy1 / len1) * offset;
            const size1 = Math.min(this.cellWidth, this.cellHeight) * 0.85 * scale;
            const img1 = this.getSpriteImage(cell1);
            if (img1) {
                this.ctx.save();
                this.ctx.translate(x1 + shiftX1, y1 + shiftY1);
                this.ctx.scale(scale, scale);
                if (!this.isMobile) {
                this.ctx.shadowColor = 'rgba(255, 215, 0, 0.2)';
                this.ctx.shadowBlur = 10;
                }
                this.ctx.drawImage(img1, -size1 / 2, -size1 / 2, size1, size1);
                this.ctx.restore();
            }
        }
    }
    // Второй предмет
    const cell2 = this.board[h2.row]?.[h2.col];
    if (cell2 && cell2.type && !(cell2.locked && cell2.covered === true)) {
        const x2 = h2.col * this.cellWidth + this.cellWidth / 2;
        const y2 = h2.row * this.cellHeight + this.cellHeight / 2;
        const tx2 = h2.targetCol * this.cellWidth + this.cellWidth / 2;
        const ty2 = h2.targetRow * this.cellHeight + this.cellHeight / 2;
        const dx2 = tx2 - x2, dy2 = ty2 - y2;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (len2 > 0) {
            const shiftX2 = (dx2 / len2) * offset;
            const shiftY2 = (dy2 / len2) * offset;
            const size2 = Math.min(this.cellWidth, this.cellHeight) * 0.85 * scale;
            const img2 = this.getSpriteImage(cell2);
            if (img2) {
                this.ctx.save();
                this.ctx.translate(x2 + shiftX2, y2 + shiftY2);
                this.ctx.scale(scale, scale);
                if (!this.isMobile) {
                this.ctx.shadowColor = 'rgba(255, 215, 0, 0.2)';
                this.ctx.shadowBlur = 10;
                }
                this.ctx.drawImage(img2, -size2 / 2, -size2 / 2, size2, size2);
                this.ctx.restore();
            }
        }
    }
}

   // Рисуем анимации предметов (перемещение из корзинки)
for (const anim of this.itemAnimations) {
    const progress = anim.progress;
    const x = anim.startX + (anim.endX - anim.startX) * progress;
    const y = anim.startY + (anim.endY - anim.startY) * progress;
    const scale = anim.scale + (anim.targetScale - anim.scale) * progress;
    const size = Math.min(this.cellWidth, this.cellHeight) * scale;
    // Создаём временный объект для получения картинки
    const tempItem = { typeIndex: anim.itemTypeIndex, level: anim.itemLevel };
    const img = this.getSpriteImage(tempItem);
    if (img) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale / anim.targetScale, scale / anim.targetScale);

        if (!this.isMobile) {
        this.ctx.shadowColor = 'rgba(255,255,255,0.1)';
        this.ctx.shadowBlur = 10;
        }
        this.ctx.drawImage(img, -size/2, -size/2, size, size);
        this.ctx.restore();
    }
}

    // --- Рисуем звёздочки ---
    for (let i = this.stars.length - 1; i >= 0; i--) {
        const s = this.stars[i];
        s.progress += s.speed;
        if (s.progress >= 1) {
            this.stars.splice(i, 1);
            continue;
        }
        s.alpha = 1 - s.progress;
        const x = s.x + (s.endX - s.x) * s.progress;
        const y = s.y + (s.endY - s.y) * s.progress;
        this.ctx.save();
        this.ctx.globalAlpha = s.alpha;
        this.ctx.fillStyle = '#ffffff';
        if (!this.isMobile) {
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 12;
        }
        this.ctx.beginPath();
        const outerRadius = s.size;
        const innerRadius = s.size * 0.4;
        for (let j = 0; j < 8; j++) {
            const radius = j % 2 === 0 ? outerRadius : innerRadius;
            const angle = (j / 8) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (j === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
  
    this.drawPulseEffects(); //пульс рожающих предметов и рождающихся   
  // Пульсация при наведении (без зажатия) – только для открытых клеток с возможностью объединения
if (this.hoverCell && !this.isDragging) {
    const { row, col } = this.hoverCell;
    const cell = this.board[row]?.[col];
    if (!cell || !cell.type) {
        // если клетка пуста – выходим (но тут не должно быть return, а пропустить)
        // просто ничего не делаем
    } else {
        const isHint = this.hintAnimations.some(h => h.row === row && h.col === col);
        const canMerge = this.canMergeToLevel(cell.typeIndex, cell.level);
        // --- Новая логика canSpawn через itemData ---
        let canSpawn = false;
        const itemData = this.itemData[cell.typeIndex];
        if (itemData) {
            canSpawn = (itemData.spawnable && itemData.spawnLevels.includes(cell.level) && cell.level >= 3) || !!itemData.spawnRules;
        }
        if (!cell.locked && !isHint && (canMerge || canSpawn)) {
            const hasPulse = this.pulseItems.some(p => p.row === row && p.col === col);
            if (!hasPulse) {
                const cw = this.cellWidth;
                const ch = this.cellHeight;
                const x = col * cw + cw / 2;
                const y = row * ch + ch / 2;
                const time = Date.now() / 1000;
                const scale = 0.95 + 0.05 * Math.sin(time * 3);
                const size = Math.min(cw, ch) * 0.85 * scale;

                const img = this.getSpriteImage(cell);
                if (img) {
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    this.ctx.scale(scale, scale);
                    if (!this.isMobile) {
                    this.ctx.shadowColor = 'rgba(255, 176, 124, 0.2)';
                    this.ctx.shadowBlur = 10;
                    }
                    this.ctx.drawImage(img, -size/2, -size/2, size, size);
                    this.ctx.restore();
                }
            }
        }
    }
}
},

drawPulseEffects() {
    if (this.pulseItems.length === 0 || !this.ctx) return;
    const ctx = this.ctx;
    const cw = this.cellWidth;
    const ch = this.cellHeight;

    for (const p of this.pulseItems) {
        const item = this.board[p.row]?.[p.col];
        // ★ Добавляем проверку: если клетка пуста (нет type), пропускаем
        if (!item || !item.type) continue;

        const x = p.col * cw + cw / 2;
        const y = p.row * ch + ch / 2;
        const scale = 1 + (p.maxScale - 1) * Math.sin(p.progress * Math.PI);
        const size = Math.min(cw, ch) * 0.85 * scale;

        const img = this.getSpriteImage(item);
        if (!img) continue;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        if (!this.isMobile) {
                ctx.shadowColor = 'rgba(255, 176, 124, 0.3)';
                ctx.shadowBlur = 15;
        }
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.restore();
    }
},

        updateDragGhost(clientX, clientY, item) {
    const ghost = document.getElementById('drag-ghost');
    if (!ghost) return;
    if (!item) {
        ghost.style.display = 'none';
        return;
    }
    ghost.style.display = 'block';
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';

    // ★ Используем тот же размер, что и на доске (0.85)
    const size = Math.min(this.cellWidth, this.cellHeight) * 0.85;
    ghost.style.width = size + 'px';
    ghost.style.height = size + 'px';

    const imgSrc = this.getImageSrc(item.typeIndex, item.level);
    if (imgSrc) {
        ghost.innerHTML = `<img src="${imgSrc}" style="width:100%; height:100%; object-fit: contain;">`;
    } else {
        ghost.innerHTML = `<span style="font-size: 40px;">🍀</span>`;
    }
},

    // ---------- ЛОГИКА ИГРЫ ----------
    canMergeToLevel(typeIndex, currentLevel) {
        const maxMerge = this.sceneConfig.maxMergeLevelPerType[typeIndex] ?? this.sceneConfig.maxMergeLevel;
        const nextLevel = currentLevel + 1;
        const realMax = this.maxLevels[typeIndex] || 1;
        return nextLevel <= maxMerge && nextLevel <= realMax;
    },

combineItems(r1, c1, r2, c2) {
    //console.log('✅ combineItems вызван', r1, c1, r2, c2);
    const sourceItem = this.dragStart ? this.dragStart.item : this.board[r1]?.[c1];
    const targetCell = this.board[r2]?.[c2];

    // Защита от NaN
    const sourceLevel = Number(sourceItem?.level);
    const targetLevel = Number(targetCell?.level);
    if (isNaN(sourceLevel) && sourceItem) {
        console.warn('combineItems: sourceItem.level is NaN, устанавливаем 1');
        sourceItem.level = 1;
    }
    if (isNaN(targetLevel) && targetCell) {
        console.warn('combineItems: targetCell.level is NaN, устанавливаем 1');
        targetCell.level = 1;
    }

    if (!sourceItem) {
        console.log('❌ sourceItem отсутствует');
        return;
    }


     // ---- Проверка: батарейка + генератор на перезарядке ----
    const isSourceGen = (sourceItem.charges !== undefined);
    const isTargetGen = (targetCell && targetCell.charges !== undefined);
    const isSourceBattery = (sourceItem.typeIndex === 8);
    const isTargetBattery = (targetCell && targetCell.typeIndex === 8);

    // Случай 1: source – генератор на перезарядке, target – батарейка
    if (isSourceGen && isTargetBattery && sourceItem.charges === 0 && sourceItem.cooldownEnd > Date.now()) {
        // Сброс таймера генератора
        sourceItem.charges = sourceItem.maxCharges || MAX_CHARGES;
        sourceItem.cooldownEnd = 0;
        // Удаляем батарейку
        this.board[r2][c2] = { locked: false, row: r2, col: c2 };
        // Убираем перетаскивание
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedCell = { row: r1, col: c1 };
        this.showItemInfo(r1, c1);
        AudioManager.play('merge');
        this.saveBoardState();
        this.updateUI();
        this.drawBoard();
        return;
    }

    // Случай 2: source – батарейка, target – генератор на перезарядке
    if (isSourceBattery && isTargetGen && targetCell.charges === 0 && targetCell.cooldownEnd > Date.now()) {
        targetCell.charges = targetCell.maxCharges || MAX_CHARGES;
        targetCell.cooldownEnd = 0;
        this.board[r1][c1] = { locked: false, row: r1, col: c1 };
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedCell = { row: r2, col: c2 };
        this.showItemInfo(r2, c2);
        AudioManager.play('merge');
        this.saveBoardState();
        this.updateUI();
        this.drawBoard();
        return;
    }

// --- Обработка целевой заблокированной клетки ---
if (targetCell && targetCell.locked === true) {
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

    // Тип и уровень должны совпадать
    if (sourceItem.type !== targetCell.type || sourceItem.level !== targetCell.level) {
        console.log('❌ Тип или уровень не совпадают с заблокированной клеткой');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    // --- НОВЫЕ ПРОВЕРКИ ---
    const nextLevel = sourceItem.level + 1;
    const realMax = this.maxLevels[sourceItem.typeIndex] || 1;
    const maxMerge = this.sceneConfig.maxMergeLevelPerType[sourceItem.typeIndex] ?? this.sceneConfig.maxMergeLevel;

    if (nextLevel > realMax) {
        this.showFloatingMessage(r2, c2, 'limit_reached');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
    if (nextLevel > maxMerge) {
        this.showFloatingMessage(r2, c2, 'not_yet');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
    // --- конец проверок ---

    // Разблокируем клетку и создаём предмет нового уровня
    this.board[r2][c2] = {
        type: this.imageNames[sourceItem.typeIndex] || sourceItem.type,
        typeIndex: sourceItem.typeIndex,
        level: nextLevel,
        merged: true,
        row: r2,
        col: c2,
        locked: false,
            };  
            // Инициализация генератора для нового предмета
            this.initGeneratorFields(this.board[r2][c2], sourceItem.typeIndex, nextLevel);
            this.uncoverNeighbors(r2, c2, true);
             if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(sourceItem.typeIndex, nextLevel);
                }   
    this.board[r1][c1] = { locked: false, row: r1, col: c1 };
    if (this.dragStart) this.dragStart.item = this.board[r2][c2];
    this.selectedCell = { row: r2, col: c2 };
    this.showItemInfo(r2, c2);

    // Разблокировка заказов при достижении уровня 3
    if (nextLevel >= 3) {
        const wasUnlocked = Storage.getOrdersUnlocked();
        Storage.setOrdersUnlocked(true);
        if (!wasUnlocked) {
            if (typeof OrderManager !== 'undefined' && OrderManager.renderOrders) {
                OrderManager.renderOrders();
               
            }
        }
        QuestManager.handleTrigger('first_3lvl_merge');
    }

    const prog = Storage.getProgress();
    prog.totalCombines = (prog.totalCombines || 0) + 1;
    Storage.saveProgress(prog);
    AudioManager.play('merge');
    this.spawnConfetti(r2, c2);
    this.addPulse(r2, c2, 0.8, 1.2);
    this.saveBoardState();
    this.updateUI();
    this.drawBoard();
    this.dragStart = null;
    this.dragTarget = null;
    return;
}

    // --- Пустая клетка ---
    if (!targetCell || !targetCell.type) {
        console.log('❌ Целевая клетка пуста');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    // --- Специальные комбинации ---
    const specials = this.allSpecialCombinations || [];
    let specialResult = null;
    for (const combo of specials) {
        if (Array.isArray(combo) && combo.length === 6) {
            const [typeA, levelA, typeB, levelB, resType, resLevel] = combo;
            if ((sourceItem.typeIndex === typeA && sourceItem.level === levelA && targetCell.typeIndex === typeB && targetCell.level === levelB) ||
                (sourceItem.typeIndex === typeB && sourceItem.level === levelB && targetCell.typeIndex === typeA && targetCell.level === levelA)) {
                specialResult = { typeIndex: resType, level: resLevel };
                break;
            }
        }
    }
    if (specialResult) {
       // console.log('✅ Найдена специальная комбинация!', specialResult);
        const newType = this.imageNames[specialResult.typeIndex] || '🍀';
        this.board[r2][c2] = {
            type: newType,
            typeIndex: specialResult.typeIndex,
            level: specialResult.level,
            merged: true,
            row: r2,
            col: c2,
            locked: false,
        };
                
                this.initGeneratorFields(this.board[r2][c2], specialResult.typeIndex, specialResult.level);
                 this.uncoverNeighbors(r2, c2, true);
                if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(specialResult.typeIndex, specialResult.level);
            }
        this.board[r1][c1] = { locked: false, row: r1, col: c1 };
        if (this.dragStart) this.dragStart.item = this.board[r2][c2];
        this.selectedCell = { row: r2, col: c2 };
        this.showItemInfo(r2, c2);

        // ★★★ РАЗБЛОКИРОВКА ЗАКАЗОВ (если достигнут уровень 3) ★★★
        if (specialResult.level >= 3) {
           const wasUnlocked = Storage.getOrdersUnlocked();
                Storage.setOrdersUnlocked(true);
                if (!wasUnlocked) {
                    // Заказы только что разблокированы – отображаем их
                    if (typeof OrderManager !== 'undefined' && OrderManager.renderOrders) {
                        OrderManager.renderOrders();
                    
                    }
                }
                QuestManager.handleTrigger('first_3lvl_merge');
            }

        const prog = Storage.getProgress();
        prog.totalCombines = (prog.totalCombines || 0) + 1;
        Storage.saveProgress(prog);
        AudioManager.play('merge');
        this.spawnConfetti(r2, c2);
        this.addPulse(r2, c2, 0.8, 1.2);
        this.saveBoardState();
        this.updateUI();
        this.drawBoard();
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    // --- Обычное объединение ---
    if (sourceItem.type !== targetCell.type) {
        console.log('❌ Типы не совпадают! Возвращаем.');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
    if (sourceItem.level !== targetCell.level) {
        console.log('❌ Уровни не совпадают! Возвращаем.');
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

const nextLevel = sourceItem.level + 1;
const realMax = this.maxLevels[sourceItem.typeIndex] || 1;
const maxMerge = this.sceneConfig.maxMergeLevelPerType[sourceItem.typeIndex] ?? this.sceneConfig.maxMergeLevel;

if (nextLevel > realMax) {
    this.showFloatingMessage(r2, c2, 'limit_reached');
    this.board[r1][c1] = sourceItem;
    this.dragStart = null;
    this.dragTarget = null;
    return;
}
if (nextLevel > maxMerge) {
    this.showFloatingMessage(r2, c2, 'not_yet');
    this.board[r1][c1] = sourceItem;
    this.dragStart = null;
    this.dragTarget = null;
    return;
}
// теперь можно объединять

    const newLevel = sourceItem.level + 1;
    this.board[r2][c2] = {
        type: sourceItem.type,
        typeIndex: sourceItem.typeIndex,
        level: newLevel,
        merged: true,
        row: r2,
        col: c2,
        locked: false,
    };  
        this.initGeneratorFields(this.board[r2][c2], sourceItem.typeIndex, newLevel);
        this.uncoverNeighbors(r2, c2, true);
                if (typeof CollectionManager !== 'undefined') {
                CollectionManager.onItemCreated(sourceItem.typeIndex, newLevel);
            }
    if (this.dragStart) this.dragStart.item = this.board[r2][c2];
    this.selectedCell = { row: r2, col: c2 };
    this.showItemInfo(r2, c2);

    // ★★★ РАЗБЛОКИРОВКА ЗАКАЗОВ (если достигнут уровень 3) ★★★
  if (newLevel >= 3) {
                const wasUnlocked = Storage.getOrdersUnlocked();
                Storage.setOrdersUnlocked(true);
                if (!wasUnlocked) {
                    if (typeof OrderManager !== 'undefined' && OrderManager.renderOrders) {
                        OrderManager.renderOrders();
                  
                    }
                }
                QuestManager.handleTrigger('first_3lvl_merge');
            }

        const prog = Storage.getProgress();
        prog.totalCombines = (prog.totalCombines || 0) + 1;
        Storage.saveProgress(prog);
    AudioManager.play('merge');
    this.spawnConfetti(r2, c2);
    this.addPulse(r2, c2, 0.8, 1.2);
    this.saveBoardState();
    this.updateUI();
    this.drawBoard();

    this.dragStart = null;
    this.dragTarget = null;
},


drawBoard() {
    if (!this.ctx) return;

    // 1. Скопировать кешированный фон
    if (!this._backgroundCanvas) {
        this._drawBackground();
    }
    this.ctx.drawImage(this._backgroundCanvas, 0, 0);

    const cw = this.cellWidth;
    const ch = this.cellHeight;
    const ctx = this.ctx;

    // ---- Рисуем предметы (без пульсирующих и подсвеченных) ----
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const x = c * cw;
            const y = r * ch;
            const cell = this.board[r][c];
            if (!cell || !cell.type) continue;
            const isLocked = cell.locked === true;
            const isPulsing = this.pulseItems.some(p => p.row === r && p.col === c);
            const isHovering = this.hoverCell && !this.isDragging &&
                               this.hoverCell.row === r && this.hoverCell.col === c &&
                               !isLocked && (this.canMergeToLevel(cell.typeIndex, cell.level) ||
                               (this.itemData[cell.typeIndex]?.spawnable && this.itemData[cell.typeIndex].spawnLevels.includes(cell.level)));
            const isHint = this.hintAnimations.some(h => h.row === r && h.col === c);

            // Рисуем только если не пульсирует, не подсвечивается и не является подсказкой
            // (пульсация и подсказка рисуются отдельно в drawAll)
            if (!isPulsing && !isHovering && !isHint) {
                const size = Math.min(cw, ch) * 0.8;
                const offsetX = (cw - size) / 2;
                const offsetY = (ch - size) / 2;
                const img = this.getSpriteImage(cell);
                ctx.save();
                if (isLocked) ctx.globalAlpha = 0.5;
                if (img) {
                    ctx.drawImage(img, x + offsetX, y + offsetY, size, size);
                } else {
                    ctx.font = (size * 0.9) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isLocked ? '#5a4a3a' : '#2a1f14';
                    ctx.fillText(this.itemTypes[cell.typeIndex % this.itemTypes.length] || '🍀', x + cw/2, y + ch/2 + 2);
                }
                ctx.restore();
            }

            // ---- Метка генератора (уголки) ----
            const itemData = this.itemData[cell.typeIndex];
            const isGenerator = itemData && itemData.spawnable && itemData.spawnLevels && itemData.spawnLevels.includes(cell.level);
            if (isGenerator) {
                const d = Math.min(cw, ch) * 0.1;
                ctx.save();
                ctx.strokeStyle = '#2a1f14';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 4, y + 4 + d);
                ctx.lineTo(x + 4, y + 4);
                ctx.lineTo(x + 4 + d, y + 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + cw - 4 - d, y + ch - 4);
                ctx.lineTo(x + cw - 4, y + ch - 4);
                ctx.lineTo(x + cw - 4, y + ch - 4 - d);
                ctx.stroke();
                ctx.restore();
            }

            // ---- Таймер перезарядки ----
            if (cell && cell.charges !== undefined && cell.charges !== Infinity && cell.cooldownEnd > Date.now()) {
                this.drawCooldownTimer(ctx, cell, x, y, cw, ch);
            }

            // ---- Паутинка для заблокированных (рисуем поверх предмета) ----
            if (isLocked && this.webImage) {
                const webSize = Math.min(cw, ch) * 0.7;
                const webOffsetX = (cw - webSize) / 2;
                const webOffsetY = (ch - webSize) / 2;
                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.drawImage(this.webImage, x + webOffsetX, y + webOffsetY, webSize, webSize);
                ctx.restore();
            }

            // ---- Коробка (covered) – поверх всего, НЕПРОЗРАЧНАЯ ----
            if (cell && cell.covered === true && this.boxImage) {
                const size = Math.min(cw, ch) * 0.85;
                const offsetX = (cw - size) / 2;
                const offsetY = (ch - size) / 2;
                ctx.save();
                ctx.globalAlpha = 1.0;   // полностью непрозрачная
                ctx.drawImage(this.boxImage, x + offsetX, y + offsetY, size, size);
                ctx.restore();
            }
        }
    }

    // ---- Рамка dragTarget (прерывистая) ----
    if (this.dragTarget) {
        const { row, col } = this.dragTarget;
        const targetCell = this.board[row]?.[col];
        let showGlow = false;
        if (targetCell) {
            if (!targetCell.locked) {
                showGlow = true;
            } else {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = row + dr, nc = col + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                            const neighbor = this.board[nr]?.[nc];
                            if (neighbor && !neighbor.locked) {
                                showGlow = true;
                                break;
                            }
                        }
                    }
                    if (showGlow) break;
                }
            }
        }
        if (showGlow) {
            const x = col * cw;
            const y = row * ch;
            ctx.save();
            const isTargetLocked = targetCell && targetCell.locked === true;
            ctx.strokeStyle = isTargetLocked ? '#d4a373' : '#a77b50';
            ctx.lineWidth = Math.max(2, Math.min(cw, ch) * 0.04);
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // ---- Рамка выделения (комикс-стиль) ----
    if (this.selectedCell) {
        const { row, col } = this.selectedCell;
        const x = col * cw;
        const y = row * ch;
        ctx.save();
        if (this.frameImage) {
            ctx.drawImage(this.frameImage, x, y, cw, ch);
        } else {
            ctx.strokeStyle = '#ac7d4f';
            ctx.lineWidth = Math.max(2, Math.min(cw, ch) * 0.04);
            ctx.strokeRect(x + 3, y + 3, cw - 6, ch - 6);
            const d = 8;
            ctx.lineWidth = Math.max(1.5, Math.min(cw, ch) * 0.03);
            ctx.strokeStyle = '#d4a373';
            // Верхний левый
            ctx.beginPath();
            ctx.moveTo(x + 6, y + d);
            ctx.lineTo(x + 6, y + 6);
            ctx.lineTo(x + d, y + 6);
            ctx.stroke();
            // Верхний правый
            ctx.beginPath();
            ctx.moveTo(x + cw - d, y + 6);
            ctx.lineTo(x + cw - 6, y + 6);
            ctx.lineTo(x + cw - 6, y + d);
            ctx.stroke();
            // Нижний левый
            ctx.beginPath();
            ctx.moveTo(x + 6, y + ch - d);
            ctx.lineTo(x + 6, y + ch - 6);
            ctx.lineTo(x + d, y + ch - 6);
            ctx.stroke();
            // Нижний правый
            ctx.beginPath();
            ctx.moveTo(x + cw - d, y + ch - 6);
            ctx.lineTo(x + cw - 6, y + ch - 6);
            ctx.lineTo(x + cw - 6, y + ch - d);
            ctx.stroke();
        }
        ctx.restore();
    }
},

updateUI() {
    const scoreEl = document.getElementById('game-score');
   // const levelEl = document.getElementById('game-level');
    const menuScore = document.getElementById('menu-score-display');
    const dialogueScore = document.getElementById('dialogue-score');

    const pointsImg = '<img src="images/ui/points.png" style="width:1.5em;height:1.5em;vertical-align:middle;">';

    if (scoreEl) scoreEl.innerHTML = pointsImg + ' ' + this.score;
   // if (levelEl) levelEl.textContent = this.level;
    if (menuScore) menuScore.innerHTML = pointsImg + ' ' + this.score;
    if (dialogueScore) dialogueScore.innerHTML = pointsImg + ' ' + this.score;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    if (this.onLevelUpdate) this.onLevelUpdate(this.level);
    this.checkGiftButton();
    this.checkQuestButton();
    this.updateProgressBar();
      if (typeof CollectionManager !== 'undefined') {
        CollectionManager.updateButtonVisibility();
    }
},

    showOverlay() {
    const overlay = document.getElementById('overlay-pause');
    if (overlay) overlay.classList.add('active');
},

hideOverlay() {
    const overlay = document.getElementById('overlay-pause');
    if (overlay) overlay.classList.remove('active');
},

togglePause() {
    if (this.isPaused) {
        // Снятие паузы
        this.isPaused = false;
        this.hideOverlay('pause');
            } else {
        // --- СБРОС ВСЕХ АКТИВНЫХ СОСТОЯНИЙ ---
        // 1. Прервать перетаскивание
        if (this.isDragging && this.dragStart) {
            this.board[this.dragStart.row][this.dragStart.col] = this.dragStart.item;
        }
        this.isDragging = false;
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedItem = null;
        this.updateDragGhost(0, 0, null);
      
        // 2. Сбросить блокировку кликов
       // this.processingClick = false;

        // 3. Сбросить выделение и закрыть модалки
        this.selectedCell = null;
        this.hoverCell = null;
        if (typeof ModalManager !== 'undefined') {
            this.updateInfoPanel(); 
            ModalManager.closeCenterModal();
        }

        // 4. Очистить подсказки
        this.hintAnimations = [];

        // 5. Удалить глобальные обработчики событий
       if (this._onGlobalMouseMove) {
    document.removeEventListener('mousemove', this._onGlobalMouseMove);
}
if (this._onGlobalMouseUp) {
    document.removeEventListener('mouseup', this._onGlobalMouseUp);
}
if (this._onGlobalTouchMove) {
    document.removeEventListener('touchmove', this._onGlobalTouchMove);
}
if (this._onGlobalTouchEnd) {
    document.removeEventListener('touchend', this._onGlobalTouchEnd);
}

        // 6. Установить паузу
        this.isPaused = true;
        this.showOverlay('pause');
          }
    return this.isPaused;
},

// Добавить после существующих методов
spawnItemFromButton(typeIndex, level) {
    let freeCell = null;
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (!cell || !cell.type) {
                freeCell = { row: r, col: c };
                break;
            }
        }
        if (freeCell) break;
    }
    if (!freeCell) {
        console.warn('Нет свободных клеток для подарка');
        return false;
    }
    const newItem = {
        type: this.imageNames[typeIndex] || '🍀',
        typeIndex: typeIndex,
        level: level,
        merged: false,
        row: freeCell.row,
        col: freeCell.col,
        locked: false,
    };
    this.initGeneratorFields(newItem, typeIndex, level);
    const btn = document.querySelector('.subscene-toggle-btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        const startX = (rect.left + rect.width / 2 - canvasRect.left) * this.scaleX;
        const startY = (rect.top + rect.height / 2 - canvasRect.top) * this.scaleY;
        this.addItemAnimationFromPoint(startX, startY, freeCell.row, freeCell.col, newItem);
    } else {
        // fallback: без анимации
        this.board[freeCell.row][freeCell.col] = newItem;
        
        this.addPulse(freeCell.row, freeCell.col, 0.5, 1.1);
        this.spawnStars(freeCell.row, freeCell.col);
        this.saveBoardState();
        this.updateUI();
    }
    return true;
},

addItemAnimationFromPoint(startX, startY, toRow, toCol, item) {
    const endX = toCol * this.cellWidth + this.cellWidth / 2;
    const endY = toRow * this.cellHeight + this.cellHeight / 2;
    this.itemAnimations.push({
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        progress: 0,
        speed: 0.015,
        itemType: item.type,
        itemTypeIndex: item.typeIndex,
        itemLevel: item.level,
        toRow: toRow,
        toCol: toCol,
        added: false,
        scale: 0.1,
        targetScale: 0.85,
    });
},
_getSpawnRulesForLevel(itemData, level) {
    if (!itemData || !itemData.spawnable) return null;
    const rules = itemData.spawnRules;
    if (!rules) return null;
    const rule = rules[level];
    if (!rule) return null;
    // Возвращаем объект с полями types и infinite (если есть)
    return {
        types: rule.types || [],
        infinite: rule.infinite === true
    };
},

// Показать кнопку подарка
showGiftButton() {
    const btn = document.getElementById('gift-btn');
   // console.log('showGiftButton, btn found?', !!btn);
    if (btn) {
        btn.style.display = 'flex';
        btn.classList.remove('fade-out-scale');
           btn.classList.add('pulse-attention');  
    }
},

// Скрыть кнопку подарка (опционально с анимацией)
hideGiftButton(animate = false) {
    const btn = document.getElementById('gift-btn');
    if (!btn) return;
        btn.classList.remove('pulse-attention');   // ← убираем пульсацию
    if (animate) {
        btn.classList.add('fade-out-scale');
        setTimeout(() => {
            btn.style.display = 'none';
            btn.classList.remove('fade-out-scale');
        }, 500);
    } else {
        btn.style.display = 'none';
    }
},
checkGiftButton() {
    if (!this.isRunning || this.isPaused) return;

    // ★ Если подарок уже ожидает – показываем кнопку и выходим
    if (this.giftPending) {
        this.showGiftButton();
        return;
    }

    const now = Date.now();
    if (now - this._lastGiftTime < this._giftCooldown) {
        this.hideGiftButton(false);
        return;
    }

    let hasSpawner = false;
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (cell && cell.type && !cell.locked) {
                const itemData = this.itemData[cell.typeIndex];
                if (itemData && itemData.spawnable === true) {
                    const rule = this._getSpawnRulesForLevel(itemData, cell.level);
                    if (rule) {
                        hasSpawner = true;
                        break;
                    }
                }
            }
        }
        if (hasSpawner) break;
    }

    if (hasSpawner) {
        this.hideGiftButton(false);
        // ❌ НЕ устанавливаем giftPending здесь
    } else {
        this.giftPending = true;
        this.showGiftButton();
    }
},
onGiftClick() {
    // Доступные спавнящиеся типы на текущей сцене
    const available = this.sceneConfig.availableTypes || [];
    const spawnableTypes = available.filter(idx => {
        const item = this.itemData[idx];
        return item && item.spawnable === true;
    });
    if (spawnableTypes.length === 0) return;

    // Случайный тип и уровень (всегда 1, можно доработать)
    const randomType = spawnableTypes[Math.floor(Math.random() * spawnableTypes.length)];
    const level = 1;

    const itemName = getItemName(randomType, level);
    const imgSrc = this.getImageSrc(randomType, level);

    // Рандомный текст из четырёх вариантов
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
                <img src="${imgSrc}" style="width:80%; height:80%; object-fit:contain;">
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
                    this.receiveGift(randomType, level);
                }
            }
        ]
    });
},
    receiveGift(typeIndex, level) {
    // Найти свободную клетку (первую попавшуюся)
    let freeCell = null;
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (!cell || !cell.type) {
                freeCell = { row: r, col: c };
                break;
            }
        }
        if (freeCell) break;
    }
    if (!freeCell) return;

    // Скрыть кнопку с анимацией
    this.hideGiftButton(true);
     this.giftPending = false;
      this._lastGiftTime = Date.now();  //установка кулдауна подарка
       // ★ СОХРАНЯЕМ ПРОГРЕСС ★
    const prog = Storage.getProgress();
    prog.lastGiftTime = this._lastGiftTime;
    Storage.saveProgress(prog);

    // Создать объект предмета
    const newItem = {
        type: this.imageNames[typeIndex] || '🍀',
        typeIndex: typeIndex,
        level: level,
        merged: false,
        row: freeCell.row,
        col: freeCell.col,
        locked: false,
    };
    this.initGeneratorFields(newItem, typeIndex, level);
    // Координаты кнопки подарка для анимации полёта
    const giftBtn = document.getElementById('gift-btn');
    let startX, startY;
    if (giftBtn && this.canvas) {
        const rect = giftBtn.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        startX = (rect.left + rect.width / 2 - canvasRect.left) * this.scaleX;
        startY = (rect.top + rect.height / 2 - canvasRect.top) * this.scaleY;
    } else {
        // fallback – центр доски
        startX = this.canvas ? this.canvas.width / 2 : 0;
        startY = this.canvas ? this.canvas.height / 2 : 0;
    }

    // Запустить анимацию появления (уменьшение + звёздочки)
    this.addItemAnimationFromPoint(startX, startY, freeCell.row, freeCell.col, newItem);
    this.updateUI();
},

/** Обновить видимость кнопки корзинки */
updateInventoryButton() {
    // Если ссылки нет — попробовать найти
    if (!this.inventoryBtn) {
        this.inventoryBtn = document.getElementById('inventory-btn');
    }
    const prog = Storage.getProgress();
    const inventory = prog.inventory || [];
    if (this.inventoryBtn) {
        if (inventory.length > 0) {
            this.inventoryBtn.style.display = 'flex';
        } else {
            this.inventoryBtn.style.display = 'none';
        }
    }
},

// Проверка, есть ли доступные и доступные по очкам квесты
checkQuestButton() {
    const btn = document.getElementById('quest-btn');
    if (!btn) {
        console.warn('Кнопка quest-btn не найдена');
        return;
    }
    const available = QuestManager._availableQuests || [];
    const affordable = available.filter(q => q.quest.cost <= this.score);
    const show = affordable.length > 0;
   // console.log(`checkQuestButton: affordable=${affordable.length}, show=${show}`);
    btn.style.display = show ? 'flex' : 'none';
},

// Обработчик клика по кнопке
onQuestClick() {
    console.log('🔵 onQuestClick вызван');
    const available = QuestManager._availableQuests || [];
    console.log('available:', available);
    const affordable = available.filter(q => q.quest.cost <= this.score);
    console.log('affordable:', affordable);
    if (affordable.length === 0) {
        console.warn('Нет доступных квестов по очкам');
        return;
    }
    const first = affordable[0];
    console.log('Первый доступный квест:', first.quest);
    if (typeof QuestManager.showQuestInfoModal === 'function') {
        console.log('Вызов QuestManager.showQuestInfoModal');
        QuestManager.showQuestInfoModal(first.quest);
    } else {
        console.error('QuestManager.showQuestInfoModal не является функцией');
    }
},

/** Найти первую свободную клетку на доске */
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

updateProgressBar() {
    const progress = Experience.getProgress(); // 0..1
    const percent = Math.round(progress * 100);
    const fill = document.getElementById('game-progress-fill');
    if (fill) fill.style.width = percent + '%';
    const fillDialogue = document.getElementById('dialogue-progress-fill');
    if (fillDialogue) fillDialogue.style.width = percent + '%';
},

showBoxDisappear(row, col) {
    // Если картинка не загружена – убираем коробку мгновенно (без анимации)
    if (!this.boxImage || !this.boxImage.complete || this.boxImage.naturalWidth === 0) {
        if (this.board[row] && this.board[row][col]) {
            this.board[row][col].covered = false;
            this.drawBoard();
        }
        return;
    }

    const key = `${row}_${col}`;
    if (this._boxAnimations && this._boxAnimations.has(key)) return;
    if (!this._boxAnimations) this._boxAnimations = new Set();
    this._boxAnimations.add(key);

    const canvasRect = this.canvas.getBoundingClientRect();

    // Координаты клетки и размер коробки в CSS-пикселях
    const x = col * this.cellWidth;
    const y = row * this.cellHeight;
    const size = Math.min(this.cellWidth, this.cellHeight) * 0.85;
    const offsetX = (this.cellWidth - size) / 2;
    const offsetY = (this.cellHeight - size) / 2;

    // Прямое позиционирование (без учёта devicePixelRatio, так как canvasRect и cellWidth уже в CSS-пикселях)
    const left = canvasRect.left + x + offsetX;
    const top = canvasRect.top + y + offsetY;
    const width = size;
    const height = size;

    // 1. Создаём DOM-элемент с коробкой
    const el = document.createElement('img');
    el.src = this.boxImage.src;
    el.style.cssText = `
        position: fixed;
        left: ${left}px;
        top: ${top}px;
        width: ${width}px;
        height: ${height}px;
        z-index: 999999;
        pointer-events: none;
        object-fit: contain;
        opacity: 1;
        transform: scale(1) rotate(0deg);
        transition: none;
    `;
    document.body.appendChild(el);

    // 2. Двойной requestAnimationFrame – даём браузеру два кадра,
    //    чтобы DOM-элемент гарантированно отрисовался до перерисовки canvas
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (this.board[row] && this.board[row][col]) {
                this.board[row][col].covered = false;
                this.drawBoard();
            }
        });
    });

    // 3. Через 1 секунду запускаем анимацию исчезновения DOM-элемента
    setTimeout(() => {
        AudioManager.play('box_disappear');
        el.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.2) rotate(10deg)';
    }, 1000);

    // 4. Через 4.5 секунды удаляем элемент
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        this._boxAnimations.delete(key);
    }, 4500);
},

/** Спавн предмета из корзинки с анимацией из точки (startX, startY) */
spawnItemFromPoint(startX, startY, row, col, typeIndex, level) {
    const newItem = {
        type: this.imageNames[typeIndex] || '🍀',
        typeIndex: typeIndex,
        level: level,
        merged: false,
        row: row,
        col: col,
        locked: false,
    };
    this.initGeneratorFields(newItem, typeIndex, level);
    this.addItemAnimationFromPoint(startX, startY, row, col, newItem);
    this.updateUI();
},

// Метод: инициализация полей генератора для клетки
initGeneratorFields(cell, typeIndex, level) {
    const item = this.itemData[typeIndex];
    if (!item || !item.spawnable) return;
    const ruleObj = this._getSpawnRulesForLevel(item, level);
    if (!ruleObj) return; // не генератор на этом уровне

    const infinite = ruleObj.infinite === true;
    cell.charges = infinite ? Infinity : MAX_CHARGES;
    cell.maxCharges = MAX_CHARGES;
    cell.cooldownEnd = 0; // не на перезарядке
},

// Метод: проверить, является ли клетка генератором на перезарядке
isGeneratorOnCooldown(cell) {
   if (!cell || cell.charges === undefined) return false;
    if (cell.charges === Infinity) return false;
    return cell.charges <= 0 && cell.cooldownEnd > Date.now();
},

// Метод: обновить все таймеры перезарядки (вызывается в animateLoop)
updateCooldowns() {
    const now = Date.now();
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (cell && cell.charges !== undefined && cell.charges !== Infinity && cell.cooldownEnd > 0) {
                if (cell.cooldownEnd <= now) {
                    // Перезарядка завершена – восстанавливаем заряд
                    cell.charges = cell.maxCharges || MAX_CHARGES;
                    cell.cooldownEnd = 0;
                }
            }
        }
    }
},

// Метод: рисование кругового таймера поверх клетки
drawCooldownTimer(ctx, cell, x, y, cw, ch) {
    if (!cell || cell.charges === undefined || cell.charges === Infinity) return;
    if (cell.cooldownEnd <= Date.now()) return;

    const now = Date.now();
    const remaining = cell.cooldownEnd - now;
    if (remaining <= 0) return;

    const progress = Math.min(remaining / COOLDOWN_MS, 1); // от 0 до 1
            const radius = Math.min(cw, ch) * 0.25; // уменьшенный размер
            const cx = x + cw - radius - 4;          // отступ от правого края
            const cy = y + ch - radius - 4;          // отступ от нижнего края

    ctx.save();
    // Полупрозрачный фон
    ctx.globalAlpha = 0.85;
    if (!this.isMobile) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;}

    // Рисуем круглый индикатор (как часы)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    if (!this.isMobile) {
    ctx.shadowBlur = 0;}

    // Дуга прогресса – от 12 часов по часовой стрелке
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * (1 - progress); // оставшееся время
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.85, startAngle, endAngle);
    ctx.strokeStyle = '#ffdd77';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Внутренняя точка (центр)
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd77';
    ctx.fill();

    ctx.restore();
},

saveBoardState() {
    if (this.board && this.board.length) {
        Storage.saveBoard({ board: this.board, rows: this.rows, cols: this.cols });
    }
},

// ===== КЕШИРОВАНИЕ ФОНА =====
_drawBackground() {
    // Создаём offscreen‑canvas, если ещё нет
    if (!this._backgroundCanvas) {
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

    // ---- 1. Фон доски (деревянная текстура) ----
     if (this.isMobile) {
        // Упрощённый сплошной цвет без градиента
        ctx.fillStyle = '#8b6b4d';  // тот же базовый цвет, что и в градиенте
        ctx.fillRect(0, 0, boardWidth, boardHeight);
    } else {
        // Полноценный градиент для ПК
    const woodBase = '#8b6b4d';
    const woodLight = '#a8865e';
    const grad = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    grad.addColorStop(0, woodBase);
    grad.addColorStop(0.5, woodLight);
    grad.addColorStop(1, '#6f4f32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    // Волокна дерева – убираем на мобильных
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

    // ---- 2. Отрисовка клеток (только фон и сетка, без предметов, паутинки и коробок) ----
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
            if (this.isMobile) {
                // Одинаковый цвет для всех клеток (светло-бежевый)
                fillColor = '#d9c5a6';
                if (isLocked) fillColor = '#a38564'; // заблокированные темнее
            } else {
                // Чередование цветов для ПК
                fillColor = (r + c) % 2 === 0 ? '#d9c5a6' : '#c9b18c';
                if (isLocked) fillColor = (r + c) % 2 === 0 ? '#a38564' : '#92785b';
            }


            // Закруглённая клетка
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

            // Штриховка – на мобильных убираем
            if (!this.isMobile) {
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
                ctx.restore(); // снимаем clip
            } else {
                ctx.restore(); // без clip
            }
        }
    }
    // Паутинка, коробки, рамки – НЕ рисуем здесь, они будут в drawBoard()
},

    reset() {
               this.isRunning = false;
              this.isPaused = false;
        this.hideOverlay('pause');
              this.level = 1;
        this.score = 0;
  const prog = Storage.getProgress();
    prog.score = 0;
    prog.level = 1;
    prog.lastGiftTime = 0;          // ← обнуляем
    Storage.saveProgress(prog);

    this.init(this.rows, this.cols); // загрузит уже обнулённое lastGiftTime
    this.giftPending = false;
    },

  restartBoard() {
    // Сброс состояний взаимодействия
     this.giftPending = false;
       this.isRunning = true;
    this.selectedItem = null;
    this.dragStart = null;
    this.dragTarget = null;
    this.isDragging = false;
    this.hoverCell = null;
    this.pulseItems = [];
    this.stars = [];
    this.itemAnimations = [];
    this.selectedCell = null;
    this.hintAnimations = [];
    this.processingClick = false;
     this.checkGiftButton();
     this._lastGiftTime = 0;
     const prog = Storage.getProgress();
    prog.lastGiftTime = 0;
    Storage.saveProgress(prog);


    // Пересоздать доску
    this._initBoard();
     this.saveBoardState();
    this.updateUI();
    this.updateInfoPanel();
    this.findHintPair();
    this.startInactivityTimer();
},

cleanup() {
    this.isRunning = false;
    this.isPaused = false;
   this.giftPending = false;
    // Остановка цикла анимации
    if (this._animationFrameId) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
        this._loopActive = false;
    }

    // Удаление глобальных обработчиков
    ['_onGlobalMouseMove','_onGlobalMouseUp','_onGlobalTouchMove','_onGlobalTouchEnd'].forEach(key => {
        if (this[key]) {
            const eventName = key.replace('_onGlobal','').toLowerCase();
            document.removeEventListener(eventName, this[key]);
            this[key] = null;
        }
    });

    clearTimeout(this.inactivityTimer);

    // Очистка анимаций и состояний
    this.itemAnimations = [];
    this.pulseItems = [];
    this.stars = [];
    this.hintAnimations = [];
    this.selectedCell = null;
    this.hoverCell = null;
    this.dragStart = null;
    this.dragTarget = null;
    this.isDragging = false;
    this.processingClick = false;
    this.updateDragGhost(0, 0, null);

    if (typeof ModalManager !== 'undefined') {
        ModalManager.closeAll();
    }

    const pauseBtn = document.getElementById('game-pause-btn');
    if (pauseBtn) pauseBtn.textContent = '⏸';
}
};