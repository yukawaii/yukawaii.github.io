// ============================================================
//  EVENT DATA  – настройки ивентов, активный ивент
// ============================================================

// ---- МАССИВ ПРЕДМЕТОВ ДЛЯ ИВЕНТОВ (аналог ITEM_DATA) ----
const EVENT_ITEM_DATA = [
    {
        id: 0,
        name: 'halloween',          // имя соответствует спрайтам items/events/halloween1.png и т.д.
        categoryKey: 'category_events',
        displayName: {  ru: 'Капибара',    en: '',      tr: ''        },
        levelNames: {
            1: { ru: 'Капибара', en: '', tr: '' },
            2: { ru: 'Капибара и сова', en: '', tr: '' },
            3: { ru: 'Капибара с косой', en: '', tr: '' },
            4: { ru: 'Капибара и коробка', en: '', tr: '' },
            5: { ru: 'Капибара и конфеты', en: '', tr: '' },
            6: { ru: 'Капибара на метле', en: '', tr: '' },
            7: { ru: 'Капибара и котик', en: '', tr: '' },
            8: { ru: 'Капибара и свеча', en: '', tr: '' },
            9: { ru: 'Капибара Бу!', en: '', tr: '' },
            10: { ru: 'Капибара и попкорн', en: '', tr: '' },
            11: { ru: 'Капибара и алмаз', en: '', tr: '' },
            12: { ru: 'Капибара и мороженое', en: '', tr: '' },
            13: { ru: 'Капибара и паук', en: '', tr: '' },
            14: { ru: 'Капибара и шарик', en: '', tr: '' },
            15: { ru: 'Капибара и блокнот', en: '', tr: '' }, 
            16: { ru: 'Капибара и палочка', en: '', tr: '' }, 
            17: { ru: 'Капибара и паук', en: '', tr: '' }, 
            18: { ru: 'Капибара и торт', en: '', tr: '' }, 
            19: { ru: 'Капибара с косой', en: '', tr: '' }, 
            20: { ru: 'Капибара и гримуар', en: '', tr: '' }, 
        },
        initialLevel: 1,  spawnable: true, spawnLevels: [15, 20],
        spawnRules: {
            15: {types: [{ type: 0, level: 1, weight: 55 },    
                    { type: 0, level: 2, weight: 45 },
                    // можно также добавлять другие типы, если есть (например, 1,2...)
                ],
                // infinite: true // если нужен бесконечный генератор
            } ,
             20: { types: [ { type: 0, level: 1, weight: 50 },    
                    { type: 0, level: 2, weight: 45 },
                    { type: 0, level: 3, weight: 5 },             
                ],
                infinite: true // если нужен бесконечный генератор
            }                     
        },
        specialCombinations: []
    }, 
    // можно добавить другие ивентовые предметы с id 1, 2, ...
];

// ---- НАСТРОЙКИ ИВЕНТОВ (без изменений) ----
const EVENT_CONFIGS = [
    {
        id: 'halloween',
        name: {
            ru: 'Хэллоуин',
            en: 'Halloween',
            tr: 'Cadılar Bayramı'
        },
           frameName: 'ramka1', 
        //старт сегодня new Date().toISOString().split('T')[0] + 'T00:00:00',
         EventStart: { month: 8, day: 18 },  // 18 августа
       
        durationDays: 30,
              reward: { score: 100 },
        boardSettings: {
            initialOpenSide: 'bottom',
            initialOpenCount: 5,
            levelsDistribution: [
                { distance: 1, minLevel: 1, maxLevel: 3 },
                { distance: 2, minLevel: 3, maxLevel: 6 },
                { distance: 3, minLevel: 4, maxLevel: 10 },
                { distance: 4, minLevel: 5, maxLevel: 15 }
            ]
        },
        maxLevel: 20,
        atlasPrefix: 'halloween',   // используется для формирования пути к спрайтам
           giftCooldownHours: 0.01   // ★ ДОБАВИТЬ ЭТУ СТРОКУ (0.01 часа = 36 секунд)
    }
];

function getEventItemData() {
    return EVENT_ITEM_DATA;
}

function getEventItemById(id) {
    return EVENT_ITEM_DATA.find(item => item.id === id) || null;
}

function getActiveEvent() {
    const now = Date.now();
    for (const cfg of EVENT_CONFIGS) {
        if (!cfg.EventStart) continue; // если нет правила – пропускаем
        const start = getEventStartDate(cfg).getTime();
        const end = start + cfg.durationDays * 24 * 60 * 60 * 1000;
        if (now >= start && now <= end) {
            // Возвращаем конфиг с добавленными вычисленными полями
            return {
                ...cfg,
                _start: start,
                _end: end,
            };
        }
    }
    return null;
}

function getEventConfig(id) {
    return EVENT_CONFIGS.find(cfg => cfg.id === id) || null;
}

function getEventStartDate(cfg) {
    const now = new Date();
    const year = now.getFullYear();
    // Дата 18 августа текущего года
    const start = new Date(year, cfg.EventStart.month - 1, cfg.EventStart.day);
    // Если сегодня позже 18 августа, то старт уже был – оставляем этот год.
    // Если сегодня раньше 18 августа, то старт ещё не наступил – тоже этот год.
    // Но если мы хотим, чтобы ивент был активен только после 18 августа,
    // то условие now >= start определит активность.
    return start;
}

window.EVENT_CONFIGS = EVENT_CONFIGS;
window.getActiveEvent = getActiveEvent;
window.getEventConfig = getEventConfig;
window.EVENT_ITEM_DATA = EVENT_ITEM_DATA;
window.getEventItemData = getEventItemData;
window.getEventItemById = getEventItemById;