// ============================================================
//  EVENT DATA  – настройки ивентов, активный ивент
// ============================================================

const EVENT_CONFIGS = [
    {
        id: 'halloween',
        name: {            ru: 'Хэллоуин',            en: 'Halloween',            tr: 'Cadılar Bayramı'        },
        startDate: '2026-10-01T00:00:00',   // ISO строка
        durationDays: 7,
        reward: {
            score: 10,
            // можно добавить предметы
        },
        boardSettings: {
            initialOpenSide: 'bottom',      // 'top', 'bottom', 'left', 'right'
            initialOpenCount: 5,
            levelsDistribution: [
                { distance: 1, minLevel: 2, maxLevel: 3 },
                { distance: 2, minLevel: 3, maxLevel: 6 },
                { distance: 3, minLevel: 4, maxLevel: 8 },
                { distance: 4, minLevel: 5, maxLevel: 15 }
            ]
        },
        maxLevel: 15                        // максимальный уровень предмета ивента
    }
    // можно добавить другие ивенты
];

/**
 * Возвращает активный ивент (по дате) или null
 */
function getActiveEvent() {
    const now = Date.now();
    for (const cfg of EVENT_CONFIGS) {
        const start = new Date(cfg.startDate).getTime();
        const end = start + cfg.durationDays * 24 * 60 * 60 * 1000;
        if (now >= start && now <= end) {
            return cfg;
        }
    }
    return null;
}

/**
 * Возвращает конфиг по id
 */
function getEventConfig(id) {
    return EVENT_CONFIGS.find(cfg => cfg.id === id) || null;
}

// Глобальный доступ
window.EVENT_CONFIGS = EVENT_CONFIGS;
window.getActiveEvent = getActiveEvent;
window.getEventConfig = getEventConfig;