//  RESIZE MANAGER  – адаптация доски для Game и Event
// ============================================================
const ResizeManager = {
    context: null,

    init(context) {
        this.context = context;
    },

    // ---- РЕСАЙЗ (вызывается извне) ----
handleResize() {
    const ctx = this.context;
    if (!ctx) return;
    const { rows: newRows, cols: newCols, isMobile } = computeBoardSize();

    const options = {
        onSave: () => {
            if (typeof ctx.saveBoardState === 'function') ctx.saveBoardState();
            else if (typeof ctx._saveState === 'function') ctx._saveState();
        },
        onAfterResize: (c) => {
            if (c === Game) BoardCore.findHintPair(c);
        },
        onUIUpdate: (c) => {
            if (typeof c.updateUI === 'function') c.updateUI();
        }
    };
    this.reshapeBoard(ctx, newRows, newCols, options);
},

    // ---- Ресайз для Game (перестройка доски) ----
  /* _reshapeBoardGame(newRows, newCols) {
        const game = this.context;
        if (!game) return;

        // Сброс перетаскивания и блокировки
        if (game.isDragging && game.dragStart) {
            game.board[game.dragStart.row][game.dragStart.col] = game.dragStart.item;
        }
        game.isDragging = false;
        game.dragStart = null;
        game.dragTarget = null;
        game.selectedItem = null;
        game.processingClick = false;
        BoardCore.updateDragGhost(game, 0, 0, null);

        if (game.rows === newRows && game.cols === newCols) return;

        const oldRows = game.rows;
        const oldCols = game.cols;
        const oldBoard = game.board;

        // Создаём новую доску
        const newBoard = [];
        for (let r = 0; r < newRows; r++) {
            newBoard[r] = [];
            for (let c = 0; c < newCols; c++) {
                newBoard[r][c] = { locked: false, row: r, col: c };
            }
        }

        // Копируем предметы
        for (let r = 0; r < Math.min(oldRows, newRows); r++) {
            for (let c = 0; c < Math.min(oldCols, newCols); c++) {
                if (oldBoard[r] && oldBoard[r][c] && oldBoard[r][c].type) {
                    newBoard[r][c] = { ...oldBoard[r][c], row: r, col: c };
                }
            }
        }

        // Перенос правых столбцов вниз
        if (oldCols > newCols) {
            const extraCols = oldCols - newCols;
            for (let ec = 0; ec < extraCols; ec++) {
                const oldC = newCols + ec;
                const newR = oldRows + ec;
                if (!newBoard[newR]) newBoard[newR] = [];
                for (let r = 0; r < oldRows; r++) {
                    if (oldBoard[r] && oldBoard[r][oldC] && oldBoard[r][oldC].type) {
                        if (!newBoard[newR][r]) newBoard[newR][r] = { locked: false, row: newR, col: r };
                        newBoard[newR][r] = { ...oldBoard[r][oldC], row: newR, col: r };
                    }
                }
            }
        }

        // Перенос нижних строк вправо
        if (oldRows > newRows) {
            const extraRows = oldRows - newRows;
            for (let er = 0; er < extraRows; er++) {
                const oldR = newRows + er;
                const newC = oldCols + er;
                for (let c = 0; c < oldCols; c++) {
                    if (oldBoard[oldR] && oldBoard[oldR][c] && oldBoard[oldR][c].type) {
                        if (!newBoard[c]) newBoard[c] = [];
                        if (!newBoard[c][newC]) newBoard[c][newC] = { locked: false, row: c, col: newC };
                        newBoard[c][newC] = { ...oldBoard[oldR][c], row: c, col: newC };
                    }
                }
            }
        }

        game.rows = newRows;
        game.cols = newCols;
        game.board = newBoard;

        // Сброс выделения
        if (game.selectedCell) {
            const { row, col } = game.selectedCell;
            if (row >= newRows || col >= newCols) {
                game.selectedCell = null;
            }
        }

        // Перерисовка
        BoardCore.initCanvas(game, 'game-board', 'game-canvas');
     game._drawBackground();
     this._backgroundDirty = false;
        BoardCore.drawBoard(game);
        BoardCore.findHintPair(game);
    },*/

    // resize.js – дополняем объект ResizeManager

reshapeBoard(ctx, newRows, newCols, options = {}) {
    const { onSave, onAfterResize, onUIUpdate, skipBackgroundDirty } = options;

    // Сброс перетаскивания
    if (ctx.isDragging && ctx.dragStart) {
        ctx.board[ctx.dragStart.row][ctx.dragStart.col] = ctx.dragStart.item;
    }
    ctx.isDragging = false;
    ctx.dragStart = null;
    ctx.dragTarget = null;
    ctx.selectedItem = null;
    ctx.processingClick = false;
    BoardCore.updateDragGhost(ctx, 0, 0, null);

    const oldRows = ctx.rows;
    const oldCols = ctx.cols;

    // ---- Если размеры не изменились, просто пересчитываем канвас ----
    if (oldRows === newRows && oldCols === newCols) {
        const containerId = ctx._activeEvent ? 'event-board' : 'game-board';
        const canvasId = ctx._activeEvent ? 'event-canvas' : 'game-canvas';
        BoardCore.initCanvas(ctx, containerId, canvasId);
        if (typeof ctx._drawBackground === 'function') {
            ctx._drawBackground();
        }
        if (!skipBackgroundDirty && ctx._backgroundDirty !== undefined) {
            ctx._backgroundDirty = false;
        }
        BoardCore.drawBoard(ctx);
        if (typeof onAfterResize === 'function') onAfterResize(ctx);
        if (typeof onUIUpdate === 'function') onUIUpdate(ctx);
        if (typeof onSave === 'function') onSave(ctx);
        return;
    }

    // ---- Перестраиваем доску (размеры изменились) ----
    const oldBoard = ctx.board; // ⬅️ ВАЖНО: объявляем oldBoard

    // 2. Создание новой доски
    const newBoard = [];
    for (let r = 0; r < newRows; r++) {
        newBoard[r] = [];
        for (let c = 0; c < newCols; c++) {
            newBoard[r][c] = { locked: false, row: r, col: c };
        }
    }

    // 3. Копирование предметов из старой доски
    for (let r = 0; r < Math.min(oldRows, newRows); r++) {
        for (let c = 0; c < Math.min(oldCols, newCols); c++) {
            if (oldBoard[r] && oldBoard[r][c] && oldBoard[r][c].type) {
                newBoard[r][c] = { ...oldBoard[r][c], row: r, col: c };
            }
        }
    }

    // 4. Перенос правых столбцов вниз
    if (oldCols > newCols) {
        const extraCols = oldCols - newCols;
        for (let ec = 0; ec < extraCols; ec++) {
            const oldC = newCols + ec;
            const newR = oldRows + ec;
            if (!newBoard[newR]) newBoard[newR] = [];
            for (let r = 0; r < oldRows; r++) {
                if (oldBoard[r] && oldBoard[r][oldC] && oldBoard[r][oldC].type) {
                    if (!newBoard[newR][r]) newBoard[newR][r] = { locked: false, row: newR, col: r };
                    newBoard[newR][r] = { ...oldBoard[r][oldC], row: newR, col: r };
                }
            }
        }
    }

    // 5. Перенос нижних строк вправо
    if (oldRows > newRows) {
        const extraRows = oldRows - newRows;
        for (let er = 0; er < extraRows; er++) {
            const oldR = newRows + er;
            const newC = oldCols + er;
            for (let c = 0; c < oldCols; c++) {
                if (oldBoard[oldR] && oldBoard[oldR][c] && oldBoard[oldR][c].type) {
                    if (!newBoard[c]) newBoard[c] = [];
                    if (!newBoard[c][newC]) newBoard[c][newC] = { locked: false, row: c, col: newC };
                    newBoard[c][newC] = { ...oldBoard[oldR][c], row: c, col: newC };
                }
            }
        }
    }

    // 6. Обновление размеров и доски
    ctx.rows = newRows;
    ctx.cols = newCols;
    ctx.board = newBoard;

    // 7. Сброс выделения, если вышло за пределы
    if (ctx.selectedCell) {
        const { row, col } = ctx.selectedCell;
        if (row >= newRows || col >= newCols) {
            ctx.selectedCell = null;
        }
    }

    // 8. Переинициализация канваса и перерисовка
    const containerId = ctx._activeEvent ? 'event-board' : 'game-board';
    const canvasId = ctx._activeEvent ? 'event-canvas' : 'game-canvas';
    BoardCore.initCanvas(ctx, containerId, canvasId);

    if (typeof ctx._drawBackground === 'function') {
        ctx._drawBackground();
    }
    if (!skipBackgroundDirty && ctx._backgroundDirty !== undefined) {
        ctx._backgroundDirty = false;
    }

    BoardCore.drawBoard(ctx);

    // 9. Дополнительные действия
    if (typeof onAfterResize === 'function') onAfterResize(ctx);
    if (typeof onUIUpdate === 'function') onUIUpdate(ctx);
    if (typeof onSave === 'function') onSave(ctx);
},

    // ---- Упрощённый resize для Game (только перерисовка) ----
    _resizeGame() {
        const game = this.context;
        if (!game) return;
          // Обновляем isMobile
                    const { isMobile } = computeBoardSize();
                    game.isMobile = isMobile;
        if (game.canvas) {
            BoardCore.initCanvas(game, 'game-board', 'game-canvas');
            game._drawBackground();
            BoardCore.drawBoard(game);
        }
    }
};