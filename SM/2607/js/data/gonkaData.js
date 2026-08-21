// ============================================================
//  RACE DATA  — настройки гонок, ботов и глобального сезона
// ============================================================

/**
 * Массив конфигураций гонок.
 * Каждая гонка имеет свой глобальный сезон (повторяется каждый год).
 */
const RACE_CONFIGS = [
    {
        id: 0,
        nameKey: 'race_name_0',          // ключ локализации
        durationHours: 0.1,                // длительность одной гонки (в часах)
        targetScores: [1, 3, 5],   // этапы

        // ---- Глобальный сезон (повторяется каждый год) ----
        globalStartMonth: 8,             // август (1-12)
        globalStartDay: 18,              // 18 августа
        globalDurationDays: 7,           // длится 7 дней (до 24 августа включительно)
    },
    // Можно добавить другие гонки с другими сезонами:
    // {
    //     id: 1,
    //     nameKey: 'race_name_1',
    //     durationHours: 6,
    //     targetScores: [150, 300, 500],
    //     globalStartMonth: 10,
    //     globalStartDay: 31,
    //     globalDurationDays: 3,
    // },
];

/**
 * Имена ботов (соперников).
 */
const BOT_NAMES = [
    'Алексей', 'Мария', 'Иван', 'Екатерина', 'Дмитрий',
    'Анна', 'Сергей', 'Ольга', 'Андрей', 'Татьяна',
    'Николай', 'Елена', 'Владимир', 'Наталья', 'Михаил',
    'Ирина', 'Василий', 'Светлана', 'Петр', 'Кристина',
    'Галина', 'Евгений', 'Зоя', 'Игорь', 'Людмила',
    'Максим', 'Надежда', 'Олег', 'Полина', 'Роман',
    'Снежана', 'Тимофей', 'Ульяна', 'Фёдор', 'Юлия',
];

/**
 * Профили ботов (архетипы) с параметрами.
 */
const BOT_PROFILES = {
    sprinter: {
        speedCurve: (progress) => 1.8 - progress * 1.5,
        baseSpeed: 1.2,
        burstChance: 0.3,
        burstMultiplier: 1.6,
    },
    steady: {
        speedCurve: (progress) => 0.8 + 0.2 * progress,
        baseSpeed: 0.9,
        burstChance: 0.1,
        burstMultiplier: 1.3,
    },
    late: {
        speedCurve: (progress) => {
            if (progress < 0.7) return 0.3 + 0.2 * (progress / 0.7);
            else return 0.5 + 2.0 * ((progress - 0.7) / 0.3);
        },
        baseSpeed: 0.8,
        burstChance: 0.2,
        burstMultiplier: 2.0,
    },
};

/**
 * Дневной ритм (активность по часам).
 */
const DAY_CYCLE = {
    speedMultiplierByHour: (hour) => {
        if (hour >= 23 || hour < 7) return 0.2;
        if (hour < 12) return 0.4 + 0.6 * ((hour - 7) / 5);
        if (hour < 18) return 1.0;
        return 1.0 + 0.5 * ((hour - 18) / 5);
    },
};

// Экспортируем
window.RACE_CONFIGS = RACE_CONFIGS;
window.BOT_NAMES = BOT_NAMES;
window.BOT_PROFILES = BOT_PROFILES;
window.DAY_CYCLE = DAY_CYCLE;