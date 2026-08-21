// ============================================================
//  LOCALIZATION DATA  (ru, en, tr) — только диалоги и система
// ============================================================

const LOCALE_DATA = {
    ru: {
        race_name_0: 'Гонка за листьями',
        race_season_ended_title: 'Сезон завершён',
race_season_ended_text: 'Этот ивент закончился. Но скоро следующий!',
race_start_new: 'Новая гонка',
//Названия циклов квестов
        quest_cycle_0_name: 'Уборка дома',
        quest_cycle_1_name: 'Уборка кухни',
//Названия (задание, что надо сделать) отдельных квестов
        quest_0_0_name: 'Убрать доски с двери',
        quest_0_1_name: 'Помыть дверь',
        quest_0_2_name: 'Помыть стену',
        quest_0_3_name: 'Помыть правую стену',
        quest_0_4_name: 'Убрать доски',
        quest_0_5_name: 'Помыть окно',
        quest_0_6_name: 'Помыть левую стену',
        quest_0_7_name: 'Помыть камин',
        quest_0_8_name: 'Убрать листья',
        quest_0_9_name: 'Помыть пол',
          quest_0_10_name: 'Помыть пол',
            quest_0_11_name: 'Помыть пол',
              quest_0_12_name: 'Помыть пол',
                quest_0_13_name: 'Помыть пол',
                  quest_0_14_name: 'Помыть пол',
                    quest_0_15_name: 'Помыть пол',
                      quest_0_16_name: 'Помыть пол',
                        quest_0_17_name: 'Помыть пол',
                          quest_0_18_name: 'Помыть пол',
                            quest_0_19_name: 'Помыть пол',
                              quest_0_20_name: 'Помыть пол',

        quest_1_0_name: '  ',

// Квестовые диалоги (после выполненного квеста)
        Qd_0_0_1: 'Уф, доски держались так крепко! Пригодятся в качестве дров для растопки печи.',
        Qd_0_0_2: 'Теперь я смогу помыть дверь, а заодно и согреться.',
        Qd_0_1_1: 'Ведро с водой, тряпка — и дверь как новая. ',
        Qd_0_1_2: 'Грязь была такая, будто тут медведь носом скрёб!',
        Qd_0_2_1: 'Чистота — это магия. Вот была стена в пятнах, а теперь сияет. ',
        Qd_0_2_2: 'Хорошо бы и во всех делах так же быстро наводился порядок!',
        Qd_0_3_1: 'Вот это слой грязи! Тут, наверное, целая история леса записана. ',
        Qd_0_3_2: 'Но я её смываю, пора писать новую главу.',
        Qd_0_4_1: 'Свет! Наконец-то солнечный зайчик заглянул в дупло. ',
        Qd_0_4_2: 'Теперь не буду спотыкаться о собственный хвост в темноте.',
        Qd_0_5_1: 'Окно блестит, как мороженое в солнечный день! Теперь лес видно до самой речки. Красота!',
        Qd_0_5_2: 'Чистое окно — как открытая книга. Только вместо букв — белки и птички. Люблю свой лес!',
        Qd_0_6_1: 'Ещё одна стена готова! Чувствую себя художником, только вместо краски — мыльная пена.',
        Qd_0_6_2: 'Поскорее бы закончить с уборкой и заняться ужином!',
        Qd_0_7_1: 'Камин вымыт! Сажа сдалась без боя, хотя и пыталась въесться в шерсть.',
        Qd_0_7_2: 'Хорошо, что я котёнок, а не снежок — а то растаял бы от усердия.',
        Qd_0_8_1: '',
        Qd_0_8_2: '',
        Qd_0_9_1: '',
        Qd_0_9_2: '',
        Qd_0_10_1: '',
        Qd_0_10_2: '',
        Qd_0_11_1: '',
        Qd_0_11_2: '',
//диалоги основного сюжета 
        dlg_0: 'Мяу?.. О, нет! Волшебный ураган разрушил мой домик в дупле дерева!',
        dlg_1: 'Нужно навести порядок и вернуть сюда уют!',
        dlg_2: 'Но как же я это сделаю голыми лапками?',
        dlg_3: 'Сначала нужно добыть всё необходимое для починки и уборки!',


 // Если нужны конкретные имена для отдельных покупателей:
        character_buyer: 'Покупатель', //имя покупателей по умолчанию         
        character_k1: 'Покупатель 1',
        character_k2: 'Покупатель 2',

//Разное , что не надо менять или добавлять
        menu_reset_confirm: 'Сбросить весь прогресс?',
        menu_title: '🍜 Уютные Лапки',
        confirm_delete: 'Вы уверены, что хотите удалить этот предмет?',
        delete: 'Удалить',
        cancel: 'Отмена',
        ok: 'OK',
        can_get_from: 'Можно получить из',
        gives: 'Выдаёт',
        next_level_gives: 'Следующий уровень выдаёт',
        item_can_spawn: 'Нажмите, чтобы получить предмет',
        item_combine: 'Объедините для улучшения',
        settings_title: 'Настройки',
        limit_reached: 'Это предел',
        not_yet: 'Пока не умею',
        reward_ad_title: 'Рулетка',
        reward_ad_prompt: 'Посмотри рекламу и получи случайный предмет!',
        reward_ad_error_title: 'Ошибка',
        reward_ad_error_text: 'Ой, условия не выполнены!',
        game_not_started: 'Ой, игра не запущена!',
        character_gg: 'Котёнок',
        sound_label: 'Звук',
        music_label: 'Птицы',
        hint_title: "Подсказка",
        hint_press_item: "НАЖМИТЕ на предмет",
        gift_title: 'Подарок',
        gift_get: 'Получить',
        gift_text1: 'Гуляя по лесу, ты нашёл что-то полезное!',
        gift_text2: 'Кажется, что-то блестит под старым пнём…',
        gift_text3: 'Приподняв корягу, ты нашёл что-то полезное!',
        gift_text4: 'Под ворохом листьев ты нашёл что-то полезное!',
        help_title: 'Как играть?',
        help_rule1: 'Объединяй одинаковые предметы и создавай предметы получше',
        help_rule2: 'Нажимай на особые предметы, чтобы достать из них ингредиенты',
        help_rule3: 'Перетаскивай предметы на животных, чтобы отдать им их и получить листья',
        help_rule4: 'Ремонтируй свой домик, тратя листья, и получай награды',
        help_rule5: 'Выкладывай награды из корзинки на стол и используй их!',
        on_cooldown: 'Перезарядка',
        collection_title_category: 'Коллекция: {category}',
        collection_empty: 'Пока нет открытых предметов. Создавай новые комбинации!',
        category_tools: 'Инструменты',
        category_products: 'Продукты',
        category_special: 'Разное',
        inventory_title: 'Корзинка',
     
       no_space: 'Нет места',
        no_space_text: 'Расчисти место, чтобы было куда это положить',
        inventory_empty: 'Корзинка пуста',
        to_inventory: 'В корзинку',        
        race_start_title: 'Начать гонку?',
        race_start_desc: 'Вы готовы соревноваться? Гонка длится {hours} часов.',
        race_start: 'Начать',
        race_title: 'Гонка',
        race_player: 'Вы',
        pobeda: 'Победа!',
        konec: 'Конец',
        race_place: 'Место',
        race_fail: 'В этот раз призы ускользнули.',
        loading: 'Загрузка...',
        menu_sub: '~ Кафе Котёнка ~',
        menu_play: 'Играть',
        menu_reset: 'Сброс прогресса',
        menu_footer: '© 2026 · Версия 0.1',
      
        pause_title: '⏸ Пауза',
        pause_text: 'Игра приостановлена',
        pause_resume: 'Продолжить',
        quest_execute: 'Выполнить',
        quest_title: 'Задание',
        quest_rewards: 'Награды',
        prize_sent: 'Награда отправлена в корзинку с припасами!',
play_again: 'Сыграть ещё раз?',
 puzz_name_0: 'Лесные загадки',
    puzz_name_1: 'Морские приключения',
    puzz_level: 'Уровень',
    puzz_attempts: 'Попыток: ',
     noattempts: 'Нет попыток',
    puzz_reset: 'Заново',
      puzz_wrong: 'Не туда!',
    puzz_cell_occupied: 'Занято',
    puzz_off_board: 'Вне доски!',
    all_done: 'Невероятно!',
    puzz_all_done: 'Все пазлы собраны!',
    puzz_done1: 'Ух, какой хороший получился пазл! ',
     puzz_done2: 'Интересно, что будет, если собрать их все...',
    secret: 'Секретная награда',
    secret_text: 'Эта полянка оказалась интереснее, чем казалось!',
  event_comp1: 'Ура! Собран весь комплект!',
  event_comp2: 'Интересно, что будет, если открыть все клетки...',

    },
    en: {
        menu_title: '🍜Cozy Paws',
        loading: 'Loading...',
        menu_sub: '~ Kitten\'s Cafe ~',
        menu_play: 'Play',
        menu_reset: 'Reset Progress',
        menu_footer: '© 2026 · Version 0.1',
        K1: 'Kitten',
       
        pause_title: '⏸ Pause',
        pause_text: 'Game paused',
        pause_resume: 'Resume',
       
        dlg_0: 'Meow... This is my cafe... It\'s so ruined!',
        dlg_1: 'We need to clean up and make it cozy again!',
        dlg_2: 'Match identical items to create new ones!',
        dlg_3: 'Ready? Press the button and let\'s go!',
    
        menu_reset_confirm: 'Reset all progress?',
        confirm_delete: 'Are you sure you want to delete this item?',
        delete: 'Delete',
        cancel: 'Cancel',
        ok: 'OK',
        can_get_from: 'Can get from',
        gives: 'Gives',
        next_level_gives: 'Next level gives',
        item_can_spawn: 'Tap to get item',
        item_combine: 'Combine to improve',
         hint_title: "Hint",
    hint_press_item: "CLICK on an item",
    },
    tr: {
        menu_title: '🍜Sevimli Patiler',
        loading: 'Yükleniyor...',
        menu_sub: '~ Kedi Kafe ~',
        menu_play: 'Oyna',
        menu_reset: 'İlerlemeyi Sıfırla',
        menu_footer: '© 2026 · Sürüm 0.1',
        K1: 'Kedi Yavrusu',
    
        pause_title: '⏸ Duraklat',
        pause_text: 'Oyun duraklatıldı',
        pause_resume: 'Devam Et',
       
        dlg_0: 'Miyav... Burası benim kafem... Çok harap olmuş!',
        dlg_1: 'Temizleyip tekrar rahat bir yer haline getirmeliyiz!',
        dlg_2: 'Yeni şeyler oluşturmak için aynı öğeleri birleştir!',
        dlg_3: 'Hazır mısın? Düğmeye bas ve başlayalım!',
           menu_reset_confirm: 'Tüm ilerlemeyi sıfırla?',
        confirm_delete: 'Bu öğeyi silmek istediğinize emin misiniz?',
        delete: 'Sil',
        cancel: 'İptal',
        ok: 'Tamam',
        can_get_from: 'Şundan alınabilir',
        gives: 'Verir',
        next_level_gives: 'Sonraki seviye verir',
        item_can_spawn: 'Öğe almak için tıklayın',
        item_combine: 'Geliştirmek için birleştirin',
         hint_title: " ",
    hint_press_item: "",
    }
};

let currentLang = 'ru';
let locale = LOCALE_DATA.ru;

/** Установить язык и применить ко всем элементам с data-lkey */
function setLanguage(lang) {
    if (LOCALE_DATA[lang]) {
        currentLang = lang;
        locale = LOCALE_DATA[lang];
        applyLocale();
        return true;
    }
    return false;
}

/** Применить текущую локаль ко всем элементам с атрибутом data-lkey */
function applyLocale() {
    document.querySelectorAll('[data-lkey]').forEach(el => {
        const key = el.getAttribute('data-lkey');
        if (locale[key] !== undefined) {
            el.textContent = locale[key];
        }
    });
    const dText = document.getElementById('dialogue-text');
    if (dText && dText.dataset.dlgKey && locale[dText.dataset.dlgKey] !== undefined) {
        dText.textContent = locale[dText.dataset.dlgKey];
    }
}

/** Получить локализованную строку по ключу с подстановкой параметров {param} */
function getText(key, fallback, params) {
    let str = locale[key] || fallback || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
    }
    return str;
}

// Загрузить сохранённый язык
try {
    const savedLang = localStorage.getItem('cafe_lang');
    if (savedLang && LOCALE_DATA[savedLang]) {
        currentLang = savedLang;
        locale = LOCALE_DATA[savedLang];
    }
} catch (e) { /* ignore */ }