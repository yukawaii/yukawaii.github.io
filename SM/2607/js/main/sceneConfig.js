// ============================================================
//  SCENE CONFIG – настройки для разных сцен/уровней
//  sceneId: 0, 1, 2, ...       Заказы могут быть упрощенно:  orders: { maxActive: 3, allowedTypes: [1, 2, 3, 5]} 
// тогда Уровень генерируется случайно от 1 до min(maxLevel[тип], maxSpawnLevel).

const SCENE_CONFIGS = {
    0: {
        availableTypes: [3,4,5,11],
      //  maxSpawnLevel: 5,  максимальный уровень заказов, если не заданы в ордерс. Тут заданы
        maxMergeLevel: 10, 
        unlockLevel: 0,
        orders: { allowedTypes: [
          { type: 3, levels: [3,4,5,6,7,9,10,11] },
          { type: 4, levels: [3,4,5,6,7,9,10,11] },
          { type: 5, levels: [3,4,5,6,7,9,10,11] },
          { type: 11, levels: [3,4,5,6,7,9,10,11] },

           { type: 10, levels: [3,4,5,6,7,9,10,11] },
            { type: 9, levels: [3,4,5,6,7,9,10,11] },
            { type: 7, levels: [3,4,5,6,7,9,10,11] },
            { type: 6, levels: [3,4,5,6,7,9,10,11] },
  ] },

        questCycleIds: [0],              // ID циклов заданий, относящихся к этой сцене
        completionDialogueId: 'scene_complete', // ID диалога после выполнения всех заданий
        nextSceneId: 1,                  // ID следующей сцены (пока не реализовано)
        initialInteriors: ['stenaL_fixed', 'stenaR_fixed', 'stenaC_fixed', 'kamin_fixed', 'pol_fixed','door2_fixed',  'okno2_fixed', 'door_fixed', 'okno_fixed','list_fixed',],
        dialogues: [
            {   id: 'intro',
                trigger: 'scene_start',   // срабатывает при старте игры
                auto: true,               // переключиться на диалог автоматически
                delayed: false,
                steps: [
                    { chara: 'gg1.png', side: 'left', textKey: ['dlg_0','dlg_1','dlg_2', 'dlg_3' ]},
                ]
            },
            {   id: 'first_order',
                trigger: 'order_completed',
                condition: (game) => game.score >= 10,
                auto: false,              // не переключать автоматически
                delayed: true,            // будет ждать, пока игрок переключится на строительную сцену
                steps: [
                    { chara: 'gg1.png', side: 'right', textKey: 'dlg_first_order' }
                ]
            },
            {   id: 'score_50',
                trigger: 'score_reached',
                condition: (game) => game.score >= 50,
                auto: false,
                delayed: true,
                steps: [
                    { chara: 'gg1.png', side: 'left', textKey: 'dlg_score_50' }
                ]
            }
        ]
    },
    // другие сцены...
};

let currentSceneId = 0;

function getSceneConfig(sceneId) {
    return SCENE_CONFIGS[sceneId] || SCENE_CONFIGS[0];
}

function setCurrentScene(sceneId) {
    if (SCENE_CONFIGS[sceneId]) {
        currentSceneId = sceneId;
        return true;
    }
    return false;
}

function getCurrentSceneConfig() {
    return getSceneConfig(currentSceneId);
}

// Опционально: корректировка настроек в зависимости от уровня игрока
function adjustConfigByPlayerLevel(config, playerLevel) {
    const adjusted = { ...config };
    // Пример: если игрок достиг 5 уровня, добавляем новые типы
    if (playerLevel >= 5) {
        adjusted.availableTypes = [...config.availableTypes, 6, 7];
        adjusted.maxSpawnLevel = Math.max(config.maxSpawnLevel, 2);
    }
    // Можно добавить другие правила
    return adjusted;
}