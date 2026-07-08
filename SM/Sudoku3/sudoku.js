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
// 2. Управление рекламой
// ============================================================
// ============================================================
// Глобальные переменные для VK и алмазов
// ============================================================
let vkInitialized = false;
let vkUserId = null;
let vkUserToken = null;

class AdManager {
    constructor() {
        this.bannerShown = false;
        this.lastAdTime = 0;
        this.adCooldown = 120000;
    }

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

    // Показать рекламу за вознаграждение
    showRewardedAd() {
        console.log('showRewardedAd вызван');
        
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                console.log('⏰ Таймаут показа рекламы (10 сек)');
                resolve(false);
            }, 40000);
            
            if (typeof vkBridge === 'undefined') {
                clearTimeout(timeoutId);
                console.log("VK Bridge не найден");
                resolve(false);
                return;
            }
            
            const sendMethod = vkBridge.sendPromise || vkBridge.send;
            
            // Показываем рекламу
            sendMethod.call(vkBridge, 'VKWebAppShowNativeAds', {
                ad_format: 'reward'
            })
            .then((result) => {
                clearTimeout(timeoutId);
                console.log('VKWebAppShowNativeAds результат:', result);
                
                // ВАЖНО: Проверяем разные варианты успешного показа
                // В VK Bridge успешный показ рекламы может возвращаться по-разному
                if (result) {
                    // Если есть поле result и оно true
                    if (result.result === true) {
                        console.log('✅ Реклама успешно показана (result: true)');
                        resolve(true);
                        return;
                    }
                    
                    // Если есть поле success
                    if (result.success === true) {
                        console.log('✅ Реклама успешно показана (success: true)');
                        resolve(true);
                        return;
                    }
                    
                    // Если есть поле status и оно 'success'
                    if (result.status === 'success') {
                        console.log('✅ Реклама успешно показана (status: success)');
                        resolve(true);
                        return;
                    }
                    
                    // Если пришёл объект с данными (не ошибка)
                    if (result.result !== false && result.error === undefined) {
                        console.log('✅ Реклама успешно показана (нет ошибок)');
                        resolve(true);
                        return;
                    }
                }
                
                // Если дошли сюда - реклама не показана
                console.log('❌ Реклама не показана');
                resolve(false);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.log('Ошибка при показе рекламы:', error);
                // Если ошибка, но реклама всё равно могла показаться
                // Некоторые версии VK Bridge возвращают ошибку, но реклама показывается
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
        // Для серий
this.totalChecks = 0;              // всего проверок
this.totalPlaced = 0;              // всего поставленных цифр
this.perfectGame = false;           // флаг для идеальной игры (сбрасывается при ошибке)
this.gameErrors = 0;               // количество ошибок в текущей игре
this.consecutiveSameNumber = 0;    // счётчик для "одной цифрой"
this.lastPlacedNumber = 0;         // последняя поставленная цифра
this.sevenCount = 0;               // для достижения lucky_7
// Для чистых побед
this.noHintWins = 0;
this.winStreak = 0;
this.maxWinStreak = 0;
this.winsByLevel = { easy: 0, medium: 0, hard: 0, expert: 0 };
// Для идеальных побед
this.perfectWins = { easy: 0, medium: 0, hard: 0, expert: 0 };
// Для времени
this.totalGameTime = 0; // в секундах (суммарно)

        this.totalWins = 0;
this.totalHintsUsed = 0;
this.totalBonuses = 0;
this.achievements = {};
this.achievementsPage = 0;
this.achievementsPerPage = window.innerWidth < 600 ? 6 : 8;

        this.currentDiamonds = 0;          // общее количество алмазов
this.lastBonusDate = null;         // дата последнего получения бонуса (строка)
this.diamondsAwardedForCurrentGame = false; // флаг, чтобы не начислять дважды за одну победу
this.vkInitialized = false;
this.vkUserId = null;
this.vkUserToken = null;

        // DOM элементы
        this.menuScreen = document.getElementById('menuScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gridElement = document.getElementById('sudoku-grid');
        this.numPanel = document.getElementById('num-panel');
        this.messageEl = document.getElementById('message');
        this.statusEl = document.getElementById('gameStatus');
        this.timerEl = document.getElementById('timerDisplay');
       
// Список всех достижений (описание)
this.achievementList = [
    // === Победные (10 шт) ===
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

    // === Очковые (алмазы) (5 шт) ===
    { id: 'diamonds_10',    name: 'Собиратель',             desc: 'Накопить 10 алмазов',                           icon: '👼' },
    { id: 'diamonds_50',    name: 'Любитель',             desc: 'Накопить 50 алмазов',                           icon: '💎' },
    { id: 'diamonds_100',   name: 'Ценитель',            desc: 'Накопить 100 алмазов',                          icon: '💎' },
    { id: 'diamonds_500',   name: 'Богач',            desc: 'Накопить 500 алмазов',                          icon: '💎' },
    { id: 'diamonds_1000',  name: 'Златодержец',           desc: 'Накопить 1000 алмазов',                         icon: '💎' },

    // === Бонусные (5 шт) ===
    { id: 'bonus_1',        name: 'Первый бонус',           desc: 'Получить ежедневный бонус 1 раз',               icon: '🍭' },
    { id: 'bonus_5',        name: '5 бонусов',              desc: 'Получить ежедневный бонус 5 раз',               icon: '🍬' },
    { id: 'bonus_10',       name: '10 бонусов',             desc: 'Получить ежедневный бонус 10 раз',              icon: '🍑' },
    { id: 'bonus_25',       name: '25 бонусов',             desc: 'Получить ежедневный бонус 25 раз',              icon: '🍒' },
    { id: 'bonus_50',       name: '50 бонусов',             desc: 'Получить ежедневный бонус 50 раз',              icon: '🍓' },

    // === Подсказочные (5 шт) ===
    { id: 'hint_1',         name: 'Первая подсказка',       desc: 'Использовать 1 подсказку',                      icon: '👶' },
    { id: 'hint_10',        name: '10 подсказок',           desc: 'Использовать 10 подсказок',                     icon: '🐭' },
    { id: 'hint_25',        name: '25 подсказок',           desc: 'Использовать 25 подсказок',                     icon: '🐶' },
    { id: 'hint_50',        name: '50 подсказок',           desc: 'Использовать 50 подсказок',                     icon: '🐹' },
    { id: 'hint_100',       name: '100 подсказок',          desc: 'Использовать 100 подсказок',                    icon: '🐰' },

    // === Проверочные (5 шт) ===
    { id: 'check_1',        name: 'Первая проверка',        desc: 'Выполнить 1 проверку',                          icon: '🐣' },
    { id: 'check_10',       name: '10 проверок',            desc: 'Выполнить 10 проверок',                         icon: '🐤' },
    { id: 'check_25',       name: '25 проверок',            desc: 'Выполнить 25 проверок',                         icon: '🐥' },
    { id: 'check_50',       name: '50 проверок',            desc: 'Выполнить 50 проверок',                         icon: '🐔' },
    { id: 'check_100',      name: '100 проверок',           desc: 'Выполнить 100 проверок',                        icon: '🐧' },

    // === Игровые (цифры) (5 шт) ===
    { id: 'place_100',      name: 'Школяр',               desc: 'Поставить 100 цифр (вручную)',                  icon: '🐱' },
    { id: 'place_500',      name: 'Студент',               desc: 'Поставить 500 цифр',                            icon: '🐗' },
    { id: 'place_1000',     name: 'Бакалавр',              desc: 'Поставить 1000 цифр',                           icon: '🐯' },
    { id: 'place_5000',     name: 'Магистр',              desc: 'Поставить 5000 цифр',                           icon: '🐲' },
    { id: 'place_10000',    name: 'Профессор',             desc: 'Поставить 10000 цифр',                          icon: '👽' },

    // === Временные (4 шт) ===
  
    { id: 'time_10min',     name: 'На чиле',           desc: 'Решить за 10 минут',                            icon: '⏱️' },
    { id: 'time_20min',     name: 'Йог',         desc: 'Решить за 20 минут',                            icon: '🐌' },
    { id: 'time_30min',     name: 'Дзэн',         desc: 'Решить за 30 минут',                            icon: '🐌' },

    // === Идеальные игры (5 шт) ===
    { id: 'perfect_easy',   name: 'Сорванец',       desc: 'Пройти лёгкий ур. без ошибок',              icon: '🍦' },
    { id: 'perfect_medium', name: 'Потихоньку',      desc: 'Пройти средний без ошибок',         icon: '🍩' },
    { id: 'perfect_hard',   name: 'Математик',      desc: 'Пройти сложный без ошибок',         icon: '🍉' },
    { id: 'perfect_expert', name: 'Мозговитый',      desc: 'Пройти эксперт без ошибок',         icon: '🍌' },
    { id: 'perfect_all',    name: 'Доцент',       desc: 'Пройти все уровни без ошибок',        icon: '🍰' },

    // === Скрытые / забавные (6 шт) ===
    { id: 'no_hint_win',    name: 'Без подсказок',          desc: 'Выиграть без подсказок',                       icon: '🤯' },
    { id: 'all_checks_used',name: 'Проверено всё',          desc: 'Использовать все проверки за раунд',        icon: '📋' },
    { id: 'first_move',     name: 'Первый шаг',             desc: 'Поставить первую цифру в игре',                 icon: '👣' },
    { id: 'one_number',     name: 'Одной цифрой',           desc: 'Поставить одну и ту же цифру 10 раз подряд',    icon: '🔟' },
    { id: 'comeback',       name: 'Возвращение',            desc: 'Выиграть после 3 ошибок в одной игре',          icon: '🔄' },
    { id: 'lucky_7',        name: '777',     desc: 'Поставить цифру 7 в 7 разных клетках за игру',  icon: '🍀' },
    // === Дополнительные (серии, скорость, время, коллекционер) ===
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
{ id: 'collector_25',   name: 'СОбиратель', desc: 'Собрать 25 достижений',            icon: '📚' },
{ id: 'collector_50',   name: 'Легенда', desc: 'Собрать 50 достижений',      icon: '📚' },
];


        // Кнопки
    document.getElementById('btnStartGame').addEventListener('pointerdown', (e) => { e.preventDefault(); this.startNewGame(); });
      document.getElementById('btnBackToMenu').addEventListener('pointerdown', (e) => { e.preventDefault(); this.goToMenu(); });
      document.getElementById('btnToggleSound').addEventListener('pointerdown', (e) => { e.preventDefault(); this.toggleSound(); });
     document.getElementById('btnInviteFriends').addEventListener('pointerdown', (e) => { e.preventDefault(); this.inviteFriends(); });
   document.getElementById('btnHint').addEventListener('pointerdown', (e) => { e.preventDefault(); this.giveHint(); });
    document.getElementById('btnCheck').addEventListener('pointerdown', (e) => { e.preventDefault(); this.checkNumber(); });
      document.getElementById('btnSolveAll').addEventListener('pointerdown', (e) => { e.preventDefault(); this.solveAll(); });

      
document.getElementById('dailyBonusUnavailableOk').addEventListener('pointerdown', (e) => { e.preventDefault();
    this.sound.click();
    this.closeModal('dailyBonusUnavailableModal');
    this.resumeTimer();
});
        // Обработчики для ежедневного бонуса (привязываем один раз)
document.getElementById('dailyBonus5').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    this.sound.click();
    this.closeModal('dailyBonusModal');
    this.claimBonus(5);
});

document.getElementById('dailyBonus15').addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    this.sound.click();

    // Проверяем, доступен ли бонус сегодня
    if (!this.canClaimDailyBonus()) {
        this.showGlobalToast('❌ Бонус уже получен сегодня!', true);
        this.closeModal('dailyBonusModal');
        return;
    }

    const modal = document.getElementById('dailyBonusModal');
    const choiceBlock = modal.querySelector('.bonus-choice');
    const loadingBlock = modal.querySelector('.bonus-loading');

    // Прячем выбор, показываем загрузку
    choiceBlock.style.display = 'none';
    loadingBlock.style.display = 'block';

    try {
        const adShown = await this.adManager.showRewardedAd();
        // Скрываем модалку
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
        // Возвращаем видимость выбора (на случай, если модалка откроется снова)
        choiceBlock.style.display = 'block';
        loadingBlock.style.display = 'none';
        // Восстанавливаем таймер, если был на паузе
        this.resumeTimer();
    }
});

document.getElementById('dailyBonusCancel').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    this.sound.click();
    this.closeModal('dailyBonusModal');
    this.resumeTimer();
});

// Кнопка "Таблица лидеров"
// В конструкторе SudokuGame
document.getElementById('btnLeaderboard').addEventListener('pointerdown', (e) => { e.preventDefault();
    this.sound.click();
    this.showLeaderboard();
});

document.getElementById('btnDailyBonus').addEventListener('pointerdown', (e) => { e.preventDefault();
    this.sound.click();
    this.showDailyBonusModal();
});
// Открыть модалку с темами
document.getElementById('btnThemeSun').addEventListener('pointerdown', function(e) { e.preventDefault();
    document.getElementById('themeModal').style.display = 'flex';
});

        
        // Кнопка "Как играть?"
     document.getElementById('btnHowToPlay').addEventListener('pointerdown', (e) => {
    this.sound.click();
    document.getElementById('howToPlayModal').style.display = 'flex';
});
        // Достижения
document.getElementById('btnAchievements').addEventListener('pointerdown', (e) => {
    this.sound.click();
    this.openAchievementsModal();
});
document.getElementById('closeAchievementsModal').addEventListener('pointerdown', (e) => { e.preventDefault(); this.closeAchievementsModal(); });
document.getElementById('achPrevPage').addEventListener('pointerdown', (e) => { e.preventDefault(); this.achievementsPrevPage(); });
document.getElementById('achNextPage').addEventListener('pointerdown', (e) => { e.preventDefault(); this.achievementsNextPage(); });

        // Закрытие модального окна
      document.getElementById('closeHowToPlay').addEventListener('pointerdown', (e) => { e.preventDefault();
            document.getElementById('howToPlayModal').style.display = 'none';
        });
  document.getElementById('closeHowToPlayBtn').addEventListener('pointerdown', (e) => { e.preventDefault();
            document.getElementById('howToPlayModal').style.display = 'none';
        });
        // Закрытие по клику вне окна
        document.getElementById('howToPlayModal').addEventListener('pointerdown', (e) => { e.preventDefault();
            if (e.target === e.currentTarget) {
                document.getElementById('howToPlayModal').style.display = 'none';
            }
        });

        // Выбор сложности
   document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.diff;
        this.sound.click();
    });
});
// Для модалки выбора бонуса
document.getElementById('dailyBonusModal').addEventListener('pointerdown', (e) => { e.preventDefault();
    if (e.target === e.currentTarget) {
        this.closeModal('dailyBonusModal');
        this.resumeTimer();
    }
});

// Для модалки "бонус уже получен"
document.getElementById('dailyBonusUnavailableModal').addEventListener('pointerdown', (e) => { e.preventDefault();
    if (e.target === e.currentTarget) {
        this.closeModal('dailyBonusUnavailableModal');
        this.resumeTimer();
    }
});
        // Подписка на VK
        this.setupVKBridge();

        // Показать меню
        this.showMenu();
        this.updateDiamondUI(); // чтобы сразу отобразить алмазы
        this.initAdBanner();
        this.initVK();
    }

// ============================================================
// Проверка "Использовать все проверки"
// ============================================================
checkAllChecksUsed() {
    if (this.checksUsed === this.maxChecks && this.maxChecks > 0) {
        this.unlockAchievement('all_checks_used');
    }
}

// ============================================================
// Проверка "Первая цифра"
// ============================================================
checkFirstMove() {
    if (this.totalPlaced === 1) {
        this.unlockAchievement('first_move');
    }
}

// ============================================================
// Проверка "Одной цифрой"
// ============================================================
checkSameNumber(number) {
    if (this.lastPlacedNumber === number) {
        this.consecutiveSameNumber++;
        if (this.consecutiveSameNumber >= 10) {
            this.unlockAchievement('one_number');
        }
    } else {
        this.consecutiveSameNumber = 1;
        this.lastPlacedNumber = number;
    }
}

// ============================================================
// Проверка "Счастливая семёрка"
// ============================================================
checkSeven(number) {
    if (number === 7) {
        this.sevenCount++;
        if (this.sevenCount >= 7) {
            this.unlockAchievement('lucky_7');
        }
    }
}

// ============================================================
// Проверка "Возвращение" (выиграть после 3 ошибок)
// ============================================================
checkComeback() {
    if (this.gameErrors >= 3) {
        this.unlockAchievement('comeback');
    }
}

    // ============================================================
    // VK Bridge
    // ============================================================
// В методе setupVKBridge добавляем:
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
        } else if (e.type === 'VKWebAppShowBannerAdResult') {
            if (e.data && e.data.result) {
                console.log('Баннер показан успешно');
            }
        }
        // 👇 ДОБАВЛЯЕМ ОБРАБОТКУ РЕКЛАМЫ ЗА ВОЗНАГРАЖДЕНИЕ
        else if (e.type === 'VKWebAppShowNativeAdsResult') {
            console.log('VKWebAppShowNativeAdsResult:', e.data);
            // Здесь можно обработать результат показа рекламы
            if (e.data && e.data.result === true) {
                console.log('✅ Реклама за вознаграждение успешно показана');
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
    okBtn.addEventListener('pointerdown', (e) => { e.preventDefault();
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        console.log('Нажата кнопка "Ок" в модалке "Реклама недоступна"');
        callback(true);
    });
    
    // Закрытие по клику вне диалога
    overlay.addEventListener('pointerdown', (e) => { e.preventDefault();
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
showHintAdModal() {
    console.log('showHintAdModal вызван');
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
            this.resumeTimer();
            console.log('Модалка закрыта с результатом:', result);
            resolve(result);
        };
        
        // Убираем старые обработчики
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newCancelBtn.addEventListener('pointerdown', (e) => { e.preventDefault();
            this.sound.click();
            closeModal(false);
        });
        
   newConfirmBtn.addEventListener('pointerdown', async (e) => {
            this.sound.click();
            console.log('Нажата кнопка "Получить"');
            
            // Меняем текст на кнопке, чтобы показать загрузку
            const btn = document.getElementById('hintAdConfirm');
            const originalText = btn.textContent;
            btn.textContent = '⏳ Загрузка...';
            btn.disabled = true;
            
            try {
                // Показываем рекламу
                const adShown = await this.adManager.showRewardedAd();
                console.log('Результат показа рекламы в модалке:', adShown);
                
                // Восстанавливаем кнопку
                btn.textContent = originalText;
                btn.disabled = false;
                
                // ✅ Если реклама показана — даём 3 подсказки
                if (adShown === true) {
                    console.log('✅ Реклама успешно показана, даём 3 подсказки!');
                    this.maxHints += 3;
                    const remaining = this.maxHints - this.hintsUsed;
                    this.messageEl.textContent = `🎉 +3 подсказки! Осталось: ${remaining}`;
                    this.sound.click();
                    this.render();
                      this.updateHintButton();
                    closeModal(true);
                } else {
                    // ❌ Если реклама НЕ показана — даём 1 подсказку
                    console.log('❌ Реклама не показана, даём 1 подсказку');
                    
                    // Скрываем модалку и показываем "Реклама недоступна"
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
        
        modal.addEventListener('pointerdown', (e) => { e.preventDefault();
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
        
        document.getElementById('confirmAdYes').addEventListener('pointerdown', (e) => { e.preventDefault();
            closeDialog(true);
        });
        
        document.getElementById('confirmAdNo').addEventListener('pointerdown', (e) => { e.preventDefault();
            closeDialog(false);
        });
        
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
    // ============================================================
// Инициализация VK и получение данных пользователя
// ============================================================
initVK() {
    if (typeof vkBridge === 'undefined') {
        console.warn('VK Bridge не найден, работаем в локальном режиме');
        this.loadDiamondsLocal();
               this.loadAchievements();  
        this.updateDiamondUI();
        return;
    }

    // Проверяем, запущено ли внутри ВК
    const isVK = window.location !== window.parent.location;
    if (!isVK) {
        console.warn('Приложение запущено не внутри ВК, используем localStorage');
        this.loadDiamondsLocal();
          this.loadAchievements(); 
        this.updateDiamondUI();

        return;
    }

    // Запрашиваем токен для работы с storage и secure API
    vkBridge.send('VKWebAppGetAuthToken', {
        app_id: 51399364, // Ваш ID приложения (можно вынести в константу)
        scope: ''
    })
    .then((data) => {
        if (data && data.access_token) {
            this.vkUserToken = data.access_token;
            this.vkInitialized = true;
            console.log('✅ Токен получен');
            // Получаем информацию о пользователе
            return vkBridge.send('VKWebAppGetUserInfo', {});
        } else {
            throw new Error('Токен не получен');
        }
    })
    .then((userInfo) => {
        if (userInfo && userInfo.id) {
            this.vkUserId = userInfo.id;
            console.log('👤 Пользователь VK:', this.vkUserId);
            // Загружаем алмазы из VK Storage
            this.loadDiamonds();
            this.loadAchievements();
        } else {
            throw new Error('Не удалось получить ID пользователя');
        }
    })
    .catch((err) => {
        console.warn('Ошибка инициализации VK:', err);
        // Работаем с localStorage как fallback
        this.loadDiamondsLocal();
        this.updateDiamondUI();
    });
}
// ============================================================
// Загрузка алмазов из VK Storage
// ============================================================
loadDiamonds() {
    if (!this.vkUserId || !this.vkInitialized) {
        this.loadDiamondsLocal();
        return;
    }

    vkBridge.send('VKWebAppStorageGet', {
        keys: ['diamonds', 'bonusDate']
    })
    .then((data) => {
        if (data && data.keys) {
            data.keys.forEach(item => {
                if (item.key === 'diamonds') {
                    this.currentDiamonds = parseInt(item.value) || 0;
                }
                if (item.key === 'bonusDate') {
                    this.lastBonusDate = item.value || null;
                }
            });
        }
        this.updateDiamondUI();
        // После загрузки синхронизируем таблицу лидеров (на случай, если локально было больше)
        this.syncLeaderboard();
    })
    .catch((err) => {
        console.warn('Ошибка загрузки из VK Storage:', err);
        this.loadDiamondsLocal();
    });
}

// ============================================================
// Загрузка из localStorage (fallback)
// ============================================================
loadDiamondsLocal() {
    try {
        const saved = localStorage.getItem('sudoku_diamonds');
        this.currentDiamonds = saved ? parseInt(saved) : 0;
        const bonusDate = localStorage.getItem('sudoku_bonusDate');
        this.lastBonusDate = bonusDate || null;
    } catch (e) {
        this.currentDiamonds = 0;
        this.lastBonusDate = null;
    }
    this.updateDiamondUI();
}

// ============================================================
// Сохранение алмазов (в VK Storage и localStorage)
// ============================================================
saveDiamonds() {
    // Сохраняем локально
    try {
        localStorage.setItem('sudoku_diamonds', String(this.currentDiamonds));
        if (this.lastBonusDate) {
            localStorage.setItem('sudoku_bonusDate', this.lastBonusDate);
        }
    } catch (e) {}

    // Сохраняем в VK Storage, если доступно
    if (this.vkUserId && this.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', {
            key: 'diamonds',
            value: String(this.currentDiamonds)
        })
        .then(() => {
            console.log('💎 Алмазы сохранены в VK Storage');
        })
        .catch((err) => {
            console.warn('Ошибка сохранения в VK Storage:', err);
        });

        if (this.lastBonusDate) {
            vkBridge.send('VKWebAppStorageSet', {
                key: 'bonusDate',
                value: this.lastBonusDate
            })
            .catch((err) => console.warn('Ошибка сохранения даты бонуса:', err));
        }
    }

    // Обновляем UI и таблицу лидеров
    this.updateDiamondUI();
    this.syncLeaderboard();
}

// ============================================================
// Обновление счётчика алмазов в меню
// ============================================================
updateDiamondUI() {
    const counter = document.getElementById('diamond-counter');
    if (counter) {
        counter.textContent = `💎 ${this.currentDiamonds}`;
    } else {
        console.warn('Элемент #diamond-counter не найден');
    }
}
// ============================================================
// Открытие таблицы лидеров
// ============================================================
showLeaderboard() {
      // Передаём текущее количество алмазов как результат пользователя
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: this.currentDiamonds,
        global: 1
    })
    .then(() => {
        console.log('📊 Таблица лидеров открыта');
    })
    .catch((err) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', err);
        alert('Не удалось открыть таблицу лидеров. Попробуйте позже.');
    });
}

// ============================================================
// Синхронизация рекорда с таблицей лидеров (через secure.addAppEvent)
// ============================================================
syncLeaderboard() {
    if (!this.vkInitialized || !this.vkUserId || !this.vkUserToken) {
        console.log('⏳ Нет данных для синхронизации лидерборда');
        return;
    }
    if (this.currentDiamonds <= 0) return;

    // Получаем текущий рекорд пользователя
    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getScore',
        params: {
            user_id: this.vkUserId,
            v: '5.131',
            access_token: this.vkUserToken
        }
    })
    .then((data) => {
        let currentScore = parseInt(data.response) || 0;
        if (this.currentDiamonds > currentScore) {
            // Обновляем рекорд
            return vkBridge.send('VKWebAppCallAPIMethod', {
                method: 'secure.addAppEvent',
                params: {
                    user_id: this.vkUserId,
                    activity_id: 2,   // 2 – очки (алмазы)
                    value: this.currentDiamonds,
                    v: '5.131',
                    access_token: 'b59b7666b59b7666b59b7666bcb68b3ca2bb59bb59b7666d76fa8fa06cdc580a759b821'
                }
            });
        } else {
            return Promise.resolve();
        }
    })
    .then(() => {
        console.log('🏆 Таблица лидеров обновлена до', this.currentDiamonds);
    })
    .catch((err) => {
        console.error('❌ Ошибка синхронизации лидерборда:', err);
    });
}
    // ============================================================
    // Социальные функции
    // ============================================================
inviteFriends() {
    this.sound.click();
    const sendMethod = vkBridge.sendPromise || vkBridge.send;
    sendMethod.call(vkBridge, 'VKWebAppShowInviteBox', {});
}
// Проверка серий
checkStreak() {
    if (this.winStreak >= 3) this.unlockAchievement('streak_3');
    if (this.winStreak >= 5) this.unlockAchievement('streak_5');
    if (this.winStreak >= 10) this.unlockAchievement('streak_10');
    if (this.winStreak >= 20) this.unlockAchievement('streak_20');
    if (this.winStreak >= 50) this.unlockAchievement('streak_50');
}


// Проверка "все уровни"
checkAllLevels() {
    const levels = ['easy', 'medium', 'hard', 'expert'];
    let all = true;
    for (const level of levels) {
        if (this.winsByLevel[level] < 1) all = false;
    }
    if (all) this.unlockAchievement('all_levels');
}

// Проверка накопления алмазов
checkDiamonds() {
    if (this.currentDiamonds >= 10) this.unlockAchievement('diamonds_10');
    if (this.currentDiamonds >= 50) this.unlockAchievement('diamonds_50');
    if (this.currentDiamonds >= 100) this.unlockAchievement('diamonds_100');
    if (this.currentDiamonds >= 500) this.unlockAchievement('diamonds_500');
    if (this.currentDiamonds >= 1000) this.unlockAchievement('diamonds_1000');
}

// Проверка коллекционера
checkCollector() {
    const count = Object.values(this.achievements).filter(v => v === true).length;
    if (count >= 10) this.unlockAchievement('collector');
    if (count >= 25) this.unlockAchievement('collector_25');
    if (count >= 50) this.unlockAchievement('collector_50');
}
// В классе SudokuGame
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
// Проверка времени суток для бонуса
checkBonusTime() {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 10) this.unlockAchievement('early_bird');
    if (hours >= 23) this.unlockAchievement('night_owl');
}

// Обновление общего времени игры (вызывать при закрытии игры или раз в минуту)
updateTotalGameTime(seconds) {
    this.totalGameTime += seconds;
    if (this.totalGameTime >= 3600) this.unlockAchievement('time_1h');
    if (this.totalGameTime >= 18000) this.unlockAchievement('time_5h');
    if (this.totalGameTime >= 36000) this.unlockAchievement('time_10h');
    if (this.totalGameTime >= 86400) this.unlockAchievement('time_24h');
    if (this.totalGameTime >= 360000) this.unlockAchievement('time_100h');
    this.saveAchievements();
}
// ============================================================
// Загрузка достижений из VK Storage и localStorage (с merge)
// ============================================================
loadAchievements() {
    // Сначала загружаем из localStorage
    try {
        const local = localStorage.getItem('sudoku_achievements');
        if (local) {
            const parsed = JSON.parse(local);
            // Объединяем с существующими (не затираем)
            for (const key in parsed) {
                if (parsed[key] === true) {
                    this.achievements[key] = true;
                }
            }
        }
        
        // Загружаем счётчики
const winStreak = localStorage.getItem('sudoku_winStreak');
if (winStreak) this.winStreak = parseInt(winStreak) || 0;
const perfectWins = localStorage.getItem('sudoku_perfectWins');
const winsByLevel = localStorage.getItem('sudoku_winsByLevel');
if (winsByLevel) { try { this.winsByLevel = JSON.parse(winsByLevel); } catch(e) {} }
const noHintWins = localStorage.getItem('sudoku_noHintWins');
if (noHintWins) this.noHintWins = parseInt(noHintWins) || 0;
const totalChecks = localStorage.getItem('sudoku_totalChecks');
if (totalChecks) this.totalChecks = parseInt(totalChecks) || 0;
const totalPlaced = localStorage.getItem('sudoku_totalPlaced');
if (totalPlaced) this.totalPlaced = parseInt(totalPlaced) || 0;
const totalGameTime = localStorage.getItem('sudoku_totalGameTime');
if (totalGameTime) this.totalGameTime = parseInt(totalGameTime) || 0;
const wins = localStorage.getItem('sudoku_totalWins');
if (wins) this.totalWins = parseInt(wins) || 0;
const hints = localStorage.getItem('sudoku_totalHints');
if (hints) this.totalHintsUsed = parseInt(hints) || 0;
const bonuses = localStorage.getItem('sudoku_totalBonuses');
if (bonuses) this.totalBonuses = parseInt(bonuses) || 0;
const maxWinStreak = localStorage.getItem('sudoku_maxWinStreak');
if (maxWinStreak) this.maxWinStreak = parseInt(maxWinStreak) || 0;
    } catch (e) {}

    // Если есть VK Storage – загружаем оттуда и мержим
    if (this.vkUserId && this.vkInitialized) {
   vkBridge.send('VKWebAppStorageGet', {
    keys: [
        'achievements', 'totalWins', 'totalHints', 'totalBonuses',
        'winStreak', 'maxWinStreak', 'winsByLevel', 'noHintWins',
        'perfectWins', 'totalChecks', 'totalPlaced', 'totalGameTime'
    ]
})
.then((data) => {
            if (data && data.keys) {
                data.keys.forEach(item => {
                    if (item.key === 'achievements') {
                        try {
                            const parsed = JSON.parse(item.value);
                            for (const key in parsed) {
                                if (parsed[key] === true) {
                                    this.achievements[key] = true;
                                }
                            }
                        } catch (e) {}
                    }
                    if (item.key === 'totalWins') {
                        const val = parseInt(item.value) || 0;
                        if (val > this.totalWins) this.totalWins = val;
                    }
                    if (item.key === 'totalHints') {
                        const val = parseInt(item.value) || 0;
                        if (val > this.totalHintsUsed) this.totalHintsUsed = val;
                    }
                    if (item.key === 'totalBonuses') {
                        const val = parseInt(item.value) || 0;
                        if (val > this.totalBonuses) this.totalBonuses = val;
                    }
           // Добавляем новые:
            if (item.key === 'winStreak') {
                const val = parseInt(item.value) || 0;
                if (val > this.winStreak) this.winStreak = val;
            }
            if (item.key === 'maxWinStreak') {
                const val = parseInt(item.value) || 0;
                if (val > this.maxWinStreak) this.maxWinStreak = val;
            }
if("winsByLevel"===item.key)try{const e=JSON.parse(item.value);for(const i in e)this.winsByLevel[i]=Math.max(this.winsByLevel[i]||0,e[i])}catch(e){}
            if (item.key === 'noHintWins') {
                const val = parseInt(item.value) || 0;
                if (val > this.noHintWins) this.noHintWins = val;
            }
if("perfectWins"===item.key)try{const t=JSON.parse(item.value);for(const e in t)this.perfectWins[e]=Math.max(this.perfectWins[e]||0,t[e])}catch(t){}
            if (item.key === 'totalChecks') {
                const val = parseInt(item.value) || 0;
                if (val > this.totalChecks) this.totalChecks = val;
            }
            if (item.key === 'totalPlaced') {
                const val = parseInt(item.value) || 0;
                if (val > this.totalPlaced) this.totalPlaced = val;
            }
            if (item.key === 'totalGameTime') {
                const val = parseInt(item.value) || 0;
                if (val > this.totalGameTime) this.totalGameTime = val;
            }
        });
    }
            // После загрузки проверяем достижения и сохраняем
            this.checkAchievements();
            this.saveAchievements();
        })
        .catch(() => {
            // Если VK Storage недоступен – всё равно проверяем и сохраняем локально
            this.checkAchievements();
            this.saveAchievements();
        });
    } else {
        // Если нет VK – просто проверяем локально
        this.checkAchievements();
        this.saveAchievements();
    }
}

// ============================================================
// Сохранение достижений (в VK Storage и localStorage)
// ============================================================
saveAchievements() {
    // Сохраняем в localStorage
    try {
        localStorage.setItem('sudoku_achievements', JSON.stringify(this.achievements));
        localStorage.setItem('sudoku_totalWins', String(this.totalWins));
        localStorage.setItem('sudoku_totalHints', String(this.totalHintsUsed));
        localStorage.setItem('sudoku_totalBonuses', String(this.totalBonuses));
        localStorage.setItem('sudoku_winStreak', String(this.winStreak));
localStorage.setItem('sudoku_maxWinStreak', String(this.maxWinStreak));
localStorage.setItem('sudoku_winsByLevel', JSON.stringify(this.winsByLevel));
localStorage.setItem('sudoku_noHintWins', String(this.noHintWins));
localStorage.setItem('sudoku_perfectWins', JSON.stringify(this.perfectWins));
localStorage.setItem('sudoku_totalChecks', String(this.totalChecks));
localStorage.setItem('sudoku_totalPlaced', String(this.totalPlaced));
localStorage.setItem('sudoku_totalGameTime', String(this.totalGameTime));
    } catch (e) {}

    // Сохраняем в VK Storage, если доступно
    if (this.vkUserId && this.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', {
            key: 'achievements',
            value: JSON.stringify(this.achievements)
        }).catch(err => console.warn('Ошибка сохранения достижений в VK:', err));

        vkBridge.send('VKWebAppStorageSet', {
            key: 'totalWins',
            value: String(this.totalWins)
        }).catch(err => console.warn('Ошибка сохранения totalWins:', err));

        vkBridge.send('VKWebAppStorageSet', {
            key: 'totalHints',
            value: String(this.totalHintsUsed)
        }).catch(err => console.warn('Ошибка сохранения totalHints:', err));

        vkBridge.send('VKWebAppStorageSet', {
            key: 'totalBonuses',
            value: String(this.totalBonuses)
        }).catch(err => console.warn('Ошибка сохранения totalBonuses:', err));
        vkBridge.send('VKWebAppStorageSet', { key: 'winStreak', value: String(this.winStreak) })
    .catch(err => console.warn('Ошибка сохранения winStreak:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'maxWinStreak', value: String(this.maxWinStreak) })
    .catch(err => console.warn('Ошибка сохранения maxWinStreak:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'winsByLevel', value: JSON.stringify(this.winsByLevel) })
    .catch(err => console.warn('Ошибка сохранения winsByLevel:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'noHintWins', value: String(this.noHintWins) })
    .catch(err => console.warn('Ошибка сохранения noHintWins:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'perfectWins', value: JSON.stringify(this.perfectWins) })
    .catch(err => console.warn('Ошибка сохранения perfectWins:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'totalChecks', value: String(this.totalChecks) })
    .catch(err => console.warn('Ошибка сохранения totalChecks:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'totalPlaced', value: String(this.totalPlaced) })
    .catch(err => console.warn('Ошибка сохранения totalPlaced:', err));
vkBridge.send('VKWebAppStorageSet', { key: 'totalGameTime', value: String(this.totalGameTime) })
    .catch(err => console.warn('Ошибка сохранения totalGameTime:', err));
    }
}

// ============================================================
// Разблокировка достижения
// ============================================================
unlockAchievement(id) {
    if (!this.achievements[id]) {
        this.achievements[id] = true;
        this.saveAchievements();
        
        // Находим достижение в списке
        const ach = this.achievementList.find(a => a.id === id);
        if (ach) {
            // Показываем красивый попап
            this.showAchievementPopup(ach.icon, ach.name);
            // Звук победы
            this.sound.win();
        }
    }
}
// ============================================================
// Показать всплывающее уведомление о достижении
// ============================================================
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
// ============================================================
// Проверка всех достижений (вызывать после изменения счётчиков)
// ============================================================
checkAchievements() {
    // Победы
    if (this.totalWins >= 1) this.unlockAchievement('first_win');
    if (this.totalWins >= 5) this.unlockAchievement('win_5');
    if (this.totalWins >= 10) this.unlockAchievement('win_10');
    if (this.totalWins >= 25) this.unlockAchievement('win_25');
    if (this.totalWins >= 50) this.unlockAchievement('win_50');
    if (this.totalWins >= 100) this.unlockAchievement('win_100');

    // Бонусы
    if (this.totalBonuses >= 1) this.unlockAchievement('bonus_1');
    if (this.totalBonuses >= 5) this.unlockAchievement('bonus_5');
    if (this.totalBonuses >= 10) this.unlockAchievement('bonus_10');
    if (this.totalBonuses >= 25) this.unlockAchievement('bonus_25');
    if (this.totalBonuses >= 50) this.unlockAchievement('bonus_50');

    // Подсказки
    if (this.totalHintsUsed >= 1) this.unlockAchievement('hint_1');
    if (this.totalHintsUsed >= 10) this.unlockAchievement('hint_10');
    if (this.totalHintsUsed >= 25) this.unlockAchievement('hint_25');
    if (this.totalHintsUsed >= 50) this.unlockAchievement('hint_50');
    if (this.totalHintsUsed >= 100) this.unlockAchievement('hint_100');

    // Проверки
    if (this.totalChecks >= 1) this.unlockAchievement('check_1');
    if (this.totalChecks >= 10) this.unlockAchievement('check_10');
    if (this.totalChecks >= 25) this.unlockAchievement('check_25');
    if (this.totalChecks >= 50) this.unlockAchievement('check_50');
    if (this.totalChecks >= 100) this.unlockAchievement('check_100');

    // Поставленные цифры
    if (this.totalPlaced >= 100) this.unlockAchievement('place_100');
    if (this.totalPlaced >= 500) this.unlockAchievement('place_500');
    if (this.totalPlaced >= 1000) this.unlockAchievement('place_1000');
    if (this.totalPlaced >= 5000) this.unlockAchievement('place_5000');
    if (this.totalPlaced >= 10000) this.unlockAchievement('place_10000');

    // Алмазы
    if (this.currentDiamonds >= 10) this.unlockAchievement('diamonds_10');
    if (this.currentDiamonds >= 50) this.unlockAchievement('diamonds_50');
    if (this.currentDiamonds >= 100) this.unlockAchievement('diamonds_100');
    if (this.currentDiamonds >= 500) this.unlockAchievement('diamonds_500');
    if (this.currentDiamonds >= 1000) this.unlockAchievement('diamonds_1000');
     // Проверяем коллекционера
    this.checkCollector();
}

// ============================================================
// Проверка победы на уровне (вызывать из checkWin)
// ============================================================
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

// ============================================================
// Открыть модалку достижений
// ============================================================
openAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (!modal) return;
    this.achievementsPage = 0;
    modal.style.display = 'flex';
    this.renderAchievements();
}

// ============================================================
// Закрыть модалку достижений
// ============================================================
closeAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (modal) modal.style.display = 'none';
}

// ============================================================
// Рендеринг достижений с пагинацией
// ============================================================
renderAchievements() {
    const container = document.getElementById('achievementsList');
    const pageInfo = document.getElementById('achPageInfo');
    if (!container) return;

    // Сортируем: сначала разблокированные
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

    // Обновляем информацию о странице
    if (pageInfo) {
        pageInfo.textContent = `${this.achievementsPage + 1} / ${maxPage + 1}`;
    }

    // Обновляем состояние кнопок
    document.getElementById('achPrevPage').style.opacity = this.achievementsPage === 0 ? '0.3' : '1';
    document.getElementById('achNextPage').style.opacity = this.achievementsPage === maxPage ? '0.3' : '1';
    this.checkCollector();
}

// ============================================================
// Пагинация достижений
// ============================================================
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

// ============================================================
// Проверка возможности получения ежедневного бонуса
// ============================================================
canClaimDailyBonus() {
    if (!this.lastBonusDate) return true;
    const today = new Date().toDateString();
    return this.lastBonusDate !== today;
}

// ============================================================
// Показать модалку выбора бонуса
// ============================================================
showDailyBonusModal() {
    this.pauseTimer();

    if (!this.canClaimDailyBonus()) {
        // Бонус уже получен – показываем отдельную модалку-сообщение
        const modal = document.getElementById('dailyBonusUnavailableModal');
        if (modal) modal.style.display = 'flex';
        return;
    }

    // Бонус доступен – показываем модалку выбора
    const modal = document.getElementById('dailyBonusModal');
    if (modal) modal.style.display = 'flex';
}

// ============================================================
// Закрытие модалки по id
// ============================================================
closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ============================================================
// Начисление бонуса
// ============================================================
claimBonus(amount) {
    if (amount <= 0) return;

    this.addDiamonds(amount);
    this.lastBonusDate = new Date().toDateString();
    // Сохраняем дату в localStorage и VK Storage (как уже есть)
    try {
        localStorage.setItem('sudoku_bonusDate', this.lastBonusDate);
    } catch (e) {}
    if (this.vkUserId && this.vkInitialized) {
        vkBridge.send('VKWebAppStorageSet', { key: 'bonusDate', value: this.lastBonusDate })
            .catch(err => console.warn(err));
    }

    this.totalBonuses++;
    this.checkAchievements();
    this.checkBonusTime();
    this.saveAchievements();

    // Показываем модалку результата (она видна на любом экране)
    this.showBonusResult(amount);
    this.resumeTimer();
}

// ============================================================
// Показать модалку "Бонус получен!"
// ============================================================
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
        // Возобновляем таймер (если был приостановлен)
        this.resumeTimer();
    });

    // Закрытие по клику вне
    modal.addEventListener('pointerdown', (e) => { e.preventDefault();
        if (e.target === modal) {
            this.closeModal('bonusResultModal');
            this.resumeTimer();
        }
    });
}

// ============================================================
// Добавление алмазов (общий метод)
// ============================================================
addDiamonds(amount) {
    if (amount <= 0) return;
    this.currentDiamonds += amount;
    this.saveDiamonds();
    this.updateDiamondUI();
    this.syncLeaderboard();
    this.checkDiamonds();
    this.sound.click();
}
// === Конфетти ===
showConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#ff5722'];
    const numParticles = 150;

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

    let animationId;
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
            ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            ctx.restore();
        }
        if (alive) {
            animationId = requestAnimationFrame(animate);
        } else {
            this.hideConfetti();
        }
    };
    animate();
    // Через 6 секунд принудительно скрыть
    setTimeout(() => {
        if (animationId) cancelAnimationFrame(animationId);
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

// === Управление кнопкой "Решить всё" ===
updateSolveButton() {
    const btn = document.getElementById('btnSolveAll');
    if (!btn) return;
    if (this.isFinished) {
        btn.textContent = '🎉 Новая игра';
        btn.className = 'action-btn solve-btn win-btn'; // добавляем класс для зелёного и пульсации
        // Убираем старый обработчик, если он был привязан к solveAll – но мы оставим один обработчик с проверкой
    } else {
        btn.textContent = '⚡ Решить всё';
        btn.className = 'action-btn solve-btn';
    }
}

// === Эффекты победы ===
showWinEffects() {
    this.showConfetti();
    this.updateSolveButton();
}
// ============================================================
// Вспомогательный тост (если модалка не отображается)
// ============================================================
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
        this.updateDiamondUI();
    }

    goToMenu() {
        this.hideConfetti();
        this.sound.click();
            // Сохраняем время игры (если игра не завершена, добавляем текущее время)
    if (!this.isFinished && this.timer > 0) {
        this.updateTotalGameTime(this.timer);
    }
        this.showMenu();
        this.updateDiamondUI(); // чтобы сразу отобразить алмазы
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

       cell.addEventListener('pointerdown', (e) => { e.preventDefault(); this.selectCell(r, c); });
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
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.placeNumber(i); });
        this.numPanel.appendChild(btn);
    }
    const erase = document.createElement('button');
    erase.className = 'num-btn erase';
    erase.textContent = '✕';
    erase.addEventListener('pointerdown', (e) => { e.preventDefault(); this.placeNumber(0); });
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
  this.totalPlaced++;
  // После this.totalPlaced++;
if (num !== 0) {
    this.checkFirstMove();    // достижение "Первый шаг"
    this.checkSameNumber(num); // достижение "Одной цифрой"
    this.checkSeven(num);     // достижение "Счастливая семёрка"
}

// Удаляем статус проверки для этой клетки (она изменена)
delete this.checkedCells[cellKey];

// Проверяем правильность (для всех уровней)
if (num !== this.solution[r][c]) {
    this.gameErrors++; // увеличиваем счётчик ошибок
}

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
    this.checkAchievements();
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
  
          }
}

// ============================================================
// Обновленная подсказка с модалкой для доп. подсказок
// ============================================================
async giveHint() {
    console.log('giveHint вызван');
    if (this.isFinished) return;
    
    if (this.maxHints === undefined || this.maxHints === 0) {
        if (this.difficulty === 'easy' || this.difficulty === 'medium') {
            this.maxHints = 3;
        } else {
            this.maxHints = 1;
        }
    }

    // Обновляем иконку в зависимости от количества подсказок
    this.updateHintButton();

    if (this.hintsUsed >= this.maxHints) {
        console.log('Подсказки кончились. Использовано:', this.hintsUsed, 'Максимум:', this.maxHints);
        this.messageEl.textContent = '💡 Подсказки закончились!';
        this.sound.error();
        
        const result = await this.showHintAdModal();
        console.log('Результат модалки:', result);
        
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

updateCheckButton() {
    const checkBtn = document.getElementById('btnCheck');
    if (!checkBtn) return;

    const remaining = this.maxChecks - this.checksUsed;
    if (remaining <= 0) {
        checkBtn.innerHTML = '✅✨'; // звёздочка, когда нет проверок
        checkBtn.classList.add('no-checks');
    } else {
        checkBtn.innerHTML = `✅ ${remaining}`;
        checkBtn.classList.remove('no-checks');
    }
}

// ============================================================
// Проверка (проверяет ВСЕ цифры на поле)
// ============================================================
async checkNumber() {
    if (this.isFinished) return;

    // Инициализируем maxChecks, если ещё не задан (на случай вызова до старта)
    if (this.maxChecks === undefined || this.maxChecks === 0) {
        this.maxChecks = 1;        
    }

    // Если проверки кончились – предлагаем получить дополнительные
    if (this.checksUsed >= this.maxChecks) {
    this.messageEl.textContent = '❌ Проверки закончились!';
    this.sound.error();

    const result = await this.showCheckAdModal();
    if (result === true) {
        // Проверки успешно получены (maxChecks уже увеличен внутри showCheckAdModal)
        const remaining = this.maxChecks - this.checksUsed;
        this.messageEl.textContent = `✅ Получены проверки! Осталось: ${remaining}`;
        this.sound.click();
        // Обновляем кнопку, чтобы отобразить новое количество проверок
        this.updateCheckButton();
        // Выходим – проверку не выполняем
        return;
    } else {
        this.messageEl.textContent = '❌ Вы отменили получение проверок.';
        this.sound.error();
        return;
    }
}

    // Теперь проводим саму проверку (оставшийся код из checkNumber)
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
// Начисление алмазов за победу
// ============================================================
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
        // Показываем сообщение (если не перекрыто другим)
        this.showToast(`💎 +${amount} алмазов за победу!`);
    }
}
// ============================================================
// Решить всё (с рекламой за вознаграждение либо просто так, если рекламы нет)
// ============================================================
async solveAll() {
       // Если игра завершена – запускаем новую игру
    if (this.isFinished) {
        this.startNewGame();
        return;
    }
    
    const confirmed = await this.showConfirmDialog();
    if (!confirmed) {
        this.messageEl.textContent = '❌ Решение отменено';
        this.sound.error();
        return;
    }
    
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
        
        // РЕШАЕМ ВСЕГДА
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
    } catch (error) {
        console.error('Ошибка в solveAll:', error);
        this.messageEl.textContent = '❌ Ошибка при решении';
        this.sound.error();
    } finally {
        solveBtn.textContent = originalText;
        solveBtn.disabled = false;
    }
}
// ============================================================
// Модалка для получения дополнительных проверок
// ============================================================
showCheckAdModal() {
    console.log('showCheckAdModal вызван');
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
            this.resumeTimer();
            console.log('Модалка проверок закрыта с результатом:', result);
            resolve(result);
        };

        // Убираем старые обработчики (защита от дублирования)
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newCancelBtn.addEventListener('pointerdown', (e) => { e.preventDefault();
            this.sound.click();
            closeModal(false);
        });

        newConfirmBtn.addEventListener('pointerdown', async (e) => {
            this.sound.click();
            console.log('Нажата кнопка "Получить проверки"');

            const btn = document.getElementById('checkAdConfirm');
            const originalText = btn.textContent;
            btn.textContent = '⏳ Загрузка...';
            btn.disabled = true;

            try {
                const adShown = await this.adManager.showRewardedAd();
                console.log('Результат показа рекламы (проверки):', adShown);

                btn.textContent = originalText;
                btn.disabled = false;

                if (adShown === true) {
                    this.maxChecks += 3;
                    const remaining = this.maxChecks - this.checksUsed;
                    this.messageEl.textContent = `🎉 +3 проверки! Осталось: ${remaining}`;
                    this.sound.click();
                    this.render();
                    this.updateCheckButton();
                    closeModal(true);
                } else {
                    // Реклама не показана – даём 1 проверку
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

        modal.addEventListener('pointerdown', (e) => { e.preventDefault();
            if (e.target === modal) {
                this.sound.click();
                closeModal(false);
            }
        });
    });
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

    // Если дошли сюда – победа
    this.totalWins++;
    this.winStreak++;
    if (this.winStreak > this.maxWinStreak) this.maxWinStreak = this.winStreak;
    this.winsByLevel[this.difficulty] = (this.winsByLevel[this.difficulty] || 0) + 1;

    // Проверяем серии
    this.checkStreak();

    // Проверяем все уровни
    this.checkAllLevels();

    // Если без подсказок
    if (this.hintsUsed === 0) {
        this.noHintWins++;
        this.unlockAchievement('no_hint_win');
        if (this.noHintWins >= 10) this.unlockAchievement('no_hint_10');
    }

    // Идеальная игра
    if (this.gameErrors === 0) {
        this.perfectGame = true;
        this.perfectWins[this.difficulty] = (this.perfectWins[this.difficulty] || 0) + 1;
        this.unlockAchievement(`perfect_${this.difficulty}`);
        // Проверяем все уровни (идеальные)
        if (this.perfectWins.easy > 0 && this.perfectWins.medium > 0 &&
            this.perfectWins.hard > 0 && this.perfectWins.expert > 0) {
            this.unlockAchievement('perfect_all');
        }
    }
    // После блока идеальной игры
this.checkComeback();
this.checkAllChecksUsed();

    // Время (быстрые победы)
    if (this.timer <= 60) {
        this.unlockAchievement('speed_1');
    } else if (this.timer <= 120) {
        this.unlockAchievement('speed_2');
    } else if (this.timer <= 180) {
        this.unlockAchievement('speed_3');
    } else if (this.timer <= 300) {
        this.unlockAchievement('speed_5');
    }

    // Время (обычные)
    if (this.timer <= 600) this.unlockAchievement('time_10min');
    if (this.timer <= 1200) this.unlockAchievement('time_20min');
    if (this.timer <= 1800) this.unlockAchievement('time_30min');


    this.checkLevelAchievement(this.difficulty);
    this.checkAchievements(); // общая проверка (алмазы, бонусы, подсказки, проверки, цифры)
    this.updateTotalGameTime(this.timer); // добавляем время текущей партии
    this.saveAchievements();
    this.awardDiamondsForWin();
this.showWinEffects();
    return true;
}
    // ============================================================
    // Старт игры
    // ============================================================
    startNewGame() {
         this.hideConfetti();
this.diamondsAwardedForCurrentGame = false;
    this.perfectGame = false;     // <-- добавить
    this.gameErrors = 0;          // <-- добавить
this.consecutiveSameNumber = 0;
this.lastPlacedNumber = 0;
this.sevenCount = 0;
// Подгружаем свежие данные из хранилища (на случай синхронизации между вкладками)
this.loadDiamonds();
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
        this.maxHints = 1;
    } else {
        this.maxHints = 1;
    }

// Внутри startNewGame() после установки difficulty
this.maxChecks = 1;

this.checksUsed = 0;
this.updateSolveButton(); // вернёт исходный вид
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
        hintBtn.innerHTML = '💡✨'; // подсказок нет
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
document.addEventListener('DOMContentLoaded', () => {
    const game = new SudokuGame();
    window.__game = game;
});
document.addEventListener('touchmove', function(event) {
    var target = event.target;
    // Разрешаем скролл, если касание началось внутри модалки или её дочерних элементов
    var modal = document.getElementById('howToPlayModal');
    if (modal && modal.contains(target)) {
        return; // не блокируем
    }
    event.preventDefault();
}, { passive: false });



// Закрыть модалку
function closeThemeModal() {
    document.getElementById('themeModal').style.display = 'none';
}

document.getElementById('closeThemeModal').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    closeThemeModal();
});
document.getElementById('themeModal').addEventListener('pointerdown', function(e) {
    if (e.target === this) {
        e.preventDefault();
        closeThemeModal();
    }
});

// Переключение тем
document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
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