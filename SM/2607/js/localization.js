// ============================================================
//  LOCALIZATION DATA  (ru, en, tr)
// ============================================================
const LOCALE_DATA = {
    ru: {
        loading: 'Загрузка...',
        menu_sub: '~ Кафе Котёнка ~',
        menu_play: 'Играть',
        menu_reset: 'Сброс прогресса',
        menu_footer: '© 2026 · Версия 0.1',
        dialogue_speaker: 'Котёнок',
        dialogue_continue: 'Продолжить',
        pause_title: '⏸ Пауза',
        pause_text: 'Игра приостановлена',
        pause_resume: 'Продолжить',
        gameover_title: '🎉 Уровень пройден!',
        gameover_text: 'Отличная работа!',
        gameover_next: 'Следующий уровень',
        dlg_0: 'Мяу... Это моё кафе... Оно такое разрушенное!',
        dlg_1: 'Нужно навести порядок и снова сделать его уютным!',
        dlg_2: 'Соединяй одинаковые предметы, чтобы создавать новые!',
        dlg_3: 'Начнём? Нажми на кнопку, и мы приступим!',
        game_score: 'Счёт',
        game_level: 'Ур.',
        game_timer: 'Время',
        game_combine: 'Соединение!',
        menu_reset_confirm: 'Сбросить весь прогресс?',
        menu_title: '🍜 Уютные Лапки',
    },
    en: {
        
          menu_title: '🍜Cozy Paws',
        loading: 'Loading...',
        menu_sub: '~ Kitten\'s Cafe ~',
        menu_play: 'Play',
        menu_reset: 'Reset Progress',
        menu_footer: '© 2026 · Version 0.1',
        dialogue_speaker: 'Kitten',
        dialogue_continue: 'Continue',
        pause_title: '⏸ Pause',
        pause_text: 'Game paused',
        pause_resume: 'Resume',
        gameover_title: '🎉 Level Complete!',
        gameover_text: 'Great job!',
        gameover_next: 'Next Level',
        dlg_0: 'Meow... This is my cafe... It\'s so ruined!',
        dlg_1: 'We need to clean up and make it cozy again!',
        dlg_2: 'Match identical items to create new ones!',
        dlg_3: 'Ready? Press the button and let\'s go!',
        game_score: 'Score',
        game_level: 'Lv.',
        game_timer: 'Time',
        game_combine: 'Combined!',
        menu_reset_confirm: 'Reset all progress?',
    },
    tr: {
         menu_title: '🍜Sevimli Patiler',
        loading: 'Yükleniyor...',
        menu_sub: '~ Kedi Kafe ~',
        menu_play: 'Oyna',
        menu_reset: 'İlerlemeyi Sıfırla',
        menu_footer: '© 2026 · Sürüm 0.1',
        dialogue_speaker: 'Kedi Yavrusu',
        dialogue_continue: 'Devam',
        pause_title: '⏸ Duraklat',
        pause_text: 'Oyun duraklatıldı',
        pause_resume: 'Devam Et',
        gameover_title: '🎉 Seviye Tamamlandı!',
        gameover_text: 'Harika iş!',
        gameover_next: 'Sonraki Seviye',
        dlg_0: 'Miyav... Burası benim kafem... Çok harap olmuş!',
        dlg_1: 'Temizleyip tekrar rahat bir yer haline getirmeliyiz!',
        dlg_2: 'Yeni şeyler oluşturmak için aynı öğeleri birleştir!',
        dlg_3: 'Hazır mısın? Düğmeye bas ve başlayalım!',
        game_score: 'Skor',
        game_level: 'Seviye',
        game_timer: 'Zaman',
        game_combine: 'Birleşti!',
        menu_reset_confirm: 'Tüm ilerlemeyi sıfırla?',
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
    // Обновить текст диалога, если он активен
    const dText = document.getElementById('dialogue-text');
    if (dText && dText.dataset.dlgKey && locale[dText.dataset.dlgKey] !== undefined) {
        dText.textContent = locale[dText.dataset.dlgKey];
    }
}

/** Получить локализованную строку по ключу */
function getText(key, fallback) {
    return locale[key] || fallback || key;
}

// Загрузить сохранённый язык
try {
    const savedLang = localStorage.getItem('cafe_lang');
    if (savedLang && LOCALE_DATA[savedLang]) {
        currentLang = savedLang;
        locale = LOCALE_DATA[savedLang];
    }
} catch (e) { /* ignore */ }