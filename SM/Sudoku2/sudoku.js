// ============================================================
// 1. VK Bridge инициализация (используем глобальный объект)
// ============================================================
const vkBridge = window.vkBridge || {
    send: (event, data) => console.log('[VK Bridge]', event, data),
    sendPromise: (event, data) => {
        console.log('[VK Bridge]', event, data);
        return Promise.resolve({ result: true });
    },
    subscribe: () => {}
};

// ============================================================
// 2. Управление рекламой (баннер + межстраничная)
// ============================================================
// ============================================================
// 2. Управление рекламой
// ============================================================
class AdManager {
    constructor() {
        this.bannerShown = false;
        this.isRewardAdAvailable = false;
        this.rewardAdChecked = false;
    }

    // Показать баннерную рекламу внизу
    showBottomBanner() {
        if (this.bannerShown) return;
        if (typeof vkBridge !== 'undefined') {
            const sendMethod = vkBridge.sendPromise || vkBridge.send;
            sendMethod.call(vkBridge, 'VKWebAppShowBannerAd', {
                banner_location: 'bottom'
            })
            .then((data) => {
                if (data && data.result) {
                    console.log('Баннер успешно отображён');
                    this.bannerShown = true;
                }
            })
            .catch((error) => {
                console.log('Ошибка при показе баннера:', error);
            });
        }
    }

    // Проверка доступности рекламы за вознаграждение
    checkRewardedAdAvailable() {
        if (this.rewardAdChecked) {
            return Promise.resolve(this.isRewardAdAvailable);
        }
        
        return new Promise((resolve) => {
            if (typeof vkBridge !== 'undefined') {
                const sendMethod = vkBridge.sendPromise || vkBridge.send;
                sendMethod.call(vkBridge, 'VKWebAppCheckNativeAds', {
                    ad_format: 'reward'
                })
                .then((data) => {
                    this.rewardAdChecked = true;
                    this.isRewardAdAvailable = data && data.result === true;
                    console.log('Доступность рекламы reward:', this.isRewardAdAvailable);
                    resolve(this.isRewardAdAvailable);
                })
                .catch((error) => {
                    this.rewardAdChecked = true;
                    this.isRewardAdAvailable = false;
                    console.log('Ошибка проверки рекламы:', error);
                    resolve(false);
                });
            } else {
                this.rewardAdChecked = true;
                this.isRewardAdAvailable = false;
                resolve(false);
            }
        });
    }

    // Показать рекламу за вознаграждение
    showRewardedAd() {
        console.log('showRewardedAd вызван');
        
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                console.log('⏰ Таймаут показа рекламы');
                resolve(false);
            }, 8000);
            
            if (typeof vkBridge === 'undefined') {
                clearTimeout(timeoutId);
                console.log("VK Bridge не найден");
                resolve(false);
                return;
            }
            
            const sendMethod = vkBridge.sendPromise || vkBridge.send;
            
            // Проверяем доступность рекламы
            sendMethod.call(vkBridge, 'VKWebAppCheckNativeAds', {
                ad_format: 'reward'
            })
            .then((checkResult) => {
                console.log('VKWebAppCheckNativeAds результат:', checkResult);
                
                if (!checkResult || checkResult.result !== true) {
                    clearTimeout(timeoutId);
                    console.log('Реклама reward недоступна');
                    resolve(false);
                    return Promise.reject('Реклама недоступна');
                }
                
                // Реклама доступна - показываем
                return sendMethod.call(vkBridge, 'VKWebAppShowNativeAds', {
                    ad_format: 'reward'
                });
            })
            .then((showResult) => {
                clearTimeout(timeoutId);
                console.log('Результат показа рекламы:', showResult);
                
                // Проверяем, что реклама была показана и пользователь её посмотрел
                if (showResult && showResult.result === true) {
                    resolve(true);
                } else {
                    // Если пришёл не true - возможно, реклама не досмотрена
                    resolve(false);
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.log('Ошибка при показе рекламы:', error);
                resolve(false);
            });
        });
    }

   
}
// ============================================================
// 3. Простой звуковой движок
// ============================================================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.initialized = false;
          this.maxHints = 0;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio не поддерживается');
        }
    }

    beep(freq = 600, duration = 80, volume = 0.15) {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration / 1000);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration / 1000);
        } catch (e) { /* игнорируем */ }
    }

    click() { this.beep(700, 60, 0.12); }
    error() { this.beep(300, 150, 0.15); }
    win() { 
        this.beep(523, 120, 0.12);
        setTimeout(() => this.beep(659, 120, 0.12), 150);
        setTimeout(() => this.beep(784, 180, 0.12), 300);
    }
    hint() { this.beep(880, 80, 0.1); }
    solve() { this.beep(440, 100, 0.1); }
    toggle() { this.beep(500, 50, 0.1); }
}

// ============================================================
// 4. Основная игра Судоку
// ============================================================
class SudokuGame {
  // ============================================================
// Модалка "Реклама недоступна"
// ============================================================
showNoAdModal(callback) {
    console.log('showNoAdModal вызван');
    
    // Создаём overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;
    
    // Создаём диалог
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: rgba(22, 33, 62, 0.95);
        backdrop-filter: blur(15px);
        border-radius: 24px;
        padding: 30px 25px;
        max-width: 400px;
        width: 100%;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        animation: slideUp 0.3s ease;
    `;
    
    dialog.innerHTML = `
        <span style="font-size: 3rem; display: block; margin-bottom: 10px;">📺</span>
        <h2 style="color: #fff; font-size: 1.4rem; margin-bottom: 10px;">Реклама недоступна</h2>
        <p style="color: #8a8fa8; font-size: 1rem; margin-bottom: 20px; line-height: 1.6;">
            К сожалению, реклама сейчас не доступна.<br>
            Но вы всё равно получите <strong style="color: #ffd54f;">+1 подсказку</strong>!
        </p>
        <button id="noAdOkBtn" style="
            background: linear-gradient(135deg, #e94560, #c23152);
            color: #fff;
            border: none;
            padding: 12px 40px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 25px rgba(233, 69, 96, 0.4);
            transition: 0.2s;
        ">👍 Ок</button>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Обработчик кнопки
    const okBtn = document.getElementById('noAdOkBtn');
    okBtn.addEventListener('click', () => {
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        console.log('Нажата кнопка "Ок" в модалке "Реклама недоступна"');
        callback(true);
    });
    
    // Закрытие по клику вне диалога
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            console.log('Закрытие модалки "Реклама недоступна" по клику вне');
            callback(false);
        }
    });
}
                                            // ============================================================
// Модалка для получения дополнительных подсказок
// ============================================================
async showHintAdModal() {
    console.log('showHintAdModal вызван');
    return new Promise((resolve) => {
        const modal = document.getElementById('hintAdModal');
        
        if (!modal) {
            console.error('Модалка #hintAdModal не найдена в DOM');
            resolve(false);
            return;
        }
        
        // ⏸️ Ставим таймер на паузу
        this.pauseTimer();
        
        modal.style.display = 'flex';
        
        const cancelBtn = document.getElementById('hintAdCancel');
        const confirmBtn = document.getElementById('hintAdConfirm');
        
        let isResolved = false;
        
        const closeModal = (result) => {
            if (isResolved) return;
            isResolved = true;
            modal.style.display = 'none';
            this.resumeTimer();
            console.log('Модалка закрыта с результатом:', result);
            resolve(result);
        };
        
        // Убираем старые обработчики
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newCancelBtn.addEventListener('click', () => {
            this.sound.click();
            closeModal(false);
        });
        
        newConfirmBtn.addEventListener('click', async () => {
            this.sound.click();
            console.log('Нажата кнопка "Получить"');
            
            // Сначала проверяем доступность рекламы
            this.messageEl.textContent = '⏳ Проверка рекламы...';
            
            try {
                const isAvailable = await this.adManager.checkRewardedAdAvailable();
                console.log('Реклама доступна:', isAvailable);
                
                if (isAvailable) {
                    // Показываем рекламу
                    this.messageEl.textContent = '⏳ Загрузка рекламы...';
                    const adShown = await this.adManager.showRewardedAd();
                    console.log('Результат показа рекламы:', adShown);
                    
                    if (adShown === true) {
                        // ✅ Реклама показана — даём 3 подсказки
                        this.maxHints += 3;
                        const remaining = this.maxHints - this.hintsUsed;
                        this.messageEl.textContent = `🎉 +3 подсказки! Осталось: ${remaining}`;
                        this.sound.click();
                        this.render();
                        closeModal(true);
                    } else {
                        // ❌ Реклама не досмотрена или ошибка
                        modal.style.display = 'none';
                        this.showNoAdModal((result) => {
                            if (result) {
                                this.maxHints += 1;
                                const remaining = this.maxHints - this.hintsUsed;
                                this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                                this.sound.click();
                                this.render();
                                closeModal(true);
                            } else {
                                closeModal(false);
                            }
                        });
                    }
                } else {
                    // Реклама недоступна
                    modal.style.display = 'none';
                    this.showNoAdModal((result) => {
                        if (result) {
                            this.maxHints += 1;
                            const remaining = this.maxHints - this.hintsUsed;
                            this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                            this.sound.click();
                            this.render();
                            closeModal(true);
                        } else {
                            closeModal(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Ошибка при показе рекламы:', error);
                modal.style.display = 'none';
                this.showNoAdModal((result) => {
                    if (result) {
                        this.maxHints += 1;
                        const remaining = this.maxHints - this.hintsUsed;
                        this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                        this.sound.click();
                        this.render();
                        closeModal(true);
                    } else {
                        closeModal(false);
                    }
                });
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.sound.click();
                closeModal(false);
            }
        });
    });
}
// ============================================================
// Показать диалог подтверждения перед рекламой
// ============================================================
showConfirmDialog() {
    return new Promise((resolve) => {
        // ⏸️ Ставим таймер на паузу
        this.pauseTimer();
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #16213e;
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.3s ease;
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        dialog.innerHTML = `
            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.4rem;">🎬 Реклама за вознаграждение</h3>
            <p style="color: #ccc; margin-bottom: 25px; line-height: 1.6; font-size: 1rem;">
                Посмотреть рекламу, чтобы узнать решение головоломки?
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirmAdYes" style="
                    background: #e94560;
                    color: #fff;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: 0.2s;
                    flex: 1;
                ">✅ Посмотреть</button>
                <button id="confirmAdNo" style="
                    background: #0f3460;
                    color: #fff;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: 0.2s;
                    flex: 1;
                ">❌ Отмена</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const closeDialog = (result) => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            // ▶️ Возобновляем таймер
            this.resumeTimer();
            resolve(result);
        };
        
        document.getElementById('confirmAdYes').addEventListener('click', () => {
            closeDialog(true);
        });
        
        document.getElementById('confirmAdNo').addEventListener('click', () => {
            closeDialog(false);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(false);
            }
        });
    });
}



    constructor() {
        this.sound = new SoundManager();
        this.adManager = new AdManager();
        this.difficulty = 'easy';
        this.grid = [];
        this.solution = [];
        this.userGrid = [];
        this.given = [];
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.timer = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.isFinished = false;
        this.hintsUsed = 0;
            this.checksUsed = 0; 
               this.checkedCells = {};
        this.cellsToRemove = 0;

        // DOM элементы
        this.menuScreen = document.getElementById('menuScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gridElement = document.getElementById('sudoku-grid');
        this.numPanel = document.getElementById('num-panel');
        this.messageEl = document.getElementById('message');
        this.statusEl = document.getElementById('gameStatus');
        this.timerEl = document.getElementById('timerDisplay');
       

        // Кнопки
        document.getElementById('btnStartGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('btnBackToMenu').addEventListener('click', () => this.goToMenu());
        document.getElementById('btnToggleSound').addEventListener('click', () => this.toggleSound());
        document.getElementById('btnInviteFriends').addEventListener('click', () => this.inviteFriends());
       document.getElementById('btnHint').addEventListener('click', () => this.giveHint());
        document.getElementById('btnCheck').addEventListener('click', () => this.checkNumber());
        document.getElementById('btnSolveAll').addEventListener('click', () => this.solveAll());

        
        // Кнопка "Как играть?"
        document.getElementById('btnHowToPlay').addEventListener('click', () => {
            this.sound.click();
            document.getElementById('howToPlayModal').style.display = 'flex';
        });
        
        // Закрытие модального окна
        document.getElementById('closeHowToPlay').addEventListener('click', () => {
            document.getElementById('howToPlayModal').style.display = 'none';
        });
        document.getElementById('closeHowToPlayBtn').addEventListener('click', () => {
            document.getElementById('howToPlayModal').style.display = 'none';
        });
        // Закрытие по клику вне окна
        document.getElementById('howToPlayModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('howToPlayModal').style.display = 'none';
            }
        });

        // Выбор сложности
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
                this.sound.click();
            });
        });

        // Подписка на VK
        this.setupVKBridge();

        // Показать меню
        this.showMenu();
        this.initAdBanner();
    }

    // ============================================================
    // VK Bridge
    // ============================================================
    setupVKBridge() {
        vkBridge.subscribe((e) => {
            if (e.type === 'VKWebAppViewHide') {
                if (this.sound.ctx && this.sound.ctx.state === 'running') {
                    this.sound.ctx.suspend();
                }
            } else if (e.type === 'VKWebAppViewRestore') {
                if (this.sound.ctx && this.sound.ctx.state === 'suspended') {
                    this.sound.ctx.resume();
                }
            }
            // Обработка события показа баннера
            else if (e.type === 'VKWebAppShowBannerAdResult') {
                if (e.data && e.data.result) {
                    console.log('Баннер показан успешно');
                }
            }
        });
    }

    // ============================================================
    // Реклама
    // ============================================================
    initAdBanner() {
        // Показываем баннерную рекламу через VK Bridge
        this.adManager.showBottomBanner();
    }

    // ============================================================
    // Социальные функции
    // ============================================================
inviteFriends() {
    this.sound.click();
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    sendMethod.call(vkBridge, 'VKWebAppShowInviteBox', {});
}

    // ============================================================
    // Навигация
    // ============================================================
    showMenu() {
        this.menuScreen.style.display = 'flex';
        this.gameScreen.style.display = 'none';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
    }

    goToMenu() {
        this.sound.click();
        this.showMenu();
    }

    showGame() {
        this.menuScreen.style.display = 'none';
        this.gameScreen.style.display = 'flex';
    }

    // ============================================================
    // Звук
    // ============================================================
    toggleSound() {
        this.sound.enabled = !this.sound.enabled;
        const btn = document.getElementById('btnToggleSound');
        btn.textContent = this.sound.enabled ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
        this.sound.toggle();
        if (this.sound.enabled) {
            this.sound.init();
        }
    }

    // ============================================================
    // Генерация Судоку
    // ============================================================
    generateSudoku() {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        for (let block = 0; block < 9; block += 3) {
            this.fillBlock(grid, block, block);
        }
        this.solveSudoku(grid);
        this.solution = grid.map(row => [...row]);
        this.userGrid = grid.map(row => [...row]);
        this.given = Array.from({ length: 9 }, () => Array(9).fill(true));

        const removeCounts = {
            easy: 30 + Math.floor(Math.random() * 5),
            medium: 38 + Math.floor(Math.random() * 7),
            hard: 46 + Math.floor(Math.random() * 8),
            expert: 55 + Math.floor(Math.random() * 10)
        };
        this.cellsToRemove = removeCounts[this.difficulty] || 35;

        let removed = 0;
        while (removed < this.cellsToRemove) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (this.userGrid[r][c] !== 0) {
                this.userGrid[r][c] = 0;
                this.given[r][c] = false;
                removed++;
            }
        }
        this.grid = this.userGrid.map(row => [...row]);
    }

    fillBlock(grid, startRow, startCol) {
        const nums = [1,2,3,4,5,6,7,8,9];
        for (let i = 0; i < 9; i++) {
            const r = startRow + Math.floor(i / 3);
            const c = startCol + (i % 3);
            const idx = Math.floor(Math.random() * nums.length);
            grid[r][c] = nums[idx];
            nums.splice(idx, 1);
        }
    }

    isValid(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num) return false;
            if (grid[i][col] === num) return false;
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        return true;
    }

    solveSudoku(grid) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    const nums = this.shuffleArray([1,2,3,4,5,6,7,8,9]);
                    for (const num of nums) {
                        if (this.isValid(grid, r, c, num)) {
                            grid[r][c] = num;
                            if (this.solveSudoku(grid)) return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ============================================================
    // Рендеринг
    // ============================================================
    render() {
    this.gridElement.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (c % 3 === 2 && c < 8) cell.classList.add('block-border-right');
            if (r % 3 === 2 && r < 8) cell.classList.add('block-border-bottom');

            const val = this.grid[r][c];
            const cellKey = `${r}-${c}`;
            
            if (val !== 0) {
                cell.textContent = val;
                if (this.given[r][c]) {
                    cell.classList.add('given');
                } else {
                    cell.classList.add('user');
                }
            }

            // Показываем ошибки ТОЛЬКО на легком уровне (автоматически)
            if (this.difficulty === 'easy') {
                if (!this.given[r][c] && val !== 0 && val !== this.solution[r][c]) {
                    cell.classList.add('error');
                }
            }

// Отображаем результаты проверки (цвет цифр, а не фона)
if (this.checkedCells[cellKey] !== undefined) {
    // Убираем классы проверки
    cell.classList.remove('checked-correct', 'checked-error');
    
    if (this.checkedCells[cellKey] === true) {
        cell.classList.add('checked-correct'); // ← зеленый через класс
    } else if (this.checkedCells[cellKey] === false) {
        cell.classList.add('checked-error'); // ← красный через класс
    }
}

            if (this.selectedRow === r && this.selectedCol === c) {
                cell.classList.add('selected');
            }

// Подсветка одинаковых цифр (кроме уровня Эксперт)
if (this.selectedRow !== -1 && this.selectedCol !== -1) {
    const selVal = this.grid[this.selectedRow][this.selectedCol];
    // Подсвечиваем одинаковые цифры только если уровень НЕ Эксперт
    if (this.difficulty !== 'expert') {
        if (selVal !== 0 && val === selVal && !(r === this.selectedRow && c === this.selectedCol)) {
            cell.classList.add('same-number');
        }
    }
    if (r === this.selectedRow || c === this.selectedCol || 
        (Math.floor(r/3) === Math.floor(this.selectedRow/3) && 
         Math.floor(c/3) === Math.floor(this.selectedCol/3))) {
        if (!(r === this.selectedRow && c === this.selectedCol)) {
            cell.classList.add('highlighted');
        }
    }
}

            cell.addEventListener('click', () => this.selectCell(r, c));
            this.gridElement.appendChild(cell);
        }
    }
    this.renderNumPanel();
    this.updateStatus();
}
// ============================================================
// Рендеринг панели цифр
// ============================================================
renderNumPanel() {
    this.numPanel.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.textContent = i;
        btn.addEventListener('click', () => this.placeNumber(i));
        this.numPanel.appendChild(btn);
    }
    const erase = document.createElement('button');
    erase.className = 'num-btn erase';
    erase.textContent = '✕';
    erase.addEventListener('click', () => this.placeNumber(0));
    this.numPanel.appendChild(erase);
}
// ============================================================
// Обновление статуса
// ============================================================
updateStatus() {
    if (this.isFinished) {
        this.statusEl.textContent = '🎉 Победа!';
        this.statusEl.style.color = '#4caf50';
    } else {
        // Русские названия уровней
        const difficultyNames = {
            'easy': 'Лёгкий',
            'medium': 'Средний',
            'hard': 'Сложный',
            'expert': 'Эксперт'
        };
        this.statusEl.textContent = `🎯 ${difficultyNames[this.difficulty] || this.difficulty}`;
        this.statusEl.style.color = '#e94560';
    }
}
// ============================================================
// Обновление таймера
// ============================================================
updateTimer() {
    const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
    const secs = String(this.timer % 60).padStart(2, '0');
    this.timerEl.textContent = `${mins}:${secs}`;
}
    // ============================================================
    // Игровая логика
    // ============================================================
    selectCell(row, col) {
        if (this.isFinished) return;
        if (this.given[row][col]) {
            this.sound.error();
            return;
        }
        this.selectedRow = row;
        this.selectedCol = col;
        this.sound.click();
        this.render();
        this.messageEl.textContent = '';
    }

    placeNumber(num) {
    if (this.isFinished) return;
    if (this.selectedRow === -1 || this.selectedCol === -1) {
        this.messageEl.textContent = '⚠️ Выберите клетку';
        return;
    }
    const r = this.selectedRow;
    const c = this.selectedCol;
    if (this.given[r][c]) {
        this.messageEl.textContent = '❌ Это клетка с подсказкой';
        this.sound.error();
        return;
    }

    this.sound.init();

    const cellKey = `${r}-${c}`;
    
    if (num === 0) {
        if (this.grid[r][c] !== 0) {
            this.grid[r][c] = 0;
            // Удаляем статус проверки для этой клетки
            delete this.checkedCells[cellKey];
            this.sound.click();
            this.messageEl.textContent = '';
            this.render();
            this.checkWin();
        }
        return;
    }

    // Ставим цифру
    this.grid[r][c] = num;
    this.sound.click();
    
    // Удаляем статус проверки для этой клетки (она изменена)
    delete this.checkedCells[cellKey];
    
    // На легком уровне показываем результат сразу
    if (this.difficulty === 'easy') {
        if (num === this.solution[r][c]) {
            this.messageEl.textContent = '✅ Верно!';
        } else {
            this.messageEl.textContent = `❌ Неправильно!`;
            this.sound.error();
        }
    } else {
        this.messageEl.textContent = `Цифра ${num} поставлена`;
    }
    
    this.render();
    
    if (this.checkWin()) {
        this.isFinished = true;
        this.sound.win();
        this.statusEl.textContent = '🎉 Победа!';
        this.messageEl.textContent = '🏆 Вы решили Судоку!';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.render();
    }
}

// ============================================================
// Модалка для получения дополнительных подсказок
// ============================================================
showHintAdModal() {
    console.log('showHintAdModal вызван');
    return new Promise((resolve) => {
        const modal = document.getElementById('hintAdModal');
        
        if (!modal) {
            console.error('Модалка #hintAdModal не найдена в DOM');
            resolve(false);
            return;
        }
        
        // ⏸️ Ставим таймер на паузу
        this.pauseTimer();
        
        modal.style.display = 'flex';
        
        const cancelBtn = document.getElementById('hintAdCancel');
        const confirmBtn = document.getElementById('hintAdConfirm');
        
        let isResolved = false;
        
        const closeModal = (result) => {
            if (isResolved) return;
            isResolved = true;
            modal.style.display = 'none';
            this.resumeTimer();
            console.log('Модалка закрыта с результатом:', result);
            resolve(result);
        };
        
        // Убираем старые обработчики
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newCancelBtn.addEventListener('click', () => {
            this.sound.click();
            closeModal(false);
        });
        
                                            newConfirmBtn.addEventListener('click', async () => {
                                        this.sound.click();
                                        console.log('Нажата кнопка "Получить"');
                                        
                                        // Показываем сообщение о загрузке рекламы
                                        this.messageEl.textContent = '⏳ Загрузка рекламы...';
                                        
                                        try {
                                            const adShown = await this.adManager.showRewardedAd();
                                            console.log('Результат показа рекламы:', adShown);
                                            
                                            if (adShown === true) {
                                                // ✅ Реклама показана — даём 3 подсказки
                                                this.maxHints += 3;
                                                const remaining = this.maxHints - this.hintsUsed;
                                                this.messageEl.textContent = `🎉 +3 подсказки! Осталось: ${remaining}`;
                                                this.sound.click();
                                                this.render();
                                                closeModal(true);
                                            } else {
                                                // ❌ Реклама НЕ показана
                                                modal.style.display = 'none';
                                                
                                                this.showNoAdModal((result) => {
                                                    if (result) {
                                                        this.maxHints += 1;
                                                        const remaining = this.maxHints - this.hintsUsed;
                                                        this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                                                        this.sound.click();
                                                        this.render();
                                                        closeModal(true);
                                                    } else {
                                                        closeModal(false);
                                                    }
                                                });
                                            }
                                        } catch (error) {
                                            console.error('Ошибка при показе рекламы:', error);
                                            modal.style.display = 'none';
                                            this.showNoAdModal((result) => {
                                                if (result) {
                                                    this.maxHints += 1;
                                                    const remaining = this.maxHints - this.hintsUsed;
                                                    this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                                                    this.sound.click();
                                                    this.render();
                                                    closeModal(true);
                                                } else {
                                                    closeModal(false);
                                                }
                                            });
                                        }
                                    });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.sound.click();
                closeModal(false);
            }
        });
    });
}
// ============================================================
// Обновленная подсказка с модалкой для доп. подсказок
// ============================================================
async giveHint() {
    console.log('giveHint вызван');
    if (this.isFinished) return;
    
    // Проверка доступности подсказок на уровне сложности
    // Устанавливаем начальное значение, если оно ещё не установлено
    if (this.maxHints === undefined || this.maxHints === 0) {
        if (this.difficulty === 'easy' || this.difficulty === 'medium') {
            this.maxHints = 3;
        } else {
            this.maxHints = 1;
        }
    }

    // Если подсказки закончились — показываем модалку
    if (this.hintsUsed >= this.maxHints) {
        console.log('Подсказки кончились. Использовано:', this.hintsUsed, 'Максимум:', this.maxHints);
        this.messageEl.textContent = '💡 Подсказки закончились!';
        this.sound.error();
        
        const result = await this.showHintAdModal();
        console.log('Результат модалки:', result);
        
        if (result === true) {
            // Подсказки добавлены к счётчику
            const remaining = this.maxHints - this.hintsUsed;
            this.messageEl.textContent = `✅ Получены подсказки! Осталось: ${remaining}`;
            this.sound.click();
            this.render();
            return;
        } else {
            this.messageEl.textContent = '❌ Вы отменили получение подсказок.';
            this.sound.error();
            return;
        }
    }

    // Проверка, выделена ли клетка
    if (this.selectedRow === -1 || this.selectedCol === -1) {
        this.messageEl.textContent = '⚠️ Выделите клетку';
        this.sound.error();
        return;
    }

    const r = this.selectedRow;
    const c = this.selectedCol;

    // Проверка, пустая ли клетка
    if (this.grid[r][c] !== 0) {
        this.messageEl.textContent = '⚠️ В этой клетке уже есть цифра';
        this.sound.error();
        return;
    }

    // Проверка, является ли клетка "данной"
    if (this.given[r][c]) {
        this.messageEl.textContent = '❌ Это клетка с подсказкой';
        this.sound.error();
        return;
    }

    this.sound.init();
    this.sound.hint();
    this.hintsUsed++;

    // Ставим правильную цифру
    const correctNum = this.solution[r][c];
    this.grid[r][c] = correctNum;
    
    const cellKey = `${r}-${c}`;
    this.checkedCells[cellKey] = true;
    
    const remaining = this.maxHints - this.hintsUsed;
    this.messageEl.textContent = `💡 Подсказка: ${correctNum} (осталось: ${remaining})`;
    this.render();
    
    // Подсветим подсказку
    const cells = this.gridElement.children;
    const idx = r * 9 + c;
    if (cells[idx]) {
        cells[idx].classList.add('hint');
        setTimeout(() => cells[idx].classList.remove('hint'), 1000);
    }
    
    if (this.checkWin()) {
        this.isFinished = true;
        this.sound.win();
        this.statusEl.textContent = '🎉 Победа!';
        this.messageEl.textContent = '🏆 Вы решили Судоку!';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}
// ============================================================
// Управление таймером (пауза/возобновление)
// ============================================================
pauseTimer() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.isRunning = false;
        console.log('⏸️ Таймер на паузе');
    }
}

resumeTimer() {
    if (!this.timerInterval && !this.isFinished) {
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
        console.log('▶️ Таймер возобновлён');
    }
}
// ============================================================
// Проверка (проверяет ВСЕ цифры на поле)
// ============================================================
checkNumber() {
    if (this.isFinished) return;
    
    let maxChecks = 0;
    if (this.difficulty === 'easy') {
        maxChecks = 3;
    } else if (this.difficulty === 'medium') {
        maxChecks = 3;
    } else if (this.difficulty === 'hard') {
        maxChecks = 1;
    } else if (this.difficulty === 'expert') {
        maxChecks = 1;
    } else {
        this.messageEl.textContent = '❌ Проверка недоступна на этом уровне';
        this.sound.error();
        return;
    }

    if (this.checksUsed >= maxChecks) {
        this.messageEl.textContent = `❌ Проверки закончились! (${maxChecks}/${maxChecks})`;
        this.sound.error();
        return;
    }

    this.sound.init();
    this.checksUsed++;

    let errors = 0;
    let correct = 0;
    
    // Сохраняем результаты проверки
    const newCheckedCells = {};
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = this.grid[r][c];
            const cellKey = `${r}-${c}`;
            
            // Пропускаем пустые клетки и "данные"
            if (val === 0 || this.given[r][c]) {
                // Если клетка пустая или данная — не сохраняем результат
                continue;
            }
            
            if (val === this.solution[r][c]) {
                correct++;
                newCheckedCells[cellKey] = true; // правильная
            } else {
                errors++;
                newCheckedCells[cellKey] = false; // неправильная
            }
        }
    }
    
    // Объединяем с предыдущими результатами (не перезаписываем уже проверенные)
    for (const key in newCheckedCells) {
        this.checkedCells[key] = newCheckedCells[key];
    }

    // Сообщение о результате
    if (errors === 0 && correct > 0) {
        this.messageEl.textContent = `✅ Все ${correct} цифр правильные! (${this.checksUsed}/${maxChecks})`;
        this.sound.click();
    } else if (errors === 0 && correct === 0) {
        this.messageEl.textContent = `⚠️ Нет цифр для проверки (${this.checksUsed}/${maxChecks})`;
        this.sound.error();
    } else {
        this.messageEl.textContent = `❌ Найдено ${errors} ошибок, ${correct} правильных (${this.checksUsed}/${maxChecks})`;
        this.sound.error();
    }
    
    // Перерендерим, чтобы показать результаты
    this.render();
    
    // Проверяем победу
    if (this.checkWin()) {
        this.isFinished = true;
        this.sound.win();
        this.statusEl.textContent = '🎉 Победа!';
        this.messageEl.textContent = '🏆 Вы решили Судоку!';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.render();
    }
}
  
// ============================================================
// Решить всё (с рекламой за вознаграждение либо просто так, если рекламы нет)
// ============================================================
async solveAll() {
    if (this.isFinished) return;
    
    const confirmed = await this.showConfirmDialog();
    if (!confirmed) {
        this.messageEl.textContent = '❌ Решение отменено';
        this.sound.error();
        return;
    }
    
    this.messageEl.textContent = '⏳ Загрузка рекламы...';
    const adShown = await this.adManager.showRewardedAd();
    
    if (!adShown) {
        this.messageEl.textContent = '⚠️ Рекламы сейчас нет, но мы решим поле!';
        this.sound.error();
        // Пауза, чтобы пользователь увидел сообщение
        await new Promise(resolve => setTimeout(resolve, 1500));
    }    
    
    // РЕШАЕМ ВСЕГДА — и с рекламой, и без
    this.sound.init();
    this.sound.solve();

    let solved = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (!this.given[r][c] && this.grid[r][c] !== this.solution[r][c]) {
                this.grid[r][c] = this.solution[r][c];
                const cellKey = `${r}-${c}`;
                this.checkedCells[cellKey] = true;
                solved++;
            }
        }
    }

    this.messageEl.textContent = `⚡ Решено ${solved} клеток!`;
    this.render();

    if (this.checkWin()) {
        this.isFinished = true;
        this.sound.win();
        this.statusEl.textContent = '🎉 Победа!';
        this.messageEl.textContent = '🏆 Судоку решено!';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

    // ============================================================
    // Проверка победы
    // ============================================================
    checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    // ============================================================
    // Старт игры
    // ============================================================
    startNewGame() {
        this.sound.init();
        this.sound.click();
        
        this.isFinished = false;
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.timer = 0;
        this.checksUsed = 0;
          
             this.checkedCells = {}; 
        this.hintsUsed = 0;
      // Устанавливаем максимальное количество подсказок в зависимости от уровня
    if (this.difficulty === 'easy' || this.difficulty === 'medium') {
        this.maxHints = 3;
    } else {
        this.maxHints = 1;
    }
    this.messageEl.textContent = '';
        this.messageEl.textContent = '';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.generateSudoku();
        this.showGame();
        this.render();
        this.updateTimer();
        
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
        
        if (this.sound.ctx && this.sound.ctx.state === 'suspended') {
            this.sound.ctx.resume();
        }
    }
}

// ============================================================
// 5. Запуск
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new SudokuGame();
    window.__game = game;
});
document.addEventListener('touchmove', function(event) {
    // Разрешаем скролл, только если внутри вашего приложения есть 
    // отдельный блок, который должен прокручиваться (например, чат)
    event.preventDefault();
}, { passive: false });

// Кнопки пригласить друзей и тема
document.getElementById('btnInviteFriends').addEventListener('click', function() {
    if (window.vkBridge) {
        window.vkBridge.send('VKWebAppShowInviteBox')
            .catch(e => console.warn('Ошибка приглашения:', e));
    } else {
        alert('Пригласить друзей');
    }
});

// Открыть модалку с темами
document.getElementById('btnThemeSun').addEventListener('click', function() {
    document.getElementById('themeModal').style.display = 'flex';
});

// Закрыть модалку
function closeThemeModal() {
    document.getElementById('themeModal').style.display = 'none';
}

document.getElementById('closeThemeModal').addEventListener('click', closeThemeModal);
document.getElementById('themeModal').addEventListener('click', function(e) {
    if (e.target === this) closeThemeModal();
});

// Переключение тем
document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        // Убрать активный класс у всех
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active-theme'));
        this.classList.add('active-theme');
        
        const theme = this.dataset.theme;
        applyTheme(theme);
        
        // Сохранить выбранную тему
        localStorage.setItem('sudoku-theme', theme);
    });
});

// Применить тему
function applyTheme(theme) {
    const container = document.querySelector('.container');
    const modal = document.querySelector('#themeModal > div');
    const body = document.body;
    const grid = document.getElementById('sudoku-grid');
    const cells = document.querySelectorAll('.cell');
    const numBtns = document.querySelectorAll('.num-btn');
    const actionBtns = document.querySelectorAll('.action-btn');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const diffBtns = document.querySelectorAll('.diff-btn');
    const stars = document.querySelector('body::before');
    
    // Убрать все классы тем
    body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
    container.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
    if (grid) grid.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
    
    // Добавить класс теме на body для каскадных стилей
    body.classList.add('theme-' + theme);
    
// Обновить активный класс в модалке
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
        btn.classList.remove('active-theme');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active-theme');
        }
    });
    
    // Сохранить тему
    localStorage.setItem('sudoku-theme', theme);
}

// Восстановить тему при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('sudoku-theme');
    if (savedTheme) {
        applyTheme(savedTheme);
        // Обновить активный класс
        document.querySelectorAll('.theme-btn').forEach(function(btn) {
            btn.classList.remove('active-theme');
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active-theme');
            }
        });
    }
});