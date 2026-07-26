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

    // --- tsParticles ---
    particlesContainer: null,
    particlesRunning: false,

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
                    this.spritesLoaded = true;
                    if (!anyLoaded) {
                        console.warn('[Game] Ни одно изображение не загрузилось. Проверьте пути и CORS.');
                    } else {
                        console.log('[Game] Спрайты загружены, maxLevels:', this.maxLevels);
                    }
                    callback && callback();
                }
            };
            img.src = path;
        };

        this.maxLevels = new Array(types.length).fill(0);
        types.forEach((_, idx) => {
            checkLevel(idx, 1);
        });

        setTimeout(() => {
            if (!this.spritesLoaded) {
                console.warn('[Game] Таймаут загрузки спрайтов, используем эмодзи');
                this.spritesLoaded = true;
                callback && callback();
            }
        }, 5000);
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
        if (this.particlesContainer) {
            this.particlesContainer.destroy();
            this.particlesContainer = null;
        }

        const available = this.sceneConfig.availableTypes;
        const typeIndices = available || this.itemTypes.map((_, i) => i);
        const typeNames = typeIndices.map(i => this.itemTypes[i]);

        const totalCells = (this.rows - 2) * (this.cols - 2);
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
        const maxSpawn = this.sceneConfig.maxSpawnLevel || 1;
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const isBorder = r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1;
                if (isBorder) {
                    this.board[r][c] = null;
                } else {
                    const type = pool[idx++] || '🍀';
                    const typeIndex = this.itemTypes.indexOf(type);
                    const maxLevelForType = this.maxLevels[typeIndex] || 1;
                    const level = Math.min(
                        Math.floor(Math.random() * maxSpawn) + 1,
                        maxLevelForType
                    );
                    this.board[r][c] = {
                        type: type,
                        typeIndex: typeIndex >= 0 ? typeIndex : 0,
                        level: level,
                        merged: false,
                        row: r,
                        col: c,
                    };
                }
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
        this.cellWidth = size / this.cols;
        this.cellHeight = size / this.rows;

        this.bindEvents();
    },

    bindEvents() {
        const canvas = this.canvas;
        if (!canvas) return;

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

        // --- Обработка движения мыши/пальца (без нажатия) ---
        const onMouseMove = (e) => {
            if (this.isDragging) return; // при перетаскивании обрабатываем в onMove
            const pos = getPos(e);
            const cell = getCell(pos.x, pos.y);
            if (cell) {
                this.hoverCell = cell;
            } else {
                this.hoverCell = null;
            }
        };

        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            if (!touch) return;
            const me = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
            });
            canvas.dispatchEvent(me);
        }, { passive: true });

        // --- Обработка начала перетаскивания ---
        const onStart = (e) => {
            e.preventDefault();
            if (this.isPaused || this.isGameOver || !this.isRunning) return;
            const pos = getPos(e);
            const cell = getCell(pos.x, pos.y);
            if (!cell) return;
            const { row, col } = cell;
            const item = this.board[row]?.[col];
            if (!item) return;

            // Запоминаем предмет и удаляем его с доски
            this.dragStart = { row, col, item };
            this.board[row][col] = null; // очищаем исходную клетку

            const centerX = col * this.cellWidth + this.cellWidth / 2;
            const centerY = row * this.cellHeight + this.cellHeight / 2;
            this.dragOffsetX = pos.x - centerX;
            this.dragOffsetY = pos.y - centerY;

            this.isDragging = true;
            this.selectedItem = { row, col, item };
            this.dragMouseX = pos.x;
            this.dragMouseY = pos.y;
            canvas.style.cursor = 'grabbing';
            this.hoverCell = null;
        };

        // --- Обработка движения при перетаскивании ---
        const onMove = (e) => {
            e.preventDefault();
            if (!this.isDragging || this.isPaused || this.isGameOver) return;
            const pos = getPos(e);
            this.dragMouseX = pos.x;
            this.dragMouseY = pos.y;

            const cell = getCell(pos.x, pos.y);
            if (!cell) {
                this.dragTarget = null;
                return;
            }
            const { row, col } = cell;
            const target = this.board[row]?.[col];
            let canMerge = false;
            if (target && this.dragStart) {
                const item1 = this.dragStart.item;
                if (target.type === item1.type && target.level === item1.level) {
                    const typeIndex = item1.typeIndex;
                    if (this.canMergeToLevel(typeIndex, item1.level)) {
                        canMerge = true;
                    }
                }
            }

            if (canMerge) {
                this.dragTarget = { row, col, item: target };
            } else {
                this.dragTarget = null;
            }
        };

        // --- Обработка окончания перетаскивания ---
        const onEnd = (e) => {
            e.preventDefault();
            if (!this.isDragging) return;
            this.isDragging = false;
            canvas.style.cursor = 'grab';

            if (this.dragTarget && this.dragStart) {
                const { row: r1, col: c1 } = this.dragStart;
                const { row: r2, col: c2 } = this.dragTarget;
                if (r1 !== r2 || c1 !== c2) {
                    this.combineItems(r1, c1, r2, c2);
                } else {
                    // Если цели нет – возвращаем предмет на место
                    this.board[r1][c1] = this.dragStart.item;
                }
            } else {
                // Возвращаем предмет на исходную клетку
                if (this.dragStart) {
                    this.board[this.dragStart.row][this.dragStart.col] = this.dragStart.item;
                }
            }

            this.dragStart = null;
            this.dragTarget = null;
            this.selectedItem = null;
        };

        canvas.addEventListener('mousedown', onStart);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onEnd);
        canvas.addEventListener('mouseleave', (e) => {
            if (this.isDragging) onEnd(e);
        });

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

    // ---------- АНИМАЦИИ (tsParticles + пульсация) ----------
    spawnConfetti(row, col) {
        if (this.particlesRunning) return;
        this.particlesRunning = true;

        const boardEl = document.getElementById('game-board');
        const rect = boardEl.getBoundingClientRect();
        const x = rect.left + col * this.cellWidth + this.cellWidth / 2;
        const y = rect.top + row * this.cellHeight + this.cellHeight / 2;

        const container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            overflow: visible;
        `;
        boardEl.appendChild(container);

        tsParticles.load(container, {
            fpsLimit: 60,
            particles: {
                number: {
                    value: 30,
                    density: { enable: false },
                },
                color: {
                    value: ['#ffb07c', '#ff8a5c', '#ffd4b8', '#ff6b35', '#ffaa66', '#ffe066', '#ff6b6b'],
                },
                shape: {
                    type: ['circle', 'square', 'triangle'],
                },
                opacity: {
                    value: { min: 0.3, max: 0.9 },
                    animation: { enable: true, speed: 0.5, startValue: 'random' },
                },
                size: {
                    value: { min: 3, max: 8 },
                    animation: { enable: true, speed: 2, startValue: 'random' },
                },
                move: {
                    enable: true,
                    speed: { min: 2, max: 6 },
                    direction: 'none',
                    random: true,
                    straight: false,
                    outModes: { default: 'out' },
                    gravity: { enable: true, acceleration: 0.3 },
                },
                life: {
                    duration: { value: 1.2 },
                    count: 1,
                },
            },
            emitters: {
                position: { x: 50, y: 50 },
                size: { width: 0, height: 0 },
                rate: { quantity: 30, delay: 0 },
                life: { duration: 0.1, count: 1 },
            },
        }).then((container) => {
            this.particlesContainer = container;
            setTimeout(() => {
                if (this.particlesContainer) {
                    this.particlesContainer.destroy();
                    this.particlesContainer = null;
                }
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
                this.particlesRunning = false;
                // Убираем пульсацию с объединённого предмета
                this.pulseItems = this.pulseItems.filter(p => !(p.row === row && p.col === col));
            }, 1500);
        });
    },

    // Добавляем пульсацию для предмета
    addPulse(row, col) {
        const existing = this.pulseItems.find(p => p.row === row && p.col === col);
        if (existing) return;
        this.pulseItems.push({
            row,
            col,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
        });
    },

    updatePulses() {
        for (const p of this.pulseItems) {
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 0;
        }
        this.pulseItems = this.pulseItems.filter(p => {
            const item = this.board[p.row]?.[p.col];
            return item !== null && item !== undefined;
        });
    },

    // ---------- ЦИКЛ ОТРИСОВКИ ----------
    animateLoop() {
        const loop = () => {
            this.updatePulses();
            this.drawAll();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    drawAll() {
        if (!this.ctx) return;
        this.drawBoard();
        this.drawDragGhost(this.dragMouseX, this.dragMouseY);
        this.drawPulseEffects();
        // Добавляем пульсацию для hover-клетки (без зажатия)
        if (this.hoverCell && !this.isDragging) {
            const { row, col } = this.hoverCell;
            const item = this.board[row]?.[col];
            if (item) {
                // Рисуем пульсирующий ореол вокруг клетки
                this.drawHoverPulse(row, col);
            }
        }
    },

    drawHoverPulse(row, col) {
        const ctx = this.ctx;
        const cw = this.cellWidth;
        const ch = this.cellHeight;
        const x = col * cw + cw / 2;
        const y = row * ch + ch / 2;
        const time = Date.now() / 1000;
        const radius = Math.min(cw, ch) * 0.4 + Math.sin(time * 3) * 4;
        ctx.save();
        ctx.shadowColor = '#ffb07c';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `rgba(255, 176, 124, ${0.5 + 0.2 * Math.sin(time * 2)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    drawPulseEffects() {
        if (this.pulseItems.length === 0 || !this.ctx) return;
        const ctx = this.ctx;
        const cw = this.cellWidth;
        const ch = this.cellHeight;

        for (const p of this.pulseItems) {
            const x = p.col * cw + cw / 2;
            const y = p.row * ch + ch / 2;
            const scale = 0.85 + 0.15 * Math.sin(p.progress * Math.PI * 2);
            const size = Math.min(cw, ch) * 0.7 * scale;

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
        const item1 = this.dragStart ? this.dragStart.item : this.board[r1]?.[c1];
        const item2 = this.board[r2]?.[c2];
        if (!item1 || !item2) return;
        if (item1.type !== item2.type) return;
        if (item1.level !== item2.level) return;

        const typeIndex = item1.typeIndex;
        const currentLevel = item1.level;
        if (!this.canMergeToLevel(typeIndex, currentLevel)) return;

        const newLevel = currentLevel + 1;
        // Новый предмет ставим ВО ВТОРУЮ клетку (куда принесли)
        this.board[r2][c2] = {
            type: item1.type,
            typeIndex: typeIndex,
            level: newLevel,
            merged: true,
            row: r2,
            col: c2,
        };
        // Первую клетку очищаем (она уже очищена в onStart, но на всякий случай)
        this.board[r1][c1] = null;

        const points = 10 * newLevel;
        this.score += points;
        Storage.updateHighest(this.score);

        const prog = Storage.getProgress();
        prog.score = this.score;
        prog.totalCombines = (prog.totalCombines || 0) + 1;
        Storage.saveProgress(prog);

        AudioManager.play('combine');

        // --- АНИМАЦИИ ---
        // Конфетти на целевой клетке (r2, c2)
        this.spawnConfetti(r2, c2);
        // Пульсация объединённого предмета
        this.addPulse(r2, c2);

        this.updateUI();
        this.checkWin();

        // Обнуляем dragStart, чтобы не возвращать предмет
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

        const gradient = ctx.createRadialGradient(w/2, w/2, 0, w/2, w/2, w*0.7);
       gradient.addColorStop(0, '#f5e6e6');
gradient.addColorStop(1, '#e6cccc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, w);

        ctx.strokeStyle = 'rgba(200, 150, 150, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cw, 0);
            ctx.lineTo(i * cw, w);
            ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * ch);
            ctx.lineTo(w, i * ch);
            ctx.stroke();
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * cw, y = r * ch;
                const isBorder = r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1;
                if (!isBorder) {
                   const shade = (r + c) % 2 === 0 ? 'rgba(230,210,210,0.6)' : 'rgba(210,190,190,0.4)';
                    ctx.fillStyle = shade;
                    ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
                }

                const item = this.board[r]?.[c];
                if (item) {
                    const size = Math.min(cw, ch) * 0.7;
                    const offsetX = (cw - size) / 2;
                    const offsetY = (ch - size) / 2;
                    const img = this.getSpriteImage(item);
                    ctx.save();
                    if (img) {
                        ctx.shadowColor = 'rgba(200, 150, 150, 0.1)';
                        ctx.shadowBlur = 8;
                        ctx.drawImage(img, x + offsetX, y + offsetY, size, size);
                    } else {
                        ctx.font = size + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#d96c6c';
                        ctx.shadowColor = 'rgba(0,0,0,0.05)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(item.type, x + cw/2, y + ch/2 + 2);
                    }
                    ctx.restore();
                } else if (!isBorder) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(200, 150, 150, 0.1)';
                    ctx.lineWidth = 1;
                    const cx = x + cw/2, cy = y + ch/2;
                    const d = Math.min(cw, ch) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(cx - d, cy - d);
                    ctx.lineTo(cx + d, cy + d);
                    ctx.moveTo(cx + d, cy - d);
                    ctx.lineTo(cx - d, cy + d);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    },

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