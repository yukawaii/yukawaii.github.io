// ============================================================
//  GAME  —  пульсацией, без багов
// ============================================================

const Game = {
    rows: 7,
    cols: 9,
    mobileRows: 7,
    mobileCols: 9,
    isMobile: false,
    processingClick: false,
    _clickLock: false,
    _dragGhostId: 'drag-ghost',
    board: [],
    itemAnimations: [],
    stars: [],
    score: 0,
    level: 1,
    isPaused: false,
    isRunning: false,
    _updatePending: false,
    _saveTimer: null,
    _backgroundDirty: false,
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
    _spriteCache: {}, // кеш для спрайтов { 'typeIndex_level': spriteData или null }
    _dataUrlCache: {},   // кэш data URL для предметов 
    _spawnerCache: null, // будет хранить Set строк "row,col" или двумерный массив

    _lastGiftTime: 0,
    _giftCooldown: 120000, // 2 минуты
    giftPending: false,          // флаг, что подарок ожидает получения
    inventoryBtn: null,
    _emergencyTimer: null,

    // --- АНИМАЦИОННЫЕ ДАННЫЕ ---
    pulseItems: [],         // [{ row, col, progress, speed }] – для пульсации
    selectedCell: null,   // { row, col } или null
    hintAnimations: [],   // для подсказки – два предмета, которые можно объединить
    _animationFrameId: null,
    _loopActive: false,
    allSpecialCombinations: [],
    itemData: window.ITEM_DATA || [],
    _dragGhostId: 'drag-ghost',
    // imageNames, spawnableFlags, spawnLevels теперь вычисляются из itemData (для совместимости)
    get imageNames() { return this.itemData.map(item => item.name); },
    get spawnableFlags() { return this.itemData.map(item => item.spawnable); },
    get spawnLevels() { return this.itemData.map(item => item.spawnLevels); },
    inactivityTimer: null,
    inactivityTimeout: 10000, // 10 секунд
    hintPhase: 0,
    // --- hover (без зажатия) ---
    hoverCell: null,         // { row, col }

    itemTypes: ['🥔', '🌶️', '🌿', '🧹',],
    maxLevels: [],
    spritesLoaded: false,
    sceneConfig: { availableTypes: null, maxMergeLevel: 3, maxMergeLevelPerType: {}, },
    onScoreUpdate: null,
    onLevelUpdate: null,
  
    // ---------- ЗАГРУЗКА СПРАЙТОВ ----------
loadSprites(callback) {
    if (this.spritesLoaded) { callback && callback(); return; }

    const computedMaxLevels = window.getMaxLevelsForItems ? window.getMaxLevelsForItems() : null;
    if (!computedMaxLevels || computedMaxLevels.length === 0) {
        for (let i = 0; i < this.imageNames.length; i++) {
            this.maxLevels[i] = 5;
        }
    } else {
        this.maxLevels = computedMaxLevels;
    }

    SpriteAtlas.loadAll(() => {
        this.spritesLoaded = true;
        callback && callback();
    });
    
},


    updateSceneConfig(newConfig) {
        Object.assign(this.sceneConfig, newConfig);
        this.init(this.rows, this.cols);
    },

    // ---------- ИНИЦИАЛИЗАЦИЯ ----------
init(rows, cols, loadFromSave = false, onReady = null) {
    this._onReady = onReady;

    this.rows = rows || (Device.isMobile ? this.mobileRows : 9);
    this.cols = cols || (Device.isMobile ? this.mobileCols : 9);
    this._fpsLimit = Device.isMobile ? 30 : 120;
    this.inactivityTimeout = Device.isMobile ? 15000 : 10000;

 // ★★★ ПОЛУЧАЕМ boardId ИЗ КОНФИГА СЦЕНЫ ★★★
        const config = getCurrentSceneConfig();
        this._boardId = config.boardId || null;
        // Если boardId = null – доска не сохраняется
        const shouldSaveBoard = this._boardId !== null;


 let sceneCfg = getCurrentSceneConfig();

    this.allSpecialCombinations = [];
    for (const item of this.itemData) {
        if (item.specialCombinations && Array.isArray(item.specialCombinations)) {
            this.allSpecialCombinations.push(...item.specialCombinations);
        }
    }

    this.sceneConfig.availableTypes = sceneCfg.availableTypes || null;
   this.sceneConfig.maxMergeLevel = sceneCfg.maxMergeLevel || 3;
    this.sceneConfig.maxMergeLevelPerType = {};

    // --- Загрузка прогресса и опыта ---
this.score = Storage.getScore();
this._lastGiftTime = Storage.getLastGiftTime();
Experience.init(this);
this.level = Experience.getLevel(); // Experience сам загружает свой exp через Storage.getExp()

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
   // ★★★ ЗАГРУЗКА ДОСКИ ★★★
        if (loadFromSave && shouldSaveBoard) {
            // Проверяем, есть ли сохранение для этого boardId
            const hasSave = Storage.hasBoardForId(this._boardId);
            
            if (hasSave) {
                const savedBoard = Storage.loadBoardForId(this._boardId);
                if (savedBoard && savedBoard.board && 
                    savedBoard.rows === this.rows && 
                    savedBoard.cols === this.cols) {
                    
                    this.board = structuredClone(savedBoard.board);
                    console.log(`[Game] Доска загружена для boardId: ${this._boardId}`);

                    // Восстанавливаем генераторы и коллекции
                    for (let r = 0; r < this.rows; r++) {
                        for (let c = 0; c < this.cols; c++) {
                            const cell = this.board[r]?.[c];
                            if (cell && cell.typeIndex !== undefined && cell.level !== undefined) {
                                if (cell.charges === undefined) {
                                    BoardCore.initGeneratorFields(this, cell, cell.typeIndex, cell.level);
                                }
                            }
                        }
                    }

                    // Восстанавливаем covered и соседей
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
                                BoardCore.uncoverNeighbors(this, r, c);
                            }
                        }
                    }

                    // Добавляем в коллекцию все предметы на доске
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
                    // Размеры не совпадают – создаём новую доску
                    console.log(`[Game] Размеры не совпадают, создаём новую доску для boardId: ${this._boardId}`);
                    this._initBoard();
                    Storage.saveBoardForId(this._boardId, { board: this.board, rows: this.rows, cols: this.cols });
                }
            } else {
                // Нет сохранения – создаём новую доску
                console.log(`[Game] Нет сохранения для boardId: ${this._boardId}, создаём новую доску`);
                this._initBoard();
                Storage.saveBoardForId(this._boardId, { board: this.board, rows: this.rows, cols: this.cols });
            }
        } else {
            // Либо loadFromSave = false, либо boardId = null (доска не сохраняется)
            console.log(`[Game] Создаём новую доску (loadFromSave=${loadFromSave}, boardId=${this._boardId})`);
            this._initBoard();
            if (shouldSaveBoard) {
                Storage.saveBoardForId(this._boardId, { board: this.board, rows: this.rows, cols: this.cols });
            }
        }

        this._updateSpawnerCache();

    if (this.particlesContainer) {
        this.particlesContainer.destroy();
        this.particlesContainer = null;
    }

    // --- Создание доски ---
   // this._initBoard();

 // --- Загрузка спрайтов и запуск ---
this.loadSprites(() => {
   BoardCore.initCanvas(this, 'game-board', 'game-canvas');
   this._drawBackground();
   BoardCore.bindEvents(this);
   this.inventoryBtn = document.getElementById('inventory-btn');
   this.updateUI();
   this.updateInventoryButton();
   BoardCore.updateInfoPanel(this);
   BoardCore.findHintPair(this);
   BoardCore.startInactivityTimer(this);
   this.checkGiftButton();
   this.isRunning = true;
   BoardCore.animateLoop(this);

   const playBtn = document.getElementById('menu-play-btn');
   if (playBtn) {
       playBtn.textContent = getText('loading', 'Загрузка...');
       playBtn.disabled = true;
   }

   // ★ Вызываем колбэк, переданный в init ★
   if (typeof this._onReady === 'function') {
       this._onReady();
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
                BoardCore.uncoverNeighbors(this, r, c);
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
              BoardCore.initGeneratorFields(this, cell, cell.typeIndex, cell.level);
            }
        }
    }
    this._updateSpawnerCache(); 
},


handleClick(row, col) {
    // Сброс подсказки
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
            // Клик на уже выделенную клетку – проверяем возможность спавна
            const itemData = this.itemData[cell.typeIndex];
            if (itemData && itemData.spawnable === true && itemData.spawnLevels && itemData.spawnLevels.includes(cell.level)) {
                this.performSpawn(row, col); // здесь нет установки processingClick
            } else {
                this.selectedCell = null;
                BoardCore.updateInfoPanel(this);
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
                BoardCore.updateInfoPanel(this);
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

// Добавьте в объект Game:
getUIImage(name) {
    // name: 'web', 'box', 'kletkaramka', 'points', 'colect', ...
    const spriteData = SpriteAtlas.getSprite('ui', `ui/${name}.png`);
    return spriteData || null;
},


// Показать инфо-модалку для выделенной клетки
showItemInfo(row, col) {
    if (typeof ModalManager === 'undefined') return;

    // ---- Убеждаемся, что контейнер правильный для игры ----
    let targetContainer = document.getElementById('info-modal-container');
   // console.log('[game.showItemInfo] targetContainer:', targetContainer ? targetContainer.id : 'null');
    if (targetContainer && ModalManager._infoContainer !== targetContainer) {
        ModalManager._infoContainer = targetContainer;
          console.log('[game.showItemInfo] Установлен контейнер:', targetContainer.id);
    }

    //  console.log('[game.showItemInfo] ModalManager._infoContainer:', ModalManager._infoContainer ? ModalManager._infoContainer.id : 'null');
    const cell = this.board[row]?.[col];
    if (!cell || cell.locked || !cell.type) {
          this.selectedCell = null;   // ← сбрасываем выделение
        BoardCore.updateInfoPanel(this); 
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

  const imgSrc = BoardCore.getItemImageDataUrl(this, typeIdx, cell.level);
    const cellHtml = `
        <div class="info-item-preview" style="
           width:clamp(2rem,8vh,8rem); height:clamp(2rem,8vh,8rem);
            background: #99c9ff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <img src="${imgSrc}" style="width: 90%; height: 90%; object-fit: contain;" alt="">
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
    const fullHtml = this.buildItemInfoHTML(row, col); // возвращает DOM-элемент
    ModalManager.showCenterModal({
        title: name,
        bodyElement: fullHtml,   // ← именно bodyElement
        buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }]
    });
},
        showTrash: true,
        trashAction: () => {
           //  console.log('[game.showItemInfo] trashAction вызван');
            ModalManager.confirmDelete(
                { name: name },
                () => {
                    BoardCore.deleteItem(this, row, col);
                      this._updateSpawnerCache();
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
    if (!item) return document.createDocumentFragment(); // пустой фрагмент

    const fragment = document.createDocumentFragment();

    // ---- ЦЕПОЧКА УРОВНЕЙ ----
    const maxLevel = this.maxLevels[typeIdx] || 1;
    const chainContainer = document.createElement('div');
    chainContainer.className = 'item-info-grid';
    chainContainer.style.cssText = 'justify-content:center; gap:0.3rem;';

    for (let lv = 1; lv <= maxLevel; lv++) {
        const isDiscovered = typeof CollectionManager !== 'undefined' && CollectionManager.isDiscovered(typeIdx, lv);
        const isCurrent = (lv === level);

        const cellDiv = document.createElement('div');
        cellDiv.className = 'item-info-cell';
        cellDiv.style.cssText = `width:clamp(2.5rem, 5vmin, 4rem); height:clamp(2.5rem, 5vmin, 4rem); flex-shrink:0;${isCurrent ? ' border: 3px solid #ac7d4f; box-shadow: 0 0 0 2px #d4a373;' : ''}`;

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

    // ---- БЛОК: Можно получить из ----
    const sources = this._getItemSources(typeIdx, level);
    if (sources.length > 0) {
        const title = document.createElement('div');
        title.className = 'item-info-spawn-title';
        title.textContent = '~ ' + getText('can_get_from', 'Можно получить из') + ' ~';
        fragment.appendChild(title);

        const comboContainer = document.createElement('div');
        comboContainer.className = 'item-info-combos';
        sources.forEach(source => {
            const srcEl = this._renderSourceCell(source[0].typeIndex, source[0].level);
            comboContainer.appendChild(srcEl);
        });
        fragment.appendChild(comboContainer);
    }

    // ---- БЛОК: Выдаёт ----
    const canSpawn = item.spawnable === true && item.spawnLevels && item.spawnLevels.includes(level);
    if (canSpawn) {
        const results = this._getSpawnResults(typeIdx, level);
        if (results.length > 0) {
            const title = document.createElement('div');
            title.className = 'item-info-spawn-title';
            title.textContent = '~ ' + getText('gives', 'Выдаёт') + ' ~';
            fragment.appendChild(title);

            const comboContainer = document.createElement('div');
            comboContainer.className = 'item-info-combos';
            results.forEach(r => {
                const srcEl = this._renderSourceCell(r.typeIndex, r.level);
                comboContainer.appendChild(srcEl);
            });
            fragment.appendChild(comboContainer);
        }

        const nextLevel = level + 1;
        if (item.spawnLevels && item.spawnLevels.includes(nextLevel)) {
            const resultsCurrent = this._getSpawnResults(typeIdx, level);
            const resultsNext = this._getSpawnResults(typeIdx, nextLevel);
            const newItems = resultsNext.filter(rNext =>
                !resultsCurrent.some(rCur => rCur.typeIndex === rNext.typeIndex && rCur.level === rNext.level)
            );
            if (newItems.length > 0) {
                const title = document.createElement('div');
                title.className = 'item-info-spawn-title';
                title.textContent = '~ ' + getText('next_level_gives', 'Следующий уровень выдаёт') + ' ~';
                fragment.appendChild(title);

                const comboContainer = document.createElement('div');
                comboContainer.className = 'item-info-combos';
                newItems.forEach(r => {
                    const srcEl = this._renderSourceCell(r.typeIndex, r.level);
                    comboContainer.appendChild(srcEl);
                });
                fragment.appendChild(comboContainer);
            }
        }
    }

    return fragment; // возвращаем DocumentFragment
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
    const src = BoardCore.getItemImageDataUrl(this, typeIndex, level);
    return `
        <div class="item-info-cell">
            <img src="${src}" class="item-info-img" alt="">
            <span class="item-info-badge">${label}</span>
        </div>
    `;
},

_renderSourceCell(typeIndex, level) {
    const container = document.createElement('div');
    container.className = 'item-info-cell clickable';
    container.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.className = 'item-info-img';
    img.src = BoardCore.getItemImageDataUrl(this, typeIndex, level) || '';
    img.alt = '';
    container.appendChild(img);

    container.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        BoardCore.showItemInfoByData(
            this,
            typeIndex,
            level,
            this.buildItemInfoHTMLFromCell.bind(this)
        );
    });

    return container; // возвращаем DOM-элемент
},

// Возвращает массив { typeIndex, level } предметов, которые может выдать данный предмет на указанном уровне
_getSpawnResults(typeIdx, level) {
    const itemData = this.itemData[typeIdx];
    if (!itemData) return [];
    const rule = BoardCore.getSpawnRulesForLevel(this, itemData, level)
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


    BoardCore.updateCooldowns(this);
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
   if (BoardCore.isGeneratorOnCooldown(this, cell)) {
    showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, row, col, 'on_cooldown', 1500);
    this.processingClick = false;
    return;
}

   // ---- Получение правила спавна ----
        const ruleObj = BoardCore.getSpawnRulesForLevel(this, itemData, level)
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
        BoardCore.addItemAnimation(this, row, col, target.row, target.col, newItem);
        this._updateSpawnerCache();
       BoardCore.addPulse(this, row, col, 0.5, 1.12);
        AudioManager.play('spawn');
        this.showItemInfo(row, col);
        this.updateUI();
    
    } catch (err) {
        console.error('❌ Ошибка в performSpawn:', err);
        this.processingClick = false;
    }
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
this._updateSpawnerCache();
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
        clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {this.saveBoardState();}, 30000);
        this.updateUI();
          
    },



combineItems(r1, c1, r2, c2) {
  //  console.log('✅ combineItems вызван', r1, c1, r2, c2);
    const sourceItem = this.dragStart ? this.dragStart.item : this.board[r1]?.[c1];
    const targetCell = this.board[r2]?.[c2];
  // console.log('sourceItem:', sourceItem);
 //   console.log('targetCell:', targetCell);
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

// ---- Запрет объединения генераторов, если один на перезарядке ----
 // ---- ОБЩИЕ ПРОВЕРКИ ---- (объявляем один раз)
    const isSourceGen = (sourceItem.charges !== undefined);
    const isTargetGen = (targetCell && targetCell.charges !== undefined);
    const isSourceBattery = (sourceItem.typeIndex === 8);
    const isTargetBattery = (targetCell && targetCell.typeIndex === 8);
if (isSourceGen && isTargetGen) {
    const sourceOnCooldown = BoardCore.isGeneratorOnCooldown(this, sourceItem);
    const targetOnCooldown = BoardCore.isGeneratorOnCooldown(this, targetCell);
    if (sourceOnCooldown || targetOnCooldown) {
        showFloatingMessage(
            this.canvas, this.scaleX, this.scaleY,
            this.cellWidth, this.cellHeight,
            r1, c1, 'on_cooldown', 2000
        );
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
}
     // ---- Проверка: батарейка + генератор на перезарядке ----
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
        clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
          this.updateUI();
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
        clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
        this.updateUI();
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
   // console.log('nextLevel =', nextLevel, 'sourceItem.level =', sourceItem.level);
    const realMax = this.maxLevels[sourceItem.typeIndex] || 1;
    const maxMerge = this.sceneConfig.maxMergeLevelPerType[sourceItem.typeIndex] ?? this.sceneConfig.maxMergeLevel;

    if (nextLevel > realMax) {
      showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, r2, c2, 'limit_reached', 3000);
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
    if (nextLevel > maxMerge) {
        showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, r2, c2, 'not_yet', 3000);
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
            this._backgroundDirty = true;
            this._updateSpawnerCache();
            // Инициализация генератора для нового предмета
           BoardCore.initGeneratorFields(this, this.board[r2][c2], sourceItem.typeIndex, nextLevel);
           BoardCore.uncoverNeighbors(this, r2, c2, true);
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
      //  console.log('[Game] Разблокировка заказов, было разблокировано?', wasUnlocked);
        Storage.setOrdersUnlocked(true);
        if (!wasUnlocked) {
           //   console.log('[Game] Первая разблокировка, вызываем OrderManager...');
            if (typeof OrderManager !== 'undefined' && OrderManager.renderOrders) {
                     // console.log('[Game] OrderManager найден, вызываем generateOrders и renderOrders');
                            OrderManager.generateOrders(OrderManager.minActive);
                            OrderManager.renderOrders();
                    // console.log('[Game] После вызова, OrderManager.orders =', OrderManager.orders);               
            }
             } else {
        console.warn('[Game] OrderManager не определён или нет renderOrders');
           }
        QuestManager.handleTrigger('first_3lvl_merge');
    }

Storage.addTotalCombines(1);
    AudioManager.play('merge');
    BoardCore.spawnConfetti(this, r2, c2);
    BoardCore.addPulse(this, r2, c2, 0.8, 1.2);
    clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
     this.updateUI();
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
      //  console.log('✅ Найдена специальная комбинация!', specialResult);
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
                this._updateSpawnerCache();
                BoardCore.initGeneratorFields(this, this.board[r2][c2], specialResult.typeIndex, specialResult.level);
             BoardCore.uncoverNeighbors(this, r2, c2, true);
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
                         OrderManager.generateOrders(OrderManager.minActive); 
                        OrderManager.renderOrders();
                    
                    }
                }
                QuestManager.handleTrigger('first_3lvl_merge');
            }

     Storage.addTotalCombines(1);
        AudioManager.play('merge');
       BoardCore.spawnConfetti(this, r2, c2);
        BoardCore.addPulse(this, r2, c2, 0.8, 1.2);
        clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
          this.updateUI();
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
console.log('nextLevel =', nextLevel, 'sourceItem.level =', sourceItem.level);
const realMax = this.maxLevels[sourceItem.typeIndex] || 1;
const maxMerge = this.sceneConfig.maxMergeLevelPerType[sourceItem.typeIndex] ?? this.sceneConfig.maxMergeLevel;

if (nextLevel > realMax) {
    showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, r2, c2, 'limit_reached', 3000);
    this.board[r1][c1] = sourceItem;
    this.dragStart = null;
    this.dragTarget = null;
    return;
}
if (nextLevel > maxMerge) {
    showFloatingMessage(this.canvas, this.scaleX, this.scaleY, this.cellWidth, this.cellHeight, r2, c2, 'not_yet', 3000);
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
    this._updateSpawnerCache();
        BoardCore.initGeneratorFields(this, this.board[r2][c2], sourceItem.typeIndex, newLevel);
       BoardCore.uncoverNeighbors(this, r2, c2, true);
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
                        OrderManager.generateOrders(OrderManager.minActive); 
                        OrderManager.renderOrders();
                  
                    }
                }
                QuestManager.handleTrigger('first_3lvl_merge');
            }

   Storage.addTotalCombines(1);
    AudioManager.play('merge');
   BoardCore.spawnConfetti(this, r2, c2);
    BoardCore.addPulse(this, r2, c2, 0.8, 1.2);
    clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
     this.updateUI();

    this.dragStart = null;
    this.dragTarget = null;

      

},

// ---- Быстрое обновление счёта (синхронно) ----
updateScoreOnly() {
    const pointsImg = `<img src="${App.pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;">`;
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) scoreEl.innerHTML = pointsImg + ' ' + this.score;
    const menuScore = document.getElementById('menu-score-display');
    if (menuScore) menuScore.innerHTML = pointsImg + ' ' + this.score;
    const dialogueScore = document.getElementById('dialogue-score');
    if (dialogueScore) dialogueScore.innerHTML = pointsImg + ' ' + this.score;
            if (typeof EventManager !== 'undefined' && EventManager.isRunning) {
            EventManager.updateScoreOnly();
        }
},

// ---- Полное обновление UI (счёт сразу, остальное – в следующем кадре) ----
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
    if (typeof EventManager !== 'undefined' && EventManager.isRunning) {
    EventManager.updateScoreOnly();
    EventManager._updateGlobalProgressBar();
}
},

// ---- Внутренний метод полного обновления (всё, кроме счёта) ----
_renderFullUI() {
    // Прогресс-бар
    this.updateProgressBar();

    // Кнопка квестов
    this.checkQuestButton();

    // Коллекция
    if (typeof CollectionManager !== 'undefined') {
        CollectionManager.updateButtonVisibility();
    }

    // Кнопка подарка
    this.checkGiftButton();

    // Инвентарь
    this.updateInventoryButton();

    // Прокрутка правой панели
    const panel = document.getElementById('right-panel');
    if (panel && typeof ScrollablePanel !== 'undefined') {
        ScrollablePanel.refresh(panel);
    }

    // Внешние колбэки
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    if (this.onLevelUpdate) this.onLevelUpdate(this.level);

    // Если выделен предмет – обновить инфо-панель
    if (this.selectedCell) {
        BoardCore.updateInfoPanel(this);
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
       if (!this.isRunning) return;
    if (this.isPaused) {
        // Снятие паузы
        this.isPaused = false;
  
       this.hideOverlay();
        // снятие паузы – перезапустить таймер
        BoardCore.startInactivityTimer(this);
            } else {
        // --- СБРОС ВСЕХ АКТИВНЫХ СОСТОЯНИЙ ---
        // пауза – очистить таймер 
        clearTimeout(this.inactivityTimer);
        // 1. Прервать перетаскивание
        if (this.isDragging && this.dragStart) {
            this.board[this.dragStart.row][this.dragStart.col] = this.dragStart.item;
        }
        this.isDragging = false;
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedItem = null;
       BoardCore.updateDragGhost(this, 0, 0, null);
      
        // 2. Сбросить блокировку кликов
       // this.processingClick = false;

        // 3. Сбросить выделение и закрыть модалки
        this.selectedCell = null;
        this.hoverCell = null;
        if (typeof ModalManager !== 'undefined') {
            BoardCore.updateInfoPanel(this); 
            ModalManager.closeCenterModal();
        }

        // 4. Очистить подсказки
        this.hintAnimations = [];

// 5. Удалить глобальные обработчики событий
if (this._globalPointerMove) {
    document.removeEventListener('pointermove', this._globalPointerMove);
    this._globalPointerMove = null;
}
if (this._globalPointerUp) {
    document.removeEventListener('pointerup', this._globalPointerUp);
    this._globalPointerUp = null;
}

        // 6. Установить паузу
        this.isPaused = true;
        this.showOverlay();
          // ★ ДОБАВИТЬ СОХРАНЕНИЕ ★
        if (typeof App !== 'undefined') {
            App.saveFullProgress();
        }
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
   BoardCore.initGeneratorFields(this, newItem, typeIndex, level);
    const btn = document.querySelector('.subscene-toggle-btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        const startX = (rect.left + rect.width / 2 - canvasRect.left) * this.scaleX;
        const startY = (rect.top + rect.height / 2 - canvasRect.top) * this.scaleY;
       BoardCore.addItemAnimationFromPoint(this, startX, startY, freeCell.row, freeCell.col, newItem);
    
      
    } else {
        // fallback: без анимации
        this.board[freeCell.row][freeCell.col] = newItem;
        
       BoardCore.addPulse(this, freeCell.row, freeCell.col, 0.5, 1.1);
       BoardCore.spawnStars(this, freeCell.row, freeCell.col);
        clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
        this.updateUI();
    }
    return true;
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

// Метод для обновления кеша
_updateSpawnerCache() {
    const cache = new Set();
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r]?.[c];
            if (cell && cell.type && !cell.locked) {
                const itemData = this.itemData[cell.typeIndex];
                if (itemData && itemData.spawnable === true) {
                    const rule = BoardCore.getSpawnRulesForLevel(this, itemData, cell.level);
                    if (rule) {
                        cache.add(`${r},${c}`);
                    }
                }
            }
        }
    }
    this._spawnerCache = cache;
},

checkGiftButton() {
    if (!this.isRunning || this.isPaused) return;
    if (this.giftPending) {
        this.showGiftButton();
        return;
    }
    const now = Date.now();
    if (now - this._lastGiftTime < this._giftCooldown) {
        this.hideGiftButton(false);
        return;
    }
    // ★ Используем кеш вместо перебора
    const hasSpawner = this._spawnerCache && this._spawnerCache.size > 0;
if (hasSpawner) {
    this.hideGiftButton(false);
} else {
    this.giftPending = true;
    this.showGiftButton();
}
},



onGiftClick() {
      if (!this.isRunning) return;
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
   const imgSrc = BoardCore.getItemImageDataUrl(this, randomType, level);

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
                <img src="${imgSrc}" style="width:90%; height:90%; object-fit:contain;">
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
           // ★ СОХРАНЯЕМ ПРОГРЕСС ★
    this._lastGiftTime = Date.now();
Storage.setLastGiftTime(this._lastGiftTime);

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
   BoardCore.initGeneratorFields(this, newItem, typeIndex, level);
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
  BoardCore.addItemAnimationFromPoint(this, startX, startY, freeCell.row, freeCell.col, newItem);
   this._updateSpawnerCache();
this.updateUI();
   
},


    /**
     * Генерирует 3 случайных предмета для рулетки из доступных в текущей сцене.
     * @returns {Array<{typeIndex: number, level: number, imageUrl: string}>}
     */
    generateRouletteItems() {
        const available = this.sceneConfig.availableTypes || [];
        const allCombos = [];
        for (const typeIdx of available) {
            const maxLevel = this.maxLevels[typeIdx] || 1;
            for (let lv = 1; lv <= maxLevel; lv++) {
                const imageUrl = BoardCore.getItemImageDataUrl(this, typeIdx, lv);
                allCombos.push({ typeIndex: typeIdx, level: lv, imageUrl });
            }
        }
        if (allCombos.length === 0) return [];

        const shuffled = allCombos.sort(() => Math.random() - 0.5);
        const count = Math.min(3, shuffled.length);
        const pool = [];
        for (let i = 0; i < count; i++) {
            pool.push(shuffled[i]);
        }
        while (pool.length < 3) {
            const last = pool[pool.length - 1];
            pool.push({ ...last });
        }
        return pool;
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
      if (!this.isRunning) return;
   // console.log('🔵 onQuestClick вызван');
    const available = QuestManager._availableQuests || [];
   // console.log('available:', available);
    const affordable = available.filter(q => q.quest.cost <= this.score);
  //  console.log('affordable:', affordable);
    if (affordable.length === 0) {
        console.warn('Нет доступных квестов по очкам');
        return;
    }
    const first = affordable[0];
  //  console.log('Первый доступный квест:', first.quest);
    if (typeof QuestManager.showQuestInfoModal === 'function') {
        //console.log('Вызов QuestManager.showQuestInfoModal');
        QuestManager.showQuestInfoModal(first.quest);
    } else {
        console.error('QuestManager.showQuestInfoModal не является функцией');
    }
},


updateProgressBar() {
    const progress = Experience.getProgress(); // 0..1
    const percent = Math.round(progress * 100);
    const fill = document.getElementById('game-progress-fill');
    if (fill) fill.style.width = percent + '%';
    const fillDialogue = document.getElementById('dialogue-progress-fill');
    if (fillDialogue) fillDialogue.style.width = percent + '%';
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
   BoardCore.initGeneratorFields(this, newItem, typeIndex, level);
  BoardCore.addItemAnimationFromPoint(this, startX, startY, row, col, newItem);
    this._updateSpawnerCache();
this.updateUI();
     
},


    // ---- СОХРАНЕНИЕ ДОСКИ ----
    saveBoardState() {
        if (this._boardId === null) {
            // Доска не сохраняется
            return;
        }
        if (this.board && this.board.length) {
            Storage.saveBoardForId(this._boardId, { 
                board: this.board, 
                rows: this.rows, 
                cols: this.cols 
            });
        }
    },
    
// ===== КЕШИРОВАНИЕ ФОНА =====
_drawBackground() {
       if (!this.canvas) return; 
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
     if (Device.isMobile) {
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
       fillColor = (r + c) % 2 === 0 ? '#d9c5a6' : '#c9b18c';
if (isLocked) fillColor = (r + c) % 2 === 0 ? '#a38564' : '#92785b';


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
                ctx.restore(); // снимаем clip
            } else {
                ctx.restore(); // без clip
            }
        }
    }
    // Паутинка, коробки, рамки – НЕ рисуем здесь, они будут в drawBoard()
    this._backgroundDirty = false;
},

_getItemData(typeIndex) {
    return this.itemData[typeIndex] || null;
},

    reset() {
               this.isRunning = false;
              this.isPaused = false;
      this.hideOverlay();
                this.level = 1;
                this.score = 0;
                Storage.setScore(0);
                Storage.setLevel(1);
                Storage.setLastGiftTime(0);
                Storage.setExp(0); // Опыт тоже сбрасываем? 

    this.init(this.rows, this.cols); // загрузит уже обнулённое lastGiftTime
    this.giftPending = false;
    },

  restartBoard() {
        this._spriteCache = {}; // сброс кэша спрайтов Это гарантирует, что после смены сцены или перезагрузки кеш будет актуален.
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
Storage.setLastGiftTime(0);


    // Пересоздать доску
    this._initBoard();
    this._updateSpawnerCache();
     clearTimeout(this._saveTimer);
this._saveTimer = setTimeout(() => {
    this.saveBoardState();
}, 30000);
    this.updateUI();
    BoardCore.updateInfoPanel(this);
    BoardCore.findHintPair(this);
BoardCore.startInactivityTimer(this);
},

cleanup() {
    this.isRunning = false;
    this.isPaused = false;
    this.giftPending = false; 
     this.hideGiftButton(false);
    // НЕ сбрасываем _lastGiftTime, чтобы кулдаун сохранялся
    // this._lastGiftTime = 0; // удалить или закомментировать

   // ★ Удаление глобальных обработчиков pointer
    if (this._globalPointerMove) {
        document.removeEventListener('pointermove', this._globalPointerMove);
        this._globalPointerMove = null;
    }
    if (this._globalPointerUp) {
        document.removeEventListener('pointerup', this._globalPointerUp);
        this._globalPointerUp = null;
    }

    // ★ Удаление обработчиков resize / orientationchange (если добавлены через bind)
    if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
        this._resizeHandler = null;
    }
    if (this._orientationHandler) {
        window.removeEventListener('orientationchange', this._orientationHandler);
        this._orientationHandler = null;
    }


 // Очищаем таймер сохранения
    if (this._saveTimer) {
        clearTimeout(this._saveTimer);
        this._saveTimer = null;
    }
    // Остановка цикла анимации
    if (this._animationFrameId) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
        this._loopActive = false;
    }
    if (this._emergencyTimer) {
        clearTimeout(this._emergencyTimer);
        this._emergencyTimer = null;
    }
 // ★  ЯВНОЕ СКРЫТИЕ КНОПКИ подарка на всякий★
    const giftBtn = document.getElementById('gift-btn');
    if (giftBtn) {
        giftBtn.style.display = 'none';
        giftBtn.classList.remove('pulse-attention');
    }
        // Удаление глобальных обработчиков
        if (this._globalPointerMove) {
            document.removeEventListener('pointermove', this._globalPointerMove);
            this._globalPointerMove = null;
        }
        if (this._globalPointerUp) {
            document.removeEventListener('pointerup', this._globalPointerUp);
            this._globalPointerUp = null;
        }

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
    BoardCore.updateDragGhost(this, 0, 0, null);

    if (typeof ModalManager !== 'undefined') {
        ModalManager.closeAll();
    }

    const pauseBtn = document.getElementById('game-pause-btn');
    if (pauseBtn) pauseBtn.textContent = '⏸';

    //поля доски
     this.board = [];
    this.rows = 0;
    this.cols = 0;
    this.score = 0;
    this.level = 1;
    this._spriteCache = {};
    this._dataUrlCache = null;
    this._backgroundCanvas = null;
    this._backgroundCtx = null;
},


};