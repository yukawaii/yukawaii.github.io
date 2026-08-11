//  RESIZE MANAGER  – адаптация доски и модалок (финальная версия)
// ============================================================
const ResizeManager = {
    game: null,

    init(game) {
        this.game = game;
    },


    // ---- РЕСАЙЗ ИГРОВОЙ ДОСКИ ----
    handleResize() {
        const game = this.game;
        if (!game) return;

        const isMobile = window.innerWidth < 768 || window.innerHeight < 600;
        const isPortrait = window.innerHeight > window.innerWidth;

        let newRows, newCols;
        if (isMobile && isPortrait) {
            newRows = 9;
            newCols = 7;
        } else {
            newRows = 7;
            newCols = 9;
        }

        if (game.rows !== newRows || game.cols !== newCols) {
            this.reshapeBoard(newRows, newCols);
        } else {
            this.resize();
        }     
    },



    // Перестраивает доску с сохранением предметов
   reshapeBoard(newRows, newCols) {
    const game = this.game;
    if (!game) return;
    // --- Сброс перетаскивания и блокировки ---
    if (game.isDragging && game.dragStart) {
        game.board[game.dragStart.row][game.dragStart.col] = game.dragStart.item;
    }
    game.isDragging = false;
    game.dragStart = null;
    game.dragTarget = null;
    game.selectedItem = null;
    game.processingClick = false;
    game.updateDragGhost(0, 0, null);


        if (game.rows === newRows && game.cols === newCols) return;

        const oldRows = game.rows;
        const oldCols = game.cols;
        const oldBoard = game.board;

        // Создаём новую полностью инициализированную доску
        const newBoard = [];
        for (let r = 0; r < newRows; r++) {
            newBoard[r] = [];
            for (let c = 0; c < newCols; c++) {
                newBoard[r][c] = { locked: false, row: r, col: c };
            }
        }

        // Копируем все предметы, которые помещаются в общую область (минимальные размеры)
        for (let r = 0; r < Math.min(oldRows, newRows); r++) {
            for (let c = 0; c < Math.min(oldCols, newCols); c++) {
                if (oldBoard[r] && oldBoard[r][c] && oldBoard[r][c].type) {
                    newBoard[r][c] = { ...oldBoard[r][c], row: r, col: c };
                }
            }
        }

        // Если старая сетка шире новой (ландшафт → портрет) – переносим правые столбцы вниз
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

        // Если старая сетка выше новой (портрет → ландшафт) – переносим нижние строки в новые столбцы
        // ▲ ИСПРАВЛЕНО: условие oldRows > newRows (было oldCols < newCols)
        if (oldRows > newRows) {
            const extraRows = oldRows - newRows;
            for (let er = 0; er < extraRows; er++) {
                const oldR = newRows + er;          // лишняя строка
                const newC = oldCols + er;          // новый столбец (добавляется справа)
                for (let c = 0; c < oldCols; c++) {
                    if (oldBoard[oldR] && oldBoard[oldR][c] && oldBoard[oldR][c].type) {
                        if (!newBoard[c]) newBoard[c] = [];
                        if (!newBoard[c][newC]) newBoard[c][newC] = { locked: false, row: c, col: newC };
                        newBoard[c][newC] = { ...oldBoard[oldR][c], row: c, col: newC };
                    }
                }
            }
        }

        // Обновляем доску и размеры
        game.rows = newRows;
        game.cols = newCols;
        game.board = newBoard;

        // Сбрасываем выделение, если оно выходит за границы
        if (game.selectedCell) {
            const { row, col } = game.selectedCell;
            if (row >= newRows || col >= newCols) {
                game.selectedCell = null;
            }
        }

        // Перерисовываем
        game.initCanvas();
        game._drawBackground();
        game.drawBoard();
        game.findHintPair();
    },

    // Упрощённый resize – только перерисовка
    resize() {
        const game = this.game;
        if (!game) return;
        if (game.canvas) {
            game.initCanvas();
            game._drawBackground();
            game.drawBoard();
        }
    }
};