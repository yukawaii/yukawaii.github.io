// ============================================================
//  SCENE CONFIG – настройки для разных сцен/уровней
//  sceneId: 0, 1, 2, ...       Заказы могут быть упрощенно:  orders: { maxActive: 3, allowedTypes: [1, 2, 3, 5]} 
// тогда Уровень генерируется случайно от 1 до min(maxLevel[тип], maxSpawnLevel).

const SCENE_CONFIGS = {
    0: { boardId: 'stroika',   // ← идентификатор доски (общая для сцен 0 и 2)
        availableTypes: [3,4,5,11],
        maxMergeLevel: 10, 
        unlockLevel: 0,
             orders: { allowedTypes: [3,4,5,11,10,9,7,6]   // только типы, уровни вычисляются автоматически
        },
          
        questCycleIds: [0],              // ID циклов заданий, относящихся к этой сцене
        completionDialogueId: 'scene_complete', // ID диалога после выполнения всех заданий
        nextSceneId: 1,                  // ID следующей сцены (пока не реализовано)
        initialInteriors: ['stenaL_fixed', 'stenaR_fixed', 'stenaC_fixed', 'kamin_fixed', 'pol_fixed','door2_fixed',  'okno2_fixed', 'door_fixed', 'okno_fixed','list_fixed',],
        dialogues: [
            {   id: 'intro',
                trigger: 'scene_start',   // срабатывает при старте игры
                auto: true,               // переключиться на диалог автоматически
                steps: [
                    { chara: 'gg1.png', side: 'left', textKey: ['dlg_0','dlg_1','dlg_2', 'dlg_3' ]},
                ]
            },   
            {   id: 'first_order',
                trigger: 'order_completed',
                condition: (game) => game.score >= 10,
                auto: false,              // не переключать автоматически   // будет ждать, пока игрок переключится на строительную сцену
                steps: [
                    { chara: 'gg1.png', side: 'right', textKey: 'dlg_first_order' }
                ]
            },
            {   id: 'score_50',
                trigger: 'score_reached',
                condition: (game) => game.score >= 50,
                auto: false,
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

function getCurrentSceneConfig() {
    return getSceneConfig(currentSceneId);
}

function setCurrentScene(sceneId) {
    if (SCENE_CONFIGS[sceneId] !== undefined) {
        currentSceneId = sceneId;
        return true;
    }
    return false;
}


window.SCENE_CONFIGS = SCENE_CONFIGS;
window.currentSceneId = currentSceneId;
window.getSceneConfig = getSceneConfig;
window.getCurrentSceneConfig = getCurrentSceneConfig;
window.setCurrentScene = setCurrentScene;
