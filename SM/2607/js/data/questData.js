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
                },
                   dialogue: {
                    steps: [
                             { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_0_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_0_2' }
                    ]
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
                },
               dialogue: {
                    steps: [
                             { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_1_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_1_2' }
                    ]
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
                    position: { left: '70%', top: '30%' }
                },
                dialogue: {
                    steps: [
                             { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_2_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_2_2' }
                    ]
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
                },
                dialogue: {
                    steps: [
                             { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_3_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_3_2' }
                    ]
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
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_4_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_4_2' }
                    ]
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
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_5_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_5_2' }
                    ]
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
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_6_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_6_2' }
                    ]
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
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_7_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_7_2' }
                    ]
                }
            },
                        { id: 8, nameKey: 'quest_0_8_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_8_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_8_2' }
                    ]
                }
            },
                        { id: 9, nameKey: 'quest_0_9_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_9_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_9_2' }
                    ]
                }
            },
                        { id: 10, nameKey: 'quest_0_10_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_10_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_10_2' }
                    ]
                }
            },
                                    { id: 11, nameKey: 'quest_0_11_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_11_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_11_2' }
                    ]
                }
            },
                                    { id: 12, nameKey: 'quest_0_12_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_12_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_12_2' }
                    ]
                }
            },
                { id: 13, nameKey: 'quest_0_13_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_13_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_13_2' }
                    ]
                }
            },
                { id: 14, nameKey: 'quest_0_14_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_14_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_14_2' }
                    ]
                }
            },
               { id: 15, nameKey: 'quest_0_15_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_15_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_15_2' }
                    ]
                }
            },
                { id: 16, nameKey: 'quest_0_16_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_16_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_16_2' }
                    ]
                }
            },
                                    { id: 17, nameKey: 'quest_0_17_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_17_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_17_2' }
                    ]
                }
            },
                                    { id: 18, nameKey: 'quest_0_18_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_18_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_18_2' }
                    ]
                }
            },
                { id: 19, nameKey: 'quest_0_19_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_19_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_19_2' }
                    ]
                }
            },
                { id: 20, nameKey: 'quest_0_20_name',
                rewards: {
                    items: [
                        { typeIndex: 4, level: 1, count: 1 },
                        { typeIndex: 3, level: 1, count: 1 },
                    ],
                    exp: 10
                },
                cost: 2,
                interior: {
                    id: '',
                    action: 'remove',
                    position: { left: '45%', top: '70%' }
                },
                dialogue: {
                    steps: [
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_20_1' },
                            { chara: 'gg2.png', side: 'left', textKey: 'Qd_0_20_2' }
                    ]
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