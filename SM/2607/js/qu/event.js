// ============================================================
//  EVENT MANAGER  – управление ивентами (доска, UI, подарки)
// ============================================================

const EventManager = {
    _game: null,
    _activeEvent: null,
    _eventState: null,          // { openedLevels: [], freeClaimed, lastFreeClaimDate, board, rows, cols }
    _timerInterval: null,
    _eventItemTypeIndex: null,  // индекс типа предмета ивента в ITEM_DATA
    _eventChainContainer: null,

    // ---- инициализация ----
    init(game) {
        this._game = game;
    },

    // ---- запуск ивента ----
    startEvent(eventId) {
        const config = getEventConfig(eventId);
        if (!config) {
            console.warn('[EventManager] Ивент не найден:', eventId);
            return;
        }
        this._activeEvent = config;
        this._loadState();
        this._setupUI();
        if (!this._eventState.board) {
            // нет сохранённой доски – создаём новую
            this._initEventBoard(config);
        } else {
            // восстанавливаем доску из сохранения
            this._restoreBoard();
        }
        this._renderEventProgress();
        this._startTimer();
        // устанавливаем колбэк на создание предметов
        this._game.onItemCreated = (typeIndex, level) => {
            if (typeIndex === this._eventItemTypeIndex) {
                this._onEventItemCreated(level);
            }
        };
        // запускаем цикл игры, если не запущен
        if (!this._game.isRunning) {
            this._game.isRunning = true;
            this._game.animateLoop();
        }
        this._game.updateUI();
    },

    // ---- загрузка/сохранение состояния ----
    _loadState() {
        const saved = Storage.getEventState(this._activeEvent.id);
        if (saved) {
            this._eventState = saved;
        } else {
            this._eventState = {
                openedLevels: [],
                freeClaimed: false,
                lastFreeClaimDate: 0,
                board: null,
                rows: this._game.rows,
                cols: this._game.cols
            };
        }
    },

    _saveState() {
        const state = this._eventState;
        state.board = this._game.board;
        state.rows = this._game.rows;
        state.cols = this._game.cols;
        Storage.saveEventState(this._activeEvent.id, state);
    },

    // ---- восстановление доски из сохранения ----
    _restoreBoard() {
        const state = this._eventState;
        this._game.board = state.board;
        this._game.rows = state.rows;
        this._game.cols = state.cols;
        // пересоздаём canvas
        this._game.initCanvas();
        this._game._drawBackground();
        this._game.drawBoard();
        // восстанавливаем тип предмета ивента
        this._eventItemTypeIndex = this._getEventItemTypeIndex(this._activeEvent.id);
    },

    // ---- настройка UI при ивенте ----
    _setupUI() {
        // скрываем кнопки квестов и подарка
        const questBtn = document.getElementById('quest-btn');
        const giftBtn = document.getElementById('gift-btn');
        if (questBtn) questBtn.style.display = 'none';
        if (giftBtn) giftBtn.style.display = 'none';
        // показываем кнопку ивента
        const eventBtn = document.getElementById('event-btn');
        if (eventBtn) {
            eventBtn.style.display = 'flex';
            const iconUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/events/${this._activeEvent.id}.png`);
            if (iconUrl) {
                eventBtn.innerHTML = `<img src="${iconUrl}" style="width:70%; height:70%; object-fit:contain;">`;
            } else {
                eventBtn.innerHTML = '🎃'; // fallback
            }
        }
        // добавляем класс на body для отключения некоторых функций в Game
        document.body.classList.add('event-mode');
        // скрываем область заказов (будем использовать её для цепочки)
        const orderArea = document.getElementById('order-area');
        if (orderArea) {
            orderArea.style.display = 'flex'; // сделаем видимой
            orderArea.innerHTML = ''; // очистим
            // создадим контейнер для таймера и цепочки
            const timerDiv = document.createElement('div');
            timerDiv.id = 'event-timer';
            timerDiv.style.cssText = 'font-size: clamp(0.8rem, 2vw, 1.2rem); color: #2a1f14; text-align: center; padding: 0.2rem; width:100%;';
            orderArea.appendChild(timerDiv);
            const chainDiv = document.createElement('div');
            chainDiv.id = 'event-chain';
            chainDiv.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; padding: 4px; width:100%;';
            orderArea.appendChild(chainDiv);
            this._eventChainContainer = chainDiv;
        }
    },

    // ---- создание доски ивента ----
    _initEventBoard(config) {
        const rows = this._game.rows;
        const cols = this._game.cols;
        const board = [];
        // инициализируем все клетки как заблокированные
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = { locked: true, covered: true, row: r, col: c };
            }
        }

        // определяем открытые клетки
        const openCount = config.boardSettings.initialOpenCount || 5;
        const side = config.boardSettings.initialOpenSide || 'bottom';
        let openCells = [];
        if (side === 'bottom') {
            const startCol = Math.floor((cols - openCount) / 2);
            for (let i = 0; i < openCount; i++) {
                openCells.push({ row: rows - 1, col: startCol + i });
            }
        } else if (side === 'top') {
            const startCol = Math.floor((cols - openCount) / 2);
            for (let i = 0; i < openCount; i++) {
                openCells.push({ row: 0, col: startCol + i });
            }
        } else if (side === 'left') {
            const startRow = Math.floor((rows - openCount) / 2);
            for (let i = 0; i < openCount; i++) {
                openCells.push({ row: startRow + i, col: 0 });
            }
        } else if (side === 'right') {
            const startRow = Math.floor((rows - openCount) / 2);
            for (let i = 0; i < openCount; i++) {
                openCells.push({ row: startRow + i, col: cols - 1 });
            }
        }

        // получаем индекс типа предмета ивента
        const eventItemTypeIndex = this._getEventItemTypeIndex(config.id);
        this._eventItemTypeIndex = eventItemTypeIndex;

        // устанавливаем открытые клетки: первая содержит предмет 1 уровня, остальные пустые
        for (let i = 0; i < openCells.length; i++) {
            const { row, col } = openCells[i];
            if (i === 0) {
                board[row][col] = {
                    type: this._game.imageNames[eventItemTypeIndex] || '🍀',
                    typeIndex: eventItemTypeIndex,
                    level: 1,
                    merged: false,
                    row, col,
                    locked: false,
                    covered: false
                };
                // добавляем в коллекцию
                if (typeof CollectionManager !== 'undefined') {
                    CollectionManager.onItemCreated(eventItemTypeIndex, 1);
                }
                // отмечаем уровень открытым
                if (!this._eventState.openedLevels.includes(1)) {
                    this._eventState.openedLevels.push(1);
                }
            } else {
                board[row][col] = { locked: false, covered: false, row, col };
            }
        }

        // вычисляем расстояния от открытых клеток
        const dist = this._computeDistances(rows, cols, openCells);
        const maxLevel = config.maxLevel;
        const distribution = config.boardSettings.levelsDistribution || [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = board[r][c];
                if (cell.locked) {
                    const d = dist[r][c];
                    let level = 1;
                    // находим подходящий диапазон
                    for (const rule of distribution) {
                        if (d === rule.distance) {
                            level = rule.minLevel + Math.floor(Math.random() * (rule.maxLevel - rule.minLevel + 1));
                            break;
                        }
                    }
                    if (level > maxLevel) level = maxLevel;
                    board[r][c] = {
                        type: this._game.imageNames[eventItemTypeIndex] || '🍀',
                        typeIndex: eventItemTypeIndex,
                        level: level,
                        merged: false,
                        row: r, col: c,
                        locked: true,
                        covered: true
                    };
                }
            }
        }

        // сохраняем доску в Game
        this._game.board = board;
        this._game.rows = rows;
        this._game.cols = cols;
        this._saveState();
        // перерисовываем
        this._game.initCanvas();
        this._game._drawBackground();
        this._game.drawBoard();
        this._game.updateUI();
    },

    // ---- вычисление манхэттенского расстояния до открытых клеток ----
    _computeDistances(rows, cols, openCells) {
        const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
        const queue = [];
        for (const cell of openCells) {
            dist[cell.row][cell.col] = 0;
            queue.push(cell);
        }
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        while (queue.length) {
            const { row, col } = queue.shift();
            for (const [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === Infinity) {
                    dist[nr][nc] = dist[row][col] + 1;
                    queue.push({ row: nr, col: nc });
                }
            }
        }
        return dist;
    },

    // ---- получение индекса типа для предмета ивента (добавляем в ITEM_DATA) ----
    _getEventItemTypeIndex(eventId) {
        // используем фиксированный индекс, например 1000, но проверяем, что он не занят
        const index = 1000;
        if (!window.ITEM_DATA[index]) {
            window.ITEM_DATA[index] = {
                id: index,
                name: eventId,
                categoryKey: 'category_events',
                displayName: {
                    ru: 'Ивентовый предмет',
                    en: 'Event item',
                    tr: 'Etkinlik eşyası'
                },
                levelNames: {},
                initialLevel: 1,
                spawnable: false,
                spawnLevels: [],
                spawnRules: null,
                specialCombinations: []
            };
            // обновляем maxLevels
            const maxLevels = getMaxLevelsForItems();
            maxLevels[index] = this._activeEvent.maxLevel;
            // перезаписываем глобальный объект, если нужно
            window.maxLevels = maxLevels;
        }
        return index;
    },

    // ---- отрисовка цепочки уровней в блоке заказов ----
    _renderEventProgress() {
        const chain = this._eventChainContainer;
        if (!chain) return;
        const maxLevel = this._activeEvent.maxLevel;
        const opened = this._eventState.openedLevels || [];
        const isPortrait = window.innerHeight > window.innerWidth;
        const itemsPerRow = isPortrait ? 5 : 3;
        const itemTypeIndex = this._eventItemTypeIndex;
        let html = '';
        for (let lv = 1; lv <= maxLevel; lv++) {
            const isOpen = opened.includes(lv);
            const src = isOpen ? this._game.getItemImageDataUrl(itemTypeIndex, lv) : '';
            html += `<div class="event-level-cell" style="
                        width: clamp(30px, 5vmin, 60px);
                        height: clamp(30px, 5vmin, 60px);
                        border: 2px solid ${isOpen ? '#ac7d4f' : '#888'};
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: ${isOpen ? '#f0e6d3' : '#d9c5a6'};
                        font-size: clamp(1rem, 2vw, 1.5rem);
                        color: #2a1f14;
                        transition: border 0.2s;
                    ">
                        ${isOpen ? `<img src="${src}" style="width:80%; height:80%; object-fit:contain;">` : '?'}
                    </div>`;
            if (lv % itemsPerRow === 0 && lv < maxLevel) {
                html += `<div style="width:100%;"></div>`;
            }
        }
        chain.innerHTML = html;
        this._updateTimer();
    },

    // ---- обновление таймера ----
    _updateTimer() {
        const timerDiv = document.getElementById('event-timer');
        if (!timerDiv) return;
        const now = Date.now();
        const start = new Date(this._activeEvent.startDate).getTime();
        const end = start + this._activeEvent.durationDays * 24 * 60 * 60 * 1000;
        const diff = end - now;
        if (diff <= 0) {
            timerDiv.textContent = 'Ивент завершён';
            return;
        }
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        let text;
        if (days > 0) {
            text = `${days}д ${hours}ч`;
        } else {
            text = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        }
        timerDiv.textContent = text;
    },

    _startTimer() {
        this._updateTimer();
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = setInterval(() => this._updateTimer(), 1000);
    },

    // ---- обработчик создания предмета ивента ----
    _onEventItemCreated(level) {
        if (!this._eventState.openedLevels.includes(level)) {
            this._eventState.openedLevels.push(level);
            this._saveState();
            this._renderEventProgress();
            this._checkCompletion();
        }
    },

    // ---- проверка завершения ивента ----
    _checkCompletion() {
        const maxLevel = this._activeEvent.maxLevel;
        const opened = this._eventState.openedLevels || [];
        const allLevelsOpened = opened.length === maxLevel;
        // проверяем, все ли клетки открыты (нет locked)
        let allCellsUnlocked = true;
        for (let r = 0; r < this._game.rows; r++) {
            for (let c = 0; c < this._game.cols; c++) {
                if (this._game.board[r][c].locked === true) {
                    allCellsUnlocked = false;
                    break;
                }
            }
            if (!allCellsUnlocked) break;
        }
        if (allLevelsOpened && allCellsUnlocked) {
            // ивент завершён
            this._completeEvent();
        }
    },

    _completeEvent() {
        // показать награду, остановить таймер, переключить в обычный режим
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
        // убираем колбэк
        this._game.onItemCreated = null;
        // показываем модалку с наградой
        const rewardText = `🎉 Поздравляем! Вы завершили ивент "${this._activeEvent.name.ru}"! Получено ${this._activeEvent.reward.score} очков.`;
        ModalManager.showCenterModal({
            title: 'Ивент завершён',
            body: rewardText,
            buttons: [
                {
                    text: 'OK',
                    onClick: () => {
                        ModalManager.closeCenterModal();
                        // можно переключиться в обычную игру
                        // для простоты просто скрываем ивент и перезапускаем игру
                        this._deactivateEvent();
                    }
                }
            ]
        });
        // начислить награду
        if (this._activeEvent.reward.score) {
            this._game.score += this._activeEvent.reward.score;
            const prog = Storage.getProgress();
            prog.score = this._game.score;
            Storage.saveProgress(prog);
            this._game.updateUI();
        }
        // также можно дать предметы
    },

    _deactivateEvent() {
        // снимаем класс event-mode
        document.body.classList.remove('event-mode');
        // показываем кнопки quest и gift
        const questBtn = document.getElementById('quest-btn');
        const giftBtn = document.getElementById('gift-btn');
        if (questBtn) questBtn.style.display = 'flex';
        if (giftBtn) giftBtn.style.display = 'flex';
        // скрываем кнопку ивента
        const eventBtn = document.getElementById('event-btn');
        if (eventBtn) eventBtn.style.display = 'none';
        // восстанавливаем обычную доску? Пока просто перезагружаем игру
        // в реальности нужно переключиться на обычный режим
        // можно перезапустить App.startGame() без ивента
        // но это сложно, пока просто выведем сообщение
        console.log('Ивент деактивирован, переключитесь на обычную игру');
        // Для простоты можно перезагрузить страницу или вызвать App.startGame() с флагом
        // лучше реализовать отдельный метод для переключения
    },

    // ---- обработчик клика по кнопке ивента (подарки) ----
    handleEventButtonClick() {
        const config = this._activeEvent;
        if (!config) return;
        const state = this._eventState;
        const now = Date.now();
        const canClaimFree = !state.freeClaimed || (now - state.lastFreeClaimDate > 24 * 60 * 60 * 1000);
        const itemTypeIndex = this._eventItemTypeIndex;
        const img1 = this._game.getItemImageDataUrl(itemTypeIndex, 1);
        const img2 = this._game.getItemImageDataUrl(itemTypeIndex, 2);

        let bodyHtml;
        if (canClaimFree) {
            bodyHtml = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.8rem; padding:0.5rem;">
                    <div style="font-size:clamp(1rem,2vw,1.4rem); text-align:center;">
                        ${getText('gift_text1', 'Гуляя по лесу, ты нашёл что-то полезное!')}
                    </div>
                    <div style="display:flex; gap:1rem;">
                        <div style="text-align:center;">
                            <div style="width:clamp(3rem,8vw,6rem); height:clamp(3rem,8vw,6rem); background:#d9c5a6; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid #2a1f14;">
                                <img src="${img1}" style="width:80%; height:80%; object-fit:contain;">
                            </div>
                            <div style="font-size:0.8rem; color:#2a1f14;">x3</div>
                        </div>
                    </div>
                    <button id="event-claim-free-btn" class="modal-btn">${getText('gift_get', 'Получить')}</button>
                </div>
            `;
        } else {
            bodyHtml = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.8rem; padding:0.5rem;">
                    <div style="font-size:clamp(1rem,2vw,1.4rem); text-align:center;">
                        ${getText('reward_ad_prompt', 'Посмотри рекламу и получи случайный предмет!')}
                    </div>
                    <div style="display:flex; gap:1rem;">
                        <div style="text-align:center;">
                            <div style="width:clamp(3rem,8vw,6rem); height:clamp(3rem,8vw,6rem); background:#d9c5a6; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid #2a1f14;">
                                <img src="${img1}" style="width:80%; height:80%; object-fit:contain;">
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:clamp(3rem,8vw,6rem); height:clamp(3rem,8vw,6rem); background:#d9c5a6; border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid #2a1f14;">
                                <img src="${img2}" style="width:80%; height:80%; object-fit:contain;">
                            </div>
                        </div>
                    </div>
                    <button id="event-reward-ad-btn" class="modal-btn">📺</button>
                </div>
            `;
        }

        const modal = ModalManager.showCenterModal({
            title: config.name.ru, // можно локализовать
            body: bodyHtml,
            buttons: []
        });

        if (canClaimFree) {
            const claimBtn = modal.querySelector('#event-claim-free-btn');
            if (claimBtn) {
                claimBtn.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0) return;
                    this._giveFreeItems();
                    ModalManager.closeCenterModal();
                });
            }
        } else {
            const adBtn = modal.querySelector('#event-reward-ad-btn');
            if (adBtn) {
                adBtn.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0) return;
                    Platform.showRewardedAd()
                        .then((rewarded) => {
                            if (rewarded) {
                                ModalManager.closeCenterModal();
                                this._giveRewardItems();
                            } else {
                                ModalManager.closeCenterModal();
                                ModalManager.showErrorModal(
                                    getText('reward_ad_error_title', 'Ошибка'),
                                    getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                                );
                            }
                        })
                        .catch(() => {
                            ModalManager.closeCenterModal();
                            ModalManager.showErrorModal(
                                getText('reward_ad_error_title', 'Ошибка'),
                                getText('reward_ad_error_text', 'Ой, условия не выполнены!')
                            );
                        });
                });
            }
        }
    },

    // ---- выдача бесплатных предметов (3 шт уровня 1) ----
    _giveFreeItems() {
        const state = this._eventState;
        state.freeClaimed = true;
        state.lastFreeClaimDate = Date.now();
        this._saveState();
        const itemTypeIndex = this._eventItemTypeIndex;
        for (let i = 0; i < 3; i++) {
            const freeCell = this._game.findFreeCell();
            if (freeCell) {
                const btnRect = document.getElementById('event-btn')?.getBoundingClientRect();
                let startX, startY;
                if (btnRect && this._game.canvas) {
                    const canvasRect = this._game.canvas.getBoundingClientRect();
                    startX = (btnRect.left + btnRect.width/2 - canvasRect.left) * this._game.scaleX;
                    startY = (btnRect.top + btnRect.height/2 - canvasRect.top) * this._game.scaleY;
                } else {
                    startX = this._game.canvas ? this._game.canvas.width/2 : 0;
                    startY = this._game.canvas ? this._game.canvas.height/2 : 0;
                }
                this._game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col, itemTypeIndex, 1);
            } else {
                ModalManager.showErrorModal(
                    getText('inventory_no_space_title', 'Нет места'),
                    getText('inventory_no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
                break;
            }
        }
        this._game.updateUI();
    },

    // ---- выдача предметов за рекламу (3 шт случайного уровня 1 или 2) ----
    _giveRewardItems() {
        const itemTypeIndex = this._eventItemTypeIndex;
        for (let i = 0; i < 3; i++) {
            const level = Math.random() < 0.7 ? 1 : 2; // 70% шанс на 1, 30% на 2
            const freeCell = this._game.findFreeCell();
            if (freeCell) {
                const btnRect = document.getElementById('event-btn')?.getBoundingClientRect();
                let startX, startY;
                if (btnRect && this._game.canvas) {
                    const canvasRect = this._game.canvas.getBoundingClientRect();
                    startX = (btnRect.left + btnRect.width/2 - canvasRect.left) * this._game.scaleX;
                    startY = (btnRect.top + btnRect.height/2 - canvasRect.top) * this._game.scaleY;
                } else {
                    startX = this._game.canvas ? this._game.canvas.width/2 : 0;
                    startY = this._game.canvas ? this._game.canvas.height/2 : 0;
                }
                this._game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col, itemTypeIndex, level);
            } else {
                ModalManager.showErrorModal(
                    getText('inventory_no_space_title', 'Нет места'),
                    getText('inventory_no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
                break;
            }
        }
        this._game.updateUI();
    }
};

// Глобальный доступ
window.EventManager = EventManager;