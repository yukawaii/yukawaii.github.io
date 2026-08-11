// ============================================================
//  ITEM LOCALIZATION DATA  
// ============================================================

let _currentLang = 'ru';
function getLanguage() {
    return localStorage.getItem('cafe_lang') || 'ru';
}



function getItemName(typeIndex, level = null) {
    if (!window.ITEM_DATA || !window.ITEM_DATA[typeIndex]) {
        return '???';
    }
    const item = window.ITEM_DATA[typeIndex];
    const lang = getLanguage(); // предполагается, что есть функция getLanguage()
    // Если передан уровень и есть levelNames – используем их
    if (level !== null && item.levelNames && item.levelNames[level]) {
        const names = item.levelNames[level];
        if (typeof names === 'object') {
            return names[lang] || names.ru || `Ур.${level}`;
        } else {
            return names;
        }
    }
    // Иначе используем displayName
    if (item.displayName) {
        return item.displayName[lang] || item.displayName.ru || item.name;
    }
    return item.name;
}

window.getItemName = getItemName;
