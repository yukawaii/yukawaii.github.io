﻿// ===== НОВАЯ МЕХАНИКА ПАЗЛА =====
class PuzzleGame {
    constructor() {
        this.gridSize = 4;
        this.tiles = [];
        this.emptyIndex = null;
        this.stepCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameOver = false;
        this.imageSrc = '';
        this.container = null;
        this.tileSize = 0;
    }

    init(imageSrc, gridSize = 4) {
        this.gridSize = gridSize;
        this.imageSrc = imageSrc;
        this.stepCount = 0;
        this.isGameOver = false;
        this.startTime = Date.now();
        
        const stepEl = document.getElementById('stepCount');
        const timerEl = document.getElementById('timerPanel');
        const gameOverEl = document.getElementById('gameOver');
        
        if (stepEl) stepEl.textContent = '0';
        if (timerEl) timerEl.textContent = '0';
        if (gameOverEl) gameOverEl.classList.remove('show');
        
        this.createPuzzle();
        this.startTimer();
    }

    createPuzzle() {
    const container = document.getElementById('puzzleContainer');
    if (!container) {
        console.error('❌ Контейнер puzzleContainer не найден!');
        return;
    }
    
    container.innerHTML = '';
    this.container = container;

    // Создаем сетку
    const grid = document.createElement('div');
    grid.className = 'puzzle-grid';
    grid.id = 'puzzleGrid';
    container.appendChild(grid);

    // ===== БОЛЬШОЙ РАЗМЕР ПАЗЛА =====
    // Получаем ширину контейнера
    const containerWidth = container.clientWidth || 500;
    // Учитываем padding (12px * 2 = 24px)
    let gridSizePx = containerWidth - 24;
    // Ограничиваем максимум 600px (чтобы не вылезал за экран)
    if (gridSizePx > 600) gridSizePx = 600;
    // Минимум 300px
    if (gridSizePx < 300) gridSizePx = 300;
    
    // Вычисляем размер ячейки
    this.tileSize = Math.floor(gridSizePx / this.gridSize);
    const actualGridSize = this.tileSize * this.gridSize;
    
    grid.style.width = actualGridSize + 'px';
    grid.style.height = actualGridSize + 'px';
    grid.style.position = 'relative';
    grid.style.margin = '0 auto';

    console.log('📐 Размер контейнера:', containerWidth, 'px');
    console.log('📐 Размер пазла:', actualGridSize, 'px, ячейка:', this.tileSize, 'px');

    // Создаем массив индексов
    const totalTiles = this.gridSize * this.gridSize;
    this.tiles = Array.from({ length: totalTiles }, (_, i) => i);
    
    this.shuffleTiles();
    this.renderTiles(grid);
}

    shuffleTiles() {
        const totalTiles = this.gridSize * this.gridSize;
        for (let i = totalTiles - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
        
        this.emptyIndex = this.tiles.indexOf(totalTiles - 1);
        
        if (!this.isSolvable()) {
            for (let i = 0; i < this.tiles.length - 1; i++) {
                if (this.tiles[i] !== totalTiles - 1 && this.tiles[i + 1] !== totalTiles - 1) {
                    [this.tiles[i], this.tiles[i + 1]] = [this.tiles[i + 1], this.tiles[i]];
                    break;
                }
            }
            // Обновляем emptyIndex после изменений
            this.emptyIndex = this.tiles.indexOf(totalTiles - 1);
        }
    }

    isSolvable() {
        const size = this.gridSize;
        let inversions = 0;
        const flat = this.tiles.filter(t => t !== size * size - 1);
        
        for (let i = 0; i < flat.length; i++) {
            for (let j = i + 1; j < flat.length; j++) {
                if (flat[i] > flat[j]) inversions++;
            }
        }
        
        if (size % 2 === 0) {
            const emptyRow = Math.floor(this.emptyIndex / size);
            return (inversions + emptyRow) % 2 === 0;
        }
        return inversions % 2 === 0;
    }

    renderTiles(grid) {
        if (!grid) {
            grid = document.getElementById('puzzleGrid');
        }
        if (!grid) {
            console.error('❌ Сетка пазла не найдена!');
            return;
        }
        
        grid.innerHTML = '';
        
        const size = this.tileSize;
        const gridSize = this.gridSize;
        
        // Проверяем, что изображение существует
        if (!this.imageSrc) {
            console.error('❌ Нет источника изображения!');
            this.renderPlaceholder(grid);
            return;
        }
        
        // Загружаем изображение
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = this.imageSrc;
        
        img.onload = () => {
            console.log('✅ Изображение загружено:', this.imageSrc);
            this.renderWithImage(img, grid);
        };
        
        img.onerror = () => {
            console.error('❌ Не удалось загрузить изображение:', this.imageSrc);
            this.renderPlaceholder(grid);
        };
        
        // Проверяем, не загружено ли уже изображение
        if (img.complete && img.naturalWidth > 0) {
            this.renderWithImage(img, grid);
        } else {
            // Если изображение еще не загружено, пробуем еще раз через секунду
            setTimeout(() => {
                if (img.complete && img.naturalWidth > 0) {
                    this.renderWithImage(img, grid);
                } else {
                    console.warn('⚠️ Изображение не загружено, показываем заглушку');
                    this.renderPlaceholder(grid);
                }
            }, 1000);
        }
    }

renderWithImage(img, grid) {
    const size = this.tileSize;
    const gridSize = this.gridSize;
    const totalTiles = gridSize * gridSize;
    
    // Размер всего изображения в пикселях для backgroundSize
    const fullSize = size * gridSize;
    
    this.tiles.forEach((tileIndex, position) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        
        const row = Math.floor(position / gridSize);
        const col = position % gridSize;
        
        tile.style.left = (col * size) + 'px';
        tile.style.top = (row * size) + 'px';
        tile.style.width = size + 'px';
        tile.style.height = size + 'px';
        tile.style.position = 'absolute';
        tile.style.borderRadius = '3px';
        tile.style.boxSizing = 'border-box';
        tile.style.transition = 'all 0.15s ease';
        tile.style.border = '1px solid rgba(255,255,255,0.06)';
        
        if (tileIndex === totalTiles - 1) {
            tile.dataset.empty = 'true';
            tile.style.background = 'rgba(255,255,255,0.03)';
            tile.style.border = '2px dashed rgba(255,255,255,0.08)';
            tile.style.cursor = 'default';
        } else {
            // ===== ПРАВИЛЬНОЕ РАЗДЕЛЕНИЕ =====
            const srcRow = Math.floor(tileIndex / gridSize);
            const srcCol = tileIndex % gridSize;
            
            // backgroundSize: размер всего изображения в пикселях
           tile.style.backgroundImage = `url(${this.imageSrc})`;
            tile.style.backgroundSize = fullSize + 'px ' + fullSize + 'px !important';
            tile.style.backgroundPosition = `-${srcCol * size}px -${srcRow * size}px !important`;
            tile.style.backgroundRepeat = 'no-repeat !important';
            tile.style.cursor = 'pointer';
            tile.dataset.index = tileIndex;
            
            tile.addEventListener('click', () => {
                if (!this.isGameOver) {
                    this.moveTile(position);
                }
            });
            
            tile.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isGameOver) {
                    this.moveTile(position);
                }
            }, { passive: false });
        }
        
        grid.appendChild(tile);
    });
    
    console.log('✅ Пазл отрисован, ячеек:', totalTiles, 'размер ячейки:', size, 'fullSize:', fullSize);
}

    renderPlaceholder(grid) {
        const size = this.tileSize;
        const gridSize = this.gridSize;
        const totalTiles = gridSize * gridSize;
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3', '#54a0ff', '#5f27cd'];
        
        this.tiles.forEach((tileIndex, position) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            
            const row = Math.floor(position / gridSize);
            const col = position % gridSize;
            
            tile.style.width = size + 'px';
            tile.style.height = size + 'px';
            tile.style.left = (col * size) + 'px';
            tile.style.top = (row * size) + 'px';
            tile.style.position = 'absolute';
            tile.style.borderRadius = '3px';
            tile.style.boxSizing = 'border-box';
            tile.style.border = '1px solid rgba(255,255,255,0.1)';
            tile.style.display = 'flex';
            tile.style.alignItems = 'center';
            tile.style.justifyContent = 'center';
            tile.style.fontSize = (size * 0.4) + 'px';
            tile.style.fontWeight = 'bold';
            tile.style.color = 'rgba(255,255,255,0.5)';
            
            if (tileIndex === totalTiles - 1) {
                tile.dataset.empty = 'true';
                tile.style.background = 'rgba(255,255,255,0.03)';
                tile.style.border = '2px dashed rgba(255,255,255,0.08)';
                tile.style.cursor = 'default';
            } else {
                const color = colors[tileIndex % colors.length];
                tile.style.background = color;
                tile.style.cursor = 'pointer';
                tile.textContent = tileIndex + 1;
                
                tile.addEventListener('click', () => {
                    if (!this.isGameOver) {
                        this.moveTile(position);
                    }
                });
                
                tile.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!this.isGameOver) {
                        this.moveTile(position);
                    }
                }, { passive: false });
            }
            
            grid.appendChild(tile);
        });
        console.warn('⚠️ Показана заглушка вместо изображения');
    }

    moveTile(position) {
        const gridSize = this.gridSize;
        const emptyRow = Math.floor(this.emptyIndex / gridSize);
        const emptyCol = this.emptyIndex % gridSize;
        const row = Math.floor(position / gridSize);
        const col = position % gridSize;
        
        const isAdjacent = (
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)
        );
        
        if (!isAdjacent) return;
        
        [this.tiles[position], this.tiles[this.emptyIndex]] = 
        [this.tiles[this.emptyIndex], this.tiles[position]];
        
        this.emptyIndex = position;
        this.stepCount++;
        document.getElementById('stepCount').textContent = this.stepCount;
        
        const grid = document.getElementById('puzzleGrid');
        this.renderTiles(grid);
        
        if (this.checkVictory()) {
            this.gameOver();
        }
    }

    checkVictory() {
        const totalTiles = this.gridSize * this.gridSize;
        return this.tiles.every((tile, index) => tile === index);
    }

    gameOver() {
        this.isGameOver = true;
        this.stopTimer();
        
        const steps = this.stepCount;
        const time = Math.floor((Date.now() - this.startTime) / 1000);
        
        const stepsEl = document.querySelector('.victory-steps');
        const timeEl = document.querySelector('.victory-time');
        if (stepsEl) stepsEl.textContent = steps;
        if (timeEl) timeEl.textContent = time;
        
        setTimeout(() => {
            const gameOverEl = document.getElementById('gameOver');
            if (gameOverEl) gameOverEl.classList.add('show');
        }, 300);
    }

    startTimer() {
        this.startTime = Date.now();
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const timerEl = document.getElementById('timerPanel');
            if (timerEl) timerEl.textContent = elapsed;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    setGridSize(size) {
        this.gridSize = size;
        this.init(this.imageSrc, size);
    }

    newImage(imageSrc) {
        this.imageSrc = imageSrc;
        this.init(imageSrc, this.gridSize);
    }

    restart() {
        this.init(this.imageSrc, this.gridSize);
    }
}

const puzzle = new PuzzleGame();

function startPuzzle(imageSrc, gridSize = 4) {
    puzzle.init(imageSrc, parseInt(gridSize));
}

function changeGridSize(size) {
    puzzle.setGridSize(parseInt(size));
}

function newImage(imageSrc) {
    puzzle.newImage(imageSrc);
}

function restartPuzzle() {
    puzzle.restart();
}

function closeVictory() {
    const el = document.getElementById('gameOver');
    if (el) el.classList.remove('show');
}

console.log('🧩 Новая механика пазла загружена!');