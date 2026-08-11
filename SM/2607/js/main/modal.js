// ============================================================
//  MODAL MANAGER  — упрощённая версия (без портретных дублей)
// ============================================================

const ModalManager = {
    _overlay: null,
    _centerModal: null,
    _orderArea: null,
    _infoContainer: null,

    init() {
        this._orderArea = document.getElementById('order-area');
        this._infoContainer = document.getElementById('info-modal-container');

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
            if (order.onClick) el.addEventListener('click', order.onClick);
            container.appendChild(el);
        });
    },

    // ---- ИНФО-МОДАЛКА ----
showInfoModal(options) {
    this._renderInfo(this._infoContainer, options);
},

    _renderInfo(container, options) {
        const { title, description, helpAction, trashAction, showTrash, showHelp } = options;
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
            trashBtn.className = 'info-trash-btn';
            trashBtn.innerHTML = '🗑️';
            trashBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                trashAction();
            });
            buttonGroup.appendChild(trashBtn);
        }

        if (showHelp && helpAction) {
            const helpBtn = document.createElement('div');
            helpBtn.className = 'info-help-btn';
            helpBtn.textContent = '?';
            helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
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

   /* closeInfoModal() {
        this._lastInfoOptions = null;
        if (this._infoContainer) {
            this._infoContainer.innerHTML = '';
        }
    },    очистка инфо-модалки больше не используется, там всегда подсказка*/

    // ---- ЦЕНТРАЛЬНАЯ МОДАЛКА ----
    showCenterModal(options = {}) {
        const { title = '', body = '', buttons = [], onClose = null } = options;
        this.closeCenterModal();

        if (!this._overlay) {
            console.warn('ModalManager: overlay not found');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'center-modal modal-fade-in';

        const titleEl = document.createElement('div');
        titleEl.className = 'modal-title';
        titleEl.textContent = title;
        modal.appendChild(titleEl);

        const bodyEl = document.createElement('div');
        bodyEl.className = 'modal-body';
        bodyEl.innerHTML = body;
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
        closeBtn.addEventListener('click', () => {
            this.closeCenterModal();
            if (onClose) onClose();
        });
        modal.appendChild(closeBtn);

        this._centerModal = modal;
        this._overlay.appendChild(modal);
        this._overlay.classList.add('active');

        return modal;
    },

    closeCenterModal() {
        if (this._centerModal) {
            this._centerModal.remove();
            this._centerModal = null;
        }
        if (!this._centerModal && this._overlay) {
            this._overlay.classList.remove('active');
        }
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
    const prog = Storage.getProgress();
    const inventory = prog.inventory || [];
    if (inventory.length === 0) {
        this.showCenterModal({
            title: getText('inventory_title', 'Корзинка'),
            body: getText('inventory_empty', 'Корзинка пуста'),
            buttons: [{ text: getText('ok', 'OK'), onClick: () => this.closeCenterModal() }]
        });
        return;
    }

    let gridHtml = '<div class="item-info-grid" style="justify-content:center; gap:0.5rem; flex-wrap:wrap;">';
    inventory.forEach((item, index) => {
        const src = Game.getImageSrc(item.typeIndex, item.level);
        gridHtml += `<div class="item-info-cell inventory-cell" data-index="${index}" style="cursor:pointer;">`;
        gridHtml += `<img src="${src}" class="item-info-img" alt="">`;
        gridHtml += `</div>`;
    });
    gridHtml += '</div>';

    let selectedIndex = null;
    const body = document.createElement('div');
    body.innerHTML = gridHtml;

    const getButton = {
        text: getText('inventory_get', 'Получить'),
        class: 'inventory-get-btn',
        disabled: true,
        onClick: () => {
            if (selectedIndex === null) return;
            const item = inventory[selectedIndex];
            const freeCell = Game.findFreeCell();
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
                prog.inventory.splice(selectedIndex, 1);
                Storage.saveProgress(prog);
                Game.spawnItemFromPoint(startX, startY, freeCell.row, freeCell.col, item.typeIndex, item.level);
                ModalManager.closeCenterModal();
                Game.updateInventoryButton();
            } else {
                ModalManager.closeCenterModal();
                ModalManager.showErrorModal(
                    getText('inventory_no_space_title', 'Нет места'),
                    getText('inventory_no_space_text', 'Расчисти место, чтобы было куда это положить')
                );
            }
        }
    };

    const modal = this.showCenterModal({
        title: getText('inventory_title', 'Корзинка'),
        body: body.innerHTML,
        buttons: [getButton],
        onClose: () => { selectedIndex = null; }
    });

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
                  if (this._overlay) this._overlay.classList.remove('active');
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