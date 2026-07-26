// ============================================================
//  GAME  — основная логика с гибкой настройкой сцен
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
    dragStart: null,
    dragTarget: null,
    isDragging: false,
    dragMouseX: 0,
    dragMouseY: 0,

    cellWidth: 0,
    cellHeight: 0,
    boardSize: 0,

    canvas: null,
    ctx: null,

    itemTypes: [
        '🥔', '🌶️', '🌿', '🧹', 
    ],
    englishNames: [
        'kartoha', 'perec', 'petrushka', 'shetka', 
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

    // ---------- ЗАГРУЗКА СПРАЙТОВ ----------
    loadSprites(callback) {
        if (this.spritesLoaded) { callback && callback(); return; }
        const types = this.itemTypes;
        let totalAttempts = 0;

        const checkLevel = (typeIndex, level) => {
            const name = this.englishNames[typeIndex] || typeIndex;
            const path = `images/level${level}/${name}.png`;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const key = level + '_' + typeIndex;
                this.spriteMap[key] = img;
                checkLevel(typeIndex, level + 1);
            };
            img.onerror = () => {
                this.maxLevels[typeIndex] = level - 1;
                totalAttempts++;
                if (totalAttempts === types.length) {
                    this.spritesLoaded = true;
                    console.log('[Game] Спрайты загружены, maxLevels:', this.maxLevels);
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

    // ---------- ОБНОВЛЕНИЕ КОНФИГА СЦЕНЫ ----------
    updateSceneConfig(newConfig) {
        Object.assign(this.sceneConfig, newConfig);
        this.init(this.rows, this.cols);
    },

    // ---------- ИНИЦИАЛИЗАЦИЯ ИГРЫ ----------
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
            this.drawBoard();
            this.startTimer();
            this.isRunning = true;

            const prog = Storage.getProgress();
            this.score = prog.score || 0;
            this.level = prog.level || 1;
            this.updateUI();
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
                x: clientX - rect.left,
                y: clientY - rect.top
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

        const onStart = (e) => {
            e.preventDefault();
            if (this.isPaused || this.isGameOver || !this.isRunning) return;
            const pos = getPos(e);
            const cell = getCell(pos.x, pos.y);
            if (!cell) return;
            const { row, col } = cell;
            const item = this.board[row]?.[col];
            if (!item) return;

            this.isDragging = true;
            this.dragStart = { row, col, item };
            this.selectedItem = { row, col, item };
            this.dragMouseX = pos.x;
            this.dragMouseY = pos.y;
            canvas.style.cursor = 'grabbing';
            this.drawBoard();
            this.highlightCell(row, col);
            this.drawDragGhost(pos.x, pos.y);
        };

        const onMove = (e) => {
            e.preventDefault();
            if (!this.isDragging || this.isPaused || this.isGameOver) return;
            const pos = getPos(e);
            this.dragMouseX = pos.x;
            this.dragMouseY = pos.y;

            const cell = getCell(pos.x, pos.y);
            if (!cell) {
                this.dragTarget = null;
                this.drawBoard();
                this.highlightCell(this.dragStart.row, this.dragStart.col);
                this.drawDragGhost(pos.x, pos.y);
                return;
            }
            const { row, col } = cell;
            const target = this.board[row]?.[col];
            if (target && target.type === this.dragStart?.item?.type && target.level === this.dragStart?.item?.level) {
                this.dragTarget = { row, col, item: target };
                this.drawBoard();
                this.highlightCell(row, col);
                this.highlightCell(this.dragStart.row, this.dragStart.col);
                this.drawDragGhost(pos.x, pos.y);
            } else {
                this.dragTarget = null;
                this.drawBoard();
                this.highlightCell(this.dragStart.row, this.dragStart.col);
                this.drawDragGhost(pos.x, pos.y);
            }
        };

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
                }
            }

            this.dragStart = null;
            this.dragTarget = null;
            this.selectedItem = null;
            this.drawBoard();
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

    highlightCell(row, col) {
        if (!this.ctx) return;
        const x = col * this.cellWidth;
        const y = row * this.cellHeight;
        this.ctx.save();
        this.ctx.shadowColor = '#ffb07c';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = 'rgba(255, 176, 124, 0.35)';
        this.ctx.fillRect(x + 2, y + 2, this.cellWidth - 4, this.cellHeight - 4);
        this.ctx.restore();
    },

    drawDragGhost(mx, my) {
        if (!this.ctx || !this.dragStart) return;
        const item = this.dragStart.item;
        if (!item) return;
        const size = Math.min(this.cellWidth, this.cellHeight) * 0.7;
        const x = mx - size/2;
        const y = my - size/2;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.globalAlpha = 0.9;

        const img = this.getSpriteImage(item);
        if (img) {
            this.ctx.drawImage(img, x, y, size, size);
        } else {
            this.ctx.font = size + 'px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.fillText(item.type, mx, my + 2);
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
        const item1 = this.board[r1]?.[c1];
        const item2 = this.board[r2]?.[c2];
        if (!item1 || !item2) return;
        if (item1.type !== item2.type) return;
        if (item1.level !== item2.level) return;

        const typeIndex = item1.typeIndex;
        const currentLevel = item1.level;

        if (!this.canMergeToLevel(typeIndex, currentLevel)) {
            return;
        }

        const newLevel = currentLevel + 1;
        this.board[r1][c1] = {
            type: item1.type,
            typeIndex: typeIndex,
            level: newLevel,
            merged: true,
            row: r1,
            col: c1,
        };
        this.board[r2][c2] = null;

        const points = 10 * newLevel;
        this.score += points;
        Storage.updateHighest(this.score);

        const prog = Storage.getProgress();
        prog.score = this.score;
        prog.totalCombines = (prog.totalCombines || 0) + 1;
        Storage.saveProgress(prog);

        AudioManager.play('combine');

        this.updateUI();
        this.checkWin();
        this.drawBoard();
        this.showFloatingText(r1, c1, '✨ ' + getText('game_combine', 'Combined!'));
    },

    checkWin() {
        let emptyCount = 0;
        let total = 0;
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

    showFloatingText(row, col, text) {
        if (!this.ctx) return;
        const x = col * this.cellWidth + this.cellWidth / 2;
        const y = row * this.cellHeight - 10;
        this.ctx.save();
        this.ctx.font = 'bold ' + (Math.min(this.cellWidth, this.cellHeight) * 0.35) + 'px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.shadowBlur = 12;
        this.ctx.fillStyle = '#ffd4b8';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    },

    drawBoard() {
        const ctx = this.ctx;
        if (!ctx) return;
        const w = this.boardSize;
        const cw = this.cellWidth;
        const ch = this.cellHeight;

        ctx.clearRect(0, 0, w, w);

        const gradient = ctx.createRadialGradient(w/2, w/2, 0, w/2, w/2, w*0.7);
        gradient.addColorStop(0, '#3d264f');
        gradient.addColorStop(1, '#1a1225');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, w);

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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
                const x = c * cw;
                const y = r * ch;
                const isBorder = r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1;

                if (!isBorder) {
                    const shade = (r + c) % 2 === 0 ? 'rgba(255,212,184,0.08)' : 'rgba(255,212,184,0.04)';
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
                        ctx.shadowColor = 'rgba(0,0,0,0.2)';
                        ctx.shadowBlur = 8;
                        ctx.drawImage(img, x + offsetX, y + offsetY, size, size);
                    } else {
                        ctx.font = size + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = 'rgba(0,0,0,0.3)';
                        ctx.shadowBlur = 6;
                        ctx.fillText(item.type, x + cw/2, y + ch/2 + 2);
                    }

                    if (item.level > 1) {
                        ctx.font = (Math.min(cw, ch) * 0.18) + 'px sans-serif';
                        ctx.fillStyle = '#ffdd99';
                        ctx.shadowBlur = 4;
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText('x' + item.level, x + cw - 4, y + ch - 4);
                    }
                    ctx.restore();
                } else if (!isBorder) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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

        if (this.dragStart && this.selectedItem) {
            this.highlightCell(this.dragStart.row, this.dragStart.col);
        }
        if (this.dragTarget) {
            this.highlightCell(this.dragTarget.row, this.dragTarget.col);
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
        const overlay = type === 'pause' ?
            document.getElementById('overlay-pause') :
            document.getElementById('overlay-gameover');
        if (overlay) overlay.classList.add('active');
    },

    hideOverlay(type) {
        const overlay = type === 'pause' ?
            document.getElementById('overlay-pause') :
            document.getElementById('overlay-gameover');
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
        this.drawBoard();
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
        this.initCanvas();
        this.drawBoard();
    }
};