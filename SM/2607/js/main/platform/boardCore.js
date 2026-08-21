// ============================================================
//  BOARD CORE – общая механика доски для Game и EventManager
//  Все методы принимают контекст (this) и работают с его полями.
// ============================================================

const BoardCore = {

    // ----- ИНИЦИАЛИЗАЦИЯ КАНВАСА -----
    /**
     * Инициализирует канвас внутри контейнера.
     * @param {object} ctx - контекст (Game или EventManager)
     * @param {string} containerId - id контейнера (например 'game-board')
     * @param {string} canvasId - id канваса (например 'game-canvas')
     */
    initCanvas(ctx, containerId, canvasId) {
        const container = document.getElementById(containerId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx.canvas = canvas;
        ctx.ctx = canvas.getContext('2d');

        canvas.style.display = 'block';
        canvas.style.background = 'transparent';
        canvas.style.pointerEvents = 'auto';
        canvas.style.zIndex = '5';

        let rect = container.getBoundingClientRect();
        if (rect.width === 0) {
            if (!container.style.width || container.style.width === '0px') {
                container.style.width = '100%';
                container.style.minWidth = '100%';
            }
            rect = container.getBoundingClientRect();
        }

        const availWidth = rect.width;
        const availHeight = rect.height;

        if (availWidth === 0 || availHeight === 0) {
            if (!ctx._initAttempts) ctx._initAttempts = 0;
            ctx._initAttempts++;
            if (ctx._initAttempts > 10) {
                console.error('[BoardCore] Слишком много попыток инициализации, отключаем');
                return;
            }
            requestAnimationFrame(() => {
                setTimeout(() => this.initCanvas(ctx, containerId, canvasId), 50);
            });
            return;
        }
        ctx._initAttempts = 0;

        const cellSizeByWidth = availWidth / ctx.cols;
        const cellSizeByHeight = availHeight / ctx.rows;
        let cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
        if (cellSize < 10) cellSize = 10;

        const canvasWidth = cellSize * ctx.cols;
        const canvasHeight = cellSize * ctx.rows;
        
        let dpr = window.devicePixelRatio || 1;
        if (Device.isMobile) {
            dpr = Math.min(dpr, 1.5); // ограничиваем на мобильных
        }
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';

        ctx.cellWidth = cellSize;
        ctx.cellHeight = cellSize;

        ctx.ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.ctx.scale(dpr, dpr);

        const canvasRect = canvas.getBoundingClientRect();
        ctx.scaleX = canvasWidth / canvasRect.width;
        ctx.scaleY = canvasHeight / canvasRect.height;

        // Вызываем специфический для каждого объекта метод отрисовки фона
        if (typeof ctx._drawBackground === 'function') {
            ctx._drawBackground();
        }
        this.drawBoard(ctx);
        if (ctx.updateUI) ctx.updateUI();
        this.updateDragGhost(ctx, 0, 0, null);
    },

    // ----- ПРИВЯЗКА СОБЫТИЙ МЫШИ / ТАЧ -----
    /**
     * Привязывает события к канвасу.
     * @param {object} ctx - контекст (Game или EventManager)
     */
 bindEvents(ctx) {
    const canvas = ctx.canvas;
    if (!canvas) return;

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * ctx.scaleX,
            y: (e.clientY - rect.top) * ctx.scaleY,
            clientX: e.clientX,
            clientY: e.clientY
        };
    };

    const getCell = (x, y) => {
        const col = Math.floor(x / ctx.cellWidth);
        const row = Math.floor(y / ctx.cellHeight);
        if (row >= 0 && row < ctx.rows && col >= 0 && col < ctx.cols) {
            return { row, col };
        }
        return null;
    };

    let startX = 0, startY = 0;
    let startRow = -1, startCol = -1;
    let startItem = null;
    let isDragging = false;

    const onGlobalPointerMove = (e) => {
        const pos = getPos(e);
        ctx._dragCanvasX = pos.x;
        ctx._dragCanvasY = pos.y;
        ctx._dragClientX = pos.clientX;
        ctx._dragClientY = pos.clientY;
        
        onMove(e);
    };

    const onGlobalPointerUp = (e) => {
        onEnd(e);
        document.removeEventListener('pointermove', onGlobalPointerMove);
        document.removeEventListener('pointerup', onGlobalPointerUp);
    };

   const onStart = (e) => {
    e.preventDefault();
    if (ctx.hintAnimations && ctx.hintAnimations.length > 0) {
        ctx.hintAnimations = [];
        if (typeof ctx.resetInactivityTimer === 'function') ctx.resetInactivityTimer();
    }
    if (ctx.isPaused || !ctx.isRunning) return;

    try {
        const pos = getPos(e);
        const cell = getCell(pos.x, pos.y);
        if (!cell) return;
        const { row, col } = cell;
        const item = ctx.board[row]?.[col];
        if (!item || !item.type) return;

        startX = pos.x;
        startY = pos.y;
        startRow = row;
        startCol = col;
        startItem = item.locked ? null : item;
        isDragging = false;
        canvas.style.cursor = 'grabbing';

        ctx._dragCanvasX = pos.x;
        ctx._dragCanvasY = pos.y;
        ctx._dragClientX = pos.clientX;
        ctx._dragClientY = pos.clientY;

        document.addEventListener('pointermove', onGlobalPointerMove);
        document.addEventListener('pointerup', onGlobalPointerUp);
        ctx._globalPointerMove = onGlobalPointerMove;
        ctx._globalPointerUp = onGlobalPointerUp;

    } catch (err) {
        // Если произошла ошибка – удаляем обработчики, чтобы не висели
        document.removeEventListener('pointermove', onGlobalPointerMove);
        document.removeEventListener('pointerup', onGlobalPointerUp);
        console.error('[BoardCore] Ошибка в onStart:', err);
        // Можно выбросить ошибку дальше, но лучше просто заглушить
        // throw err; // раскомментируйте, если нужна остановка
    }
};

    const onMove = (e) => {
        e.preventDefault();
        if (ctx.isPaused) return;

        const pos = getPos(e);
        ctx._dragCanvasX = pos.x;
        ctx._dragCanvasY = pos.y;
        ctx._dragClientX = pos.clientX;
        ctx._dragClientY = pos.clientY;

        const cell = getCell(pos.x, pos.y);
        if (cell) {
            const { row, col } = cell;
            const target = ctx.board[row]?.[col];
            if (target && target.type && !target.locked) {
                ctx.hoverCell = { row, col };
            } else {
                ctx.hoverCell = null;
            }
        } else {
            ctx.hoverCell = null;
        }

        if (startItem && !isDragging) {
            const dx = pos.x - startX;
            const dy = pos.y - startY;
            if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                ctx.selectedCell = null;
                isDragging = true;
                ctx.isDragging = true;
                ctx.dragStart = { row: startRow, col: startCol, item: startItem };
                ctx.board[startRow][startCol] = { locked: false, row: startRow, col: startCol };
                // ★ Создаём призрак немедленно
        BoardCore.updateDragGhost(ctx, pos.clientX, pos.clientY, startItem);
                ctx.dragOffsetX = startX - (startCol * ctx.cellWidth + ctx.cellWidth / 2);
                ctx.dragOffsetY = startY - (startRow * ctx.cellHeight + ctx.cellHeight / 2);
                ctx.selectedItem = { row: startRow, col: startCol, item: startItem };
                ctx.hoverCell = null;
            }
        }

        if (ctx.isDragging) {
            this.updateDragGhost(ctx, ctx._dragClientX, ctx._dragClientY, ctx.dragStart.item);
            if (cell) {
                const { row, col } = cell;
                const target = ctx.board[row]?.[col];
                let canMerge = false;
                if (ctx.dragStart && ctx.dragStart.item) {
                    canMerge = true;
                }
                ctx.dragTarget = canMerge ? { row, col, item: target } : null;
            } else {
                ctx.dragTarget = null;
            }
        }
    };

    const onEnd = (e) => {
        if (typeof ctx.resetInactivityTimer === 'function') ctx.resetInactivityTimer();
        e.preventDefault();

        try {
            if (ctx.isPaused) {
                return;
            }

            if (!isDragging && startRow !== -1 && startCol !== -1) {
                if (!ctx._clickLock) {
                    ctx._clickLock = true;
                    if (typeof ctx.handleClick === 'function') {
                        ctx.handleClick(startRow, startCol);
                    }
                    this.drawAll(ctx);
                    setTimeout(() => { ctx._clickLock = false; }, 50);
                }
                this._cleanupDrag(ctx, canvas);
                startItem = null;
                startRow = -1;
                startCol = -1;
                isDragging = false;
                ctx.hoverCell = null;
                return;
            }

            if (isDragging) {
                // Проверка дропа на заказы (только для Game)
                if (ctx.dragStart && ctx.dragStart.item && typeof ctx._dragClientX !== 'undefined') {
                    if (typeof OrderManager !== 'undefined' && typeof OrderManager.checkDrop === 'function' && ctx === Game) {
                        const clientX = ctx._dragClientX || 0;
                        const clientY = ctx._dragClientY || 0;
                        const droppedOnOrder = OrderManager.checkDrop(ctx.dragStart.item, clientX, clientY);
                        if (droppedOnOrder) {
                            this._cleanupDrag(ctx, canvas);
                            startItem = null;
                            startRow = -1;
                            startCol = -1;
                            isDragging = false;
                            ctx.hoverCell = null;
                            this.updateDragGhost(ctx, 0, 0, null);
                            return;
                        }
                    }
                }

                // Логика перетаскивания на доске
                if (ctx.dragTarget && ctx.dragStart) {
                    const { row: r1, col: c1 } = ctx.dragStart;
                    const { row: r2, col: c2 } = ctx.dragTarget;
                    if (r1 !== r2 || c1 !== c2) {
                        const targetCell = ctx.board[r2]?.[c2];
                        const sourceItem = ctx.dragStart.item;
                        if (targetCell !== undefined) {
                            if (!targetCell.type) {
                                ctx.board[r2][c2] = sourceItem;
                                ctx.board[r1][c1] = { locked: false, row: r1, col: c1 };
                                ctx.selectedCell = { row: r2, col: c2 };
                                if (typeof ctx.showItemInfo === 'function') ctx.showItemInfo(r2, c2);
                                this._cleanupDrag(ctx, canvas);
                                startItem = null;
                                startRow = -1;
                                startCol = -1;
                                isDragging = false;
                                ctx.hoverCell = null;
                                this.updateDragGhost(ctx, 0, 0, null);
                                if (typeof ctx.saveBoardState === 'function') ctx.saveBoardState();
                                return;
                            } else {
                                if (typeof ctx.combineItems === 'function') {
                                    ctx.combineItems(r1, c1, r2, c2);
                                } else {
                                    ctx.board[r1][c1] = sourceItem;
                                }
                            }
                        } else {
                            ctx.board[r1][c1] = sourceItem;
                        }
                    } else {
                        ctx.board[r1][c1] = ctx.dragStart.item;
                    }
                } else {
                    if (ctx.dragStart) {
                        ctx.board[ctx.dragStart.row][ctx.dragStart.col] = ctx.dragStart.item;
                    }
                }

                this._cleanupDrag(ctx, canvas);
            }

            startItem = null;
            startRow = -1;
            startCol = -1;
            isDragging = false;
            ctx.hoverCell = null;
            this.updateDragGhost(ctx, 0, 0, null);

        } finally {
    if (ctx._globalPointerMove) {
        document.removeEventListener('pointermove', ctx._globalPointerMove);
        ctx._globalPointerMove = null;
    }
    if (ctx._globalPointerUp) {
        document.removeEventListener('pointerup', ctx._globalPointerUp);
        ctx._globalPointerUp = null;
    }
}
    };

    canvas.addEventListener('pointerdown', onStart);
    canvas.style.cursor = 'grab';
},
    // Вспомогательная очистка после перетаскивания
    _cleanupDrag(ctx, canvas) {
        ctx.dragStart = null;
        ctx.dragTarget = null;
        ctx.selectedItem = null;
        ctx.isDragging = false;
        if (canvas) canvas.style.cursor = 'grab';
    },

    // ----- ОТРИСОВКА ДОСКИ (предметы, рамки, таймеры) -----
    /**
     * Рисует доску (предметы, паутину, коробки, рамку выделения, dragTarget).
     * @param {object} ctx - контекст
     */
    drawBoard(ctx) {
        if (!ctx.ctx) return;
           // Если фон устарел – перерисовываем его
    if (ctx._backgroundDirty && typeof ctx._drawBackground === 'function') {
        ctx._drawBackground();
    }

        // Скопировать кешированный фон
        if (!ctx._backgroundCanvas) {
            if (typeof ctx._drawBackground === 'function') ctx._drawBackground();
        }
        if (ctx._backgroundCanvas) {
            ctx.ctx.drawImage(ctx._backgroundCanvas, 0, 0);
        }

        const cw = ctx.cellWidth;
        const ch = ctx.cellHeight;
        const ctx2d = ctx.ctx;

        for (let r = 0; r < ctx.rows; r++) {
            for (let c = 0; c < ctx.cols; c++) {
                const x = c * cw;
                const y = r * ch;
                const cell = ctx.board[r][c];
                if (!cell || !cell.type) continue;
                const isLocked = cell.locked === true;
                const isPulsing = ctx.pulseItems.some(p => p.row === r && p.col === c);
                const isHovering = ctx.hoverCell && !ctx.isDragging &&
                                   ctx.hoverCell.row === r && ctx.hoverCell.col === c && !isLocked &&
                                   (this.canMergeToLevel(ctx, cell.typeIndex, cell.level) ||
                                    (ctx._isSpawnable && ctx._isSpawnable(ctx, cell)));
                const isHint = ctx.hintAnimations.some(h => h.row === r && h.col === c);

               if (!isPulsing && !isHint) {
                    const size = Math.min(cw, ch) * 0.9;
                    const offsetX = (cw - size) / 2;
                    const offsetY = (ch - size) / 2;
                    const spriteData = this.getSpriteData(ctx, cell);
                    if (spriteData) {
                        ctx2d.save();
                        if (isLocked) ctx2d.globalAlpha = 0.5;
                        ctx2d.drawImage(spriteData.image, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                                        x + offsetX, y + offsetY, size, size);
                        ctx2d.restore();
                    }
                }

                // Метка генератора (уголки) – если есть spawnRules на этом уровне
                const itemData = ctx._getItemData ? ctx._getItemData(cell.typeIndex) : null;
                const isGenerator = itemData && itemData.spawnable && itemData.spawnLevels && itemData.spawnLevels.includes(cell.level);
                if (isGenerator) {
                    const d = Math.min(cw, ch) * 0.1;
                    ctx2d.save();
                    ctx2d.strokeStyle = '#2a1f14';
                    ctx2d.lineWidth = 2;
                    ctx2d.beginPath();
                    ctx2d.moveTo(x + 4, y + 4 + d);
                    ctx2d.lineTo(x + 4, y + 4);
                    ctx2d.lineTo(x + 4 + d, y + 4);
                    ctx2d.stroke();
                    ctx2d.beginPath();
                    ctx2d.moveTo(x + cw - 4 - d, y + ch - 4);
                    ctx2d.lineTo(x + cw - 4, y + ch - 4);
                    ctx2d.lineTo(x + cw - 4, y + ch - 4 - d);
                    ctx2d.stroke();
                    ctx2d.restore();
                }

                // Таймер перезарядки
                if (cell && cell.charges !== undefined && cell.charges !== Infinity && cell.cooldownEnd > Date.now()) {
                    drawCooldownTimer(ctx2d, cell, x, y, cw, ch, Device.isMobile);
                }

                // Паутина
                if (isLocked) {
                    const webSprite = SpriteAtlas.getSprite('ui', 'ui/web.png');
                    if (webSprite) {
                        const webSize = Math.min(cw, ch) * 0.7;
                        const webOffsetX = (cw - webSize) / 2;
                        const webOffsetY = (ch - webSize) / 2;
                        ctx2d.save();
                        ctx2d.globalAlpha = 0.6;
                        ctx2d.drawImage(webSprite.image, webSprite.sx, webSprite.sy, webSprite.sw, webSprite.sh,
                                        x + webOffsetX, y + webOffsetY, webSize, webSize);
                        ctx2d.restore();
                    }
                }

                // Коробка
                if (cell && cell.covered === true) {
                    const boxSprite = SpriteAtlas.getSprite('ui', 'ui/box.png');
                    if (boxSprite) {
                        const size = Math.min(cw, ch) * 0.95;
                        const offsetX = (cw - size) / 2;
                        const offsetY = (ch - size) / 2;
                        ctx2d.save();
                        ctx2d.globalAlpha = 1.0;
                        ctx2d.drawImage(boxSprite.image, boxSprite.sx, boxSprite.sy, boxSprite.sw, boxSprite.sh,
                                        x + offsetX, y + offsetY, size, size);
                        ctx2d.restore();
                    }
                }
            }
        }

        // Рамка dragTarget
        if (ctx.dragTarget) {
            const { row, col } = ctx.dragTarget;
            const targetCell = ctx.board[row]?.[col];
            let showGlow = false;
            if (targetCell) {
                if (!targetCell.locked) {
                    showGlow = true;
                } else {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = row + dr, nc = col + dc;
                            if (nr >= 0 && nr < ctx.rows && nc >= 0 && nc < ctx.cols) {
                                const neighbor = ctx.board[nr]?.[nc];
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
                ctx2d.save();
                const isTargetLocked = targetCell && targetCell.locked === true;
                ctx2d.strokeStyle = isTargetLocked ? '#d4a373' : '#a77b50';
                ctx2d.lineWidth = Math.max(2, Math.min(cw, ch) * 0.04);
                ctx2d.setLineDash([6, 6]);
                ctx2d.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
                ctx2d.setLineDash([]);
                ctx2d.restore();
            }
        }
// Рамка hoverCell (если есть и не в режиме перетаскивания) когда предмет захвачен но не двигают его пока
 if (ctx.hoverCell && !ctx.isDragging) {
    const { row, col } = ctx.hoverCell;
    const x = col * cw;
    const y = row * ch;
    ctx2d.save();
    ctx2d.strokeStyle = '#a77b50';
    ctx2d.lineWidth = Math.max(2, Math.min(cw, ch) * 0.04);
    ctx2d.setLineDash([4, 4]);
    ctx2d.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
    ctx2d.setLineDash([]);
    ctx2d.restore();
}
        // Рамка выделения
        if (ctx.selectedCell) {
            const { row, col } = ctx.selectedCell;
            const x = col * cw;
            const y = row * ch;
            const frameSprite = SpriteAtlas.getSprite('ui', 'ui/kletkaramka.png');
            if (frameSprite) {
                ctx2d.save();
                ctx2d.drawImage(frameSprite.image, frameSprite.sx, frameSprite.sy, frameSprite.sw, frameSprite.sh,
                                x, y, cw, ch);
                ctx2d.restore();
            } else {
                // fallback
                ctx2d.save();
                ctx2d.strokeStyle = '#ac7d4f';
                ctx2d.lineWidth = Math.max(2, Math.min(cw, ch) * 0.04);
                ctx2d.strokeRect(x + 3, y + 3, cw - 6, ch - 6);
                const d = 8;
                ctx2d.lineWidth = Math.max(1.5, Math.min(cw, ch) * 0.03);
                ctx2d.strokeStyle = '#d4a373';
                ctx2d.beginPath();
                ctx2d.moveTo(x + 6, y + d);
                ctx2d.lineTo(x + 6, y + 6);
                ctx2d.lineTo(x + d, y + 6);
                ctx2d.stroke();
                ctx2d.beginPath();
                ctx2d.moveTo(x + cw - d, y + 6);
                ctx2d.lineTo(x + cw - 6, y + 6);
                ctx2d.lineTo(x + cw - 6, y + d);
                ctx2d.stroke();
                ctx2d.beginPath();
                ctx2d.moveTo(x + 6, y + ch - d);
                ctx2d.lineTo(x + 6, y + ch - 6);
                ctx2d.lineTo(x + d, y + ch - 6);
                ctx2d.stroke();
                ctx2d.beginPath();
                ctx2d.moveTo(x + cw - d, y + ch - 6);
                ctx2d.lineTo(x + cw - 6, y + ch - 6);
                ctx2d.lineTo(x + cw - 6, y + ch - d);
                ctx2d.stroke();
                ctx2d.restore();
            }
        }
    },

    // ----- ПОЛНАЯ ОТРИСОВКА (с анимациями подсказки, предметов, звёзд, пульсации) -----
    drawAll(ctx) {
        if (!ctx.ctx) return;
        this.drawBoard(ctx);

        // Подсказка: два предмета тянутся друг к другу
        if (ctx.hintAnimations && ctx.hintAnimations.length === 2) {
            const h1 = ctx.hintAnimations[0];
            const h2 = ctx.hintAnimations[1];
            const phase = ctx.hintPhase || 0;
            const moveDuration = 2;
            let effectivePhase = 0;
            let isPaused = false;
            if (phase < moveDuration) {
                const t = phase / moveDuration;
                effectivePhase = t * 2;
            } else {
                isPaused = true;
                effectivePhase = 0;
            }
            const amplitude = Math.min(ctx.cellWidth, ctx.cellHeight) * 0.06;
            const scaleAmp = 0.03;
            const offset = isPaused ? 0 : amplitude * Math.sin(effectivePhase * Math.PI * 2);
            const scale = isPaused ? 1 : 1 + scaleAmp * Math.sin(effectivePhase * Math.PI * 2);

            const drawHintItem = (h) => {
                const cell = ctx.board[h.row]?.[h.col];
                if (!cell || !cell.type || (cell.locked && cell.covered === true)) return;
                const x = h.col * ctx.cellWidth + ctx.cellWidth / 2;
                const y = h.row * ctx.cellHeight + ctx.cellHeight / 2;
                const tx = h.targetCol * ctx.cellWidth + ctx.cellWidth / 2;
                const ty = h.targetRow * ctx.cellHeight + ctx.cellHeight / 2;
                const dx = tx - x, dy = ty - y;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len === 0) return;
                const shiftX = (dx / len) * offset;
                const shiftY = (dy / len) * offset;
                const size = Math.min(ctx.cellWidth, ctx.cellHeight) * 0.85 * scale;
                const spriteData = this.getSpriteData(ctx, cell);
                if (!spriteData) return;
                ctx.ctx.save();
                ctx.ctx.translate(x + shiftX, y + shiftY);
                ctx.ctx.scale(scale, scale);
             if (!Device.isLowPerformance) {
                    const blur = Device.isMobile ? 5 : 10;
                    ctx.ctx.shadowColor = 'rgba(255, 215, 0, 0.2)';
                    ctx.ctx.shadowBlur = blur;
                }
                ctx.ctx.drawImage(spriteData.image, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                                  -size/2, -size/2, size, size);
                ctx.ctx.restore();
            };
            drawHintItem(h1);
            drawHintItem(h2);
        }

        // Анимации предметов (перемещение)
        for (const anim of ctx.itemAnimations) {
            const progress = anim.progress;
            const x = anim.startX + (anim.endX - anim.startX) * progress;
            const y = anim.startY + (anim.endY - anim.startY) * progress;
            const scale = anim.scale + (anim.targetScale - anim.scale) * progress;
            const size = Math.min(ctx.cellWidth, ctx.cellHeight) * scale;
            const tempItem = { typeIndex: anim.itemTypeIndex, level: anim.itemLevel };
            const spriteData = this.getSpriteData(ctx, tempItem);
            if (spriteData) {
                ctx.ctx.save();
                ctx.ctx.translate(x, y);
                ctx.ctx.scale(scale / anim.targetScale, scale / anim.targetScale);
         if (!Device.isLowPerformance) {
                const blur = Device.isMobile ? 5 : 10;
                ctx.ctx.shadowColor = 'rgba(255,255,255,0.1)';
                ctx.ctx.shadowBlur = blur;
            }
                ctx.ctx.drawImage(spriteData.image, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                                  -size/2, -size/2, size, size);
                ctx.ctx.restore();
            }
        }

        // Звёздочки
        for (let i = ctx.stars.length - 1; i >= 0; i--) {
            const s = ctx.stars[i];
            s.progress += s.speed;
            if (s.progress >= 1) {
                ctx.stars.splice(i, 1);
                continue;
            }
            s.alpha = 1 - s.progress;
            const x = s.x + (s.endX - s.x) * s.progress;
            const y = s.y + (s.endY - s.y) * s.progress;
            ctx.ctx.save();
            ctx.ctx.globalAlpha = s.alpha;
            ctx.ctx.fillStyle = '#ffffff';
        if (!Device.isLowPerformance) {
    const blur = Device.isMobile ? 6 : 12;
    ctx.ctx.shadowColor = '#ffffff';
    ctx.ctx.shadowBlur = blur;
}
            ctx.ctx.beginPath();
            const outerRadius = s.size;
            const innerRadius = s.size * 0.4;
            for (let j = 0; j < 8; j++) {
                const radius = j % 2 === 0 ? outerRadius : innerRadius;
                const angle = (j / 8) * Math.PI * 2 - Math.PI / 2;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                if (j === 0) ctx.ctx.moveTo(px, py);
                else ctx.ctx.lineTo(px, py);
            }
            ctx.ctx.closePath();
            ctx.ctx.fill();
            ctx.ctx.restore();
        }

        this.drawPulseEffects(ctx);

    },

    drawPulseEffects(ctx) {
        if (ctx.pulseItems.length === 0 || !ctx.ctx) return;
        const cw = ctx.cellWidth;
        const ch = ctx.cellHeight;
        for (const p of ctx.pulseItems) {
            const item = ctx.board[p.row]?.[p.col];
            if (!item || !item.type) continue;
            const x = p.col * cw + cw / 2;
            const y = p.row * ch + ch / 2;
            const scale = 1 + (p.maxScale - 1) * Math.sin(p.progress * Math.PI);
            const size = Math.min(cw, ch) * 0.85 * scale;
            const spriteData = this.getSpriteData(ctx, item);
            if (!spriteData) continue;
            ctx.ctx.save();
            ctx.ctx.translate(x, y);
            ctx.ctx.scale(scale, scale);
       if (!Device.isLowPerformance) {
    const blur = Device.isMobile ? 8 : 15;
    ctx.ctx.shadowColor = 'rgba(255, 176, 124, 0.3)';
    ctx.ctx.shadowBlur = blur;
}
            ctx.ctx.drawImage(spriteData.image, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                              -size/2, -size/2, size, size);
            ctx.ctx.restore();
        }
    },

    // ----- АНИМАЦИОННЫЙ ЦИКЛ -----
animateLoop(ctx) {
    if (ctx._loopActive || !ctx.isRunning) return;
    ctx._loopActive = true;

    const loop = (timestamp) => {
        if (!ctx.isRunning) {
            ctx._loopActive = false;
            ctx._animationFrameId = null;
            return;
        }

        // Ограничение FPS – оставляем
        if (timestamp - ctx._lastFrameTime < 1000 / ctx._fpsLimit) {
            ctx._animationFrameId = requestAnimationFrame(loop);
            return;
        }
        ctx._lastFrameTime = timestamp;

        if (!ctx.isPaused) {
            if (typeof ctx.updateCooldowns === 'function') ctx.updateCooldowns();
            BoardCore.updatePulses(ctx);
            if (ctx.itemAnimations.length > 0) {
                BoardCore.updateItemAnimations(ctx);
            }
            if (ctx.hintAnimations && ctx.hintAnimations.length > 0) {
                ctx.hintPhase = (ctx.hintPhase || 0) + 0.006;
                if (ctx.hintPhase > 1) ctx.hintPhase = 0;
            }
        }

        BoardCore.drawAll(ctx);

        if (ctx.isRunning) {
            ctx._animationFrameId = requestAnimationFrame(loop);
        } else {
            ctx._loopActive = false;
            ctx._animationFrameId = null;
        }
    };

    ctx._animationFrameId = requestAnimationFrame(loop);
},


    // ----- ОБНОВЛЕНИЕ АНИМАЦИЙ ПУЛЬСАЦИИ -----
    updatePulses(ctx) {
        for (let i = ctx.pulseItems.length - 1; i >= 0; i--) {
            const p = ctx.pulseItems[i];
            p.progress += p.speed * p.direction;
            if (p.direction === 1 && p.progress >= 1) {
                p.direction = -1;
                p.progress = 1;
            } else if (p.direction === -1 && p.progress <= 0) {
                ctx.pulseItems.splice(i, 1);
                continue;
            }
            const item = ctx.board[p.row]?.[p.col];
            if (!item) {
                ctx.pulseItems.splice(i, 1);
            }
        }
    },

    // ----- ОБНОВЛЕНИЕ АНИМАЦИЙ ПРЕДМЕТОВ (перемещение, спавн) -----
    updateItemAnimations(ctx) {
        for (let i = ctx.itemAnimations.length - 1; i >= 0; i--) {
            const anim = ctx.itemAnimations[i];
            anim.progress += anim.speed;
            if (anim.progress >= 1) {
                anim.progress = 1;
                if (!anim.added) {
                    if (anim.itemObject) {
                        // Обмен местами
                        ctx.board[anim.toRow][anim.toCol] = anim.itemObject;
                    } else {
                        // Создание нового предмета
                        const newItem = {
                            type: anim.itemType,
                            typeIndex: anim.itemTypeIndex,
                            level: anim.itemLevel,
                            merged: false,
                            row: anim.toRow,
                            col: anim.toCol,
                            locked: false,
                        };
                        ctx.board[anim.toRow][anim.toCol] = newItem;
                        // ★ Если это ивент – добавляем уровень в openedLevels
if (ctx._activeEvent && ctx._eventState && !ctx._eventState.openedLevels.includes(anim.itemLevel)) {
    ctx._eventState.openedLevels.push(anim.itemLevel);
    if (typeof ctx._renderEventProgress === 'function') {
        ctx._renderEventProgress();
    }
    if (typeof ctx._saveState === 'function') {
        ctx._saveState();
    }
}
                                                if (typeof ctx._updateSpawnerCache === 'function') {
                            ctx._updateSpawnerCache();
                        }
                        if (typeof ctx.initGeneratorFields === 'function') {
                            ctx.initGeneratorFields(newItem, newItem.typeIndex, newItem.level);
                        }
                        // Добавить в коллекцию, если есть
                        if (typeof CollectionManager !== 'undefined') {
                            // Для Game: CollectionManager.onItemCreated(typeIndex, level)
                            // Для Event: CollectionManager.onItemCreated(typeIndex, level, eventId)
                            if (ctx._activeEvent) {
                                CollectionManager.onItemCreated(newItem.typeIndex, newItem.level, ctx._activeEvent.id);
                            } else {
                                CollectionManager.onItemCreated(newItem.typeIndex, newItem.level);
                            }
                        }
                    }
                    anim.added = true;
                    this.addPulse(ctx, anim.toRow, anim.toCol, 0.5, 1.1);
                    this.spawnStars(ctx, anim.toRow, anim.toCol);
                    if (typeof ctx.saveBoardState === 'function') ctx.saveBoardState();
                    else if (typeof ctx._saveState === 'function') ctx._saveState();
                }
                ctx.itemAnimations.splice(i, 1);
                if (ctx.itemAnimations.length === 0) {
                    ctx.processingClick = false;
                }
            }
        }
    },

    // ----- ЗВЁЗДОЧКИ -----
    spawnStars(ctx, row, col) {
         // Если звёзд уже больше 30 – пропускаем создание новых
    if (ctx.stars.length > 30) return;

        const cx = col * ctx.cellWidth + ctx.cellWidth / 2;
        const cy = row * ctx.cellHeight + ctx.cellHeight / 2;
        const count = Device.isMobile ? 3 : 6;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const size = 4 + Math.random() * 6;
            ctx.stars.push({
                x: cx, y: cy,
                endX: cx + Math.cos(angle) * distance,
                endY: cy + Math.sin(angle) * distance,
                size, progress: 0,
                speed: 0.03 + Math.random() * 0.02,
                alpha: 1,
            });
        }
           
    },

    // ----- КОНФЕТТИ -----
    spawnConfetti(ctx, row, col) {
        if (ctx.particlesRunning) return;
        ctx.particlesRunning = true;
    
        const colors = ['#ffb07c', '#90d1fd', '#4f8d08', '#fa9be2', '#ffaa66', '#ffe066', '#79f87f', '#695ff5'];
        const count = Device.isMobile ? 5 : 40;
        const particles = [];
        const cx = col * ctx.cellWidth + ctx.cellWidth / 2;
        const cy = row * ctx.cellHeight + ctx.cellHeight / 2;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const size = 3 + Math.random() * 5;
            particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size, color: colors[Math.floor(Math.random() * colors.length)],
                life: 1, decay: 0.006 + Math.random() * 0.012,
                gravity: 0.05,
            });
        }
        const animateConfetti = () => {
            if (particles.length === 0) {
                ctx.particlesRunning = false;
                         ctx.pulseItems = ctx.pulseItems.filter(p => !(p.row === row && p.col === col));
                return;
            }
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
            const ctx2d = ctx.ctx;
            ctx2d.save();
            for (const p of particles) {
                ctx2d.globalAlpha = p.life;
                ctx2d.fillStyle = p.color;
                ctx2d.beginPath();
                ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx2d.fill();
            }
            ctx2d.restore();
            requestAnimationFrame(animateConfetti);
        };
        animateConfetti();

    },

    // ----- ПУЛЬСАЦИЯ -----
    addPulse(ctx, row, col, duration = 0.3, maxScale = 1.2) {
        // На мобильных разрешаем не более 3 пульсаций одновременно
    const limit = Device.isMobile ? 3 : 5;
    if (ctx.pulseItems.length >= limit) return;
    // На мобильных уменьшаем максимальный масштаб для экономии графики
    if (Device.isMobile && maxScale > 1.1) maxScale = 1.1;

        const existing = ctx.pulseItems.find(p => p.row === row && p.col === col);
        if (existing) return;
        const speed = 1 / (duration * 25);
        ctx.pulseItems.push({
            row, col,
            progress: 0,
            speed,
            direction: 1,
            maxScale,
        });
          
    },

    // ----- АНИМАЦИЯ ПЕРЕМЕЩЕНИЯ ПРЕДМЕТА (из клетки в клетку) -----
    addItemAnimation(ctx, fromRow, fromCol, toRow, toCol, item) {
        const level = Number(item.level);
        if (isNaN(level)) {
            item.level = 1;
        }
        const startX = fromCol * ctx.cellWidth + ctx.cellWidth / 2;
        const startY = fromRow * ctx.cellHeight + ctx.cellHeight / 2;
        const endX = toCol * ctx.cellWidth + ctx.cellWidth / 2;
        const endY = toRow * ctx.cellHeight + ctx.cellHeight / 2;
        ctx.itemAnimations.push({
            startX, startY, endX, endY,
            progress: 0,
            speed: 0.025,
            itemType: item.type,
            itemTypeIndex: item.typeIndex,
            itemLevel: item.level,
            toRow, toCol,
            added: false,
            scale: 0.1,
            targetScale: 0.85,
        });
           
    },

    // ----- АНИМАЦИЯ ПЕРЕМЕЩЕНИЯ ПРЕДМЕТА ИЗ ПРОИЗВОЛЬНОЙ ТОЧКИ -----
    addItemAnimationFromPoint(ctx, startX, startY, toRow, toCol, item) {
        const endX = toCol * ctx.cellWidth + ctx.cellWidth / 2;
        const endY = toRow * ctx.cellHeight + ctx.cellHeight / 2;
        ctx.itemAnimations.push({
            startX, startY, endX, endY,
            progress: 0,
            speed: 0.015,
            itemType: item.type,
            itemTypeIndex: item.typeIndex,
            itemLevel: item.level,
            toRow, toCol,
            added: false,
            scale: 0.1,
            targetScale: 0.85,
        });
             
    },

    // ----- ПОЛУЧЕНИЕ СПРАЙТА -----
    getSpriteData(ctx, item) {
        const level = item.level || 1;
        const typeIndex = item.typeIndex || 0;
        let name;
        let itemDataArray;
        if (ctx._eventItemData) {
            // EventManager
            itemDataArray = ctx._eventItemData;
            name = itemDataArray[typeIndex]?.name;
        } else {
            // Game
            itemDataArray = ctx.itemData;
            name = itemDataArray[typeIndex]?.name;
        }
        if (!name) return null;

        const cacheKey = `${typeIndex}_${level}`;
        if (ctx._spriteCache[cacheKey] !== undefined) {
            return ctx._spriteCache[cacheKey];
        }

        let atlasName = 'items';
        let spriteName = `items/level${level}/${name}.png`;
        // Для ивента используем атлас events, если активен
        if (ctx._activeEvent && ctx._eventItemTypeIndex === typeIndex) {
            atlasName = 'events';
            spriteName = `events/${ctx._activeEvent.id}${level}.png`;
        }

        const sprite = SpriteAtlas.getSprite(atlasName, spriteName);
        if (sprite) {
            ctx._spriteCache[cacheKey] = sprite;
            return sprite;
        } else {
            ctx._spriteCache[cacheKey] = null;
            return null;
        }
    },

    // ----- DATAURL ДЛЯ ПРЕДМЕТА -----
getItemImageDataUrl(ctx, typeIndex, level) {
    // --- КЭШ: создаём, если нет ---
    if (!ctx._dataUrlCache) ctx._dataUrlCache = {};

    const cacheKey = `${typeIndex}_${level}`;
    if (ctx._dataUrlCache[cacheKey]) {
        return ctx._dataUrlCache[cacheKey];
    }

    const spriteData = this.getSpriteData(ctx, { typeIndex, level });
    if (!spriteData) return null;

    try {
        const canvas = document.createElement('canvas');
        const ctx2d = canvas.getContext('2d');
        canvas.width = spriteData.sw;
        canvas.height = spriteData.sh;
        ctx2d.drawImage(spriteData.image, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh, 0, 0, spriteData.sw, spriteData.sh);
        const dataUrl = canvas.toDataURL('image/png');
        ctx._dataUrlCache[cacheKey] = dataUrl;
        return dataUrl;
    } catch (e) {
        return null;
    }
},

    // ----- ПОИСК СВОБОДНОЙ КЛЕТКИ -----
    findFreeCell(ctx) {
        for (let r = 0; r < ctx.rows; r++) {
            for (let c = 0; c < ctx.cols; c++) {
                const cell = ctx.board[r]?.[c];
                if (!cell || !cell.type) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    },

    // ----- ПРОВЕРКА ВОЗМОЖНОСТИ ОБЪЕДИНЕНИЯ -----
    canMergeToLevel(ctx, typeIndex, currentLevel) {
        const nextLevel = currentLevel + 1;
        let maxLevels;
        if (ctx._eventMaxLevels) {
            maxLevels = ctx._eventMaxLevels[typeIndex] || 1;
        } else if (ctx.maxLevels) {
            maxLevels = ctx.maxLevels[typeIndex] || 1;
        } else {
            maxLevels = 1;
        }
        return nextLevel <= maxLevels;
    },

    // ----- ТАЙМЕР БЕЗДЕЙСТВИЯ (подсказка) -----
    startInactivityTimer(ctx) {
        if (!ctx.isRunning) {
            clearTimeout(ctx.inactivityTimer);
            return;
        }
        clearTimeout(ctx.inactivityTimer);
        ctx.inactivityTimer = setTimeout(() => {
            if (ctx.isRunning && !ctx.isDragging && !ctx.processingClick) {
                if (typeof ctx.findHintPair === 'function') {
                    ctx.findHintPair();
                } else {
                    this.findHintPair(ctx);
                }
            }
            this.startInactivityTimer(ctx);
        }, ctx.inactivityTimeout || 10000);
    },

    resetInactivityTimer(ctx) {
        clearTimeout(ctx.inactivityTimer);
        this.startInactivityTimer(ctx);
    },

    // ----- ПОИСК ПАРЫ ДЛЯ ПОДСКАЗКИ -----
    findHintPair(ctx) {
        // Поиск открытой + заблокированной соседней
        for (let r = 0; r < ctx.rows; r++) {
            for (let c = 0; c < ctx.cols; c++) {
                const cell = ctx.board[r]?.[c];
                if (!cell || cell.locked || !cell.type) continue;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr < 0 || nr >= ctx.rows || nc < 0 || nc >= ctx.cols) continue;
                        const neighbor = ctx.board[nr]?.[nc];
                        if (!neighbor || !neighbor.locked || !neighbor.type || neighbor.covered === true) continue;
                        if (cell.type === neighbor.type && cell.level === neighbor.level) {
                            if (this.canMergeToLevel(ctx, cell.typeIndex, cell.level)) {
                                ctx.hintAnimations = [
                                    { row: r, col: c, targetRow: nr, targetCol: nc },
                                    { row: nr, col: nc, targetRow: r, targetCol: c }
                                ];
                                ctx.hintPhase = 0;
                                   
                                return;
                            }
                        }
                    }
                }
            }
        }
        // Поиск двух открытых
        for (let r1 = 0; r1 < ctx.rows; r1++) {
            for (let c1 = 0; c1 < ctx.cols; c1++) {
                const cell1 = ctx.board[r1]?.[c1];
                if (!cell1 || cell1.locked) continue;
                for (let r2 = 0; r2 < ctx.rows; r2++) {
                    for (let c2 = 0; c2 < ctx.cols; c2++) {
                        if (r1 === r2 && c1 === c2) continue;
                        const cell2 = ctx.board[r2]?.[c2];
                        if (!cell2 || cell2.locked) continue;
                        if (cell1.type === cell2.type && cell1.level === cell2.level) {
                            if (this.canMergeToLevel(ctx, cell1.typeIndex, cell1.level)) {
                                ctx.hintAnimations = [
                                    { row: r1, col: c1, targetRow: r2, targetCol: c2 },
                                    { row: r2, col: c2, targetRow: r1, targetCol: c1 }
                                ];
                                ctx.hintPhase = 0;
                                   
                                return;
                            }
                        }
                    }
                }
            }
        }
        ctx.hintAnimations = [];
    },

    // ----- КОРОБКА ИСЧЕЗАЕТ (анимация) -----
    showBoxDisappear(ctx, row, col) {
        if (Device.isMobile) {
            if (ctx.board[row] && ctx.board[row][col]) {
                ctx.board[row][col].covered = false;
                this.drawBoard(ctx);
            }
            return;
        }
        const boxSprite = SpriteAtlas.getSprite('ui', 'ui/box.png');
        let boxSrc = null;
        if (boxSprite) {
            try {
                const canvas = document.createElement('canvas');
                const c = canvas.getContext('2d');
                canvas.width = boxSprite.sw;
                canvas.height = boxSprite.sh;
                c.drawImage(boxSprite.image, boxSprite.sx, boxSprite.sy, boxSprite.sw, boxSprite.sh, 0, 0, boxSprite.sw, boxSprite.sh);
                boxSrc = canvas.toDataURL('image/png');
            } catch (e) {
                console.warn('[BoardCore] Ошибка dataURL для box', e);
            }
        }
        if (!boxSrc) {
            if (ctx.board[row] && ctx.board[row][col]) {
                ctx.board[row][col].covered = false;
                this.drawBoard(ctx);
            }
            return;
        }
        const key = `${row}_${col}`;
        if (ctx._boxAnimations && ctx._boxAnimations.has(key)) return;
        if (!ctx._boxAnimations) ctx._boxAnimations = new Set();
        ctx._boxAnimations.add(key);

        const canvasRect = ctx.canvas.getBoundingClientRect();
        const x = col * ctx.cellWidth;
        const y = row * ctx.cellHeight;
        const size = Math.min(ctx.cellWidth, ctx.cellHeight) * 0.85;
        const offsetX = (ctx.cellWidth - size) / 2;
        const offsetY = (ctx.cellHeight - size) / 2;
        const left = canvasRect.left + x + offsetX;
        const top = canvasRect.top + y + offsetY;
        const width = size;
        const height = size;

        const el = document.createElement('img');
        el.src = boxSrc;
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

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (ctx.board[row] && ctx.board[row][col]) {
                    ctx.board[row][col].covered = false;
                    this.drawBoard(ctx);
                }
            });
        });

        setTimeout(() => {
            AudioManager.play('box_disappear');
            el.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.2) rotate(10deg)';
        }, 1000);

      setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (ctx && ctx._boxAnimations) ctx._boxAnimations.delete(key);
        }, 4500);
    },

    // ----- ОТКРЫТИЕ СОСЕДНИХ КЛЕТОК (снятие коробок) -----
    uncoverNeighbors(ctx, row, col, animate = false) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (let d of dirs) {
            const nr = row + d[0];
            const nc = col + d[1];
            if (nr < 0 || nr >= ctx.rows || nc < 0 || nc >= ctx.cols) continue;
            const cell = ctx.board[nr][nc];
            if (cell && cell.locked && cell.covered === true) {
                if (animate) {
                    this.showBoxDisappear(ctx, nr, nc);
                } else {
                    cell.covered = false;
                }
            }
        }
    },
updateDragGhost(ctx, clientX, clientY, item) {
    const ghostId = ctx._dragGhostId || 'drag-ghost';
    let ghost = document.getElementById(ghostId);
    
    if (!item) {
        if (ghost) {
            ghost.style.display = 'none';
            // НЕ удаляем innerHTML, чтобы сохранить структуру
        }
        return;
    }
    
    if (!ghost) {
        ghost = document.createElement('div');
        ghost.id = ghostId;
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '99999';
        ghost.style.transform = 'translate(-50%, -50%)';
        ghost.style.display = 'block';
         ghost.style.willChange = 'transform, left, top'; 

        // Создаём img один раз
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        ghost.appendChild(img);
        document.body.appendChild(ghost);
    }
    
    // Гарантируем наличие img
    let img = ghost.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        ghost.appendChild(img);
    }
    
    const size = Math.min(ctx.cellWidth || 40, ctx.cellHeight || 40) * 0.85;
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';
    ghost.style.width = Math.max(size, 10) + 'px';
    ghost.style.height = Math.max(size, 10) + 'px';
    ghost.style.display = 'block';
    
    const imgSrc = this.getItemImageDataUrl(ctx, item.typeIndex, item.level);
    img.src = imgSrc || '';
},

    // ----- ИНИЦИАЛИЗАЦИЯ ПОЛЕЙ ГЕНЕРАТОРА (общая для Game и Event) -----
    initGeneratorFields(ctx, cell, typeIndex, level) {
        let itemData;
        if (ctx._eventItemData) {
            itemData = ctx._eventItemData[typeIndex];
        } else {
            itemData = ctx.itemData[typeIndex];
        }
        if (!itemData || !itemData.spawnable) return;
        let ruleObj = null;
        if (itemData.spawnRules && itemData.spawnRules[level]) {
            ruleObj = {
                types: itemData.spawnRules[level].types || [],
                infinite: itemData.spawnRules[level].infinite === true
            };
        }
        if (!ruleObj) return;
        cell.charges = ruleObj.infinite ? Infinity : MAX_CHARGES;
        cell.maxCharges = MAX_CHARGES;
        cell.cooldownEnd = 0;
    },

    // ----- ОБНОВЛЕНИЕ КУЛДАУНОВ ГЕНЕРАТОРОВ -----
    updateCooldowns(ctx) {
        const now = Date.now();
        for (let r = 0; r < ctx.rows; r++) {
            for (let c = 0; c < ctx.cols; c++) {
                const cell = ctx.board[r]?.[c];
                if (cell && cell.charges !== undefined && cell.charges !== Infinity && cell.cooldownEnd > 0) {
                    if (cell.cooldownEnd <= now) {
                        cell.charges = cell.maxCharges || MAX_CHARGES;
                        cell.cooldownEnd = 0;
                    }
                }
            }
        }
    },

    // ----- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ГЕНЕРАТОРАМИ -----
    /**
     * Получить правила спавна для предмета на указанном уровне.
     * @param {object} ctx - контекст (Game или EventManager)
     * @param {object} itemData - данные предмета (из ctx.itemData или ctx._eventItemData)
     * @param {number} level - уровень предмета
     * @returns {object|null} { types: [...], infinite: boolean } или null
     */
    getSpawnRulesForLevel(ctx, itemData, level) {
        if (!itemData || !itemData.spawnable) return null;
        const rules = itemData.spawnRules;
        if (!rules) return null;
        const rule = rules[level];
        if (!rule) return null;
        return {
            types: rule.types || [],
            infinite: rule.infinite === true
        };
    },

    /**
     * Проверяет, находится ли генератор на перезарядке.
     * @param {object} ctx - контекст (не используется, но для единообразия)
     * @param {object} cell - объект клетки
     * @returns {boolean}
     */
    isGeneratorOnCooldown(ctx, cell) {
        if (!cell || cell.charges === undefined) return false;
        if (cell.charges === Infinity) return false;
        return cell.charges <= 0 && cell.cooldownEnd > Date.now();
    },


        // ----- УДАЛЕНИЕ ПРЕДМЕТА -----
    /**
     * Удаляет предмет с доски (с анимацией звёздочек) и сбрасывает выделение.
     * @param {object} ctx - контекст (Game или EventManager)
     * @param {number} row
     * @param {number} col
     */
    deleteItem(ctx, row, col) {
        const cell = ctx.board[row]?.[col];
        if (!cell || !cell.type) return;
        this.spawnStars(ctx, row, col);
        ctx.board[row][col] = { locked: false, row, col };
        ctx.selectedCell = null;
        if (typeof ctx.saveBoardState === 'function') ctx.saveBoardState();
        else if (typeof ctx._saveState === 'function') ctx._saveState();
        if (typeof ctx.updateUI === 'function') ctx.updateUI();
        if (typeof ctx.updateInfoPanel === 'function') ctx.updateInfoPanel();
        // внутри updateItemAnimations, после ctx.board[anim.toRow][anim.toCol] = newItem;
if (typeof ctx._updateSpawnerCache === 'function') {
    ctx._updateSpawnerCache();
}
    },

        // ----- ОБНОВЛЕНИЕ ИНФО-ПАНЕЛИ (МОДАЛКА С ПОДСКАЗКОЙ) -----
    /**
     * Обновляет нижнюю информационную панель (модалку) в зависимости от выделения.
     * @param {object} ctx - контекст (Game или EventManager)
     */
updateInfoPanel(ctx) {
    if (typeof ModalManager === 'undefined') return;

    // Находим правильный контейнер
    let targetContainer;
    if (ctx._activeEvent) {
        targetContainer = document.getElementById('event-info-modal-container');
    } else {
        targetContainer = document.getElementById('info-modal-container');
    }
    // Если контейнер не найден, создаём fallback
    if (!targetContainer) {
        targetContainer = document.createElement('div');
        targetContainer.id = ctx._activeEvent ? 'event-info-modal-container' : 'info-modal-container';
        // Вставляем в нужное место (для игры в #left-panel, для ивента в #event-left-panel)
        if (ctx._activeEvent) {
            document.getElementById('event-left-panel')?.appendChild(targetContainer);
        } else {
            document.getElementById('left-panel')?.appendChild(targetContainer);
        }
    }
    // Принудительно делаем видимым и кликабельным
    targetContainer.style.display = 'flex';
    targetContainer.style.pointerEvents = 'auto';

    if (ModalManager._infoContainer !== targetContainer) {
        ModalManager._infoContainer = targetContainer;
    }
    //  console.log('[BoardCore.updateInfoPanel] ctx._activeEvent:', !!ctx._activeEvent, 'targetContainer:', targetContainer ? targetContainer.id : 'null');
    if (targetContainer && ModalManager._infoContainer !== targetContainer) {
        ModalManager._infoContainer = targetContainer;
      //  console.log('[BoardCore.updateInfoPanel] Установлен контейнер:', targetContainer.id);
    }
  //   console.log('[BoardCore.updateInfoPanel] ModalManager._infoContainer после установки:', ModalManager._infoContainer ? ModalManager._infoContainer.id : 'null');

        if (ctx.selectedCell) {
            const { row, col } = ctx.selectedCell;
            if (typeof ctx.showItemInfo === 'function') {
                ctx.showItemInfo(row, col);
            } else {
                // fallback – если showItemInfo не определён, просто показываем заглушку
                const hintTitle = getText('hint_title', 'Подсказка');
                const hintText = getText('hint_press_item', 'НАЖМИТЕ на предмет');
                ModalManager.showInfoModal({
                    title: hintTitle,
                    description: `<div style="display:flex; align-items:center; gap:1rem; justify-content:center;">
                                    <div class="info-question-mark">?</div>
                                    <div style="text-align:center;">${hintText}</div>
                                 </div>`,
                    showHelp: false,
                    showTrash: false,
                });
            }
        } else {
            const hintTitle = getText('hint_title', 'Подсказка');
            const hintText = getText('hint_press_item', 'НАЖМИТЕ на предмет');
            const questionHtml = `<div class="info-question-mark">?</div>`;
            const bodyHtml = `
                <div style="display:flex; align-items:center; gap:clamp(0.5rem,1vw,1.5rem); height:100%; padding:0.2rem; justify-content:center; width:100%;">
                    ${questionHtml}
                    <div style="flex:1; text-align:center; font-size:inherit; line-height:1.3;">${hintText}</div>
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

    // ----- ОТКРЫТИЕ ИНФО О ПРЕДМЕТЕ ПО ДАННЫМ (БЕЗ КООРДИНАТ) -----
    /**
     * Показывает модалку с подробной информацией о предмете по его типу и уровню.
     * @param {object} ctx - контекст
     * @param {number} typeIndex
     * @param {number} level
     * @param {Function} buildInfoHTML - функция, которая принимает объект cell и возвращает HTML (специфичная для Game/Event)
     */
  showItemInfoByData(ctx, typeIndex, level, buildInfoHTML) {
    if (typeof ModalManager === 'undefined') return;
    // Получаем имя предмета
    let name = 'Предмет';
    if (ctx._eventItemData) {
        const item = ctx._eventItemData[typeIndex];
        if (item) {
            const lang = currentLang || 'ru';
            name = item.displayName ? item.displayName[lang] : ('Предмет ' + typeIndex);
        }
    } else if (ctx.itemData) {
        name = getItemName(typeIndex, level);
    }
    const cell = { typeIndex, level, locked: false, type: 'dummy' };
   const fullElement = buildInfoHTML(cell);
    ModalManager.showCenterModal({
        title: name,
        bodyElement: fullElement,
        buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }]
    });
},



};

// Глобальный доступ
window.BoardCore = BoardCore;