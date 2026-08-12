// ============================================================
//  LOCALIZATION DATA  (ru, en, tr) — только диалоги и система
// ============================================================

const LOCALE_DATA = {
    ru: {
        loading: 'Загрузка...',
        menu_sub: '~ Кафе Котёнка ~',
        menu_play: 'Играть',
        menu_reset: 'Сброс прогресса',
        menu_footer: '© 2026 · Версия 0.1',
        dialogue_continue: 'Продолжить',
        pause_title: '⏸ Пауза',
        pause_text: 'Игра приостановлена',
        pause_resume: 'Продолжить',
         quest_execute: 'Выполнить',
       
        dlg_0: 'Мяу?.. О, нет! Волшебный ураган разрушил мой домик в дупле дерева!',
        dlg_1: 'Нужно навести порядок и вернуть сюда уют!',
        dlg_2: 'Но как же я это сделаю голыми лапками?',
        dlg_3: 'Сначала нужно добыть всё необходимое для починки и уборки!',
   
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
        reward_ad_title:'Рулетка',
    reward_ad_prompt:'Посмотри рекламу и получи случайный предмет!',
    reward_ad_error_title:'Ошибка',
    reward_ad_error_text:'Ой, условия не выполнены!',
character_gg: 'Котёнок',          // для русского
character_buyer: 'Покупатель',
// Если нужны конкретные имена для отдельных покупателей:
character_k1: 'Покупатель 1',
character_k2: 'Покупатель 2',

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
help_rule3: 'Перетаскивай предметы на животных, чтобы отдать им их и получить очки',
help_rule4: 'Ремонтируй свой домик, тратя листья, и получай награды',
help_rule5: 'Выкладывай награды из корзинки на стол и используй их!',
on_cooldown: 'Перезарядка',
collection_title_category: 'Коллекция: {category}',
 collection_empty: 'Пока нет открытых предметов. Создавай новые комбинации!',
    category_tools: 'Инструменты',
    category_products: 'Продукты',
    category_special: 'Разное',
        inventory_title: 'Корзинка',
        inventory_get: 'Получить',
        inventory_no_space_title: 'Нет места',
        inventory_no_space_text: 'Расчисти место, чтобы было куда это положить',
        inventory_empty: 'Корзинка пуста',
            to_inventory: 'В корзинку',
                    quest_title: 'Задание',
                quest_rewards: 'Награды',
                quest_cycle_0_name: 'Уборка дома',
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


                quest_cycle_1_name: '  ',
                quest_1_0_name: '  ',
    },
    en: {
        menu_title: '🍜Cozy Paws',
        loading: 'Loading...',
        menu_sub: '~ Kitten\'s Cafe ~',
        menu_play: 'Play',
        menu_reset: 'Reset Progress',
        menu_footer: '© 2026 · Version 0.1',
        K1: 'Kitten',
        dialogue_continue: 'Continue',
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
        dialogue_continue: 'Devam',
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