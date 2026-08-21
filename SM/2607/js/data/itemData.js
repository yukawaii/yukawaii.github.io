// ============================================================
//  ЕДИНЫЙ МАССИВ ДАННЫХ О ВСЕХ ПРЕДМЕТАХ
// ============================================================

const ITEM_DATA = [
    {id: 0, name: 'kartoha', categoryKey: 'category_products',
        displayName: { ru: 'Картошка', en: 'Potato', tr: 'Patates' },
        levelNames: {
            1: { ru: 'Картошка', en: 'Potato', tr: 'Patates' },
            2: { ru: 'Две картошки', en: 'Potato', tr: 'Patates' },
            3: { ru: 'Корзинка картохи', en: '', tr: '' }
        },
        initialLevel: 1,
        spawnable: true,
        spawnLevels: [3],
        // Новый формат: на уровне 3 выдаём картошку уровней 1 и 2
        spawnRules: {
            3: {
                types: [
                    { type: 0, level: 1, weight: 90 },
                    { type: 0, level: 2, weight: 10 }
                ]
            }
        },
        specialCombinations: []
    },
    {id: 1, name: 'perec', categoryKey: 'category_products',
        displayName: { ru: 'Перец', en: 'Pepper', tr: 'Biber' },
        levelNames: {
            1: { ru: 'Перец острый', en: '', tr: '' },
            2: { ru: 'Два перчика', en: '', tr: '' },
            3: { ru: 'Куча перца', en: '', tr: '' }
        },
        initialLevel: 1,
        spawnable: false,
        spawnLevels: [],
        spawnRules: null,
        specialCombinations: []
    },
    {id: 2,   name: 'petrushka',  categoryKey: 'category_products',
        displayName: { ru: 'Петрушка', en: 'Parsley', tr: 'Maydanoz' },
        levelNames: {
            1: { ru: 'Немного петрушки', en: '', tr: '' },
            2: { ru: 'Петрушка', en: '', tr: '' },
            3: { ru: 'Пучок петрушки', en: '', tr: '' }
        },
        initialLevel: 1,
        spawnable: false,
        spawnLevels: [],
        spawnRules: null,
        specialCombinations: []
    },
    { id: 3, name: 'shetka', categoryKey: 'category_tools',
        displayName: { ru: 'Щётка', en: '', tr: '' },
        levelNames: {
            1: { ru: 'Тряпочка', en: '', tr: '' },
            2: { ru: 'Мочалка', en: '', tr: '' },
            3: { ru: 'Хлипкая щётка', en: '', tr: '' },
            4: { ru: 'Щётка', en: '', tr: '' },
            5: { ru: 'Веник', en: '', tr: '' },
            6: { ru: 'Метла', en: '', tr: '' },
            7: { ru: 'Пылесборник', en: '', tr: '' },
            8: { ru: 'Мини-пылесос', en: '', tr: '' },
            9: { ru: 'Старый пылесос', en: '', tr: '' },
            10: { ru: 'Слабый пылесос', en: '', tr: '' },
            11: { ru: 'Пылесос', en: '', tr: '' },
            12: { ru: 'Пылесос', en: '', tr: '' },
            13: { ru: 'Мощный пылесос', en: '', tr: '' },
        },

        initialLevel: 1,
        spawnable: true,
        spawnLevels: [4, 8],
        spawnRules: {
            4: {
                types: [
                    { type: 3, level: 1, weight: 85 },
                    { type: 3, level: 2, weight: 5 },                
                    { type: 4, level: 1, weight: 5 },
                    { type: 5, level: 1, weight: 5 },                    
                ],  // infinite: true
            },
            8: {
                types: [
                    { type: 5, level: 1, weight: 40 },
                    { type: 3, level: 1, weight: 10 },
                    { type: 4, level: 1, weight: 30 },
                    { type: 6, level: 2, weight: 10 },
                     { type: 7, level: 2, weight: 10 }
                ]
            }
        },
        specialCombinations: []
    },
    { id: 4,    name: 'vedro', categoryKey: 'category_tools',
        displayName: { ru: 'Ведро', en: 'Bucket', tr: 'Kova' },
        levelNames: {
            1: { ru: 'Дырявая лейка', en: '', tr: '' },
            2: { ru: 'Пустое ведро', en: '', tr: '' },
            3: { ru: 'Ведро с водой', en: '', tr: '' },
            4: { ru: 'Кадка', en: '', tr: '' },
            5: { ru: 'Ведро с пеной', en: '', tr: '' },
            6: { ru: 'Бадья', en: '', tr: '' },
            7: { ru: 'Стиральная доска', en: '', tr: '' },
            8: { ru: 'Куча белья', en: '', tr: '' },
             9: { ru: 'Корзина белья', en: '', tr: '' },
            10: { ru: 'Простая стиралка', en: '', tr: '' },
            11: { ru: 'Мини-стиралка', en: '', tr: '' },
            12: { ru: 'Сушилка', en: '', tr: '' },
            13: { ru: 'Стиральная машина', en: '', tr: '' },
            14: { ru: 'Стиральная машина', en: '', tr: '' },
                   },
        initialLevel: 1,
        spawnable: false,
        spawnLevels: [6],
       spawnRules:  {5: { types: [
                    { type: 4, level: 1, weight: 60 },
                    { type: 10, level: 2, weight: 30 },
                   { type: 3, level: 1, weight: 5 }, 
                    { type: 7, level: 1, weight: 5 }, 
                  ]  },
                },
        specialCombinations: [] 

    },
    { id: 5,    name: 'gaech', categoryKey: 'category_tools',
        displayName: { ru: 'Гаечный ключ', en: 'Wrench', tr: 'Anahtar' },
        levelNames: {
            1: { ru: 'Хлипкий гвоздь', en: '', tr: '' },
            2: { ru: 'Шуруп', en: '', tr: '' },
            3: { ru: 'Шило', en: '', tr: '' },
            4: { ru: 'Открывашка', en: '', tr: '' },
            5: { ru: 'Гаечный ключ', en: '', tr: '' },
            6: { ru: 'Кусачки', en: '', tr: '' },
            7: { ru: 'Плоскогубцы', en: '', tr: '' },
            8: { ru: 'Ручная дрель', en: '', tr: '' },
            9: { ru: 'Шуруповёрт', en: '', tr: '' },
            10: { ru: 'Перфоратор', en: '', tr: '' }
        },
        initialLevel: 1,
        spawnable: true,
        spawnLevels: [5],
        spawnRules:  {5: { types: [
                    { type: 5, level: 1, weight: 80 },
                    { type: 5, level: 2, weight: 10 },
                   { type: 4, level: 1, weight: 10 }, //лейка
                  ]  },
                },
        specialCombinations: []
    },
    { id: 6,  name: 'shetkaVedro', categoryKey: 'category_tools',
        displayName: { ru: 'Щётка и ведро', en: 'Brush&Bucket', tr: 'Fırça&Kova' },
        levelNames: {
            2: { ru: 'Щётка с ведром', en: '', tr: '' },
            3: { ru: 'Увлажнитель воздуха', en: '', tr: '' },           
        },
        initialLevel: 5,
        spawnable: true,
        spawnLevels: [5],
        // Для каждого уровня спауна задаём одинаковый набор типов (можно было бы и разные)
        spawnRules: {
            2: {
                types: [
                    { type: 4, level: 2, weight: 9 },{ type: 4, level: 3, weight: 1 },
                    { type: 4, level: 1, weight: 40 },
                    { type: 3, level: 1, weight: 30 },
                    { type: 3, level: 2, weight: 9 },  { type: 3, level: 3, weight: 1 }
                ]
            },
            3: {
                types: [
                    { type: 4, level: 3, weight: 20 },
                    { type: 4, level: 1, weight: 60 },
                    { type: 5, level: 2, weight: 30 }, //шурупы
                  //  { type: 3, level: 2, weight: 10 }
                ]
            },
        
        },
        specialCombinations: [
            [4, 3, 3, 4, 6, 2]
        ]
    },

    { id: 7,  name: 'milo', categoryKey: 'category_tools',
        displayName: { ru: 'Мыло', en: '', tr: '' },
        levelNames: {
            2: { ru: 'Мыльная пена', en: '', tr: '' },
            3: { ru: 'Остатки мыла', en: '', tr: '' },
            4: { ru: 'Мыло', en: '', tr: '' },
            5: { ru: 'Сода', en: '', tr: '' },
            6: { ru: 'Отбеливатель', en: '', tr: '' },
            7: { ru: 'Пульверизатор', en: '', tr: '' },
             8: { ru: 'Освежитель', en: '', tr: '' },
             9: { ru: 'Пятновыводитель', en: '', tr: '' },
             10: { ru: 'Ополаскиватель', en: '', tr: '' },
        },
        initialLevel: 2,
        spawnable: true,
        spawnLevels: [9,10],
        spawnRules:  {9: {
                types: [
                    { type: 7, level: 1, weight: 60 },
                    { type: 7, level: 2, weight: 33 },
                 //   { type: 8, level: 3, weight: 3 }, 
                  { type: 3, level: 1, weight: 7 }, //тряпочка
                  ]  },
                  10: {
                types: [
                    { type: 7, level: 1, weight: 60 },
                    { type: 7, level: 2, weight: 33 },
                 //   { type: 8, level: 3, weight: 3 }, 
                  { type: 3, level: 1, weight: 7 }, //тряпочка
                  ]  },
                
                },
        specialCombinations: []
    },
     { id: 8, name: 'battery', categoryKey: 'category_special',
        displayName: { ru: 'Батарейка', en: 'Battery', tr: 'Pil' },
        levelNames: { 2: { ru: 'Батарейка', en: 'Battery', tr: 'Pil' }     },
        initialLevel: 2,     spawnable: false,  spawnLevels: [], spawnRules: null,
        specialCombinations: []
    },
         { id: 9, name: 'gaika', categoryKey: 'category_tools',
        displayName: { ru: 'Гайка', en: '', tr: '' },
        levelNames: { 2: { ru: 'Гайка', en: '', tr: '' },
     3: { ru: 'Отвёртка', en: '', tr: '' }  ,
     4: { ru: 'Молоток', en: '', tr: '' } , 
     5: { ru: 'Кувалда', en: '', tr: '' } , 
     6: { ru: 'Топор', en: '', tr: '' } ,  
     7: { ru: ' ', en: '', tr: '' } ,  
     8: { ru: 'Тонкая пила', en: '', tr: '' } ,  
     9: { ru: 'Пила', en: '', tr: '' } , 
     10: { ru: 'Лезвие', en: '', tr: '' } , 
     11: { ru: 'Электропила', en: '', tr: '' } ,    },
        initialLevel: 2,     spawnable: false,  spawnLevels: [], 
        spawnRules: null,
        specialCombinations: []
    },
        { id: 10, name: 'gubka', categoryKey: 'category_tools',
        displayName: { ru: 'Губка', en: '', tr: '' },
        levelNames: {
            2: { ru: 'Пучок мха', en: '', tr: '' },
            3: { ru: 'Губка из травы', en: '', tr: '' },
            4: { ru: 'Микрофибра', en: '', tr: '' },
            5: { ru: 'Хвойная губка', en: '', tr: '' },
            6: { ru: ' ', en: '', tr: '' },
            7: { ru: ' ', en: '', tr: '' },
            8: { ru: ' ', en: '', tr: '' },
             9: { ru: ' ', en: '', tr: '' }
        },  initialLevel: 1,     spawnable: false,  spawnLevels: [], 
        spawnRules: null,
        specialCombinations: []
    },
           { id: 11, name: 'lopata', categoryKey: 'category_tools',
        displayName: { ru: 'Лопата', en: '', tr: '' },
        levelNames: {
            1: { ru: 'Палка-копалка', en: '', tr: '' },
            2: { ru: 'Хлипкий скребок', en: '', tr: '' },
            3: { ru: 'Скребок', en: '', tr: '' },
            4: { ru: 'Совок', en: '', tr: '' },
            5: { ru: 'Лопатка', en: '', tr: '' },
            6: { ru: 'Острая лопата', en: '', tr: '' },
            7: { ru: 'Мотыга', en: '', tr: '' },
            8: { ru: 'Кирка', en: '', tr: '' },
            9: { ru: 'Серп', en: '', tr: '' },
            10: { ru: 'Грабли', en: '', tr: '' }
        }, initialLevel: 1,     spawnable: true,  spawnLevels: [5,8], 
        spawnRules:  {8: { types: [
                    { type: 11, level: 1, weight: 60 },
                    { type: 9, level: 2, weight: 37 }, //гайка
                   { type: 5, level: 1, weight: 3 }, 
                  ]  },
                  5: { types: [
                    { type: 11, level: 1, weight: 60 },
                    { type: 9, level: 2, weight: 3}, //гайка
                   { type: 5, level: 1, weight: 37 }, 
                  ]  },
                },
    },
    { id: 15,  name: 'kapusta', categoryKey: 'category_products',
        displayName: { ru: 'Капуста', en: 'Cabbage', tr: 'Lahana' },
        levelNames: {},
        initialLevel: 1,
        spawnable: false,
        spawnLevels: [],
        spawnRules: null,
        specialCombinations: []
    },
    
    
];

// ---- НОВАЯ ФУНКЦИЯ: вычисление максимального уровня для каждого типа ----
function getMaxLevelsForItems() {
    const maxLevels = new Array(ITEM_DATA.length).fill(0);
    for (let i = 0; i < ITEM_DATA.length; i++) {
        const item = ITEM_DATA[i];
        if (!item) continue; // ← защита от undefined
        const levels = new Set();
        if (item.initialLevel !== undefined) {
            levels.add(item.initialLevel);
        }
        if (item.levelNames) {
            for (const key of Object.keys(item.levelNames)) {
                const lv = parseInt(key, 10);
                if (!isNaN(lv)) levels.add(lv);
            }
        }
        if (item.spawnRules) {
            for (const key of Object.keys(item.spawnRules)) {
                const lv = parseInt(key, 10);
                if (!isNaN(lv)) levels.add(lv);
            }
        }
        if (levels.size === 0) levels.add(1);
        const max = Math.max(...levels);
        maxLevels[item.id] = max;
    }
    return maxLevels;
}


// Глобальные объекты
window.ITEM_DATA = ITEM_DATA;
window.getMaxLevelsForItems = getMaxLevelsForItems;

// Экспорт для модулей (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ITEM_DATA };
}