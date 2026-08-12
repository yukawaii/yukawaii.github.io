// ============================================================
//  EXPERIENCE  — система опыта и уровня
// ============================================================
const Experience = {
    _exp: 0,
    _game: null,
    _onLevelUp: [],

    // Награды за уровни: { уровень: { typeIndex, level } }
    _levelRewards: {
        2: { typeIndex: 8, level: 2 },   // батарейка
        3: { typeIndex: 8, level: 2 },   
        4: { typeIndex: 8, level: 2 }, 
        5: { typeIndex: 8, level: 2 }, 
        // можно расширять
    },

    init(game) {
        this._game = game;
        this.load();
    },

    onLevelUp(callback) {
        if (typeof callback === 'function') {
            this._onLevelUp.push(callback);
        }
    },

    load() {
        const progress = Storage.getProgress();
        this._exp = progress.exp || 0;
        this._updateLevel();
    },

    save() {
        const progress = Storage.getProgress();
        progress.exp = this._exp;
        Storage.saveProgress(progress);
        this._updateLevel();
    },

    clearCallbacks() {
        this._onLevelUp = [];
    },

    getExp() { return this._exp; },

    setExp(value) {
        this._exp = Math.max(0, value);
        this.save();
    },

    addExp(amount) {
        if (amount <= 0) return;
        const oldLevel = this.getLevel();
        this._exp += amount;
        this.save();
        const newLevel = this.getLevel();
        if (newLevel > oldLevel) {
            for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
                this._onLevelUp.forEach(cb => cb(lv, oldLevel));
            }
        }
    },

    getLevel() {
        return 1 + Math.floor(this._exp / 10); // 10 хп до след уровня
    },

    getExpToNextLevel() {
        const currentLevel = this.getLevel();
        const needed = currentLevel * 10;  // 10 хп до след уровня
        return Math.max(0, needed - this._exp);
    },

    // Прогресс 0..1
    getProgress() {
        const currentLevel = this.getLevel();
        const expInLevel = this._exp - (currentLevel - 1) * 10; // 10 хп до след уровня
        return Math.min(Math.max(expInLevel / 10, 0), 1); // 10 хп до след уровня
    },

    getLevelReward(level) {
        return this._levelRewards[level] || null;
    },

    // Выдача подарка за уровень (всегда в инвентарь)
  giveLevelReward(level) {
    const game = this._game;
    if (!game) return;

    let reward = this.getLevelReward(level);
    let typeIndex, rewardLevel;
    if (reward) {
        typeIndex = reward.typeIndex;
        rewardLevel = reward.level;
    } else {
        const config = getCurrentSceneConfig();
        const available = config.availableTypes || [];
        if (available.length === 0) return;
        typeIndex = available[Math.floor(Math.random() * available.length)];
        rewardLevel = 1;
    }

    const maxLevel = game.maxLevels[typeIndex] || 1;
    if (rewardLevel > maxLevel) rewardLevel = 1;

    // Кладём в инвентарь
    const prog = Storage.getProgress();
    if (!prog.inventory) prog.inventory = [];
    prog.inventory.push({ typeIndex, level: rewardLevel });
    Storage.saveProgress(prog);
    if (game.updateInventoryButton) game.updateInventoryButton();

    // Случайная фраза
    const phrases = [
        getText('gift_text1', 'Гуляя по лесу, ты нашёл что-то полезное!'),
        getText('gift_text2', 'Кажется, что-то блестит под старым пнём…'),
        getText('gift_text3', 'Приподняв корягу, ты нашёл что-то полезное!'),
        getText('gift_text4', 'Под ворохом листьев ты нашёл что-то полезное!')
    ];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

const imgSrc = game.getItemImageDataUrl(typeIndex, rewardLevel) || '';
    ModalManager.showCenterModal({
        title: getText('gift_title', 'Подарок'),
        body: `
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.8rem;">
                <div style="width: clamp(4rem, 10vw, 8rem); height: clamp(4rem, 10vw, 8rem); 
                            background: #d9c5a6; border-radius: 12px; border: 3px solid #2a1f14; 
                            display:flex; align-items:center; justify-content:center;">
                    <img src="${imgSrc}" style="width:80%; height:80%; object-fit:contain;">
                </div>
                <div style="font-size: clamp(1rem, 2vw, 1.5rem); text-align:center; color: #4a3a2a;">
                    ${randomPhrase}
                </div>
            </div>
        `,
        buttons: [
            {
                text: getText('to_inventory', 'В корзинку'),
                onClick: () => ModalManager.closeCenterModal()
            }
        ]
    });
},

    _updateLevel() {
        if (this._game) {
            this._game.level = this.getLevel();
            if (typeof this._game.updateUI === 'function') {
                this._game.updateUI();
            }
        }
    }
};