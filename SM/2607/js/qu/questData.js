// ============================================================
//  QUEST DATA  – все циклы и задания 
// ============================================================
const QUEST_CYCLES = [
    {
        id: 0,
        nameKey: 'quest_cycle_0_name', //локализация
        startUnlocked: true,
        unlockCondition: null,
        quests: [
         {id: 0,  nameKey: 'quest_0_0_name',  //локализация
                rewards: {
                    items: [
                        { typeIndex: 3, level: 4, count: 1 },
                         { typeIndex: 4, level: 1, count: 1 },
                          { typeIndex: 5, level: 1, count: 1 }
                    ],
                    exp: 3
                },
                cost: 1,
                condition: { type: 'trigger', name: 'first_3lvl_merge' },
                interior: {
                    id: 'door_fixed',
                    action: 'remove',
                    position: { left: '50%', top: '50%' }   // ← точные проценты
                }
            },
         { id: 1, nameKey: 'quest_0_1_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 5, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'door2_fixed',
                    action: 'remove',
                    position: { left: '50%', top: '50%' }
                }
            },
         { id: 2, nameKey: 'quest_0_2_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'stenaC_fixed',
                    action: 'remove',
                    position: { left: '60%', top: '40%' }
                }
            },
       { id: 3, nameKey: 'quest_0_3_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'stenaR_fixed',
                    action: 'remove',
                    position: { left: '75%', top: '40%' }
                }
            },
          { id: 4, nameKey: 'quest_0_4_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'okno_fixed',
                    action: 'remove',
                    position: { left: '28%', top: '20%' }
                }
            },
             { id: 5, nameKey: 'quest_0_5_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'okno2_fixed',
                    action: 'remove',
                    position: { left: '35%', top: '40%' }
                }
            },
              { id: 6, nameKey: 'quest_0_6_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'stenaL_fixed',
                    action: 'remove',
                    position: { left: '25%', top: '50%' }
                }
            },
            { id: 7, nameKey: 'quest_0_7_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: 'kamin_fixed',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                }
            },
            // можно добавить третий квест, чтобы увидеть три кнопки
        ]
    }
];

window.QUEST_CYCLES = QUEST_CYCLES;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QUEST_CYCLES };
}