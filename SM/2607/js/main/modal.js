// ============================================================
//  MODAL MANAGER  — упрощённая версия (без портретных дублей)
// ============================================================

const FRAME_CORNER_SIZE = 100;   // ширина рамки в спрайте (100px)
const FRAME_SPRITE_SIZE = 700;   // размер всего спрайта (700x700)

const ModalManager = {
    _overlay: null,
    _centerModal: null,
    _orderArea: null,
    _infoContainer: null,
    

    init() {
        this._orderArea = document.getElementById('order-area');
this._infoContainer = document.getElementById('info-modal-container') || document.getElementById('event-info-modal-container');

        // Создаём оверлей, если его нет
        if (!document.getElementById('modal-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            document.body.appendChild(overlay);
            this._overlay = overlay;
        } else {
            this._overlay = document.getElementById('modal-overlay');
        }

        // Если контейнеры отсутствуют – создаём (для обратной совместимости)
        if (!this._orderArea) {
            const area = document.createElement('div');
            area.id = 'order-area';
            document.body.appendChild(area);
            this._orderArea = area;
        }
        if (!this._infoContainer) {
            const container = document.createElement('div');
            container.id = 'info-modal-container';
            document.body.appendChild(container);
            this._infoContainer = container;
        }

        // Управление адаптацией полностью через CSS 
    },

    // ---- ОБНОВЛЕНИЕ ЗАКАЗОВ ----
    updateOrderArea(orders) {
          this._renderOrders(this._orderArea, orders);
    },

_renderOrders(container, orders) {
    container.innerHTML = '';
    if (!orders || orders.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';
    orders.forEach(order => {
        const el = document.createElement('div');
        el.className = 'order-item';
        el.innerHTML = `
            <span class="order-icon">${order.icon || '🍽️'}</span>
            ${order.text || ''}
            <span class="order-count">${order.count || 0}</span>
        `;
        if (order.onClick) {
            el.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;   // только левая кнопка
                e.stopPropagation();
                e.preventDefault();
                order.onClick(e);
            });
        }
        container.appendChild(el);
    });
},

    // ---- ИНФО-МОДАЛКА ----
showInfoModal(options) {
    // Убедимся, что контейнер актуален
    if (!this._infoContainer || !document.contains(this._infoContainer)) {
        // Если контейнер не существует или не в DOM, попробуем найти заново
        const gameContainer = document.getElementById('info-modal-container');
        const eventContainer = document.getElementById('event-info-modal-container');
        // Определяем, какая сцена активна
        const isEvent = document.getElementById('scene-event')?.classList.contains('active');
        this._infoContainer = isEvent ? eventContainer : gameContainer;
    }
    // Если всё ещё null, создаём fallback
    if (!this._infoContainer) {
        const fallback = document.createElement('div');
        fallback.id = 'info-modal-container';
        document.body.appendChild(fallback);
        this._infoContainer = fallback;
    }
    // Убедимся, что контейнер видим и получает события
    this._infoContainer.style.pointerEvents = 'auto';
    this._renderInfo(this._infoContainer, options);
},

    _renderInfo(container, options) {
     
           if (!container) {
        console.warn('[ModalManager._renderInfo] контейнер отсутствует');
        return;
    }
        const { title, description, helpAction, trashAction, showTrash, showHelp } = options;
          //   console.log('[ModalManager._renderInfo] container:', container, 'options:', options);
        container.innerHTML = '';
        const modal = document.createElement('div');
        modal.className = 'info-modal';

        // Заголовок + кнопки в одной строке
        const header = document.createElement('div');
        header.className = 'info-header';
        const titleEl = document.createElement('div');
        titleEl.className = 'info-title';
        titleEl.textContent = title || '';
        header.appendChild(titleEl);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'info-button-group';

        if (showTrash && trashAction) {
            const trashBtn = document.createElement('button');
             //   console.log('[ModalManager._renderInfo] trashBtn:', trashBtn);
            trashBtn.className = 'info-trash-btn';
            trashBtn.innerHTML = '🗑️';
   trashBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    trashAction();
});
            buttonGroup.appendChild(trashBtn);
        }

        if (showHelp && helpAction) {
            const helpBtn = document.createElement('div');
             //   console.log('[ModalManager._renderInfo] helpBtn:', helpBtn);
            helpBtn.className = 'info-help-btn';
            helpBtn.textContent = '?';
       helpBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    helpAction();
});
            buttonGroup.appendChild(helpBtn);
        }

        header.appendChild(buttonGroup);
        modal.appendChild(header);

        if (description) {
            const body = document.createElement('div');
            body.className = 'info-body';
            body.innerHTML = description;
            modal.appendChild(body);
        }

        container.appendChild(modal);

    },

// ---- ЦЕНТРАЛЬНАЯ МОДАЛКА (с поддержкой рамки) ----
showCenterModal(options = {}) {
    const { title = '', body = '', bodyElement = null, buttons = [], onClose = null, frameName = null } = options;
    this.closeCenterModal();

    if (!this._overlay) {
        console.warn('ModalManager: overlay not found');
        return;
    }

    // ---- Создаём модалку (без изменений) ----
    const modal = document.createElement('div');
    modal.className = 'center-modal modal-fade-in';

    const titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    modal.appendChild(titleEl);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'modal-body';
    if (bodyElement) {
        bodyEl.appendChild(bodyElement);
    } else if (body) {
        bodyEl.innerHTML = body;
    }
    modal.appendChild(bodyEl);

    if (buttons.length) {
        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        buttons.forEach((btn) => {
            const b = document.createElement('button');
            b.className = `modal-btn ${btn.class || ''}`;
            b.innerHTML = btn.text;
            if (btn.onClick) {
                b.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0) return;
                    btn.onClick(e, modal);
                });
            }
            actions.appendChild(b);
        });
        modal.appendChild(actions);
    }

    const closeBtn = document.createElement('div');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('pointerdown', () => {
        this.closeCenterModal();
        if (onClose) onClose();
    });
    modal.appendChild(closeBtn);

    // ---- Рамка поверх модалки ----
    let rootElement = modal;
   // ---- Рамка поверх модалки (внутри modal) ----
if (frameName) {
    const frameUrl = this.getFrameDataURL(frameName);
    if (frameUrl) {
        // 1. Делаем modal позиционированным контейнером и разрешаем выступать за пределы
        modal.style.position = 'relative';
        modal.style.overflow = 'visible';
        modal.style.borderRadius = '0'; // убираем скругление, чтобы рамка была ровной

        // 2. Создаём слой рамки как дочерний элемент modal
        const frameLayer = document.createElement('div');
        const offset = Device.isMobile ? 15 : 30; // отступ рамки от края модалки
        const borderWidth = Device.isMobile ? 80 : 120;

        frameLayer.style.position = 'absolute';
        frameLayer.style.top = `-${offset}px`;
        frameLayer.style.left = `-${offset}px`;
        frameLayer.style.right = `-${offset}px`;
        frameLayer.style.bottom = `-${offset}px`;
        frameLayer.style.pointerEvents = 'none'; // клики проходят сквозь рамку
        frameLayer.style.zIndex = '1';           // ниже кнопок
        frameLayer.style.border = `${borderWidth}px solid transparent`;
        frameLayer.style.borderImageSource = `url(${frameUrl})`;
       frameLayer.style.borderImageSlice = '35.7%'; // уголки
        frameLayer.style.borderImageRepeat = 'stretch';
        frameLayer.style.boxSizing = 'border-box';

        // Вставляем рамку первым дочерним элементом (позади всего содержимого)
        modal.insertBefore(frameLayer, modal.firstChild);

        // 3. Поднимаем кнопки поверх рамки
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.style.zIndex = '10';
        }
        const actionBtns = modal.querySelectorAll('.modal-btn');
        actionBtns.forEach(btn => {
            btn.style.position = 'relative';
            btn.style.zIndex = '10';
        });
    } else {
        console.warn('[ModalManager] Рамка не найдена:', frameName);
    }
}

    this._centerModal = rootElement;
    this._overlay.appendChild(rootElement);
    this._overlay.classList.add('active');

    return rootElement;
},



closeCenterModal() {
    if (this._centerModal) {
        this._centerModal.remove();
        this._centerModal = null;
    }
    if (this._overlay) {
       this._overlay.classList.remove('active');
        
        // НЕ трогаем display и pointer-events важно иначе кнопки перестанут выполняться
    }
},

// ---- ПОЛУЧЕНИЕ DATA URL РАМКИ ----
getFrameDataURL(frameName) {
    if (typeof SpriteAtlas === 'undefined') return null;
    // Путь в атласе: "ui/ramki/ramka1.png"
    return SpriteAtlas.getSpriteDataURL('ui', `ui/ramki/${frameName}.png`);
},

    // ---- ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ----
    confirmDelete(item, onConfirm) {
        const itemName = item?.name || 'предмет';
        const texts = {
            title: '🗑️ ' + itemName,
            body: getText('confirm_delete', 'Вы уверены, что хотите удалить этот предмет?'),
            confirm: getText('delete', 'Удалить'),
            cancel: getText('cancel', 'Отмена'),
        };
        this.showCenterModal({
            title: texts.title,
            body: texts.body,
            buttons: [
                {
                    text: texts.cancel,
                    class: 'modal-btn-secondary',
                    onClick: () => this.closeCenterModal(),
                },
                {
                    text: texts.confirm,
                    onClick: () => {
                        this.closeCenterModal();
                        if (onConfirm) onConfirm();
                    },
                },
            ],
        });
    },


/** Показать модалку с содержимым корзинки */
showInventoryModal() {
    if (typeof Game === 'undefined' || !Game.canvas) {
        this.showErrorModal(
            getText('reward_ad_error_title', 'Ошибка'),
            getText('game_not_started', 'Игра не запущена')
        );
        return;
    }

    const inventory = Storage.getInventory();
    if (inventory.length === 0) {
        this.showCenterModal({
            title: getText('inventory_title', 'Корзинка'),
            body: getText('inventory_empty', 'Корзинка пуста'),
            buttons: [{ text: getText('ok', 'OK'), onClick: () => this.closeCenterModal() }]
        });
        return;
    }

    // Создаём контейнер для сетки
    const gridContainer = document.createElement('div');
    gridContainer.className = 'item-info-grid';
    gridContainer.style.cssText = 'justify-content:center; gap:0.5rem; flex-wrap:wrap;';

    // Фрагмент для ячеек
    const fragment = document.createDocumentFragment();

    inventory.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.className = 'item-info-cell inventory-cell';
        cell.dataset.index = index;
        cell.style.cursor = 'pointer';

        const img = document.createElement('img');
        const src = BoardCore.getItemImageDataUrl(Game, item.typeIndex, item.level);
        img.src = src || '';
        img.className = 'item-info-img';
        img.alt = '';
        cell.appendChild(img);
        fragment.appendChild(cell);
    });

    gridContainer.appendChild(fragment);

    // Подготовка кнопки "Получить"
    let selectedIndex = null;
    const getButton = {
        text: getText('gift_get', 'Получить'),
        class: 'inventory-get-btn',
        disabled: true,
        onClick: () => {
            if (selectedIndex === null) return;
            const item = inventory[selectedIndex];
            const freeCell = BoardCore.findFreeCell(Game);
            if (freeCell) {
                const btnRect = Game.inventoryBtn ? Game.inventoryBtn.getBoundingClientRect() : null;
                let startX, startY;
                if (btnRect) {
                    const canvasRect = Game.canvas.getBoundingClientRect();
                    startX = (btnRect.left + btnRect.width/2 - canvasRect.left) * Game.scaleX;
                    startY = (btnRect.top + btnRect.height/2 - canvasRect.top) * Game.scaleY;
                } else {
                    startX = Game.canvas.width / 2;
                    startY = Game.canvas.height / 2;
                }
                inventory.splice(selectedIndex, 1);
                Storage.saveInventory(inventory);
                Game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col, item.typeIndex, item.level);
                ModalManager.closeCenterModal();
                Game.updateInventoryButton();
            } else {
                ModalManager.closeCenterModal();
                ModalManager.showErrorModal(
                    getText('no_space', 'Нет места'),
                    getText('no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
            }
        }
    };

    // в showInventoryModal после создания gridContainer:
const modal = this.showCenterModal({
    title: getText('inventory_title', 'Корзинка'),
    bodyElement: gridContainer,  // передаём DOM-элемент
    buttons: [getButton],
    onClose: () => { selectedIndex = null; }
});
    // Обработчики кликов по ячейкам
    const cells = modal.querySelectorAll('.inventory-cell');
    cells.forEach(cell => {
        cell.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const idx = parseInt(cell.dataset.index);
            cells.forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedIndex = idx;
            const getBtn = modal.querySelector('.inventory-get-btn');
            if (getBtn) {
                getBtn.disabled = false;
                getBtn.style.opacity = '1';
                getBtn.style.pointerEvents = 'auto';
            }
        });
    });

    const getBtn = modal.querySelector('.inventory-get-btn');
    if (getBtn) {
        getBtn.disabled = true;
        getBtn.style.opacity = '0.5';
        getBtn.style.pointerEvents = 'none';
    }
},

/** Показать мини-модалку с ошибкой */
showErrorModal(title, text) {
    this.showCenterModal({
        title: title,
        body: text,
        buttons: [{ text: getText('ok', 'OK'), onClick: () => this.closeCenterModal() }]
    });
},


          showSettingsModal() {
    const soundEnabled = AudioManager.soundEnabled;
    const selectedTrack = AudioManager._selectedTrack; // или геттер

    // Иконки для звука
    const soundIcon = soundEnabled ? '🔊' : '🔇';

    // Иконки для птиц
    const birdsIcon = (selectedTrack === 'birds') ? '🐦' : '🕊️';

    // Иконки для нот
    const notesIcon = (selectedTrack === 'notes') ? '🎵' : '🎶';

    const bodyHtml = `
        <div class="settings-modal-body">
            <div class="settings-row" style="display:flex; gap:1.2rem; flex-wrap:wrap; justify-content:center;">
                <button class="modal-btn settings-sound-btn" id="settings-sound-btn">${soundIcon}</button>
                <button class="modal-btn settings-birds-btn" id="settings-birds-btn">${birdsIcon}</button>
                <button class="modal-btn settings-notes-btn" id="settings-notes-btn">${notesIcon}</button>
            </div>
            <div class="lang-row" style="display:flex; gap:0.8rem; flex-wrap:wrap; justify-content:center; margin-top:0.5rem;">
                <button class="lang-btn lang-settings-btn" data-lang="ru">🇷🇺 RU</button>
                <button class="lang-btn lang-settings-btn" data-lang="en">🇬🇧 EN</button>
                <button class="lang-btn lang-settings-btn" data-lang="tr">🇹🇷 TR</button>
            </div>
        </div>
    `;

    const modal = this.showCenterModal({
        title: getText('settings_title', 'Настройки'),
        body: bodyHtml,
        buttons: []
    });

    // Звук
    const soundBtn = modal.querySelector('#settings-sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const enabled = AudioManager.toggleSound();
            const icon = enabled ? '🔊' : '🔇';
            soundBtn.textContent = icon;
        });
    }

    // Птицы
    const birdsBtn = modal.querySelector('#settings-birds-btn');
    if (birdsBtn) {
        birdsBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            AudioManager.setSelectedTrack('birds');
            // Обновляем иконки обеих музыкальных кнопок
            const newBirdsIcon = (AudioManager._selectedTrack === 'birds') ? '🐦' : '🕊️';
            birdsBtn.textContent = newBirdsIcon;
            const notesBtn = modal.querySelector('#settings-notes-btn');
            if (notesBtn) {
                notesBtn.textContent = (AudioManager._selectedTrack === 'notes') ? '🎵' : '🎶';
            }
        });
    }

    // Ноты
    const notesBtn = modal.querySelector('#settings-notes-btn');
    if (notesBtn) {
        notesBtn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            AudioManager.setSelectedTrack('notes');
            const newNotesIcon = (AudioManager._selectedTrack === 'notes') ? '🎵' : '🎶';
            notesBtn.textContent = newNotesIcon;
            const birdsBtn2 = modal.querySelector('#settings-birds-btn');
            if (birdsBtn2) {
                birdsBtn2.textContent = (AudioManager._selectedTrack === 'birds') ? '🐦' : '🕊️';
            }
        });
    }

    // Языковые кнопки – без изменений
    modal.querySelectorAll('.lang-settings-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const lang = btn.dataset.lang;
            if (setLanguage(lang)) {
                localStorage.setItem('cafe_lang', lang);
                applyLocale();
                this.closeCenterModal();
                this.showSettingsModal();
            }
        });
    });
},


    // ---- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ----
closeAll() {
       this.closeCenterModal();
    if (this._overlay) {
        this._overlay.classList.remove('active');
       // this._overlay.style.pointerEvents = 'none';
    }
},

    notify(message, title = '') {
        this.showCenterModal({
            title: title || '📢',
            body: message,
            buttons: [{ text: 'OK', onClick: () => this.closeCenterModal() }],
        });
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}