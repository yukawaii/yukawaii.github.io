// ============================================================
//  GAME  — с tsParticles, пульсацией, без багов
// ============================================================
const Game = {
    rows: 9,
    cols: 9,
    mobileRows: 7,
    mobileCols: 9,
    isMobile: false,

    board: [],
    itemAnimations: [],
    score: 0,
    level: 1,
    timer: 120,
    timerInterval: null,
    isPaused: false,
    isRunning: false,
    isGameOver: false,
    selectedItem: null,
    dragStart: null,         // { row, col, item } – исходный предмет
    dragTarget: null,
    isDragging: false,
    dragMouseX: 0,
    dragMouseY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    scaleX: 1,
    scaleY: 1,

    cellWidth: 0,
    cellHeight: 0,
    boardSize: 0,

    canvas: null,
    ctx: null,

    // --- hover (без зажатия) ---
    hoverCell: null,         // { row, col }
    webImage: null,

     // ---- НАСТРОЙКА ИМЁН ФАЙЛОВ ----
    imageNames: [
      'kartoha', 'perec', 'petrushka', 'shetka', 
    ],

    itemTypes: [
         '🥔', '🌶️', '🌿', '🧹', 
    ],


    maxLevels: [],
    spriteMap: {},
    spritesLoaded: false,
    itemPool: [],

    sceneConfig: {
        availableTypes: null,
        maxSpawnLevel: 1,
        maxMergeLevel: 3,
        maxMergeLevelPerType: {},
    },

    onScoreUpdate: null,
    onLevelUpdate: null,
    onTimerUpdate: null,
    onGameOver: null,

    // --- АНИМАЦИОННЫЕ ДАННЫЕ ---
    pulseItems: [],         // [{ row, col, progress, speed }] – для пульсации

    // ---------- ЗАГРУЗКА СПРАЙТОВ ----------
 loadSprites(callback) {
    if (this.spritesLoaded) { callback && callback(); return; }
    const types = this.itemTypes;
    let totalAttempts = 0;
    let anyLoaded = false;

    const checkLevel = (typeIndex, level) => {
        const name = this.imageNames[typeIndex] || typeIndex;
        const path = `images/level${level}/${name}.png`;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const key = level + '_' + typeIndex;
            this.spriteMap[key] = img;
            anyLoaded = true;
            checkLevel(typeIndex, level + 1);
        };
        img.onerror = () => {
            this.maxLevels[typeIndex] = level - 1;
            totalAttempts++;
            if (totalAttempts === types.length) {
                // Все типы проверены, теперь загружаем паутинку
                this.loadWebImage(() => {
                    this.spritesLoaded = true;
                    if (!anyLoaded) {
                        console.warn('[Game] Ни одно изображение не загрузилось. Проверьте пути и CORS.');
                    } else {
                        console.log('[Game] Спрайты загружены, maxLevels:', this.maxLevels);
                    }
                    callback && callback();
                });
            }
        };
        img.src = path;
    };

    this.maxLevels = new Array(types.length).fill(0);
    types.forEach((_, idx) => {
        checkLevel(idx, 1);
    });

    // Таймаут на случай, если ни один файл не загрузится
    setTimeout(() => {
        if (!this.spritesLoaded) {
            console.warn('[Game] Таймаут загрузки спрайтов, используем эмодзи');
            this.loadWebImage(() => {
                this.spritesLoaded = true;
                callback && callback();
            });
        }
    }, 5000);
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

    getSpriteImage(item) {
        const key = (item.level || 1) + '_' + (item.typeIndex || 0);
        return this.spriteMap[key] || null;
    },

    updateSceneConfig(newConfig) {
        Object.assign(this.sceneConfig, newConfig);
        this.init(this.rows, this.cols);
    },

    // ---------- ИНИЦИАЛИЗАЦИЯ ----------
init(rows, cols) {
    this.rows = rows || (this.isMobile ? this.mobileRows : 9);
    this.cols = cols || (this.isMobile ? this.mobileCols : 9);
    this.score = 0;
    this.level = 1;
    this.timer = 120;
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.selectedItem = null;
    this.dragStart = null;
    this.dragTarget = null;
    this.isDragging = false;
    this.board = [];
    this.hoverCell = null;
    this.pulseItems = [];
    this.particlesRunning = false;
    this.itemAnimations = [];
    if (this.particlesContainer) {
        this.particlesContainer.destroy();
        this.particlesContainer = null;
    }

    // 9 открытых клеток – центральные 3 строки, 3 столбца
const centerRowStart = Math.floor((this.rows - 3) / 2);
const centerColStart = Math.floor((this.cols - 3) / 2);

    const available = this.sceneConfig.availableTypes;
    const typeIndices = available || this.itemTypes.map((_, i) => i);
    const typeNames = typeIndices.map(i => this.itemTypes[i]);

    const totalCells = this.rows * this.cols;
    let pool = [];
    while (pool.length < totalCells) {
        for (let t of typeNames) {
            if (pool.length < totalCells) {
                pool.push(t);
                pool.push(t);
            }
        }
    }
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
        this.board[r] = [];
        for (let c = 0; c < this.cols; c++) {
            const type = pool[idx++] || '🍀';
            const typeIndex = this.itemTypes.indexOf(type);
          const isUnlocked = (r >= centerRowStart && r < centerRowStart + 3 &&
                   c >= centerColStart && c < centerColStart + 3);
            this.board[r][c] = {
                type: type,
                typeIndex: typeIndex >= 0 ? typeIndex : 0,
                level: 1,
                merged: false,
                row: r,
                col: c,
                locked: !isUnlocked,
            };
        }
    }

    this.loadSprites(() => {
        this.initCanvas();
        this.startTimer();
        this.isRunning = true;

        const prog = Storage.getProgress();
        this.score = prog.score || 0;
        this.level = prog.level || 1;
        this.updateUI();
        this.animateLoop();
    });
},

    // ---------- КАНВАС И СОБЫТИЯ ----------
  initCanvas() {
    const container = document.getElementById('game-board');
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    this.scaleX = canvas.width / rect.width;
    this.scaleY = canvas.height / rect.height;

    this.boardSize = size;
    // Теперь клетки квадратные, так как rows == cols (или почти)
    this.cellWidth = size / this.cols;
    this.cellHeight = size / this.rows;

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
            y: (clientY - rect.top) * this.scaleY
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

    // --- Переменные для отслеживания перетаскивания ---
    let startX = 0, startY = 0;
    let startRow = -1, startCol = -1;
    let startItem = null;
    let isDragging = false;
    let processingEnd = false;
    const DRAG_THRESHOLD = 8; // пикселей

    // --- Обработка движения мыши (без нажатия) ---
    const onMouseMove = (e) => {
        if (this.isDragging) return;
        const pos = getPos(e);
        const cell = getCell(pos.x, pos.y);
        this.hoverCell = cell || null;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    // --- Начало нажатия ---
    const onStart = (e) => {
        e.preventDefault();
        if (this.isPaused || this.isGameOver || !this.isRunning) return;
        const pos = getPos(e);
        const cell = getCell(pos.x, pos.y);
        if (!cell) return;
        const { row, col } = cell;
        const item = this.board[row]?.[col];
        if (!item || item.locked) return;

        // Сохраняем начальные данные, НЕ удаляем предмет
        startX = pos.x;
        startY = pos.y;
        startRow = row;
        startCol = col;
        startItem = item;
        isDragging = false;
        canvas.style.cursor = 'grabbing';
    };

    // --- Движение во время нажатия ---
    const onMove = (e) => {
        e.preventDefault();
        if (this.isPaused || this.isGameOver) return;
        const pos = getPos(e);
        this.dragMouseX = pos.x;
        this.dragMouseY = pos.y;

        if (startItem && !isDragging) {
            // Проверяем, превышено ли пороговое расстояние
            const dx = pos.x - startX;
            const dy = pos.y - startY;
            if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                // Начинаем перетаскивание
                isDragging = true;
                this.isDragging = true;
                this.dragStart = { row: startRow, col: startCol, item: startItem };
                // Удаляем предмет с доски
                this.board[startRow][startCol] = null;
                this.dragOffsetX = startX - (startCol * this.cellWidth + this.cellWidth / 2);
                this.dragOffsetY = startY - (startRow * this.cellHeight + this.cellHeight / 2);
                this.selectedItem = { row: startRow, col: startCol, item: startItem };
                this.hoverCell = null;
            }
        }

        if (this.isDragging) {
            // Обработка drag – определяем цель
            const cell = getCell(pos.x, pos.y);
            if (cell) {
                const { row, col } = cell;
                const target = this.board[row]?.[col];
                let canMerge = false;
               if (target && this.dragStart && this.dragStart.item) {
    const item1 = this.dragStart.item;
    // Разрешаем любую клетку (заблокированную или с подходящим предметом)
    if (target.locked) {
        canMerge = true;
    } else if (target.type === item1.type && target.level === item1.level) {
        const typeIndex = item1.typeIndex;
        if (this.canMergeToLevel(typeIndex, item1.level)) {
            canMerge = true;
        }
    }
}
                this.dragTarget = canMerge ? { row, col, item: target } : null;
            } else {
                this.dragTarget = null;
            }
        }
    };

    // --- Конец нажатия ---
  const onEnd = (e) => {
    e.preventDefault();

    if (!isDragging && startItem) {
        // Это был клик (без перетаскивания)
        this.handleClick(startRow, startCol);
        // Принудительно сбрасываем все состояния перетаскивания
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedItem = null;
        this.isDragging = false;
        canvas.style.cursor = 'grab';
    } else if (isDragging) {
        // Завершаем перетаскивание
        if (this.dragTarget && this.dragStart) {
            const { row: r1, col: c1 } = this.dragStart;
            const { row: r2, col: c2 } = this.dragTarget;
            if (r1 !== r2 || c1 !== c2) {
                const targetCell = this.board[r2]?.[c2];
                const sourceItem = this.dragStart.item;
                if (targetCell) {
                    let canMerge = false;
                    if (!targetCell.locked) {
                        if (targetCell.type === sourceItem.type && targetCell.level === sourceItem.level) {
                            canMerge = true;
                        }
                    } else {
                        // Заблокированная – проверяем соседство с открытой
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                if (dr === 0 && dc === 0) continue;
                                const nr = r2 + dr, nc = c2 + dc;
                                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                                    const neighbor = this.board[nr]?.[nc];
                                    // Убрали проверку neighbor.type – достаточно, чтобы клетка была не заблокирована
                                    if (neighbor && !neighbor.locked) {
                                        canMerge = true;
                                        break;
                                    }
                                }
                            }
                            if (canMerge) break;
                        }
                    }
                    if (canMerge) {
                        this.combineItems(r1, c1, r2, c2);
                    } else {
                        // Возвращаем предмет
                        this.board[r1][c1] = sourceItem;
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
        // Сброс состояний перетаскивания
        this.dragStart = null;
        this.dragTarget = null;
        this.selectedItem = null;
        this.isDragging = false;
        canvas.style.cursor = 'grab';
    }

    // Сброс временных переменных (всегда)
    startItem = null;
    startRow = -1;
    startCol = -1;
    isDragging = false;

    // Дополнительная страховка: сбросить hoverCell, чтобы не мешал
    this.hoverCell = null;
};

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', (e) => {
        if (this.isDragging) onEnd(e);
    });

    // --- Touch события ---
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const me = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        canvas.dispatchEvent(me);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const me = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        canvas.dispatchEvent(me);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        const me = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(me);
    }, { passive: false });

    canvas.style.cursor = 'grab';
},
handleClick(row, col) {
      // Принудительно сбрасываем любые остатки перетаскивания
    this.dragStart = null;
    this.dragTarget = null;
    this.isDragging = false;
    const cell = this.board[row]?.[col];
    if (!cell || cell.locked) return;
    const level = cell.level;
    if (level < 3) return;

    // Определяем диапазон уровней для выпадения
    let minLevel, maxLevel;
    if (level === 3) { minLevel = 1; maxLevel = 2; }
    else if (level === 4) { minLevel = 2; maxLevel = 3; }
    else if (level >= 5) { minLevel = 3; maxLevel = 4; }
    else return;

    // Ищем свободные клетки
    const freeCells = [];
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            if (!this.board[r]?.[c]) {
                freeCells.push({ row: r, col: c });
            }
        }
    }
    if (freeCells.length === 0) return;

    // Сортируем по расстоянию от исходной клетки
    freeCells.sort((a, b) => {
        const distA = Math.abs(a.row - row) + Math.abs(a.col - col);
        const distB = Math.abs(b.row - row) + Math.abs(b.col - col);
        return distA - distB;
    });

    const target = freeCells[0];
    const newLevel = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
    const newItem = {
        type: cell.type,
        typeIndex: cell.typeIndex,
        level: newLevel,
        merged: false,
        row: target.row,
        col: target.col,
        locked: false,
    };

    // Добавляем предмет на доску
    this.board[target.row][target.col] = newItem;

    // Анимация появления (уменьшенный в центре исходной клетки, затем увеличение и перемещение)
    this.addItemAnimation(row, col, target.row, target.col, newItem);

    // Лёгкая пульсация исходного предмета
    this.addPulse(row, col, 0.3, 1.3);
    // Конфетти на целевой клетке
    this.spawnConfetti(target.row, target.col);

    this.updateUI();
},

    // ---------- АНИМАЦИИ (tsParticles + пульсация) ----------
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
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
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
    const startX = fromCol * this.cellWidth + this.cellWidth / 2;
    const startY = fromRow * this.cellHeight + this.cellHeight / 2;
    const endX = toCol * this.cellWidth + this.cellWidth / 2;
    const endY = toRow * this.cellHeight + this.cellHeight / 2;
    this.itemAnimations.push({
        startX, startY,
        endX, endY,
        progress: 0,
        speed: 0.02, // скорость анимации
        item: item,
        scale: 0.01, // начальный масштаб
        targetScale: 0.85, // конечный масштаб (размер предмета)
        alpha: 1,
        done: false,
    });
},


    // Добавляем пульсацию для предмета
addPulse(row, col, duration = 0.3, maxScale = 1.2) {
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

updateItemAnimations() {
    for (let i = this.itemAnimations.length - 1; i >= 0; i--) {
        const anim = this.itemAnimations[i];
        anim.progress += anim.speed;
        if (anim.progress >= 1) {
            anim.progress = 1;
            // Удаляем из массива
            this.itemAnimations.splice(i, 1);
            // После завершения можно добавить пульсацию на целевой клетке
            this.addPulse(anim.item.row, anim.item.col, 0.3, 1.1);
        }
    }
},

    // ---------- ЦИКЛ ОТРИСОВКИ ----------
    animateLoop() {
    const loop = () => {
        this.updatePulses();
        // Обновляем анимации предметов
        for (let i = this.itemAnimations.length - 1; i >= 0; i--) {
            const anim = this.itemAnimations[i];
            anim.progress += anim.speed;
            if (anim.progress >= 1) {
                anim.progress = 1;
                anim.done = true;
                this.itemAnimations.splice(i, 1);
                // После завершения анимации можно добавить пульсацию на целевой клетке
                this.addPulse(anim.item.row, anim.item.col, 0.5, 1.1);
            }
        }
           this.updateItemAnimations(); 
        this.drawAll();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
},

  drawAll() {
    if (!this.ctx) return;
    this.drawBoard();

    // Рисуем анимации предметов
for (const anim of this.itemAnimations) {
    const progress = anim.progress;
    // Интерполяция позиции
    const x = anim.startX + (anim.endX - anim.startX) * progress;
    const y = anim.startY + (anim.endY - anim.startY) * progress;
    // Масштаб: от 0.01 до 0.85
    const scale = 0.01 + (anim.targetScale - 0.01) * progress;
    const size = Math.min(this.cellWidth, this.cellHeight) * scale;
    const img = this.getSpriteImage(anim.item);
    if (img) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale / anim.targetScale * 0.85, scale / anim.targetScale * 0.85);
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
        this.ctx.shadowBlur = 10;
        this.ctx.drawImage(img, -size/2, -size/2, size, size);
        this.ctx.restore();
    }
}

    this.drawDragGhost(this.dragMouseX, this.dragMouseY);
    this.drawPulseEffects();

    // Пульсация при наведении (без зажатия) – только для открытых клеток с возможностью объединения
    if (this.hoverCell && !this.isDragging) {
        const { row, col } = this.hoverCell;
        const cell = this.board[row]?.[col];
        if (cell && !cell.locked && cell.type && this.canMergeToLevel(cell.typeIndex, cell.level)) {
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
                    this.ctx.shadowColor = 'rgba(255, 176, 124, 0.2)';
                    this.ctx.shadowBlur = 10;
                    this.ctx.drawImage(img, -size/2, -size/2, size, size);
                    this.ctx.restore();
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
        const x = p.col * cw + cw / 2;
        const y = p.row * ch + ch / 2;
        // progress: 0->1 (увеличение), 1->0 (уменьшение)
       const scale = 1 + (p.maxScale - 1) * Math.sin(p.progress * Math.PI);
        const size = Math.min(cw, ch) * 0.85 * scale;

        const item = this.board[p.row]?.[p.col];
        if (!item) continue;
        const img = this.getSpriteImage(item);
        if (!img) continue;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.shadowColor = 'rgba(255, 176, 124, 0.3)';
        ctx.shadowBlur = 15;
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.restore();
    }
},

    // ---------- ПРИЗРАК (без прозрачности) ----------
    drawDragGhost(mx, my) {
        if (!this.isDragging || !this.dragStart || !this.ctx) return;
        const item = this.dragStart.item;
        if (!item) return;
        const size = Math.min(this.cellWidth, this.cellHeight) * 0.7;
        const x = mx - size/2 - this.dragOffsetX;
        const y = my - size/2 - this.dragOffsetY;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 20;
        // Убрана прозрачность (globalAlpha = 1 по умолчанию)

        const img = this.getSpriteImage(item);
        if (img) {
            this.ctx.drawImage(img, x, y, size, size);
        } else {
            this.ctx.font = size + 'px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#d96c6c';
            this.ctx.fillText(item.type, mx - this.dragOffsetX, my - this.dragOffsetY + 2);
        }
        this.ctx.restore();
    },

    // ---------- ЛОГИКА ИГРЫ ----------
    canMergeToLevel(typeIndex, currentLevel) {
        const maxMerge = this.sceneConfig.maxMergeLevelPerType[typeIndex] ?? this.sceneConfig.maxMergeLevel;
        const nextLevel = currentLevel + 1;
        const realMax = this.maxLevels[typeIndex] || 1;
        return nextLevel <= maxMerge && nextLevel <= realMax;
    },

combineItems(r1, c1, r2, c2) {
    const sourceItem = this.dragStart ? this.dragStart.item : this.board[r1]?.[c1];
    const targetCell = this.board[r2]?.[c2];
    if (!sourceItem) return;

    // Если целевая клетка заблокирована
    if (targetCell && targetCell.locked) {
        // Проверяем, можно ли повысить уровень
        const newLevel = sourceItem.level + 1;
        if (newLevel > this.maxLevels[sourceItem.typeIndex]) {
            // Нельзя – возвращаем
            this.board[r1][c1] = sourceItem;
            this.dragStart = null;
            this.dragTarget = null;
            return;
        }
        // Создаём предмет следующего уровня в целевой клетке
        this.board[r2][c2] = {
            type: sourceItem.type,
            typeIndex: sourceItem.typeIndex,
            level: newLevel,
            merged: true,
            row: r2,
            col: c2,
            locked: false, // разблокируем
        };
        this.board[r1][c1] = null;

        // Начисляем очки
        const points = 10 * newLevel;
        this.score += points;
        Storage.updateHighest(this.score);
        const prog = Storage.getProgress();
        prog.score = this.score;
        prog.totalCombines = (prog.totalCombines || 0) + 1;
        Storage.saveProgress(prog);

        AudioManager.play('combine');
        this.spawnConfetti(r2, c2);
       this.addPulse(r2, c2, 0.8, 1.2);
        this.updateUI();
        this.checkWin();

        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    // Обычное объединение двух открытых предметов (код остаётся как раньше)
    const targetItem = targetCell;
    if (!targetItem) {
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }
    if (sourceItem.type !== targetItem.type) return;
    if (sourceItem.level !== targetItem.level) return;

    const typeIndex = sourceItem.typeIndex;
    const currentLevel = sourceItem.level;
    if (!this.canMergeToLevel(typeIndex, currentLevel)) {
        this.board[r1][c1] = sourceItem;
        this.dragStart = null;
        this.dragTarget = null;
        return;
    }

    const newLevel = currentLevel + 1;
    this.board[r2][c2] = {
        type: sourceItem.type,
        typeIndex: typeIndex,
        level: newLevel,
        merged: true,
        row: r2,
        col: c2,
        locked: false,
    };
    this.board[r1][c1] = null;

    const points = 10 * newLevel;
    this.score += points;
    Storage.updateHighest(this.score);
    const prog = Storage.getProgress();
    prog.score = this.score;
    prog.totalCombines = (prog.totalCombines || 0) + 1;
    Storage.saveProgress(prog);

    AudioManager.play('combine');
    this.spawnConfetti(r2, c2);
    this.addPulse(r2, c2);
    this.updateUI();
    this.checkWin();

    this.dragStart = null;
    this.dragTarget = null;
},

    checkWin() {
        let emptyCount = 0, total = 0;
        for (let r = 1; r < this.rows - 1; r++) {
            for (let c = 1; c < this.cols - 1; c++) {
                total++;
                if (!this.board[r]?.[c]) emptyCount++;
            }
        }
        if (emptyCount >= total - 2) {
            this.isGameOver = true;
            this.isRunning = false;
            clearInterval(this.timerInterval);
            AudioManager.play('levelup');
            this.showOverlay('gameover');
            this.level++;
            const prog = Storage.getProgress();
            prog.level = this.level;
            Storage.saveProgress(prog);
            this.updateUI();
        }
    },

    // ---------- ОТРИСОВКА ДОСКИ ----------
drawBoard() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.boardSize;
    const cw = this.cellWidth;
    const ch = this.cellHeight;

   ctx.clearRect(0, 0, w, w);

// Заливка фона цветом тёмной клетки
ctx.fillStyle = '#7fb8e6';
ctx.fillRect(0, 0, w, w);

    const radius = Math.min(cw, ch) * 0.08;
    for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
            const x = c * cw;
            const y = r * ch;
            const cell = this.board[r][c];
            const isLocked = cell && cell.locked === true;

            // Цвет клетки: тёмно-голубой, шахматка
        // Цвет клетки: светло-голубой, шахматка
const baseColor = (r + c) % 2 === 0 ? '#99c9ff' : '#acd2ff';
const lockedColor = (r + c) % 2 === 0 ? '#7fb8e6' : '#8fc2f0';
            const fillColor = isLocked ? lockedColor : baseColor;

            // Рисуем скруглённую клетку
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
            ctx.restore();

            // Проверяем, пульсирует ли клетка или подсвечена hover
            const isPulsing = this.pulseItems.some(p => p.row === r && p.col === c);
            const isHovering = this.hoverCell && !this.isDragging &&
                               this.hoverCell.row === r && this.hoverCell.col === c &&
                               !isLocked && cell && this.canMergeToLevel(cell.typeIndex, cell.level);

            // Рисуем предмет, если он есть и не пульсирует и не hover
            if (cell && !isPulsing && !isHovering) {
                const size = Math.min(cw, ch) * 0.85;
                const offsetX = (cw - size) / 2;
                const offsetY = (ch - size) / 2;
                const img = this.getSpriteImage(cell);
                ctx.save();
                if (isLocked) {
                    ctx.globalAlpha = 0.4; // бледно для заблокированных
                }
                if (img) {
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 10;
                    ctx.drawImage(img, x + offsetX, y + offsetY, size, size);
                } else {
                    ctx.font = size + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isLocked ? '#aaa' : '#fff';
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 6;
                    ctx.fillText(cell.type, x + cw/2, y + ch/2 + 2);
                }
                ctx.restore();
            }

            // Паутинка для заблокированных (поверх предмета)
            if (isLocked && this.webImage) {
                ctx.save();
                const webSize = Math.min(cw, ch) * 0.8;
                const webOffsetX = (cw - webSize) / 2;
                const webOffsetY = (ch - webSize) / 2;
                ctx.globalAlpha = 0.5;
                ctx.drawImage(this.webImage, x + webOffsetX, y + webOffsetY, webSize, webSize);
                ctx.restore();
            }            
        }
    }

    // Золотое свечение для dragTarget (под предметами)
    if (this.dragTarget) {
        const { row, col } = this.dragTarget;
        const targetCell = this.board[row]?.[col];
        let showGlow = false;
        if (targetCell) {
            if (!targetCell.locked) {
                showGlow = true;
            } else {
                // Заблокированная – свечение только если рядом есть открытая клетка
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
            const x = col * cw + cw / 2;
            const y = row * ch + ch / 2;
            const radius = Math.min(cw, ch) * 0.45;
            ctx.save();
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
            grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
// Внешняя обводка поля (после всех клеток)
ctx.save();
ctx.strokeStyle = 'rgba(255,255,255,0.12)';
ctx.lineWidth = 2;
const boardRadius = Math.min(this.cellWidth, this.cellHeight) * 0.15;
ctx.beginPath();
ctx.moveTo(boardRadius, 0);
ctx.arcTo(w, 0, w, w, boardRadius);
ctx.arcTo(w, w, 0, w, boardRadius);
ctx.arcTo(0, w, 0, 0, boardRadius);
ctx.arcTo(0, 0, w, 0, boardRadius);
ctx.closePath();
ctx.stroke();
ctx.restore();},

    // ---------- ТАЙМЕР И UI ----------
    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isPaused || this.isGameOver) return;
            this.timer--;
            this.updateUI();
            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.isRunning = false;
                this.isGameOver = true;
                this.showOverlay('gameover');
            }
        }, 1000);
    },

    updateUI() {
        const scoreEl = document.getElementById('game-score');
        const levelEl = document.getElementById('game-level');
        const timerEl = document.getElementById('game-timer');
        const menuScore = document.getElementById('menu-score-display');
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.level;
        if (timerEl) timerEl.textContent = Math.max(0, this.timer);
        if (menuScore) menuScore.textContent = '⭐ ' + this.score;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onLevelUpdate) this.onLevelUpdate(this.level);
        if (this.onTimerUpdate) this.onTimerUpdate(this.timer);
    },

    showOverlay(type) {
        const overlay = type === 'pause' ? document.getElementById('overlay-pause') : document.getElementById('overlay-gameover');
        if (overlay) overlay.classList.add('active');
    },

    hideOverlay(type) {
        const overlay = type === 'pause' ? document.getElementById('overlay-pause') : document.getElementById('overlay-gameover');
        if (overlay) overlay.classList.remove('active');
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showOverlay('pause');
            clearInterval(this.timerInterval);
        } else {
            this.hideOverlay('pause');
            this.startTimer();
        }
        return this.isPaused;
    },

    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.hideOverlay('pause');
        this.hideOverlay('gameover');
        this.level = 1;
        this.score = 0;
        this.timer = 120;
        const prog = Storage.getProgress();
        prog.score = 0;
        prog.level = 1;
        Storage.saveProgress(prog);
        this.init(this.rows, this.cols);
    },

    nextLevel() {
        this.hideOverlay('gameover');
        this.isGameOver = false;
        this.isRunning = true;
        this.timer = 120 + this.level * 5;
        this.init(this.rows, this.cols);
    },

    resize() {
        if (this.canvas) {
            this.initCanvas();
        }
    }
};