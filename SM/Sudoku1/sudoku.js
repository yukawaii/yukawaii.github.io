const vkBridge = window.vkBridge || {
    send: (event, data) => console.log('[VK Bridge]', event, data),
    sendPromise: (event, data) => {
        console.log('[VK Bridge]', event, data);
        return Promise.resolve({ result: true });
    },
    subscribe: () => {}
};
function getLaunchParams() {
    const result = {};
    try {
        const searchParams = new URLSearchParams(window.location.search || '');
        for (const [key, value] of searchParams) {
            result[key] = value;
        }
    } catch (e) {}
    try {
        const hash = (window.location.hash || '').replace(/^#/, '');
        if (hash) {
            const hashParams = new URLSearchParams(hash);
            for (const [key, value] of hashParams) {
                if (!(key in result)) {
                    result[key] = value;
                }
            }
        }
    } catch (e) {}

    return result;
}
const launchParams = getLaunchParams();
const platform = launchParams.vk_client === 'ok' ? 'ok' : 'vk';
const userId = parseInt(
    launchParams.vk_user_id ||      
    launchParams.vk_ok_user_id ||   
    launchParams.viewer_id ||      
    launchParams.user_id || 
    '0'
);
console.log(`🔍 Платформа: ${platform}, ID пользователя: ${userId}`);
let vkInitialized = false;
let vkUserId = null;
class AdManager {
    constructor() {
        this.bannerShown = false;
        this.bannerRetryCount = 0;
        this.maxBannerRetries = 3;
        this.bannerRetryTimeout = null;
        this.bannerPending = false;
        this.bannerDelay = 3e5;
    }
    checkAndShowBanner() {
        if (void 0 === vkBridge) return void this.scheduleBannerRetry();
        (vkBridge.sendPromise || vkBridge.send)
            .call(vkBridge, "VKWebAppCheckBannerAd", {})
            .then((e) => {
                if (e && e.result) {
                    this.bannerShown = true;
                } else {
                    this.showBannerDirect();
                }
            })
            .catch(() => { this.showBannerDirect(); });
    }
    showBannerDirect() {
        if (this.bannerPending) return;
        this.bannerPending = true;
        (vkBridge.sendPromise || vkBridge.send)
            .call(vkBridge, "VKWebAppShowBannerAd", { banner_location: "bottom" })
            .then((e) => {
                this.bannerPending = false;
                if (e && (true === e.result || 1 === e.result)) {
                    this.bannerShown = true;
                }
            })
            .catch(() => { this.bannerPending = false; });
    }
    showBottomBanner() {
        if (this.bannerShown) return;
        if (void 0 === vkBridge) return void this.scheduleBannerRetry();
        if (this.bannerPending) return;
        this.bannerRetryCount++;
        this.bannerPending = true;
        (vkBridge.sendPromise || vkBridge.send)
            .call(vkBridge, "VKWebAppShowBannerAd", { banner_location: "bottom" })
            .then((e) => {
                this.bannerPending = false;
                if (e && (true === e.result || 1 === e.result)) {
                    this.bannerShown = true;
                    this.bannerRetryCount = 0;
                } else {
                    this.scheduleBannerRetry();
                }
            })
            .catch(() => {
                this.bannerPending = false;
                this.scheduleBannerRetry();
            });
    }
    handleBannerError() {  }
    scheduleBannerRetry() {
        if (this.bannerShown) return;
        if (this.bannerRetryCount >= this.maxBannerRetries) return;
        this.bannerRetryTimeout && clearTimeout(this.bannerRetryTimeout);
        this.bannerRetryTimeout = setTimeout(() => {
            this.bannerRetryTimeout = null;
            this.showBottomBanner();
        }, this.bannerDelay); 
    }
    showRewardedAd() {
        return new Promise((e) => {
            const t = setTimeout(() => { e(!1); }, 12e4);
            if (void 0 === vkBridge) return clearTimeout(t), void e(!1);
            (vkBridge.sendPromise || vkBridge.send)
                .call(vkBridge, "VKWebAppShowNativeAds", { ad_format: "reward" })
                .then((s) => {
                    if (clearTimeout(t), s) {
                        if (!0 === s.result || !0 === s.success || "success" === s.status)
                            return this.preloadRewardedAd(), void e(!0);
                        if (s.data) {
                            const t = s.data;
                            if (!0 === t.result || !0 === t.success || "success" === t.status)
                                return void e(!0);
                        }
                        void 0 !== s.error || !1 === s.result ? e(!1) : e(!0);
                    } else e(!1);
                })
                .catch((s) => { clearTimeout(t), e(!1); });
        });
    }
    preloadRewardedAd() {
        if (void 0 === vkBridge) return;
        (vkBridge.sendPromise || vkBridge.send)
            .call(vkBridge, "VKWebAppCheckNativeAds", { ad_format: "reward" })
            .then((e) => { e && e.result })
            .catch((e) => {});
    }
}
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
        } catch (e) {  }
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
class SudokuGame {
    constructor() {
        this.sound = new SoundManager();
        this.adManager = new AdManager();
        this.adManager.preloadRewardedAd(); 
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
             this.platform = platform; 
        this.userId = userId;
            this.storagePrefix = this.platform === 'ok' ? 'ok_' : '';
this.totalChecks = 0;              
this.totalPlaced = 0;           
this.perfectGame = false;          
this.gameErrors = 0;              
this.consecutiveSameNumber = 0;   
this.lastPlacedNumber = 0;        
this.sevenCount = 0;             
this.noHintWins = 0;
this.winStreak = 0;
this.maxWinStreak = 0;
this.totalGames = 0; 
this.winsByLevel = { easy: 0, medium: 0, hard: 0, expert: 0 };
this.perfectWins = { easy: 0, medium: 0, hard: 0, expert: 0 };
this.totalGameTime = 0; 
        this.totalWins = 0;
this.totalHintsUsed = 0;
this.totalBonuses = 0;
this.achievements = {};
this.achievementsPage = 0;
this.achievementsPerPage = this._calcAchievementsPerPage();
        this.currentDiamonds = 0;        
this.lastBonusDate = null;        
this.diamondsAwardedForCurrentGame = false; 
this.vkInitialized = false;
this.vkUserId = null;
        this.menuScreen = document.getElementById('menuScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gridElement = document.getElementById('sudoku-grid');
        this.cells = [];               
        this.gridHandler = null;
this.buildGrid();              
        this.numPanel = document.getElementById('num-panel');
        this.numPanelBuilt = false; 
        this.renderNumPanel(); 
        this.messageEl = document.getElementById('message');
        this.statusEl = document.getElementById('gameStatus');
        this.timerEl = document.getElementById('timerDisplay');
this.achievementList = [
    { id: 'first_win',      name: 'Первая победа',          desc: 'Выиграть любую партию',                         icon: '🐌' },
    { id: 'win_easy',       name: 'Легкотня',               desc: 'Выиграть на лёгком ур.',                     icon: '🟢' },
    { id: 'win_medium',     name: 'Чемпион',                desc: 'Выиграть на среднем ур.',                           icon: '🟠' },
    { id: 'win_hard',       name: 'Мастер',                 desc: 'Выиграть на сложном ур.',                           icon: '🔴' },
    { id: 'win_expert',     name: 'Эксперт',                desc: 'Выиграть на эксперте',                          icon: '🟣' },
    { id: 'win_5',          name: '5 побед',                desc: 'Одержать 5 побед',                                 icon: '🏅' },
    { id: 'win_10',         name: '10 побед',               desc: 'Одержать 10 побед',                                icon: '🏆' },
    { id: 'win_25',         name: '25 побед',               desc: 'Одержать 25 побед',                                icon: '🏆' },
    { id: 'win_50',         name: '50 побед',               desc: 'Одержать 50 побед',                                icon: '👑' },
    { id: 'win_100',        name: 'Победитель',              desc: 'Одержать 100 побед',                               icon: '💎' },
    { id: 'diamonds_10',    name: 'Алмаз',             desc: 'Накопить 10 алмазов',                           icon: '👼' },
    { id: 'diamonds_50',    name: 'Любитель',             desc: 'Накопить 50 алмазов',                           icon: '💎' },
    { id: 'diamonds_100',   name: 'Ценитель',            desc: 'Накопить 100 алмазов',                          icon: '💎' },
    { id: 'diamonds_500',   name: 'Богач',            desc: 'Накопить 500 алмазов',                          icon: '💎' },
    { id: 'diamonds_1000',  name: 'Златодержец',           desc: 'Накопить 1000 алмазов',                         icon: '💎' },
    { id: 'bonus_1',        name: 'Первый бонус',           desc: 'Получить ежедневный бонус 1 раз',               icon: '🍭' },
    { id: 'bonus_5',        name: '5 бонусов',              desc: 'Получить ежедневный бонус 5 раз',               icon: '🍬' },
    { id: 'bonus_10',       name: '10 бонусов',             desc: 'Получить ежедневный бонус 10 раз',              icon: '🍑' },
    { id: 'bonus_25',       name: '25 бонусов',             desc: 'Получить ежедневный бонус 25 раз',              icon: '🍒' },
    { id: 'bonus_50',       name: '50 бонусов',             desc: 'Получить ежедневный бонус 50 раз',              icon: '🍓' },
    { id: 'hint_1',         name: 'Первая подсказка',       desc: 'Использовать 1 подсказку',                      icon: '👶' },
    { id: 'hint_10',        name: '10 подсказок',           desc: 'Использовать 10 подсказок',                     icon: '🐭' },
    { id: 'hint_25',        name: '25 подсказок',           desc: 'Использовать 25 подсказок',                     icon: '🐶' },
    { id: 'hint_50',        name: '50 подсказок',           desc: 'Использовать 50 подсказок',                     icon: '🐹' },
    { id: 'hint_100',       name: '100 подсказок',          desc: 'Использовать 100 подсказок',                    icon: '🐰' },
    { id: 'check_1',        name: 'Первая проверка',        desc: 'Выполнить 1 проверку',                          icon: '🐣' },
    { id: 'check_10',       name: '10 проверок',            desc: 'Выполнить 10 проверок',                         icon: '🐤' },
    { id: 'check_25',       name: '25 проверок',            desc: 'Выполнить 25 проверок',                         icon: '🐥' },
    { id: 'check_50',       name: '50 проверок',            desc: 'Выполнить 50 проверок',                         icon: '🐔' },
    { id: 'check_100',      name: '100 проверок',           desc: 'Выполнить 100 проверок',                        icon: '🐧' },
    { id: 'place_100',      name: 'Школяр',               desc: 'Поставить 100 цифр',                  icon: '🐱' },
    { id: 'place_500',      name: 'Студент',               desc: 'Поставить 500 цифр',                            icon: '🐗' },
    { id: 'place_1000',     name: 'Бакалавр',              desc: 'Поставить 1000 цифр',                           icon: '🐯' },
    { id: 'place_5000',     name: 'Магистр',              desc: 'Поставить 5000 цифр',                           icon: '🐲' },
    { id: 'place_10000',    name: 'Профессор',             desc: 'Поставить 10000 цифр',                          icon: '👽' },
    { id: 'time_10min',     name: 'На чиле',           desc: 'Решить быстрее 10 минут',                            icon: '🐌' },
    { id: 'perfect_easy',   name: 'Сорванец',       desc: 'Пройти лёгкий ур. без ошибок',              icon: '🍦' },
    { id: 'perfect_medium', name: 'Потихоньку',      desc: 'Пройти средний без ошибок',         icon: '🍩' },
    { id: 'perfect_hard',   name: 'Математик',      desc: 'Пройти сложный без ошибок',         icon: '🍉' },
    { id: 'perfect_expert', name: 'Мозговитый',      desc: 'Пройти эксперт без ошибок',         icon: '🍌' },
    { id: 'perfect_all',    name: 'Доцент',       desc: 'Пройти все уровни без ошибок',        icon: '🍰' },
    { id: 'no_hint_win',    name: 'Без подсказок',          desc: 'Выиграть без подсказок',                       icon: '🤯' },
    { id: 'all_checks_used',name: 'Проверено всё',          desc: 'Использовать все проверки за раунд',        icon: '📋' },
    { id: 'first_move',     name: 'Первый шаг',             desc: 'Поставить первую цифру в игре',                 icon: '👣' },
    { id: 'one_number',     name: 'Стабильность',           desc: 'Поставить одну и ту же цифру 9 раз подряд',    icon: '🔟' },
    { id: 'comeback',       name: 'Возвращение',            desc: 'Выиграть после 3 ошибок в одной игре',          icon: '🔄' },
    { id: 'lucky_7',        name: '777',     desc: 'Поставить цифру 7 в 7 разных клетках за игру',  icon: '🍀' },
{ id: 'streak_3',       name: 'Серия 3',            desc: 'Выиграть 3 партии подряд',           icon: '🔥' },
{ id: 'streak_5',       name: 'Серия 5',            desc: 'Выиграть 5 партий подряд',           icon: '🔥' },
{ id: 'streak_10',      name: 'Серия 10',           desc: 'Выиграть 10 партий подряд',          icon: '🔥' },
{ id: 'streak_20',      name: 'Серия 20',           desc: 'Выиграть 20 партий подряд',          icon: '🔥' },
{ id: 'streak_50',      name: 'Серия 50',           desc: 'Выиграть 50 партий подряд',          icon: '🐞' },
{ id: 'all_levels',     name: 'Все уровни',         desc: 'Выиграть на всех уровнях',           icon: '🏁' },
{ id: 'no_hint_10',     name: 'В 10-ку!',   desc: 'Выиграть 10 раз без подсказок',      icon: '🧠' },
{ id: 'speed_1',        name: 'Молния',        desc: 'Решить за 1 минуту',                 icon: '⚡' },
{ id: 'speed_2',        name: 'Быстрый',            desc: 'Решить за 2 минуты',                 icon: '⚡' },
{ id: 'speed_3',        name: 'Скоростной',         desc: 'Решить за 3 минуты',                 icon: '⚡' },
{ id: 'speed_5',        name: 'Гепард',      desc: 'Решить за 5 минут',                  icon: '🐎' },
{ id: 'time_1h',        name: '1 час!',       desc: 'Наиграть 1 час',                     icon: '⏳' },
{ id: 'time_5h',        name: '5 часов!',     desc: 'Наиграть 5 часов',                   icon: '⏳' },
{ id: 'time_10h',       name: '10 часов!',    desc: 'Наиграть 10 часов',                  icon: '🌿' },
{ id: 'time_24h',       name: 'Сутки!',     desc: 'Наиграть 24 часа',                   icon: '⏳' },
{ id: 'time_100h',      name: 'Сотка!',   desc: 'Наиграть 100 часов',                 icon: '⏳' },
{ id: 'early_bird',     name: 'Ранняя пташка',      desc: 'Получить бонус до 10 утра',          icon: '🌅' },
{ id: 'night_owl',      name: 'Ночная сова',        desc: 'Получить бонус после 23:00',         icon: '🌙' },
{ id: 'collector',      name: 'Коллекционер',       desc: 'Собрать 10 достижений',              icon: '📚' },
{ id: 'collector_25',   name: 'Собиратель', desc: 'Собрать 25 достижений',            icon: '📚' },
{ id: 'collector_50',   name: 'Легенда', desc: 'Собрать 50 достижений',      icon: '📚' },
{ id: 'games_50',   name: '50 партий',   desc: 'Сыграть 50 партий',   icon: '🎮' },
{ id: 'games_200',  name: '200 партий',  desc: 'Сыграть 200 партий',  icon: '🎮' },
{ id: 'games_500',  name: '500 партий',  desc: 'Сыграть 500 партий',  icon: '🎮' },
{ id: 'win_easy_10',    name: 'Лёгкий профи',    desc: '20 побед на лёгком',     icon: '🟢' },
{ id: 'win_medium_10',  name: 'Средний профи',   desc: '20 побед на среднем',    icon: '🟠' },
{ id: 'win_hard_10',    name: 'Сложный профи',   desc: '20 побед на сложном',    icon: '🔴' },
{ id: 'win_expert_10',  name: 'Экспертный профи', desc: '20 побед на эксперте',  icon: '🟣' },
];
    document.getElementById('btnStartGame').addEventListener('pointerdown', (e) => { e.preventDefault(); this.startNewGame(); });
      document.getElementById('btnBackToMenu').addEventListener('pointerdown', (e) => { e.preventDefault(); this.goToMenu(); });
      document.getElementById('btnToggleSound').addEventListener('pointerdown', (e) => { e.preventDefault(); this.toggleSound(); });
     document.getElementById('btnInviteFriends').addEventListener('pointerdown', (e) => { e.preventDefault(); this.inviteFriends(); });
   document.getElementById('btnHint').addEventListener('pointerdown', (e) => { e.preventDefault(); this.giveHint(); });
    document.getElementById('btnCheck').addEventListener('pointerdown', (e) => { e.preventDefault(); this.checkNumber(); });
      document.getElementById('btnSolveAll').addEventListener('pointerdown', (e) => { e.preventDefault(); this.solveAll(); });
document.getElementById("dailyBonusUnavailableOk").addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),this.closeModal("dailyBonusUnavailableModal"),this.resumeTimer()}));
document.getElementById("dailyBonus5").addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),this.closeModal("dailyBonusModal"),this.claimBonus(5)}));
document.getElementById('dailyBonus15').addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    this.sound.click();
    if (!this.canClaimDailyBonus()) {
        this.showGlobalToast('❌ Бонус уже получен сегодня!', true);
        this.closeModal('dailyBonusModal');
        return;
    }
    const modal = document.getElementById('dailyBonusModal');
    const choiceBlock = modal.querySelector('.bonus-choice');
    const loadingBlock = modal.querySelector('.bonus-loading');
    choiceBlock.style.display = 'none';
    loadingBlock.style.display = 'block';
    try {
        const adShown = await this.adManager.showRewardedAd();
        modal.style.display = 'none';
        if (adShown) {
            this.claimBonus(15);
            this.showGlobalToast('🎉 +15 алмазов за просмотр рекламы!', false);
        } else {
            this.claimBonus(1);
            this.showGlobalToast('⚠️ Реклама недоступна, вы получили +1 алмаз.', true);
        }
    } catch (error) {
        console.error('Ошибка в dailyBonus15:', error);
        modal.style.display = 'none';
        this.claimBonus(1);
        this.showGlobalToast('❌ Ошибка загрузки рекламы, но вы получили +1 алмаз.', true);
    } finally {
        choiceBlock.style.display = 'block';
        loadingBlock.style.display = 'none';
            this.resumeTimer();
    }
});
document.getElementById("dailyBonusCancel").addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),this.closeModal("dailyBonusModal"),this.resumeTimer()}));
document.getElementById("btnLeaderboard").addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),this.showLeaderboard()}));
document.getElementById("btnDailyBonus").addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),this.showDailyBonusModal()}));
document.getElementById("btnThemeSun").addEventListener("pointerdown",(function(e){e.preventDefault(),document.getElementById("themeModal").style.display="flex"}));
document.getElementById("btnHowToPlay").addEventListener("pointerdown",(e=>{this.sound.click(),document.getElementById("howToPlayModal").style.display="flex"}));
document.getElementById("btnAchievements").addEventListener("pointerdown",(e=>{this.sound.click(),this.openAchievementsModal()}));
document.getElementById('closeAchievementsModal').addEventListener('pointerdown', (e) => { e.preventDefault(); this.closeAchievementsModal(); });
document.getElementById('achPrevPage').addEventListener('pointerdown', (e) => { e.preventDefault(); this.achievementsPrevPage(); });
document.getElementById('achNextPage').addEventListener('pointerdown', (e) => { e.preventDefault(); this.achievementsNextPage(); });
document.getElementById("closeHowToPlay").addEventListener("pointerdown",(e=>{e.preventDefault(),document.getElementById("howToPlayModal").style.display="none"}));
document.getElementById("closeHowToPlayBtn").addEventListener("pointerdown",(e=>{e.preventDefault(),document.getElementById("howToPlayModal").style.display="none"}));
document.getElementById("howToPlayModal").addEventListener("pointerdown",(e=>{e.preventDefault(),e.target===e.currentTarget&&(document.getElementById("howToPlayModal").style.display="none")}));
   document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.diff;
        this.sound.click();
    });
});
window.addEventListener('resize', () => {
    const newPerPage = this._calcAchievementsPerPage();
    if (newPerPage !== this.achievementsPerPage) {
        this.achievementsPerPage = newPerPage;
        const modal = document.getElementById('achievementsModal');
        if (modal && modal.style.display === 'flex') {
            this.achievementsPage = 0;   
            this.renderAchievements();
        }
    }
});
document.getElementById("dailyBonusModal").addEventListener("pointerdown",(e=>{e.preventDefault(),e.target===e.currentTarget&&(this.closeModal("dailyBonusModal"),this.resumeTimer())}));
document.getElementById("dailyBonusUnavailableModal").addEventListener("pointerdown",(e=>{e.preventDefault(),e.target===e.currentTarget&&(this.closeModal("dailyBonusUnavailableModal"),this.resumeTimer())}));
        this.setupVKBridge();
        this.showMenu();
        this.updateDiamondUI(); 
        this.initAdBanner();
if (this.platform === 'ok') {
    const inviteBtn = document.getElementById('btnInviteFriends');
    const leaderBtn = document.getElementById('btnLeaderboard');
    if (inviteBtn) inviteBtn.style.display = 'none';
    if (leaderBtn) leaderBtn.style.display = 'none';
}
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'flex';
    this.initVK()
        .then(() => {
            if (loading) loading.style.display = 'none';
            this.showMenu();
            this.updateDiamondUI();
            this.initAdBanner();
        })
        .catch(() => {
            if (loading) loading.style.display = 'none';
            this.showMenu();
            this.updateDiamondUI();
            this.initAdBanner();
        });
    }
checkAllChecksUsed() { this.checksUsed===this.maxChecks&&this.maxChecks>0&&this.unlockAchievement("all_checks_used");}
checkFirstMove() { 1===this.totalPlaced&&this.unlockAchievement("first_move");}
checkSameNumber(number) {
    if (this.lastPlacedNumber === number) {
        this.consecutiveSameNumber++;
    this.consecutiveSameNumber>=9&&this.unlockAchievement("one_number");
    } else {
        this.consecutiveSameNumber = 1;
        this.lastPlacedNumber = number;
    }
}
checkSeven(number) {7===number&&(this.sevenCount++,this.sevenCount>=7&&this.unlockAchievement("lucky_7"));}
checkComeback() { this.gameErrors>=3&&this.unlockAchievement("comeback");}

setupVKBridge() {
    vkBridge.subscribe((e) => {
        const t = (e && e.detail && e.detail.type) || e.type;
        if (t === "VKWebAppViewHide") {
            this.sound.ctx && "running" === this.sound.ctx.state && this.sound.ctx.suspend();
        } else if (t === "VKWebAppViewRestore") {
            this.sound.ctx && "suspended" === this.sound.ctx.state && this.sound.ctx.resume();
        } else if (t === "VKWebAppBannerAdClosedByUser") {
                    setTimeout(() => this.adManager.checkAndShowBanner(), 3e4);
        }
    });
}
 initAdBanner(){this.adManager.checkAndShowBanner()}
showNoAdModal(callback) {
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
    const okBtn = document.getElementById('noAdOkBtn');
    okBtn.addEventListener('pointerdown', (e) => { e.preventDefault();
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        callback(true);
    });
    overlay.addEventListener('pointerdown', (e) => { e.preventDefault();
        if (e.target === overlay) {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
              callback(false);
        }
    });
}
showHintAdModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('hintAdModal');        
        if (!modal) {
            console.error('Модалка #hintAdModal не найдена в DOM');
            resolve(false);
            return;
        }        
        this.pauseTimer();
        modal.style.display = 'flex';        
        const cancelBtn = document.getElementById('hintAdCancel');
        const confirmBtn = document.getElementById('hintAdConfirm');        
        let isResolved = false;        
        const closeModal = (result) => {
            if (isResolved) return;
            isResolved = true;
            modal.style.display = 'none';
              setTimeout(() => {
            this.resumeTimer();
            resolve(result);
                }, 500);
        };
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);       
newCancelBtn.addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),closeModal(!1)}));     
   newConfirmBtn.addEventListener('pointerdown', async (e) => {
            this.sound.click();
            const btn = document.getElementById('hintAdConfirm');
            const originalText = btn.textContent;
            btn.textContent = '⏳ Загрузка...';
            btn.disabled = true;            
            try {
                const adShown = await this.adManager.showRewardedAd();
                btn.textContent = originalText;
                btn.disabled = false;
                           if (adShown === true) {
                            this.maxHints += 3;
                    const remaining = this.maxHints - this.hintsUsed;
                    this.messageEl.textContent = `🎉 +3 подсказки! Осталось: ${remaining}`;
                    this.render();
                      this.updateHintButton();
                    closeModal(true);
                } else {
                             console.log('❌ Реклама не показана, даём 1 подсказку');
                                       modal.style.display = 'none';
                    this.showNoAdModal((result) => {
                        if (result) {
                            this.maxHints += 1;
                            const remaining = this.maxHints - this.hintsUsed;
                            this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                                            this.render();
                                    this.updateHintButton();
                            closeModal(true);
                        } else {
                            closeModal(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                btn.textContent = originalText;
                btn.disabled = false;                
                modal.style.display = 'none';
                this.showNoAdModal((result) => {
                    if (result) {
                        this.maxHints += 1;
                        const remaining = this.maxHints - this.hintsUsed;
                        this.messageEl.textContent = `💡 +1 подсказка! Осталось: ${remaining}`;
                        this.sound.click();
                        this.render();
                                this.updateHintButton();
                        closeModal(true);
                    } else {
                        closeModal(false);
                    }
                });
            }
        });        
        if (this._hintAdBackdropHandler) {
            modal.removeEventListener('pointerdown', this._hintAdBackdropHandler);
        }
        this._hintAdBackdropHandler = (e) => {
            e.preventDefault();
            if (e.target === modal) {
                this.sound.click();
                closeModal(false);
            }
        };
        modal.addEventListener('pointerdown', this._hintAdBackdropHandler);
    });
}
showConfirmDialog() {
    return new Promise((resolve) => {
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
                   this.resumeTimer();
            resolve(result);
        };
        
document.getElementById("confirmAdYes").addEventListener("pointerdown",(e=>{e.preventDefault(),closeDialog(!0)}));
        document.getElementById("confirmAdNo").addEventListener("pointerdown",(e=>{e.preventDefault(),closeDialog(!1)}));
     overlay.addEventListener('pointerdown', (e) => { e.preventDefault();
            if (e.target === overlay) {
                closeDialog(false);
            }
        });
    });
}
showLoadingAd() {
    const modal = document.getElementById('loadingAdModal');
    if (modal) modal.style.display = 'flex';
}
hideLoadingAd() {
    const modal = document.getElementById('loadingAdModal');
    if (modal) modal.style.display = 'none';
}
async initVK() {
    const loading = document.getElementById('loadingScreen');
    const finishLoading = () => {
        if (loading) loading.style.display = 'none';
        this.showMenu();
        this.updateDiamondUI();
        this.initAdBanner();
    };
    if (typeof vkBridge === 'undefined' || !vkBridge.send) {
        this.loadDiamondsLocal();
        await this.loadAchievements();
        finishLoading();
        return;
    }
    try {
        try {
            await vkBridge.send('VKWebAppInit');
            console.log('✅ VKWebAppInit OK');
        } catch (e) {
            console.warn('⚠️ VKWebAppInit error:', e);
        }
        if (this.userId && this.userId > 0) {
            this.vkUserId = this.userId;
            this.vkInitialized = true;
            console.log('✅ userId из launch-параметров:', this.userId);
        } else {
            try {
                const userInfo = await vkBridge.send('VKWebAppGetUserInfo', {});
                console.log('👤 VKWebAppGetUserInfo:', userInfo);
                if (userInfo && userInfo.id) {
                    this.vkUserId = userInfo.id;
                    this.userId = userInfo.id;
                    this.vkInitialized = true;
                }
            } catch (e) {
                console.warn('⚠️ VKWebAppGetUserInfo error:', e);
            }
        }
        console.log('🔄 Загружаем данные из VK Storage...');
        await Promise.all([
            this.loadDiamonds(),
            this.loadAchievements()
        ]);
        console.log('📊 Итог загрузки:', {
            diamonds: this.currentDiamonds,
            achievements: Object.keys(this.achievements).filter(k => this.achievements[k]).length,
            userId: this.userId,
            vkInitialized: this.vkInitialized
        });
        finishLoading();
    } catch (err) {
        console.warn('❌ Ошибка инициализации VK:', err);
        this.loadDiamondsLocal();
        await this.loadAchievements();
        finishLoading();
    }
}
loadDiamonds() {
    this.loadDiamondsLocal();
    if (typeof vkBridge === 'undefined' || !vkBridge.send) {
        return Promise.resolve();
    }
    const prefix = this.platform === 'ok' ? 'ok_' : '';
    const keys = [`${prefix}diamonds`, `${prefix}bonusDate`];
    return vkBridge.send('VKWebAppStorageGet', { keys })
        .then((data) => {
            console.log('💎 VK Storage diamonds response:', data);
            if (data && data.keys) {
                data.keys.forEach(item => {
                    if (item.key === `${prefix}diamonds`) {
                        const vkVal = parseInt(item.value) || 0;
                                     this.currentDiamonds = Math.max(this.currentDiamonds, vkVal);
                    }
                    if (item.key === `${prefix}bonusDate`) {
                        const vkDate = item.value || null;
                        if (vkDate && (!this.lastBonusDate || vkDate > this.lastBonusDate)) {
                            this.lastBonusDate = vkDate;
                        }
                    }
                });
            }
            this.saveDiamonds();
            this.updateDiamondUI();
            this.syncLeaderboard();
        })
        .catch((err) => {
            console.warn('❌ Ошибка загрузки diamonds из VK Storage:', err);
        });
}
loadDiamondsLocal() {
    try {
        const saved = localStorage.getItem(`${this.storagePrefix}sudoku_diamonds`);
        this.currentDiamonds = saved ? parseInt(saved) : 0;
        const bonusDate = localStorage.getItem(`${this.storagePrefix}sudoku_bonusDate`);
        this.lastBonusDate = bonusDate || null;
    } catch (e) {
        this.currentDiamonds = 0;
        this.lastBonusDate = null;
    }
    this.updateDiamondUI();
}
saveDiamonds() {
    try {
        const prefix = this.platform === 'ok' ? 'ok_' : '';
        localStorage.setItem(`${prefix}sudoku_diamonds`, String(this.currentDiamonds));
        if (this.lastBonusDate) {
            localStorage.setItem(`${prefix}sudoku_bonusDate`, this.lastBonusDate);
        }
    } catch (e) {}
    if (this.userId && this.vkInitialized) {
        const prefix = this.platform === 'ok' ? 'ok_' : '';
        vkBridge.send('VKWebAppStorageSet', {
            key: `${prefix}diamonds`,
            value: String(this.currentDiamonds)
        }).catch(err => console.warn('Ошибка сохранения diamonds:', err));

        if (this.lastBonusDate) {
            vkBridge.send('VKWebAppStorageSet', {
                key: `${prefix}bonusDate`,
                value: this.lastBonusDate
            }).catch(err => console.warn('Ошибка сохранения bonusDate:', err));
        }
    }
    this.updateDiamondUI();
    this.syncLeaderboard();
}
updateDiamondUI() {
    const counter = document.getElementById('diamond-counter');
    if (counter) {
        counter.textContent = `💎 ${this.currentDiamonds}`;
    } else {
        console.warn('Элемент #diamond-counter не найден');
    }
}
showLeaderboard() {
    if (this.platform === 'ok') {
        this.showGlobalToast('❌ Таблица лидеров недоступна в Одноклассниках', true);
        return;
    }
    this.syncLeaderboard();
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: this.currentDiamonds,
        global: 1
    })
    .catch((err) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', err);
        this.showGlobalToast('❌ Не удалось открыть таблицу лидеров', true);
    });
}
syncLeaderboard() {
    if (this.platform === 'ok') return Promise.resolve();
    if (!this.vkInitialized || !this.vkUserId) return Promise.resolve();
    if (this.currentDiamonds <= 0) return Promise.resolve();
    const lastSent = parseInt(localStorage.getItem('sudoku_lastSentScore') || '0');
    const lastSentTimestamp = parseInt(localStorage.getItem('sudoku_lastSentTimestamp') || '0');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    let shouldSend = this.currentDiamonds > lastSent;
    if (!shouldSend && lastSentTimestamp && (now - lastSentTimestamp) > oneHour) {
        shouldSend = true;
        console.log('🔄 Прошёл час, повторная отправка текущего рекорда', this.currentDiamonds);
    }
    if (!shouldSend) {
        console.log('⏩ Рекорд не изменился, синхронизация не требуется');
        return Promise.resolve();
    }
    const lastAttempt = parseInt(localStorage.getItem('sudoku_lastLeaderboardAttempt') || '0');
    const cooldown = 30 * 1000;
    if (lastAttempt && (now - lastAttempt) < cooldown) {
        console.log(`⏳ Повторная попытка через ${Math.round((cooldown - (now - lastAttempt)) / 1000)} сек`);
        return Promise.resolve();
    }
    localStorage.setItem('sudoku_lastLeaderboardAttempt', String(now));
    console.log(`📤 Отправка рекорда ${this.currentDiamonds} для пользователя ${this.vkUserId}`);
    return vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'secure.addAppEvent',
        params: {
            client_secret: 'jsQlTSHEiXcTe3UyBBnY',
            user_id: this.vkUserId,
            activity_id: 2,
            value: this.currentDiamonds,
            v: '5.131',
            access_token: 'b59b7666b59b7666b59b7666bcb68b3ca2bb59bb59b7666d76fa8fa06cdc580a759b821'
        }
    })
    .then(() => {
        console.log('🏆 Таблица лидеров обновлена до', this.currentDiamonds);
        localStorage.setItem('sudoku_lastSentScore', String(this.currentDiamonds));
        localStorage.setItem('sudoku_lastSentTimestamp', String(now));
        localStorage.removeItem('sudoku_lastLeaderboardAttempt');
    })
    .catch((err) => {
        console.error('❌ Ошибка синхронизации лидерборда:', err);
         });
}
inviteFriends() {
    this.sound.click();
    if (this.platform === 'ok') {
        this.showGlobalToast('❌ Приглашение друзей недоступно в Одноклассниках', true);
        return;
    }
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    sendMethod.call(vkBridge, 'VKWebAppShowInviteBox', {});
}
checkStreak() {
    if (this.winStreak >= 3) this.unlockAchievement('streak_3');
    if (this.winStreak >= 5) this.unlockAchievement('streak_5');
    if (this.winStreak >= 10) this.unlockAchievement('streak_10');
    if (this.winStreak >= 20) this.unlockAchievement('streak_20');
    if (this.winStreak >= 50) this.unlockAchievement('streak_50');
}
checkAllLevels() {
    const levels = ['easy', 'medium', 'hard', 'expert'];
    let all = true;
for(const l of levels)this.winsByLevel[l]<1&&(all=!1);
    if (all) this.unlockAchievement('all_levels');
}
checkDiamonds() {
    if (this.currentDiamonds >= 10) this.unlockAchievement('diamonds_10');
    if (this.currentDiamonds >= 50) this.unlockAchievement('diamonds_50');
    if (this.currentDiamonds >= 100) this.unlockAchievement('diamonds_100');
    if (this.currentDiamonds >= 500) this.unlockAchievement('diamonds_500');
    if (this.currentDiamonds >= 1000) this.unlockAchievement('diamonds_1000');
}
checkCollector() {
    const count = Object.values(this.achievements).filter(v => v === true).length;
    if (count >= 10) this.unlockAchievement('collector');
    if (count >= 25) this.unlockAchievement('collector_25');
    if (count >= 50) this.unlockAchievement('collector_50');
}
showGlobalToast(message, isError = false) {
    const toast = document.getElementById('globalToast');
    const msg = document.getElementById('globalToastMessage');
    if (!toast || !msg) return;    
    msg.textContent = message;
    toast.style.backgroundColor = isError ? 'rgba(40,20,20,0.95)' : 'rgba(22,33,62,0.9)';
    toast.style.borderColor = isError ? '#ff5252' : 'rgba(255,255,255,0.1)';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';    
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3500);
}
checkBonusTime() {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 10) this.unlockAchievement('early_bird');
    if (hours >= 23) this.unlockAchievement('night_owl');
}
updateTotalGameTime(seconds) {
    this.totalGameTime += seconds;
    if (this.totalGameTime >= 3600) this.unlockAchievement('time_1h');
    if (this.totalGameTime >= 18000) this.unlockAchievement('time_5h');
    if (this.totalGameTime >= 36000) this.unlockAchievement('time_10h');
    if (this.totalGameTime >= 86400) this.unlockAchievement('time_24h');
    if (this.totalGameTime >= 360000) this.unlockAchievement('time_100h');
    this.saveAchievements();
}
loadAchievements() {
    try {
        const prefix = this.platform === 'ok' ? 'ok_' : '';
        const local = localStorage.getItem(`${prefix}sudoku_achievements`);
        if (local) {
            const parsed = JSON.parse(local);
            for (const key in parsed) {
                if (parsed[key] === true) {
                    this.achievements[key] = true;
                }
            }
        }
        const games = localStorage.getItem(`${prefix}sudoku_totalGames`);
        if (games) this.totalGames = parseInt(games) || 0;
        const winStreak = localStorage.getItem(`${prefix}sudoku_winStreak`);
        if (winStreak) this.winStreak = parseInt(winStreak) || 0;
        const winsByLevel = localStorage.getItem(`${prefix}sudoku_winsByLevel`);
        if (winsByLevel) { try { this.winsByLevel = JSON.parse(winsByLevel); } catch(e) {} }
        const noHintWins = localStorage.getItem(`${prefix}sudoku_noHintWins`);
        if (noHintWins) this.noHintWins = parseInt(noHintWins) || 0;
        const totalChecks = localStorage.getItem(`${prefix}sudoku_totalChecks`);
        if (totalChecks) this.totalChecks = parseInt(totalChecks) || 0;
        const totalPlaced = localStorage.getItem(`${prefix}sudoku_totalPlaced`);
        if (totalPlaced) this.totalPlaced = parseInt(totalPlaced) || 0;
        const totalGameTime = localStorage.getItem(`${prefix}sudoku_totalGameTime`);
        if (totalGameTime) this.totalGameTime = parseInt(totalGameTime) || 0;
        const wins = localStorage.getItem(`${prefix}sudoku_totalWins`);
        if (wins) this.totalWins = parseInt(wins) || 0;
        const hints = localStorage.getItem(`${prefix}sudoku_totalHints`);
        if (hints) this.totalHintsUsed = parseInt(hints) || 0;
        const bonuses = localStorage.getItem(`${prefix}sudoku_totalBonuses`);
        if (bonuses) this.totalBonuses = parseInt(bonuses) || 0;
        const maxWinStreak = localStorage.getItem(`${prefix}sudoku_maxWinStreak`);
        if (maxWinStreak) this.maxWinStreak = parseInt(maxWinStreak) || 0;
        const perfectWins = localStorage.getItem(`${prefix}sudoku_perfectWins`);
        if (perfectWins) { try { this.perfectWins = JSON.parse(perfectWins); } catch(e) {} }
    } catch (e) {}
if (typeof vkBridge === 'undefined' || !vkBridge.send) {
    this.checkAchievements(); 
    this.saveAchievements();  
    return Promise.resolve();
}
    const prefix = this.platform === 'ok' ? 'ok_' : '';
    const keys = [
        `${prefix}achievements`,
        `${prefix}totalWins`,
        `${prefix}totalHints`,
        `${prefix}totalBonuses`,
        `${prefix}winStreak`,
        `${prefix}maxWinStreak`,
        `${prefix}winsByLevel`,
        `${prefix}noHintWins`,
        `${prefix}perfectWins`,
        `${prefix}totalChecks`,
        `${prefix}totalPlaced`,
        `${prefix}totalGameTime`,
        `${prefix}totalGames`
    ];
    return vkBridge.send('VKWebAppStorageGet', { keys })
        .then((data) => {
            if (data && data.keys) {
                data.keys.forEach(item => {
                    const key = item.key.replace(prefix, '');
                    const val = item.value;
                    switch(key) {
                        case 'achievements':
                            try {
                                const parsed = JSON.parse(val);
                                for (const k in parsed) {
                                    if (parsed[k] === true) {
                                        this.achievements[k] = true;
                                    }
                                }
                            } catch(e) {}
                            break;
                        case 'totalWins':
                            this.totalWins = Math.max(this.totalWins, parseInt(val) || 0);
                            break;
                        case 'totalHints':
                            this.totalHintsUsed = Math.max(this.totalHintsUsed, parseInt(val) || 0);
                            break;
                        case 'totalBonuses':
                            this.totalBonuses = Math.max(this.totalBonuses, parseInt(val) || 0);
                            break;
                        case 'totalGames':
                            this.totalGames = Math.max(this.totalGames, parseInt(val) || 0);
                            break;
                        case 'winStreak':
                            this.winStreak = Math.max(this.winStreak, parseInt(val) || 0);
                            break;
                        case 'maxWinStreak':
                            this.maxWinStreak = Math.max(this.maxWinStreak, parseInt(val) || 0);
                            break;
                        case 'winsByLevel':
                            try {
                                const parsed = JSON.parse(val);
                                for (const level in parsed) {
                                    this.winsByLevel[level] = Math.max(this.winsByLevel[level] || 0, parsed[level]);
                                }
                            } catch(e) {}
                            break;
                        case 'noHintWins':
                            this.noHintWins = Math.max(this.noHintWins, parseInt(val) || 0);
                            break;
                        case 'perfectWins':
                            try {
                                const parsed = JSON.parse(val);
                                for (const level in parsed) {
                                    this.perfectWins[level] = Math.max(this.perfectWins[level] || 0, parsed[level]);
                                }
                            } catch(e) {}
                            break;
                        case 'totalChecks':
                            this.totalChecks = Math.max(this.totalChecks, parseInt(val) || 0);
                            break;
                        case 'totalPlaced':
                            this.totalPlaced = Math.max(this.totalPlaced, parseInt(val) || 0);
                            break;
                        case 'totalGameTime':
                            this.totalGameTime = Math.max(this.totalGameTime, parseInt(val) || 0);
                            break;
                    }
                });
            }
            this.checkAchievements();
            this.saveAchievements();
        })
        .catch((err) => {
            console.warn('Ошибка загрузки достижений из VK Storage:', err);
            this.checkAchievements();
            this.saveAchievements();
        });
}
saveAchievements() {
    const prefix = this.platform === 'ok' ? 'ok_' : '';
    try {
        localStorage.setItem(`${prefix}sudoku_achievements`, JSON.stringify(this.achievements));
        localStorage.setItem(`${prefix}sudoku_totalWins`, String(this.totalWins));
        localStorage.setItem(`${prefix}sudoku_totalHints`, String(this.totalHintsUsed));
        localStorage.setItem(`${prefix}sudoku_totalBonuses`, String(this.totalBonuses));
        localStorage.setItem(`${prefix}sudoku_totalGames`, String(this.totalGames));
        localStorage.setItem(`${prefix}sudoku_winStreak`, String(this.winStreak));
        localStorage.setItem(`${prefix}sudoku_maxWinStreak`, String(this.maxWinStreak));
        localStorage.setItem(`${prefix}sudoku_winsByLevel`, JSON.stringify(this.winsByLevel));
        localStorage.setItem(`${prefix}sudoku_noHintWins`, String(this.noHintWins));
        localStorage.setItem(`${prefix}sudoku_perfectWins`, JSON.stringify(this.perfectWins));
        localStorage.setItem(`${prefix}sudoku_totalChecks`, String(this.totalChecks));
        localStorage.setItem(`${prefix}sudoku_totalPlaced`, String(this.totalPlaced));
        localStorage.setItem(`${prefix}sudoku_totalGameTime`, String(this.totalGameTime));
    } catch (e) {}
    if (this.userId && this.vkInitialized) {
        const sets = [
            { key: `${prefix}achievements`, value: JSON.stringify(this.achievements) },
            { key: `${prefix}totalWins`, value: String(this.totalWins) },
            { key: `${prefix}totalHints`, value: String(this.totalHintsUsed) },
            { key: `${prefix}totalBonuses`, value: String(this.totalBonuses) },
            { key: `${prefix}totalGames`, value: String(this.totalGames) },
            { key: `${prefix}winStreak`, value: String(this.winStreak) },
            { key: `${prefix}maxWinStreak`, value: String(this.maxWinStreak) },
            { key: `${prefix}winsByLevel`, value: JSON.stringify(this.winsByLevel) },
            { key: `${prefix}noHintWins`, value: String(this.noHintWins) },
            { key: `${prefix}perfectWins`, value: JSON.stringify(this.perfectWins) },
            { key: `${prefix}totalChecks`, value: String(this.totalChecks) },
            { key: `${prefix}totalPlaced`, value: String(this.totalPlaced) },
            { key: `${prefix}totalGameTime`, value: String(this.totalGameTime) }
        ];
sets.forEach((({key:e,value:a})=>{vkBridge.send("VKWebAppStorageSet",{key:e,value:a}).catch((e=>{}))}));
    }
}
unlockAchievement(id) {
    if (!this.achievements[id]) {
        this.achievements[id] = true;
        this.saveAchievements();
        const ach = this.achievementList.find(a => a.id === id);
        if (ach) {
            this.showAchievementPopup(ach.icon, ach.name);
            this.sound.win();
        }
    }
}
showAchievementPopup(icon, name) {
    const popup = document.getElementById('achievementPopup');
    const iconEl = document.getElementById('achievementPopupIcon');
    const nameEl = document.getElementById('achievementPopupName');
    if (!popup || !iconEl || !nameEl) {
        this.showToast(`🏅 Достижение разблокировано: ${name}!`);
        return;
    }
    iconEl.textContent = icon || '🏅';
    nameEl.textContent = name || 'Достижение';
    clearTimeout(this._popupTimeout);
    popup.classList.remove('show', 'hide');
    popup.style.display = 'block';
    void popup.offsetWidth;
    popup.classList.add('show');
    this._popupTimeout = setTimeout(() => {
        popup.classList.remove('show');
        popup.classList.add('hide');
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('hide');
        }, 400);
    }, 3000);
}
checkAchievements() {
    if (this.totalWins >= 1) this.unlockAchievement('first_win');
    if (this.totalWins >= 5) this.unlockAchievement('win_5');
    if (this.totalWins >= 10) this.unlockAchievement('win_10');
    if (this.totalWins >= 25) this.unlockAchievement('win_25');
    if (this.totalWins >= 50) this.unlockAchievement('win_50');
    if (this.totalWins >= 100) this.unlockAchievement('win_100');
    if (this.totalBonuses >= 1) this.unlockAchievement('bonus_1');
    if (this.totalBonuses >= 5) this.unlockAchievement('bonus_5');
    if (this.totalBonuses >= 10) this.unlockAchievement('bonus_10');
    if (this.totalBonuses >= 25) this.unlockAchievement('bonus_25');
    if (this.totalBonuses >= 50) this.unlockAchievement('bonus_50');
    if (this.totalHintsUsed >= 1) this.unlockAchievement('hint_1');
    if (this.totalHintsUsed >= 10) this.unlockAchievement('hint_10');
    if (this.totalHintsUsed >= 25) this.unlockAchievement('hint_25');
    if (this.totalHintsUsed >= 50) this.unlockAchievement('hint_50');
    if (this.totalHintsUsed >= 100) this.unlockAchievement('hint_100');
    if (this.totalChecks >= 1) this.unlockAchievement('check_1');
    if (this.totalChecks >= 10) this.unlockAchievement('check_10');
    if (this.totalChecks >= 25) this.unlockAchievement('check_25');
    if (this.totalChecks >= 50) this.unlockAchievement('check_50');
    if (this.totalChecks >= 100) this.unlockAchievement('check_100');
    if (this.totalPlaced >= 100) this.unlockAchievement('place_100');
    if (this.totalPlaced >= 500) this.unlockAchievement('place_500');
    if (this.totalPlaced >= 1000) this.unlockAchievement('place_1000');
    if (this.totalPlaced >= 5000) this.unlockAchievement('place_5000');
    if (this.totalPlaced >= 10000) this.unlockAchievement('place_10000');
    if (this.currentDiamonds >= 10) this.unlockAchievement('diamonds_10');
    if (this.currentDiamonds >= 50) this.unlockAchievement('diamonds_50');
    if (this.currentDiamonds >= 100) this.unlockAchievement('diamonds_100');
    if (this.currentDiamonds >= 500) this.unlockAchievement('diamonds_500');
    if (this.currentDiamonds >= 1000) this.unlockAchievement('diamonds_1000');
    this.checkCollector();
}
checkLevelAchievement(difficulty) {
    const map = {
        'easy': 'win_easy',
        'medium': 'win_medium',
        'hard': 'win_hard',
        'expert': 'win_expert'
    };
    const id = map[difficulty];
    if (id) this.unlockAchievement(id);
}
_calcAchievementsPerPage() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (h < 500 && w > h) return 4;
    if (w < 600) return 6;
    return 8;
}

openAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (!modal) return;
    this.achievementsPage = 0;
    modal.style.display = 'flex';
    this.renderAchievements();
}
closeAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (modal) modal.style.display = 'none';
}
renderAchievements() {
      this.achievementsPerPage = this._calcAchievementsPerPage(); 
    const container = document.getElementById('achievementsList');
    const pageInfo = document.getElementById('achPageInfo');
    if (!container) return;
    const sorted = [...this.achievementList].sort((a, b) => {
        const aUnlocked = this.achievements[a.id] || false;
        const bUnlocked = this.achievements[b.id] || false;
        return (aUnlocked === bUnlocked) ? 0 : (aUnlocked ? -1 : 1);
    });
    const total = sorted.length;
    const perPage = this.achievementsPerPage;
    const maxPage = Math.ceil(total / perPage) - 1;
    if (this.achievementsPage > maxPage) this.achievementsPage = maxPage;
    if (this.achievementsPage < 0) this.achievementsPage = 0;
    const start = this.achievementsPage * perPage;
    const end = Math.min(start + perPage, total);
    const pageItems = sorted.slice(start, end);
    container.innerHTML = '';
    pageItems.forEach(ach => {
        const unlocked = this.achievements[ach.id] || false;
        const div = document.createElement('div');
        div.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <span class="icon">${unlocked ? ach.icon : '🔒'}</span>
            <div class="name">${ach.name}</div>
            <div class="desc">${ach.desc}</div>
        `;
        container.appendChild(div);
    });
  pageInfo&&(pageInfo.textContent=`${this.achievementsPage+1} / ${maxPage+1}`);
    document.getElementById('achPrevPage').style.opacity = this.achievementsPage === 0 ? '0.3' : '1';
    document.getElementById('achNextPage').style.opacity = this.achievementsPage === maxPage ? '0.3' : '1';
    this.checkCollector();
}
achievementsPrevPage() {
    if (this.achievementsPage > 0) {
        this.achievementsPage--;
        this.renderAchievements();
    }
}
achievementsNextPage() {
    const total = this.achievementList.length;
    const maxPage = Math.ceil(total / this.achievementsPerPage) - 1;
    if (this.achievementsPage < maxPage) {
        this.achievementsPage++;
        this.renderAchievements();
    }
}
canClaimDailyBonus() {
    if (!this.lastBonusDate) return true;
    const today = new Date().toDateString();
    return this.lastBonusDate !== today;
}
showDailyBonusModal() {
    this.pauseTimer();
    if (!this.canClaimDailyBonus()) {
        const modal = document.getElementById('dailyBonusUnavailableModal');
        if (modal) modal.style.display = 'flex';
        return;
    }
    const modal = document.getElementById('dailyBonusModal');
    if (modal) modal.style.display = 'flex';
}
closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
claimBonus(amount) {
    if (amount <= 0) return;
    this.addDiamonds(amount);
    this.lastBonusDate = new Date().toDateString();
    const prefix = this.platform === 'ok' ? 'ok_' : '';
    try {
        localStorage.setItem(`${prefix}sudoku_bonusDate`, this.lastBonusDate);
    } catch (e) {}
    if (this.userId && this.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', {
            key: `${prefix}bonusDate`,
            value: this.lastBonusDate
        }).catch(err => console.warn('Ошибка сохранения даты бонуса:', err));
    }
    this.totalBonuses++;
    this.checkAchievements();
    this.checkBonusTime();
    this.saveAchievements();
    this.showBonusResult(amount);
    this.resumeTimer();
}
showBonusResult(amount) {
    const modal = document.getElementById('bonusResultModal');
   if (!modal) {
        console.error('Модалка #bonusResultModal не найдена');
        this.showGlobalToast(`💎 +${amount} алмазов!`, false);  
        return;
    }
    document.getElementById('bonusResultAmount').textContent = `💎 +${amount}`;
    modal.style.display = 'flex';
    const okBtn = document.getElementById('bonusResultOk');
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    newOkBtn.addEventListener('pointerdown', (e) => { e.preventDefault();
        this.sound.click();
        this.closeModal('bonusResultModal');
        this.resumeTimer();
    });
    if (this._bonusResultBackdropHandler) {
        modal.removeEventListener('pointerdown', this._bonusResultBackdropHandler);
    }
    this._bonusResultBackdropHandler = (e) => {
        e.preventDefault();
        if (e.target === modal) {
            this.closeModal('bonusResultModal');
            this.resumeTimer();
        }
    };
    modal.addEventListener('pointerdown', this._bonusResultBackdropHandler);
}
addDiamonds(amount) {
    if (amount <= 0) return;
    this.currentDiamonds += amount;
    this.saveDiamonds();
    this.updateDiamondUI();
    this.syncLeaderboard();
    this.checkDiamonds();
    this.sound.click();
}
showConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    // Отменяем предыдущую анимацию, если она ещё идёт
    if (this._confettiAnimationId) {
        cancelAnimationFrame(this._confettiAnimationId);
        this._confettiAnimationId = null;
    }
    if (this._confettiStopTimeout) {
        clearTimeout(this._confettiStopTimeout);
        this._confettiStopTimeout = null;
    }

    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#ff5722'];
    const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const numParticles = isMobile ? 15 : 50;

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5 - 50,
            w: 6 + Math.random() * 8,
            h: 4 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: 2 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 0.8 + Math.random() * 0.2
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            if (p.y < canvas.height + 50) alive = true;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.opacity * Math.min(1, (canvas.height - p.y + 50) / 100);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }

        if (alive) {
            this._confettiAnimationId = requestAnimationFrame(animate);
        } else {
            this._confettiAnimationId = null;
            this.hideConfetti();
        }
    };

    animate();

    this._confettiStopTimeout = setTimeout(() => {
        if (this._confettiAnimationId) {
            cancelAnimationFrame(this._confettiAnimationId);
            this._confettiAnimationId = null;
        }
        this._confettiStopTimeout = null;
        this.hideConfetti();
    }, 5000);
}
hideConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
        canvas.style.display = 'none';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
updateSolveButton() {
    const btn = document.getElementById('btnSolveAll');
    if (!btn) return;
    if (this.isFinished) {
        btn.textContent = '🎉 Новая игра';
        btn.className = 'action-btn solve-btn win-btn';
    } else {
        btn.textContent = '⚡ Решить всё';
        btn.className = 'action-btn solve-btn';
    }
}
showWinEffects() {
    this.showConfetti();
    this.updateSolveButton();
}
showToast(message, isError = false) {
    const msgEl = document.getElementById('message');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.color = isError ? '#ff5252' : '#ffd54f';
        setTimeout(() => {
            if (msgEl.textContent === message) {
                msgEl.textContent = '';
            }
        }, 4000);
    } else {
        alert(message);
    }
}
    showMenu() {
        this.menuScreen.style.display = 'flex';
        this.gameScreen.style.display = 'none';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.updateDiamondUI();
    }
    goToMenu() {
        this.hideConfetti();
        this.sound.click();
    if (!this.isFinished && this.timer > 0) {
        this.updateTotalGameTime(this.timer);
    }
        this.showMenu();
        this.updateDiamondUI(); 
    }

    showGame() {
        this.menuScreen.style.display = 'none';
        this.gameScreen.style.display = 'flex';
    }
    toggleSound() {
        this.sound.enabled = !this.sound.enabled;
        const btn = document.getElementById('btnToggleSound');
        btn.textContent = this.sound.enabled ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
        this.sound.toggle();
        if (this.sound.enabled) {
            this.sound.init();
        }
    }
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
buildGrid() {
    this.gridElement.innerHTML = '';   
    this.cells = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            this.gridElement.appendChild(cell);
            this.cells.push(cell);
        }
    }
    if (this.gridHandler) {
        this.gridElement.removeEventListener('pointerdown', this.gridHandler);
    }
    this.gridHandler = (e) => {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        this.selectCell(r, c);
    };
    this.gridElement.addEventListener('pointerdown', this.gridHandler);
}
render() {
    for (let i = 0; i < 81; i++) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const cell = this.cells[i];
        const val = this.grid[r][c];
        const cellKey = `${r}-${c}`;
        cell.className = 'cell';
        if (c % 3 === 2 && c < 8) cell.classList.add('block-border-right');
        if (r % 3 === 2 && r < 8) cell.classList.add('block-border-bottom');
        cell.textContent = val !== 0 ? val : '';
        if (val !== 0) {
            if (this.given[r][c]) {
                cell.classList.add('given');
            } else {
                cell.classList.add('user');
            }
        }
        if (this.difficulty === 'easy' && !this.given[r][c] && val !== 0 && val !== this.solution[r][c]) {
            cell.classList.add('error');
        }
        if (this.checkedCells[cellKey] !== undefined) {
            if (this.checkedCells[cellKey] === true) {
                cell.classList.add('checked-correct');
            } else {
                cell.classList.add('checked-error');
            }
        }
        if (this.selectedRow === r && this.selectedCol === c) {
            cell.classList.add('selected');
        }
        if (this.selectedRow !== -1 && this.selectedCol !== -1) {
            const selVal = this.grid[this.selectedRow][this.selectedCol];
            if (this.difficulty !== 'expert' && selVal !== 0 && val === selVal && !(r === this.selectedRow && c === this.selectedCol)) {
                cell.classList.add('same-number');
            }
            if (r === this.selectedRow || c === this.selectedCol || 
                (Math.floor(r/3) === Math.floor(this.selectedRow/3) && Math.floor(c/3) === Math.floor(this.selectedCol/3))) {
                if (!(r === this.selectedRow && c === this.selectedCol)) {
                    cell.classList.add('highlighted');
                }
            }
        }
    }
    this.updateStatus();
}
renderNumPanel() {
    if (this.numPanelBuilt) return;
    this.numPanel.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.textContent = i;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.placeNumber(i); });
        this.numPanel.appendChild(btn);
    }
    const erase = document.createElement('button');
    erase.className = 'num-btn erase';
    erase.textContent = '✕';
    erase.addEventListener('pointerdown', (e) => { e.preventDefault(); this.placeNumber(0); });
    this.numPanel.appendChild(erase);
    this.numPanelBuilt = true;
}
updateStatus() {
    if (this.isFinished) {
        this.statusEl.textContent = '🎉 Победа!';
        this.statusEl.style.color = '#4caf50';
    } else {
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
updateTimer() {
    const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
    const secs = String(this.timer % 60).padStart(2, '0');
    this.timerEl.textContent = `${mins}:${secs}`;
}
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
              delete this.checkedCells[cellKey];
            this.sound.click();
            this.messageEl.textContent = '';
            this.render();
            this.checkWin();
        }
        return;
    }
this.grid[r][c] = num;
this.sound.click();
  this.totalPlaced++;
if (num !== 0) {
    this.checkFirstMove();   
    this.checkSameNumber(num); 
    this.checkSeven(num);    
}
delete this.checkedCells[cellKey];
if (num !== this.solution[r][c]) {
    this.gameErrors++; 
}
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
    this.checkAchievements();
    this.render();    
 this.checkWin();

}
async giveHint() {
    if (this.isFinished) return;    
    if (this.maxHints === undefined || this.maxHints === 0) {
        if (this.difficulty === 'easy' || this.difficulty === 'medium') {
            this.maxHints = 3;
        } else {
            this.maxHints = 1;
        }
    }
    this.updateHintButton();
    if (this.hintsUsed >= this.maxHints) {
        this.messageEl.textContent = '💡 Подсказки закончились!';
        this.sound.error();        
        const result = await this.showHintAdModal();       
        if (result === true) {
            const remaining = this.maxHints - this.hintsUsed;
            this.messageEl.textContent = `✅ Получены подсказки! Осталось: ${remaining}`;
            this.sound.click();
            this.render();
            this.updateHintButton();
            return;
        } else {
            this.messageEl.textContent = '❌ Вы отменили получение подсказок.';
            this.sound.error();
            return;
        }
    }
    if (this.selectedRow === -1 || this.selectedCol === -1) {
        this.messageEl.textContent = '⚠️ Выделите клетку';
        this.sound.error();
        return;
    }
    const r = this.selectedRow;
    const c = this.selectedCol;
    if (this.grid[r][c] !== 0) {
        this.messageEl.textContent = '⚠️ В этой клетке уже есть цифра';
        this.sound.error();
        return;
    }
    if (this.given[r][c]) {
        this.messageEl.textContent = '❌ Это клетка с подсказкой';
        this.sound.error();
        return;
    }
    this.sound.init();
    this.sound.hint();
    this.hintsUsed++;
   this.totalHintsUsed++;
this.checkAchievements();
this.saveAchievements();
    const correctNum = this.solution[r][c];
    this.grid[r][c] = correctNum;    
    const cellKey = `${r}-${c}`;
    this.checkedCells[cellKey] = true;    
    const remaining = this.maxHints - this.hintsUsed;
    this.messageEl.textContent = `💡 Подсказка: ${correctNum} (осталось: ${remaining})`;
    this.render();    
    const cells = this.gridElement.children;
    const idx = r * 9 + c;
    if (cells[idx]) {
        cells[idx].classList.add('hint');
        setTimeout(() => cells[idx].classList.remove('hint'), 1000);
    }    
    this.updateHintButton();    
 this.checkWin();

}
pauseTimer() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.isRunning = false;
    }
}
resumeTimer() {
    if (!this.timerInterval && !this.isFinished) {
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }
}
updateCheckButton() {
    const checkBtn = document.getElementById('btnCheck');
    if (!checkBtn) return;
    const remaining = this.maxChecks - this.checksUsed;
    if (remaining <= 0) {
        checkBtn.innerHTML = '✅✨'; 
        checkBtn.classList.add('no-checks');
    } else {
        checkBtn.innerHTML = `✅ ${remaining}`;
        checkBtn.classList.remove('no-checks');
    }
}
async checkNumber() {
    if (this.isFinished) return;
    if (this.maxChecks === undefined || this.maxChecks === 0) {
        this.maxChecks = 1;        
    }
    if (this.checksUsed >= this.maxChecks) {
    this.messageEl.textContent = '❌ Проверки закончились!';
    this.sound.error();
    const result = await this.showCheckAdModal();
    if (result === true) {
        const remaining = this.maxChecks - this.checksUsed;
        this.messageEl.textContent = `✅ Получены проверки! Осталось: ${remaining}`;
        this.sound.click();
        this.updateCheckButton();
        return;
    } else {
        this.messageEl.textContent = '❌ Вы отменили получение проверок.';
        this.sound.error();
        return;
    }
}
    this.sound.init();
    this.checksUsed++;
    this.totalChecks++;
    this.checkAchievements();
    this.saveAchievements();
    let errors = 0;
    let correct = 0;
    const newCheckedCells = {};
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = this.grid[r][c];
            const cellKey = `${r}-${c}`;
            if (val === 0 || this.given[r][c]) continue;
            if (val === this.solution[r][c]) {
                correct++;
                newCheckedCells[cellKey] = true;
            } else {
                errors++;
                newCheckedCells[cellKey] = false;
            }
        }
    }
    for (const key in newCheckedCells) {
        this.checkedCells[key] = newCheckedCells[key];
    }
    if (errors === 0 && correct > 0) {
        this.messageEl.textContent = `✅ Все ${correct} цифр правильные! (${this.checksUsed}/${this.maxChecks})`;
        this.sound.click();
    } else if (errors === 0 && correct === 0) {
        this.messageEl.textContent = `⚠️ Нет цифр для проверки (${this.checksUsed}/${this.maxChecks})`;
        this.sound.error();
    } else {
        this.messageEl.textContent = `❌ Найдено ${errors} ошибок, ${correct} правильных (${this.checksUsed}/${this.maxChecks})`;
        this.sound.error();
    }
    this.render();
    this.updateCheckButton();
 this.checkWin();

}
awardDiamondsForWin() {
    if (this.diamondsAwardedForCurrentGame) return;
    const rewards = {
        easy: 1,
        medium: 2,
        hard: 3,
        expert: 4
    };
    const amount = rewards[this.difficulty] || 0;
    if (amount > 0) {
        this.addDiamonds(amount);
        this.diamondsAwardedForCurrentGame = true;
        this.showToast(`💎 +${amount} алмазов за победу!`);
    }
}

async solveAll() {
    if (this.isFinished) {
        this.startNewGame();
        return;
    }
    this.pauseTimer();
    const confirmed = await this.showConfirmDialog();
    if (!confirmed) {
        this.resumeTimer();
        this.messageEl.textContent = '❌ Решение отменено';
        this.sound.error();
        return;
    }
    this.pauseTimer();
    const solveBtn = document.getElementById('btnSolveAll');
    const originalText = solveBtn.textContent;
    solveBtn.textContent = '⏳ Загрузка...';
    solveBtn.disabled = true;
    try {
        const adShown = await this.adManager.showRewardedAd();
        if (!adShown) {
            this.messageEl.textContent = '⚠️ Рекламы сейчас нет, но мы решим поле!';
            this.sound.error();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
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
       this.checkWin();
    } catch (error) {
        console.error('Ошибка в solveAll:', error);
        this.messageEl.textContent = '❌ Ошибка при решении';
        this.sound.error();
    } finally {  
        solveBtn.disabled = false;
        this.updateSolveButton();
        this.resumeTimer();
}
}

showCheckAdModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('checkAdModal');
        if (!modal) {
            console.error('Модалка #checkAdModal не найдена');
            resolve(false);
            return;
        }
        this.pauseTimer();
        modal.style.display = 'flex';
        const cancelBtn = document.getElementById('checkAdCancel');
        const confirmBtn = document.getElementById('checkAdConfirm');
        let isResolved = false;
        const closeModal = (result) => {
            if (isResolved) return;
            isResolved = true;
            modal.style.display = 'none';
   setTimeout((()=>{this.resumeTimer(),resolve(result)}),500);
        };
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
newCancelBtn.addEventListener("pointerdown",(e=>{e.preventDefault(),this.sound.click(),closeModal(!1)}));
        newConfirmBtn.addEventListener('pointerdown', async (e) => {
            this.sound.click();
            const btn = document.getElementById('checkAdConfirm');
            const originalText = btn.textContent;
            btn.textContent = '⏳ Загрузка...';
            btn.disabled = true;
            try {
                const adShown = await this.adManager.showRewardedAd();
                btn.textContent = originalText;
                btn.disabled = false;
                if (adShown === true) {
                    this.maxChecks += 3;
                    const remaining = this.maxChecks - this.checksUsed;
                    this.messageEl.textContent = `🎉 +3 проверки! Осталось: ${remaining}`;
                    this.render();
                    this.updateCheckButton();
                    closeModal(true);
                } else {
                    modal.style.display = 'none';
                    this.showNoAdModal((result) => {
                        if (result) {
                            this.maxChecks += 1;
                            const remaining = this.maxChecks - this.checksUsed;
                            this.messageEl.textContent = `✅ +1 проверка! Осталось: ${remaining}`;
                                     this.render();
                            this.updateCheckButton();
                            closeModal(true);
                        } else {
                            closeModal(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                btn.textContent = originalText;
                btn.disabled = false;

                modal.style.display = 'none';
                this.showNoAdModal((result) => {
                    if (result) {
                        this.maxChecks += 1;
                        const remaining = this.maxChecks - this.checksUsed;
                        this.messageEl.textContent = `✅ +1 проверка! Осталось: ${remaining}`;
                        this.sound.click();
                        this.render();
                        this.updateCheckButton();
                        closeModal(true);
                    } else {
                        closeModal(false);
                    }
                });
            }
        });
        if (this._checkAdBackdropHandler) {
            modal.removeEventListener('pointerdown', this._checkAdBackdropHandler);
        }
        this._checkAdBackdropHandler = (e) => {
            e.preventDefault();
            if (e.target === modal) {
                this.sound.click();
                closeModal(false);
            }
        };
        modal.addEventListener('pointerdown', this._checkAdBackdropHandler);
    });
}

checkWin() {
    if (this.isFinished) return true;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (this.grid[r][c] !== this.solution[r][c]) {
                return false;
            }
        }
    }
    this.totalWins++;
    this.winStreak++;
    if (this.winStreak > this.maxWinStreak) this.maxWinStreak = this.winStreak;
    this.winsByLevel[this.difficulty] = (this.winsByLevel[this.difficulty] || 0) + 1;
if (this.winsByLevel['easy'] >= 20) this.unlockAchievement('win_easy_10');
if (this.winsByLevel['medium'] >= 20) this.unlockAchievement('win_medium_10');
if (this.winsByLevel['hard'] >= 20) this.unlockAchievement('win_hard_10');
if (this.winsByLevel['expert'] >= 20) this.unlockAchievement('win_expert_10');
if (this.totalGames >= 50) this.unlockAchievement('games_50');
if (this.totalGames >= 200) this.unlockAchievement('games_200');
if (this.totalGames >= 500) this.unlockAchievement('games_500');
    this.checkStreak();
    this.checkAllLevels();
    if (this.hintsUsed === 0) {
        this.noHintWins++;
        this.unlockAchievement('no_hint_win');
        if (this.noHintWins >= 10) this.unlockAchievement('no_hint_10');
    }
    if (this.gameErrors === 0) {
        this.perfectGame = true;
        this.perfectWins[this.difficulty] = (this.perfectWins[this.difficulty] || 0) + 1;
        this.unlockAchievement(`perfect_${this.difficulty}`);
        if (this.perfectWins.easy > 0 && this.perfectWins.medium > 0 &&
            this.perfectWins.hard > 0 && this.perfectWins.expert > 0) {
            this.unlockAchievement('perfect_all');
        }
    }

this.checkComeback();
this.checkAllChecksUsed();
    if (this.timer <= 60) {
        this.unlockAchievement('speed_1');
    } else if (this.timer <= 120) {
        this.unlockAchievement('speed_2');
    } else if (this.timer <= 180) {
        this.unlockAchievement('speed_3');
    } else if (this.timer <= 300) {
        this.unlockAchievement('speed_5');
    }
    if (this.timer <= 600) this.unlockAchievement('time_10min');
     this.checkLevelAchievement(this.difficulty);
    this.checkAchievements(); 
    this.updateTotalGameTime(this.timer); 
    this.saveAchievements();
    this.awardDiamondsForWin();
    this.isFinished = true;
this.updateStatus();             
this.messageEl.textContent = '🏆 Вы решили Судоку!';
if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
}
this.sound.win();                
this.showWinEffects();           
return true;
}

  startNewGame(){
    this.adManager.checkAndShowBanner();
    this.totalGames++,this.hideConfetti(),
this.diamondsAwardedForCurrentGame = false;
    this.perfectGame = false;     
    this.gameErrors = 0;         
this.consecutiveSameNumber = 0;
this.lastPlacedNumber = 0;
this.sevenCount = 0;
        this.sound.init();
        this.sound.click();
                this.isFinished = false;
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.timer = 0;
        this.checksUsed = 0;          
             this.checkedCells = {}; 
        this.hintsUsed = 0;
    if (this.difficulty === 'easy' || this.difficulty === 'medium') {
        this.maxHints = 1;
    } else {
        this.maxHints = 1;
    }
this.maxChecks = 1;
this.checksUsed = 0;
this.updateSolveButton(); 
this.updateCheckButton();
          this.messageEl.textContent = '';
        this.updateHintButton();        
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

updateHintButton() {
    const hintBtn = document.getElementById('btnHint');
    if (!hintBtn) return;    
    const remaining = this.maxHints - this.hintsUsed;
    if (remaining <= 0) {
        hintBtn.innerHTML = '💡✨';
        hintBtn.classList.add('no-hints');
    } else {
        hintBtn.innerHTML = `💡 ${remaining}`;
        hintBtn.classList.remove('no-hints');
    }
}
}

// ============================================================
// 5. Запуск
// ============================================================
document.addEventListener("DOMContentLoaded",(()=>{const e=new SudokuGame;window.__game=e}));
document.addEventListener('touchmove', function(event) {
    var target = event.target;
    const scrollables = [
        'howToPlayModal',
        'achievementsModal',
        'achievementsList'
    ];
    for (const id of scrollables) {
        const el = document.getElementById(id);
        if (el && el.contains(target)) return;
    }
    event.preventDefault();
}, { passive: false });
function closeThemeModal(){document.getElementById("themeModal").style.display="none"}
document.getElementById("closeThemeModal").addEventListener("pointerdown",(e=>{e.preventDefault(),closeThemeModal()}));
document.getElementById("themeModal").addEventListener("pointerdown",(function(e){e.target===this&&(e.preventDefault(),closeThemeModal())}));
document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
           document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active-theme'));
        this.classList.add('active-theme');
                const theme = this.dataset.theme;
        applyTheme(theme);
        localStorage.setItem('sudoku-theme', theme);
    });
});

function applyTheme(theme) {
    const container = document.querySelector('.container');
    const body = document.body;
    const grid = document.getElementById('sudoku-grid');
    body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
    container.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
    if (grid) grid.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-pastel');
     body.classList.add('theme-' + theme);
document.querySelectorAll(".theme-btn").forEach((function(e){e.classList.remove("active-theme"),e.dataset.theme===theme&&e.classList.add("active-theme")}));
       localStorage.setItem('sudoku-theme', theme);
}


document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('sudoku-theme');
    if (savedTheme) {
        applyTheme(savedTheme);
           document.querySelectorAll('.theme-btn').forEach(function(btn) {
            btn.classList.remove('active-theme');
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active-theme');
            }
        });
    }
});