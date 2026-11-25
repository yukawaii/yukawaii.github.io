(function (w, d) {
'use strict';
const T = w.__T || ((ru, en, tr) => ({ ru, en: en || ru, tr: tr || ru }));
(function() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const weakCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const lowRAM  = navigator.deviceMemory       && navigator.deviceMemory       <= 4;
    const isWeak  = isMobile && (weakCPU || lowRAM);
    if (isWeak) {
        document.documentElement.classList.add('weak-device');
        console.log('📱 Слабое устройство: отключаем тяжёлые эффекты');
    }
})();
const sp = new URLSearchParams(location.search);
const launchParams = {};
for (const [k, v] of sp) launchParams[k] = v;
const vkOK = launchParams.vk_client === 'ok' || (Boolean(launchParams.vk_ok_user_id) && launchParams.vk_ok_user_id !== '0');
const hasVKParams = !!(launchParams.vk_app_id || launchParams.vk_client_id || launchParams.vk_platform || launchParams.vk_user_id || launchParams.vk_client);
const hasYaGames = typeof YaGames !== 'undefined';
const yaEnv = w.YandexGamesSDKEnvironment;
const hasYaEnv = !!(yaEnv && (yaEnv.appId || yaEnv.clipId));
let isVK = false, isOK = false, isYandex = false, platform = 'standalone';
if (hasVKParams) { isOK = vkOK; isVK = !vkOK; platform = isOK ? 'ok' : 'vk'; }
else if (hasYaGames || hasYaEnv) { isYandex = true; platform = 'yandex'; }
const userId = parseInt(launchParams.vk_user_id || launchParams.vk_ok_user_id || launchParams.viewer_id || launchParams.user_id || '0');
const storagePrefix = isOK ? 'ok_' : '';
const P = {isVK, isOK, isYandex, platform, userId, storagePrefix, launchParams, isStandalone: platform === 'standalone', inIframe: (() => { try { return w.self !== w.top; } catch (e) { return true; } })()};
w.__PLATFORM = P;
const cls = d.documentElement.classList;
cls.toggle('is-vk', isVK);
cls.toggle('is-ok', isOK);
cls.toggle('is-yandex', isYandex);
cls.toggle('is-standalone', platform === 'standalone');
let darkEnabled = false;
try {
  const raw = localStorage.getItem(storagePrefix + 'aq_theme_dark');
  if (raw === 'true' || raw === true) { darkEnabled = true; cls.add('is-dark'); }
} catch (e) {}
console.log('%c🎮 ' + platform.toUpperCase(), 'color:#e94560;font-weight:bold', '| userId=' + userId + ' | prefix="' + (storagePrefix || '(none)') + '"');
const SUPPORTED = ['ru', 'en', 'tr'];
function normalizeLang(l) {
  l = String(l || '').toLowerCase();
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('tr')) return 'tr';
  return 'ru';
}
const LANG_STORAGE_KEY = storagePrefix + 'aq_user_lang';
function detectPlatformLang() {
  if (isVK || isOK) return normalizeLang(launchParams.vk_language || navigator.language || 'ru');
  if (launchParams.vk_language || launchParams.lang) {
    return normalizeLang(launchParams.vk_language || launchParams.lang);
  }
  try {
    if (w.ysdk && w.ysdk.environment && w.ysdk.environment.i18n && w.ysdk.environment.i18n.lang) {
      return normalizeLang(w.ysdk.environment.i18n.lang);
    }
  } catch (e) {}
  return normalizeLang(navigator.language || navigator.userLanguage || 'ru');
}
function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch (e) {}
  return detectPlatformLang();
}
let LANG = initialLang();
w.LANG = LANG;
function setGameLanguage(newLang, isManual) {
  const next = normalizeLang(newLang);
  if (!SUPPORTED.includes(next)) return;
  if (isManual) {
    try { localStorage.setItem(LANG_STORAGE_KEY, next); } catch (e) {}
  }
  if (LANG === next) return;
  LANG = next;
  w.LANG = next;
  applyStaticI18n();
  refreshLocalization();
}
w.setGameLanguage = setGameLanguage;
w.t = function (key) {
  const cur = (w.I18N && w.I18N[w.LANG]) || {};
  const fb = (w.I18N && w.I18N.ru) || {};
  return cur[key] != null ? cur[key] : (fb[key] != null ? fb[key] : key);
};
w.L = function (obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[w.LANG] || obj.ru || '';
};
const EXTRA_I18N = {
  ru: {
    titleLang: 'Язык',
    chooseLangTitle: 'Выберите язык',
    startTitleWord: 'Викторина',
    startSubtitle: 'Для всей семьи',
    statBerries: 'Ягоды',
    statMaxLvl: 'Макс. Ур.',
    categoriesBtn: 'Категории',
    mapBtn: 'Карта',
    helpTitle: 'Как играть',
    helpBtnTitle: 'Помощь',
    homeMenuTitle: 'На главную',
    dailyTitle: 'Вызов дня',
    dailyDone: 'Вызов выполнен',
    dailyAlready: 'Вызов дня уже выполнен. Возвращайтесь завтра!',
    dailyUnavail: 'Вызов дня недоступен',
    dailyCompletedToast: '🎉 Вызов дня выполнен!',
    dailyNeedAll: 'Чтобы выполнить вызов дня, ответь правильно на все вопросы',
    questsTitle: 'Квесты дня',
    questDone: '✓ Выполнено',
    questRewardToast: '🎉 +{n} ягод за квесты!',
    closeBtn: 'Закрыть',
    tutorialBtn: 'Обучение',
    helpP1: 'Посмотри на фото животного и выбери один из вариантов ответа.',
    helpP2: 'На каждый вопрос даётся 10 секунд — следи за таймером.',
    helpP3: 'За правильные ответы ты получаешь ягоды.',
    helpP4: 'Пройди всю викторину без ошибок — получишь 3 звезды!',
    helpP5: 'После открытия всех уровней ягоды можно будет потратить на открытие категорий.',
    helpP6: 'Выполняй ежедневные квесты и вызов дня, чтобы получать бонусные ягоды.',
    helpP7: 'Каждый 15-й правильный ответ даёт ×2 ягод.',
    mapLockedTitle: 'Уровень закрыт!',
    mapLockedDesc: 'Пройди предыдущий уровень на 2 или 3 звезды, чтобы продвинуться дальше.',
    okBtn: 'Хорошо',
    readyTitle: 'Готово!',
    mapUnlockAdDesc: 'Открыть уровень, посмотрев короткую рекламу?',
    watchBtn: 'Смотреть',
    cancelBtn: 'Отмена',
    levelOpenedToast: '🎉 Уровень открыт!',
    categoryFallback: 'Категория',
    notEnoughBerries: 'Недостаточно ягод',
    catOpenedForever: '🎉 Категория открыта навсегда!',
    catOpened24h: '🎉 Категория открыта на 24 часа!',
    catClosedSuffix: ' — закрыта',
    buyModalDesc: 'Купить навсегда за <strong>{price}</strong> ягод или открыть временно?',
    buyForBtn: 'Купить за {price}',
    watch24hBtn: 'Смотреть (24ч)',
    bonusToast: '🎉 Бонус! +2 ягоды',
    bonusCounter: '×2 через {n}',
    progressReady: 'Хватает открыть · {price}',
    progressNeed: '{total} / {price} · ещё {need}',
    levelWord: 'Уровень',
      hintTitle: 'Подсказка',
    hintModalTitle: 'Подсказка!',
    hintModalDesc: 'Посмотри короткую рекламу, чтобы получить подсказку.'
  },
  en: {
     hintTitle: 'Hint',
    hintModalTitle: 'Hint!',
    hintModalDesc: 'Watch a short ad to get a hint.',
    titleLang: 'Language',
    chooseLangTitle: 'Choose language',
    startTitleWord: 'Animal Quiz',
    startSubtitle: 'For the whole family',
    statBerries: 'Berries',
    statMaxLvl: 'Max Lvl',
    categoriesBtn: 'Categories',
    mapBtn: 'Map',
    helpTitle: 'How to play',
    helpBtnTitle: 'Help',
    homeMenuTitle: 'Main menu',
    dailyTitle: 'Daily Challenge',
    dailyDone: 'Challenge completed',
    dailyAlready: 'Daily challenge is already completed. Come back tomorrow!',
    dailyUnavail: 'Daily challenge unavailable',
    dailyCompletedToast: '🎉 Daily challenge completed!',
    dailyNeedAll: 'Answer all questions correctly to complete the daily challenge',
    questsTitle: 'Daily Quests',
    questDone: '✓ Completed',
    questRewardToast: '🎉 +{n} berries for quests!',
    closeBtn: 'Close',
    tutorialBtn: 'Tutorial',
    helpP1: 'Look at the animal photo and choose one of the answer options.',
    helpP2: 'You have 10 seconds per question — watch the timer.',
    helpP3: 'You earn berries for correct answers.',
    helpP4: 'Complete the entire quiz without mistakes to get 3 stars!',
    helpP5: 'After unlocking all levels, you can spend berries to unlock categories.',
    helpP6: 'Complete daily quests and the daily challenge to earn bonus berries.',
    helpP7: 'Every 15th correct answer gives ×2 berries.',
    mapLockedTitle: 'Level locked!',
    mapLockedDesc: 'Complete the previous level with 2 or 3 stars to move forward.',
    okBtn: 'OK',
    readyTitle: 'Ready!',
    mapUnlockAdDesc: 'Unlock this level by watching a short ad?',
    watchBtn: 'Watch',
    cancelBtn: 'Cancel',
    levelOpenedToast: '🎉 Level unlocked!',
    categoryFallback: 'Category',
    notEnoughBerries: 'Not enough berries',
    catOpenedForever: '🎉 Category unlocked forever!',
    catOpened24h: '🎉 Category unlocked for 24 hours!',
    catClosedSuffix: ' — locked',
    buyModalDesc: 'Buy permanently for <strong>{price}</strong> berries or unlock temporarily?',
    buyForBtn: 'Buy for {price}',
    watch24hBtn: 'Watch (24h)',
    bonusToast: '🎉 Bonus! +2 berries',
    bonusCounter: '×2 in {n}',
    progressReady: 'Ready to unlock · {price}',
    progressNeed: '{total} / {price} · {need} more',
    levelWord: 'Level'
  },
  tr: {
     hintTitle: 'İpucu',
    hintModalTitle: 'İpucu!',
    hintModalDesc: 'İpucu almak için kısa bir reklam izle.',
    titleLang: 'Dil',
    chooseLangTitle: 'Dil seçin',
    startTitleWord: 'Bilgi Yarışması',
    startSubtitle: 'Tüm aile için',
    statBerries: 'Meyveler',
    statMaxLvl: 'Maks. Sv.',
    categoriesBtn: 'Kategoriler',
    mapBtn: 'Harita',
    helpTitle: 'Nasıl oynanır',
    helpBtnTitle: 'Yardım',
    homeMenuTitle: 'Ana menü',
    dailyTitle: 'Günün Meydan Okuması',
    dailyDone: 'Meydan okuma tamamlandı',
    dailyAlready: 'Günün meydan okuması tamamlandı. Yarın tekrar gel!',
    dailyUnavail: 'Günün meydan okuması kullanılamıyor',
    dailyCompletedToast: '🎉 Günün meydan okuması tamamlandı!',
    dailyNeedAll: 'Günün meydan okumasını tamamlamak için tüm soruları doğru yanıtla',
    questsTitle: 'Günlük Görevler',
    questDone: '✓ Tamamlandı',
    questRewardToast: '🎉 Görevler için +{n} meyve!',
    closeBtn: 'Kapat',
    tutorialBtn: 'Eğitim',
    helpP1: 'Hayvan fotoğrafına bak ve seçeneklerden birini seç.',
    helpP2: 'Her soru için 10 saniyen var — zamanlayıcıyı takip et.',
    helpP3: 'Doğru cevaplar için meyve kazanırsın.',
    helpP4: 'Hatasız tamamla ve 3 yıldız kazan!',
    helpP5: 'Tüm seviyeleri açtıktan sonra meyvelerle kategorileri açabilirsin.',
    helpP6: 'Bonus meyve kazanmak için günlük görevleri ve günün meydan okumasını tamamla.',
    helpP7: 'Her 15. doğru cevap ×2 meyve verir.',
    mapLockedTitle: 'Seviye kilitli!',
    mapLockedDesc: 'İlerlemek için önceki seviyeyi 2 veya 3 yıldızla tamamla.',
    okBtn: 'Tamam',
    readyTitle: 'Hazır!',
    mapUnlockAdDesc: 'Kısa bir reklam izleyerek bu seviyeyi açmak ister misin?',
    watchBtn: 'İzle',
    cancelBtn: 'İptal',
    levelOpenedToast: '🎉 Seviye açıldı!',
    categoryFallback: 'Kategori',
    notEnoughBerries: 'Yetersiz meyve',
    catOpenedForever: '🎉 Kategori kalıcı olarak açıldı!',
    catOpened24h: '🎉 Kategori 24 saatliğine açıldı!',
    catClosedSuffix: ' — kilitli',
    buyModalDesc: '<strong>{price}</strong> meyve karşılığında kalıcı olarak satın al veya geçici olarak aç?',
    buyForBtn: '{price} karşılığında al',
    watch24hBtn: 'İzle (24s)',
    bonusToast: '🎉 Bonus! +2 meyve',
    bonusCounter: '×2 için {n}',
    progressReady: 'Açmaya hazır · {price}',
    progressNeed: '{total} / {price} · {need} kaldı',
    levelWord: 'Seviye'
  }
};
w.I18N = w.I18N || {};
['ru', 'en', 'tr'].forEach(l => {
  w.I18N[l] = Object.assign({}, EXTRA_I18N[l], w.I18N[l] || {});
});
function renderStartTitle() {
  const titleEl = d.getElementById('startTitle');
  if (!titleEl) return;
  const word = w.t('startTitleWord');
  titleEl.setAttribute('aria-label', word);
  titleEl.innerHTML = Array.from(word).map((ch, idx) =>
    '<span class="start-title-letter" style="--i:' + idx + '">' + (ch === ' ' ? '&nbsp;' : escapeHtml(ch)) + '</span>'
  ).join('');
}
function applyStaticI18n() {
  d.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = w.t(el.dataset.i18n); });
  d.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = w.t(el.dataset.i18nTitle); });
  const lt = d.querySelector('.loading-text');
  if (lt) lt.textContent = w.t('loading');
  renderStartTitle();
  d.documentElement.lang = LANG;
}
let ysdk = null, ysdkPlayer = null;
function vkSend(method, params, timeoutMs) {
  timeoutMs = timeoutMs || 2000;
  if (!(isVK || isOK)) return Promise.resolve(null);
  const trySend = () => {
    const bridge = w.vkBridge;
    if (!bridge || typeof bridge.send !== 'function') return Promise.resolve(null);
    let settled = false;
    let timerId = null;
    const call = new Promise(resolve => {
      try {
        bridge.send(method, params || {}).then(r => {
          if (!settled) { settled = true; clearTimeout(timerId); resolve(r); }
        })
        .catch(err => {
        console.error('VK Bridge ' + method + ' ошибка:', JSON.stringify(err, null, 2) || err);
          if (!settled) { settled = true; clearTimeout(timerId); resolve(null); }
        });
      } catch (e) {
        console.error(`VK Bridge ${method} исключение:`, e);
        if (!settled) { settled = true; clearTimeout(timerId); resolve(null); }
      }
    });
    const timer = new Promise(res => {
      timerId = setTimeout(() => {
        if (!settled) { settled = true; resolve(null); }
      }, timeoutMs);
    });
    return Promise.race([call, timer]);
  };
  if (w.__vkBridgeReady && !w.vkBridge) {
    return w.__vkBridgeReady.then(() => trySend());
  }
  return trySend();
}
let __actionLock = false;
async function withLock(fn) {
  if (__actionLock) return;
  __actionLock = true;
  try { await fn(); } finally { setTimeout(() => { __actionLock = false; }, 300); }
}
async function safeCall(fn, fallback = null, label = '') {
  try { return await fn(); }
  catch (e) { console.warn('safeCall' + (label ? ' [' + label + ']' : '') + ':', e); return fallback; }
}
function storageKey(name) { return storagePrefix + 'aq_' + name; }
function mergeValues(localVal, remoteVal) {
  if (localVal == null) return remoteVal;
  if (remoteVal == null) return localVal;
  if (Array.isArray(localVal) && Array.isArray(remoteVal)) return Array.from(new Set([...localVal, ...remoteVal]));
  if (typeof localVal === 'object' && typeof remoteVal === 'object' && !Array.isArray(localVal) && !Array.isArray(remoteVal)) {
    const merged = { ...localVal };
    for (const k in remoteVal) {
      const lv = Number(merged[k]);
      const rv = Number(remoteVal[k]);
      if (isNaN(lv) && isNaN(rv)) merged[k] = remoteVal[k];
      else merged[k] = Math.max(isNaN(lv) ? 0 : lv, isNaN(rv) ? 0 : rv);
    }
    return merged;
  }
  return remoteVal;
}
function deepMergeMetrics(local, remote) {
  if (local == null) return remote;
  if (remote == null) return local;
  if (typeof local !== 'object' || typeof remote !== 'object') return local;
  const out = { ...local };
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const k of keys) {
    const lv = local[k];
    const rv = remote[k];
    if (lv === undefined) { out[k] = rv; continue; }
    if (rv === undefined) { out[k] = lv; continue; }
    if (Array.isArray(lv) || Array.isArray(rv)) {
      const a = Array.isArray(lv) ? lv : [];
      const b = Array.isArray(rv) ? rv : [];
      out[k] = Array.from(new Set([...a, ...b]));
      continue;
    }
    if (typeof lv === 'object' && typeof rv === 'object') { out[k] = deepMergeMetrics(lv, rv); continue; }
    if (typeof lv === 'boolean' || typeof rv === 'boolean') { out[k] = !!(lv || rv); continue; }
    if (typeof lv === 'number' || typeof rv === 'number') {
      const ln = Number(lv), rn = Number(rv);
      if (!isNaN(ln) && !isNaN(rn)) {
        if (k === 'fastestCorrect') out[k] = Math.min(ln, rn);
        else out[k] = Math.max(ln, rn);
        continue;
      }
    }
    if (typeof lv === 'string' && typeof rv === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(lv) && /^\d{4}-\d{2}-\d{2}/.test(rv)) { out[k] = lv > rv ? lv : rv; continue; }
    }
    out[k] = lv;
  }
  return out;
}
async function remoteGetWithStatus(name) {
  const key = storageKey(name);
  if (isYandex) {
    if (!ysdkPlayer) return { ok: false, value: null };
    try {
      const data = await ysdkPlayer.getData([key]);
      const raw = data && data[key];
      if (raw == null) return { ok: true, value: null };
      try { return { ok: true, value: JSON.parse(raw) }; } catch { return { ok: true, value: raw }; }
    } catch (e) { return { ok: false, value: null }; }
  }
  if (isVK || isOK) {
    const data = await vkSend('VKWebAppStorageGet', { keys: [key] }, 2500);
    if (!data || !Array.isArray(data.keys)) return { ok: false, value: null };
    const item = data.keys.find(kv => kv && kv.key === key) || data.keys[0];
    const raw = item && item.value;
    if (raw === '' || raw === undefined || raw === null) return { ok: true, value: null };
    try { return { ok: true, value: JSON.parse(raw) }; } catch { return { ok: true, value: raw }; }
  }
  return { ok: false, value: null };
}
async function remoteGet(name) {
  const res = await remoteGetWithStatus(name);
  return res.value;
}
async function remoteSet(name, valueStr) {
  const key = storageKey(name);
  if (isYandex) {
    if (!ysdkPlayer) return false;
    try { await ysdkPlayer.setData({ [key]: valueStr }, true); return true; } catch (e) { return false; }
  }
  if (isVK || isOK) {
    const r = await vkSend('VKWebAppStorageSet', { key, value: valueStr }, 2500);
    return r !== null;
  }
  return false;
}
function safeLocalGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function safeLocalSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) {
    console.warn('localStorage.setItem failed:', e);
    try {
      const keys = Object.keys(localStorage);
      const prefix = storagePrefix + 'aq_';
      keys.filter(k => k.startsWith(prefix) && !k.includes('unlocked') && !k.includes('collection')).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, value);
      return true;
    } catch (e2) { return false; }
  }
}
function asArray(val, fallback = []) { return Array.isArray(val) ? val : fallback; }
function asNumber(val, fallback = 0) { const n = Number(val); return isNaN(n) ? fallback : n; }
function asObject(val, fallback = {}) { return (val && typeof val === 'object' && !Array.isArray(val)) ? val : fallback; }
function storageGet(name) {
  const key = storageKey(name);
  let localVal = null;
  try {
    const raw = safeLocalGet(key);
    if (raw !== null) { try { localVal = JSON.parse(raw); } catch { localVal = raw; } }
  } catch (e) {}
  if (P.isStandalone) return Promise.resolve(localVal);
  if (isYandex) {
    if (!ysdkPlayer) return Promise.resolve(localVal);
    return (async () => {
      try {
        const data = await ysdkPlayer.getData([key]);
        const raw = data && data[key];
        if (raw == null) return localVal;
        let remoteVal;
        try { remoteVal = JSON.parse(raw); } catch { remoteVal = raw; }
        const merged = mergeValues(localVal, remoteVal);
        try { localStorage.setItem(key, JSON.stringify(merged)); } catch (e) {}
        return merged;
      } catch (e) { console.warn('Cloud getData failed for', key, e); return localVal; }
    })();
  }
  if (isVK || isOK) {
    return remoteGetWithStatus(name).then(res => {
      if (res.ok) {
        if (res.value != null) {
          const merged = mergeValues(localVal, res.value);
          safeLocalSet(key, JSON.stringify(merged));
          if (JSON.stringify(merged) !== JSON.stringify(res.value)) {
            remoteSet(name, JSON.stringify(merged)).catch(() => {});
          }
          return merged;
        }
        if (localVal != null) {
          remoteSet(name, JSON.stringify(localVal)).catch(() => {});
        }
        return localVal;
      }
      return localVal;
    });
  }
  return Promise.resolve(localVal);
}
function storageSet(name, value) {
  const key = storageKey(name);
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  safeLocalSet(key, str);
  if (P.isStandalone) return Promise.resolve();
  if (isYandex) {
    if (!ysdkPlayer) return Promise.resolve();
    return (async () => {
      try { await ysdkPlayer.setData({ [key]: str }, true); } catch (e) { console.warn('Cloud setData failed for', key, e); }
    })();
  }
  if (isVK || isOK) return remoteSet(name, str).catch(() => {});
  return Promise.resolve();
}
async function storageGetTotal() {
  const KEY = storageKey('total');
  const TS_KEY = storageKey('total_ts');
  let localVal = null, localTs = 0;
  try {
    const rv = safeLocalGet(KEY);
    if (rv != null) localVal = Number(JSON.parse(rv)) || 0;
    const rt = safeLocalGet(TS_KEY);
    if (rt != null) localTs = Number(JSON.parse(rt)) || 0;
  } catch (e) {}
  let remoteOk = false, remoteVal = null, remoteTs = 0;
  if (!P.isStandalone) {
    try {
      if (isYandex && ysdkPlayer) {
        const data = await ysdkPlayer.getData([KEY, TS_KEY]);
        remoteOk = true;
        if (data && data[KEY] != null) remoteVal = Math.max(0, Math.floor(Number(JSON.parse(data[KEY])) || 0));
        if (data && data[TS_KEY] != null) remoteTs = Number(JSON.parse(data[TS_KEY])) || 0;
      } else if (isVK || isOK) {
        const data = await vkSend('VKWebAppStorageGet', { keys: [KEY, TS_KEY] }, 2500);
        if (data && Array.isArray(data.keys)) {
          remoteOk = true;
          for (const kv of data.keys) {
            if (!kv || kv.value === '' || kv.value == null) continue;
            if (kv.key === KEY) remoteVal = Math.max(0, Math.floor(Number(JSON.parse(kv.value)) || 0));
            else if (kv.key === TS_KEY) remoteTs = Number(JSON.parse(kv.value)) || 0;
          }
        }
      }
    } catch (e) {}
  }
  let winner;
  if (localVal == null && remoteVal == null) winner = 0;
  else if (localVal == null) winner = remoteVal;
  else if (remoteVal == null) winner = localVal;
  else winner = (remoteTs > localTs) ? remoteVal : localVal;
  winner = Math.max(0, Math.floor(Number(winner) || 0));
  try {
    safeLocalSet(KEY, JSON.stringify(winner));
    if (remoteVal != null && remoteTs > localTs) safeLocalSet(TS_KEY, JSON.stringify(remoteTs));
    if ((isVK || isOK) && remoteOk && localVal != null && localTs > remoteTs) {
      vkSend('VKWebAppStorageSet', { key: KEY, value: JSON.stringify(winner) }, 2500).catch(() => {});
      vkSend('VKWebAppStorageSet', { key: TS_KEY, value: JSON.stringify(localTs) }, 2500).catch(() => {});
    }
  } catch (e) {}
  return winner;
}
async function storageSetTotal(value) {
  const total = Number(value) || 0;
  let prevTs = 0;
  try { prevTs = Number(JSON.parse(safeLocalGet(storageKey('total_ts')))) || 0; } catch (e) {}
  const ts = Math.max(Date.now(), prevTs + 1);
  safeLocalSet(storageKey('total'), JSON.stringify(total));
  safeLocalSet(storageKey('total_ts'), JSON.stringify(ts));
  if (P.isStandalone) return;
  try {
    if (isYandex && ysdkPlayer) {
      await ysdkPlayer.setData({
        [storageKey('total')]: JSON.stringify(total),
        [storageKey('total_ts')]: JSON.stringify(ts)
      }, true);
      return;
    }
    if (isVK || isOK) {
      await vkSend('VKWebAppStorageSet', { key: storageKey('total'), value: JSON.stringify(total) }, 2500);
      await vkSend('VKWebAppStorageSet', { key: storageKey('total_ts'), value: JSON.stringify(ts) }, 2500);
    }
  } catch (e) {}
}
w.storageGet = storageGet;
w.storageSet = storageSet;
w.vkSend = vkSend;
let __lastRewardedAdTime = 0;let __lastInterstitialTime = 0; let __interstitialDelayTimer = null;
function clearAdTimers() {
  if (__interstitialDelayTimer) {
    clearTimeout(__interstitialDelayTimer);
    __interstitialDelayTimer = null;
  }
  if (bannerRetryTimer) {
    clearTimeout(bannerRetryTimer);
    bannerRetryTimer = null;
  }
  if (__adPreloadTimer) {
    clearInterval(__adPreloadTimer);
    __adPreloadTimer = null;
  }
  if (__bannerKeepAliveTimer) {
    clearInterval(__bannerKeepAliveTimer);
    __bannerKeepAliveTimer = null;
  }
}
w.clearAdTimers = clearAdTimers;
const REWARDED_AD_COOLDOWN = 31000;const INTERSTITIAL_AD_COOLDOWN = 600000;
async function waitForAdsAvailable(maxWaitMs, pollIntervalMs, adFormat){ maxWaitMs=maxWaitMs || 8000; pollIntervalMs=pollIntervalMs || 700; adFormat=adFormat || 'reward'; const startWait=Date.now(); while (Date.now() - startWait < maxWaitMs){ const chk=await vkSend('VKWebAppCheckNativeAds',{ ad_format: adFormat}, 3000); if (chk && chk.result===true) return true; await new Promise(r=>setTimeout(r, pollIntervalMs));} return false;}
let __adPreloadTimer = null;
function preloadRewardedAd(){ if (!(isVK || isOK)) return; vkSend('VKWebAppCheckNativeAds',
  { ad_format: 'reward'}, 3000); vkSend('VKWebAppCheckNativeAds',
    { ad_format: 'interstitial'}, 3000); if (__adPreloadTimer) return; 
    __adPreloadTimer=setInterval(()=>{ if (adPlaying || isGamePaused || document.hidden) return; 
      vkSend('VKWebAppCheckNativeAds',{ ad_format: 'reward'}, 3000); 
      vkSend('VKWebAppCheckNativeAds',{ ad_format: 'interstitial'}, 3000);}, 45000);}
function showRewardedAd(){
  if (P.isStandalone && !isYandex && typeof YaGames === 'undefined') return Promise.resolve(true);
  const sdkActive = isYandex || (typeof YaGames !== 'undefined' && !isVK && !isOK);
  if (sdkActive){
    const now = Date.now();
    if (now - __lastRewardedAdTime < REWARDED_AD_COOLDOWN) {
      toast(w.t('adSkipped'), true);
      return Promise.resolve(false);
    }
    return new Promise(resolve=>{
      const runAd=(sdk)=>{
        if (!sdk || !sdk.adv || typeof sdk.adv.showRewardedVideo !=='function'){
          console.warn('adv API unavailable');
          toast(w.t('adUnavailable'), true);
          return resolve(false);
        }
yandexGameplayStop(); adMute();
let rewarded = false;
let finished = false;
const safetyTimer = setTimeout(() => finish(false), 95000);
const finish = (result) => {
  if (finished) return;
  finished = true;
  clearTimeout(safetyTimer);
  if (result) __lastRewardedAdTime = Date.now();
  adUnmute();
  const qs = d.getElementById('quiz-screen');
  if (qs && qs.classList.contains('active')) yandexGameplayStart();
  resolve(result);
};
           try{
          sdk.adv.showRewardedVideo({
            callbacks:{
              onRewarded: ()=>{ rewarded=true; },
              onClose: ()=>{
                if (rewarded) return finish(true);
                toast(w.t('adSkipped'), true);
                finish(false);
              },
              onError: (e)=>{
                console.warn('ad error:', e);
                toast(w.t('adUnavailable'), true);
                finish(false);
              }
            }
          });
        } catch (e){
          console.warn('showRewardedVideo exception:', e);
          toast(w.t('adUnavailable'), true);
          finish(false);
        }
      };
      if (ysdk && ysdk.adv){ runAd(ysdk); }
      else if (typeof YaGames !=='undefined'){
        YaGames.init().then(sdk=>{
          ysdk=sdk;
          if (!isYandex){ isYandex=true; platform='yandex'; P.isYandex=true; P.platform='yandex'; P.isStandalone=false; }
          if (!ysdkPlayer && sdk.getPlayer) sdk.getPlayer().then(p=>{ ysdkPlayer=p; }).catch(()=>{});
          runAd(sdk);
        }).catch(err=>{
          console.warn('re-init failed:', err);
          toast(w.t('adUnavailable'), true);
          resolve(false);
        });
      } else {
        toast(w.t('adUnavailable'), true);
        resolve(false);
      }
    });
  }
  if (isVK || isOK){
    if (w.__rewardAdInFlight) return w.__rewardAdInFlight;
    let resolveOuter;
    w.__rewardAdInFlight=new Promise(res=>{ resolveOuter=res; });
    adMute();
    (async ()=>{
      let resolved=false;
      const finish=(result, reason)=>{
        if (resolved) return; resolved=true;
        console.log('ad flow →', reason, '| result=', result);
        try{ adUnmute(); } catch (e){}
        w.__rewardAdInFlight=null;
        resolveOuter(result);
      };
      try{
        const rewardReady=await waitForAdsAvailable(2500, 500, 'reward');
        if (rewardReady){
          const data=await vkSend('VKWebAppShowNativeAds',
            { ad_format: 'reward', use_waterfall: true }, 90000);
          const ok=!!(data && data.result === true);
          setTimeout(()=>{ vkSend('VKWebAppCheckNativeAds',{ ad_format: 'reward'}, 3000); showBanner(true); }, 500);
          if (ok) return finish(true, 'reward-watched');
          console.log('reward closed early → interstitial fallback');
        } else {
          console.log('reward unavailable → interstitial fallback');
        }
        const interReady=await waitForAdsAvailable(2000, 500, 'interstitial');
        if (!interReady){
          toast(w.t('adUnavailable'), true);
          return finish(false, 'no-ads-at-all');
        }
        const data=await vkSend('VKWebAppShowNativeAds',
          { ad_format: 'interstitial' }, 90000);
        const ok=!!(data && data.result === true);
        setTimeout(()=>{ vkSend('VKWebAppCheckNativeAds',{ ad_format: 'reward'}, 3000); showBanner(true); }, 500);
        if (ok) return finish(true, 'interstitial-watched');
        toast(w.t('adSkipped'), true);
        return finish(false, 'interstitial-not-completed');
      } catch (e){
        toast(w.t('adUnavailable'), true);
        finish(false, 'error:' + ((e && e.message) || e));
      }
    })();
    return w.__rewardAdInFlight;
  }
  toast(w.t('adUnavailable'), true);
  return Promise.resolve(false);
}
function showInterstitial(){
  const now = Date.now();
  if (now - __lastInterstitialTime < INTERSTITIAL_AD_COOLDOWN) {
    console.log('Interstitial ad skipped: cooldown active');
    return;
  }
  const quizScreenActive = document.querySelector('#quiz-screen.active');
  if (quizScreenActive) {
    console.log('Interstitial ad skipped: quiz is active');
    return;
  }
  __lastInterstitialTime = now;
if (isYandex) {
  if (!ysdk) return;
  yandexGameplayStop();
  adMute();
  let closed = false;
  const done = () => {
    if (closed) return;
    closed = true;
    adUnmute();
  };
  const fallbackTimer = setTimeout(done, 65000);
  try {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => { clearTimeout(fallbackTimer); done(); },
        onError: () => { clearTimeout(fallbackTimer); done(); }
      }
    });
  } catch (e) {
    clearTimeout(fallbackTimer);
    done();
  }
  return;
}
  if (isVK || isOK) {
    (async () => {
      try {
        const chk = await vkSend('VKWebAppCheckNativeAds', { ad_format: 'interstitial' }, 3000);
        if (!chk || chk.result !== true) {
          console.log('Interstitial skipped: no ads');
          return;
        }
        adMute();
        await vkSend('VKWebAppShowNativeAds', { ad_format: 'interstitial' }, 60000);
      } catch (e) {
        console.warn('Interstitial failed:', e);
      } finally {
        try { adUnmute(); } catch (e) {}
      }
    })();
  }
}
let bannerShown=false; let bannerRetryTimer=null; let bannerAttempts=0; const BANNER_MAX_ATTEMPTS=5;
const BANNER_RETRY_DELAY=10000;
let __bannerKeepAliveTimer=null;
function startBannerKeepAlive(){
  if (__bannerKeepAliveTimer) return;
  __bannerKeepAliveTimer=setInterval(function (){
    if (d.hidden || adPlaying) return;
    showBanner(true);
  }, 5 * 60 * 1000);
}
function showBanner(forceCheck){
  if (!(isVK || isOK)) return;
  startBannerKeepAlive();
  if (bannerShown && !forceCheck) return;
  if (bannerRetryTimer) return;
  bannerAttempts++;
  const attemptNo=bannerAttempts;
  vkSend('VKWebAppShowBannerAd',{ banner_location: 'bottom'}, 5000)
    .then(function (data){
      const ok=data && (data.result===true || data.result===1);
      if (ok){
        bannerShown=true;
        bannerAttempts=0;
        return;
      }
      bannerShown=false;
      console.warn('⚠️ Banner not shown (attempt #' + attemptNo + '):', data);
      scheduleBannerRetry(attemptNo);
    })
    .catch(function (err){
      bannerShown=false;
      console.warn('❌ Banner error (attempt #' + attemptNo + '):', err);
      scheduleBannerRetry(attemptNo);
    });
}
function scheduleBannerRetry(attemptNo){
  if (bannerShown) return;
  if (attemptNo >=BANNER_MAX_ATTEMPTS){
    console.warn('⛔ Banner retry limit reached (' + BANNER_MAX_ATTEMPTS + ' attempts)');
    bannerAttempts=0;
    return;
  }
  bannerRetryTimer=setTimeout(function (){ bannerRetryTimer=null; showBanner(true); }, BANNER_RETRY_DELAY);
  console.log('🔁 Banner retry in ' + (BANNER_RETRY_DELAY / 1000) + 's (next attempt #' + (attemptNo + 1) + ')');
}
function yandexGameplayStart() { if (isYandex && ysdk && ysdk.features && ysdk.features.GameplayAPI) try { ysdk.features.GameplayAPI.start(); } catch (e) {} }
function yandexGameplayStop() { if (isYandex && ysdk && ysdk.features && ysdk.features.GameplayAPI) try { ysdk.features.GameplayAPI.stop(); } catch (e) {} }
w.showRewardedAd = showRewardedAd;
w.showInterstitial = showInterstitial;
w.showBanner = showBanner;
w.preloadRewardedAd = preloadRewardedAd;
w.yandexGameplayStart = yandexGameplayStart;
w.yandexGameplayStop = yandexGameplayStop;
function getMiniAppShareUrl(){ const appId=P.launchParams.vk_app_id || P.launchParams.vk_client_id || new URLSearchParams(location.search).get('vk_app_id') || new URLSearchParams(location.search).get('vk_client_id') || ''; if (isOK){ return appId ? ('https://ok.ru/app/' + appId) : (location.origin + location.pathname);} return appId ? ('https://vk.com/app' + appId) : (location.origin + location.pathname);}
async function infr(){ if (isYandex || P.isStandalone || !isVK){ toast(w.t('inviteVKOnly')); return;}
 const link=getMiniAppShareUrl(); try{ const res=await vkSend('VKWebAppShare',{ link: link}, 60000); console.log('VKWebAppShare →', res);} catch (e){ console.warn('Share failed:', e); toast(w.t('inviteVKOnly'), true);}}

w.infr = infr;
const __toastQueue = [];
let __toastActive = false;
function __showNextToast() {
  if (!__toastQueue.length) { __toastActive = false; return; }
  __toastActive = true;
  const { msg, isError, title } = __toastQueue.shift();
  let el = d.getElementById('__toast');
  if (!el) { el = d.createElement('div'); el.id = '__toast'; d.body.appendChild(el); }
  el.className = 'toast' + (isError ? ' toast-error' : '');
const allowHtml = (s) => typeof s === 'string' && (s.indexOf('<svg') !== -1 || s.indexOf('<span') !== -1);
if (title) {
  el.innerHTML = '<div class="toast-title">' + (allowHtml(title) ? title : escapeHtml(title)) +
                 '</div><div class="toast-msg">' + (allowHtml(msg) ? msg : escapeHtml(msg)) + '</div>';
} else if (allowHtml(msg)) {
  el.innerHTML = msg;
} else {
  el.textContent = msg;
}
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(el.__t);
  el.__t = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(__showNextToast, 350);
  }, 3000);
}
function toast(msg, isError, title) {
  __toastQueue.push({ msg, isError, title });
  if (!__toastActive) __showNextToast();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
w.toast = toast;
let soundMode = 1;
let adPlaying = false;
let isGamePaused = false;
let audioCtx = null;
let bgAudio = null;
function canPlaySfx() {
  return soundMode > 0 && !adPlaying && !isGamePaused && !document.hidden;
}
function canPlayMusic() {
  return soundMode === 2 && !adPlaying && !isGamePaused && !document.hidden;
}
let __userInteracted = false;
function ensureAudioCtx() {
  if (!__userInteracted) return null;
  if (!audioCtx) { try { audioCtx = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { audioCtx = null; } }
  if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume().catch(() => {}); } catch (e) {} }
  return audioCtx;
}
function tone(freq, dur, type, when, peak) {
  if (!canPlaySfx()) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak == null ? 0.15 : peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 1.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (e) {} };
  } catch (e) { console.warn('Audio error:', e); }
}
let __lastClickSound = 0;
function playClick() {
  if (!canPlaySfx()) return;
  const now = Date.now();
  if (now - __lastClickSound < 60) return;
  __lastClickSound = now;
  tone(587, 0.03, 'sine', 0, 0.02);
  tone(784, 0.05, 'sine', 0.02, 0.018);
}
function playCorrect() {
  if (!canPlaySfx()) return;
  tone(660, 0.12, 'sine', 0, 0.16);
  tone(880, 0.16, 'sine', 0.10, 0.16);
  tone(1320, 0.22, 'sine', 0.22, 0.14);
}
function playWrong() {
  if (!canPlaySfx()) return;
  tone(240, 0.18, 'sawtooth', 0, 0.05);
  tone(170, 0.30, 'sawtooth', 0.10, 0.05);
}
function playFanfare() {
  if (!canPlaySfx()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.30, 'triangle', i * 0.12, 0.15));
  [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 0.75, 'sine', 0.55, 0.13));
}
 function playHint() {
      if (!canPlaySfx()) return;
      tone(587.33, 0.06, 'square', 0.00, 0.055);
      tone(739.99, 0.06, 'square', 0.06, 0.060);
      tone(880.00, 0.20, 'square', 0.12, 0.065);
    }
    function playTick(secLeft) {
      if (!canPlaySfx()) return;
      try {
        const ctx = ensureAudioCtx();
        if (!ctx) return;
        const freqs = { 3: 523.25, 2: 587.33, 1: 659.25 };
        const f = freqs[secLeft] || 587.33;
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f * 0.75, t0);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, t0 + 0.07);
        gain.gain.setValueAtTime(0.085, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.09);
        osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (e) {} };
      } catch (e) {}
    }
let __bgUnlocked = false;
let __bgFailCount = 0;
function ensureBgAudio() {
  if (bgAudio) return bgAudio;
  if (__bgFailCount >= 5) return null;
  try {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.25;
    audio.preload = 'auto';
    audio.src = 'sounds/music.ogg';
    const onCanPlay = () => {
      if (__bgUnlocked && canPlayMusic() && audio.paused) {
        audio.play().catch(() => {});
      }
    };
    const onError = () => {
      __bgFailCount++;
      console.warn('Background music failed to load: sounds/music.ogg');
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.src = '';
      bgAudio = null;
      if (__bgFailCount >= 5) removeAudioUnlockListeners();
    };
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    bgAudio = audio;
  } catch (e) {
    console.warn('Audio creation failed:', e);
    bgAudio = null;
  }
  return bgAudio;
}
function removeAudioUnlockListeners() {
  d.removeEventListener('pointerdown', unlockAndPlay, true);
  d.removeEventListener('keydown', unlockAndPlay, true);
}
function startBgMusic() {
  __userInteracted = true;
  ensureAudioCtx();
  const audio = ensureBgAudio();
  if (!audio || !canPlayMusic() || !audio.paused) return;
  const tryPlay = () => {
    const p = audio.play();
    if (p && p.then) {
      p.then(() => {
        __bgUnlocked = true;
        removeAudioUnlockListeners();
      }).catch(() => {});
    }
  };
  if (audio.readyState >= 2) {
    tryPlay();
  } else {
    audio.addEventListener('canplay', tryPlay, { once: true });
    try { audio.load(); } catch (e) {}
  }
}
function attachAudioUnlock() {
  ensureBgAudio();
  d.addEventListener('pointerdown', unlockAndPlay, true);
  d.addEventListener('keydown', unlockAndPlay, true);
}
function stopBgMusic() {
  if (bgAudio && !bgAudio.paused) {
    try { bgAudio.__savedTime = bgAudio.currentTime; bgAudio.pause(); } catch (e) {}
  }
}
function applySoundState() {
  const isAudioActive = soundMode > 0; 
  d.querySelectorAll('[data-sound-toggle]').forEach(btn => {
    const spriteName = isAudioActive ? 'soundoff' : 'soundon';
    const inner = (w.UiSprite && w.UiSprite.has(spriteName))
      ? w.UiSprite.html(spriteName)
      : (isAudioActive ? '🔇' : '🔊');
    btn.innerHTML = '<span class="emoji-icon" aria-hidden="true">' + inner + '</span>';
    btn.title = isAudioActive ? w.t('soundOffTitle') : w.t('soundOnTitle');
    btn.setAttribute('aria-label', isAudioActive ? w.t('soundOffTitle') : w.t('soundOnTitle'));
  });
  if (!canPlayMusic()) stopBgMusic();
  w.dispatchEvent(new Event('quiz:sound-changed'));
}
function toggleSound() {
  if (soundMode === 1) {
    soundMode = 2;
  } else if (soundMode === 2) {
    soundMode = 0;
  } else {
    soundMode = 1;
  }
  ensureAudioCtx();
  if (soundMode === 2) {
    startBgMusic();
  } else {
    stopBgMusic();
  }
  applySoundState();
  storageSet('sound_mode', soundMode).catch(() => {});
}
function attachSfxToUI() {
  d.addEventListener('click', (e) => {
    if (e.target.closest('.option')) return;
    const t = e.target.closest('button, .btn, .icon-btn, .level-card, .collection-item, .modal-close');
    if (!t || t.disabled) return;
    if (
      t.matches('#startPlayBtn, #startCategoriesBtn, #startHelpBtn, #startLangBtn, #menuHomeBtn, #mapMenuHomeBtn, [data-theme-toggle], [data-sound-toggle], #hint-btn, #extrasHelpBtn, #mapHelpBtn, #extrasDailyBtn, #extrasQuestsBtn, #home-btn, #quit-btn, .collapsible-header, [data-href], [onclick="Ach.openModal()"], [onclick="openYandexLeaderboard()"], [data-i18n-title="titleAchievements"]')
    ) {
      playOgg('menu_select');
      return;
    }

    playClick();
  });
}
function adMute() {
  adPlaying = true;
  stopBgMusic();
}
function adUnmute() {
  adPlaying = false;
  if (canPlayMusic()) startBgMusic();
}
function unlockAndPlay() {
  __userInteracted = true;
  ensureAudioCtx();
  const audio = ensureBgAudio(); 
  if (!audio) return;
  if (audio.readyState === 0) {
    try { audio.load(); } catch (e) {}
  }
  if (!canPlayMusic()) return;
  if (!__bgUnlocked || audio.paused) {
    const onPlaySuccess = () => {
      __bgUnlocked = true;
      removeAudioUnlockListeners();
    };
    if (audio.readyState >= 2) {
      const p = audio.play();
      if (p && p.then) p.then(onPlaySuccess).catch(() => {});
    } else {
      const onReady = () => {
        if (!canPlayMusic()) return;
        const p = audio.play();
        if (p && p.then) p.then(onPlaySuccess).catch(() => {});
      };
      audio.addEventListener('canplay', onReady, { once: true });
    }
  }
}
w.Sound = {
  isEnabled: () => soundMode > 0,
  getMode: () => soundMode,
  playClick,
  playCorrect,
  playWrong,
  playFanfare,
  playHint,
        playTick,
  toggle: toggleSound,
  apply: applySoundState,
  startBg: startBgMusic,
  stopBg: stopBgMusic,
  mute: adMute,
  unmute: adUnmute,
  unlockAndPlay: unlockAndPlay
};
const THEME_KEY = 'theme_name';
const THEMES = ['light', 'dark', 'blue', 'green'];
const THEME_META_COLORS = {
  light: '#fdf6e3',
  dark: '#1a1430',
  blue: '#dbeafe',
  green: '#dcfce7'
};
let currentTheme = 'light';
function updateThemeColorMeta() {
  let meta = d.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = d.createElement('meta'); meta.name = 'theme-color'; d.head.appendChild(meta); }
  meta.content = THEME_META_COLORS[currentTheme] || '#fdf6e3';
}
function applyTheme() {
  d.documentElement.setAttribute('data-theme', currentTheme);
  cls.toggle('is-dark', currentTheme === 'dark');
  d.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    const spriteName = currentTheme === 'dark' ? 'moon' : 'palitra';
    const inner = (w.UiSprite && w.UiSprite.has(spriteName))
      ? w.UiSprite.html(spriteName)
      : (currentTheme === 'dark' ? '🌙' : '🎨');
    btn.innerHTML = '<span class="emoji-icon" aria-hidden="true">' + inner + '</span>';
    btn.title = w.t('titleTheme');
    btn.setAttribute('aria-label', btn.title);
  });
  updateThemeColorMeta();
  __starsCreated = false;
}
async function loadTheme() {
  try {
    const saved = await storageGet(THEME_KEY);
    if (THEMES.includes(saved)) {
      currentTheme = saved;
    } else {
      currentTheme = 'light';
    }
  } catch (e) {
    currentTheme = 'light';
  }
  applyTheme();
}
async function toggleTheme() {
  const nextIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  currentTheme = THEMES[nextIdx];
  try { await storageSet(THEME_KEY, currentTheme); } catch (e) {}
  applyTheme();
}
w.Theme = {
  toggle: toggleTheme,
  apply: applyTheme,
  load: loadTheme,
  isDark: () => currentTheme === 'dark',
  get: () => currentTheme
};
function updateTotalScoreUI(value){
  const v = Math.max(0, Math.floor(Number(value) || 0));
  const abbrev = (n) => {
    if (n < 1000) return String(n);
    if (n < 1e6)  return (n/1e3).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, '') + 'K';
    if (n < 1e9)  return (n/1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    return (n/1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  };
  const text = abbrev(v);
  d.querySelectorAll('[data-total-score]').forEach(el => {
    el.textContent = text;
    el.title = String(v);
  });
}
w.updateTotalScoreUI = updateTotalScoreUI;
var __origUpdateTotal = updateTotalScoreUI;
w.updateTotalScoreUI = function (v) {
__origUpdateTotal(v);
if (window.StartMenu && window.StartMenu.updateStats) window.StartMenu.updateStats();
};
const METRICS_KEY = 'ach_metrics', UNLOCKED_KEY = 'ach_unlocked';
let metrics = null, unlockedSet = null;
function todayStr() {
  const dt = new Date();
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function yesterdayStr() {
  const dt = new Date(); dt.setDate(dt.getDate() - 1);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
async function loadMetrics() {
  let local = null;
  try {
    const raw = safeLocalGet(storageKey(METRICS_KEY));
    if (raw != null) { try { local = JSON.parse(raw); } catch { local = raw; } }
  } catch (e) {}
  let remote = null;
  try { remote = await remoteGet(METRICS_KEY); } catch (e) {}
  const merged = deepMergeMetrics(local, remote);
  const base = (merged && typeof merged === 'object' && !Array.isArray(merged)) ? merged : {};
  const dflt = { totalPlays: 0, playsToday: 0, lastPlayDate: '', maxStreak: 0, fastestCorrect: 99, noMistakeRuns: 0, zeroLossStreak: 0, hasZeroScore: false, allTimeouts: false, playedAtNight: false, playedEarlyMorning: false, dailyStreak: 0, maxDailyStreak: 0, lastActiveDate: '', playedLevels: [], lastPercent: 0 };
  metrics = { ...dflt, ...base };
  safeLocalSet(storageKey(METRICS_KEY), JSON.stringify(metrics));
  if (remote != null && JSON.stringify(metrics) !== JSON.stringify(remote)) {
    remoteSet(METRICS_KEY, JSON.stringify(metrics)).catch(() => {});
  }
  return metrics;
}
async function loadUnlocked() {
  let raw = null;
  try { raw = await storageGet(UNLOCKED_KEY); } catch (e) {}
  const a = Array.isArray(raw) ? Array.from(new Set(raw)) : [];
  unlockedSet = new Set(a);
  safeLocalSet(storageKey(UNLOCKED_KEY), JSON.stringify(a));
  return unlockedSet;
}
async function saveMetrics() { await storageSet(METRICS_KEY, metrics); }
async function saveUnlocked() { await storageSet(UNLOCKED_KEY, Array.from(unlockedSet)); }
function updateDailyStreak() {
  const t = todayStr();
  if (metrics.lastActiveDate === t) return;
  if (metrics.lastActiveDate === yesterdayStr()) metrics.dailyStreak++;
  else metrics.dailyStreak = 1;
  metrics.lastActiveDate = t;
  if (metrics.dailyStreak > metrics.maxDailyStreak) metrics.maxDailyStreak = metrics.dailyStreak;
}
function buildAchContext() {
  const unlockedLvlSet = new Set(((w.__SYNCED__ && w.__SYNCED__.unlocked) || []).map(Number));
  const mapUnlockedSet = new Set(((w.__SYNCED__ && w.__SYNCED__.mapUnlocked) || []).map(Number));
  const starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  const colArr = asArray(w.__SYNCED__ && w.__SYNCED__.collection);
  const colSet = new Set(colArr.map(String));
  let totalStars = 0, threeStarsCount = 0;
  for (const k in starsMap) {
    const s = Math.max(0, Math.min(3, Math.floor(Number(starsMap[k]) || 0)));
    totalStars += s;
    if (s >= 3) threeStarsCount++;
  }
  const unlockedRegions = new Set();
  const regionFull = new Set();
  const allAnimalIds = new Set();
  let totalLevels = 0;
  (w.REGIONS || []).forEach(reg => {
    const regAnimalIds = new Set();
    reg.levels.forEach(l => {
      if (l.isFullSet) return;
      totalLevels++;
      if (unlockedLvlSet.has(Number(l.id)) || mapUnlockedSet.has(Number(l.id))) unlockedRegions.add(reg.id);
      const qz = (w.QUIZZES || {})[l.id];
      if (qz && Array.isArray(qz.questions)) {
        qz.questions.forEach(qn => {
          const id = getAnimalId(qn.img);
          if (id) {
            allAnimalIds.add(id);
            regAnimalIds.add(id);
          }
        });
      }
    });
    if (regAnimalIds.size > 0 && Array.from(regAnimalIds).every(id => colSet.has(id))) {
      regionFull.add(reg.id);
    }
  });
  let themedTotal = 0, themedUnlocked = 0, themedPlayed = 0, themed3Stars = 0;
  (w.THEMED_LEVELS || []).forEach(l => {
    if (l.isFullSet) return;
    const id = Number(l.id);
    themedTotal++;
    if (unlockedLvlSet.has(id)) themedUnlocked++;
    if (starsMap[id] != null) themedPlayed++;
    if (Number(starsMap[id]) >= 3) themed3Stars++;
  });
  let photoTotal = 0, photoUnlocked = 0, photoPlayed = 0, photo3Stars = 0;
  (w.PHOTO_LEVELS || []).forEach(l => {
    if (l.isFullSet) return;
    const id = Number(l.id);
    photoTotal++;
    if (unlockedLvlSet.has(id)) photoUnlocked++;
    if (starsMap[id] != null) photoPlayed++;
    if (Number(starsMap[id]) >= 3) photo3Stars++;
  });
  const m = metrics || {};
  return {
    totalStars,
    threeStarsCount,
    stars: starsMap,
    unlockedLevels: unlockedLvlSet.size,
    totalLevels,
    unlockedRegions,
    regionFull,
    collectionCount: colSet.size,
    collectionTotal: allAnimalIds.size,
    themedTotal, themedUnlocked, themedPlayed, themed3Stars,
    photoTotal, photoUnlocked, photoPlayed, photo3Stars,
    totalPlays: m.totalPlays || 0,
    playsToday: m.playsToday || 0,
    maxStreak: m.maxStreak || 0,
    fastestCorrect: m.fastestCorrect != null ? m.fastestCorrect : 99,
    noMistakeRuns: m.noMistakeRuns || 0,
    zeroLossStreak: m.zeroLossStreak || 0,
    hasZeroScore: !!m.hasZeroScore,
    allTimeouts: !!m.allTimeouts,
    playedAtNight: !!m.playedAtNight,
    playedEarlyMorning: !!m.playedEarlyMorning,
    maxDailyStreak: m.maxDailyStreak || 0,
    playedLevels: new Set(Array.isArray(m.playedLevels) ? m.playedLevels : []),
    lastPercent: m.lastPercent || 0
  };
}
async function checkAndUnlock(silent) {
  if (!unlockedSet) await loadUnlocked();
  const ctx = buildAchContext();
  const newly = [];
  for (const a of (w.ACHIEVEMENTS || [])) {
    if (unlockedSet.has(a.id)) continue;
    let ok = false;
    try { ok = !!a.check(ctx); } catch (e) {}
    if (ok) { unlockedSet.add(a.id); newly.push(a); }
  }
  if (newly.length) {
    await saveUnlocked();
    if (!silent) {
      newly.forEach(a => {
        toast(a.icon + ' ' + w.L(a.title), false, '🏆 ' + w.t('achUnlocked'));
      });
    }
  }
  return newly;
}
async function recordVisit() {
  if (!metrics) await loadMetrics();
  updateDailyStreak();
  await saveMetrics();
  return checkAndUnlock(true);
}
async function recordRound(data) {
  if (!metrics) await loadMetrics();
  updateDailyStreak();
  metrics.totalPlays++;
  const t = todayStr();
  if (metrics.lastPlayDate === t) metrics.playsToday++;
  else { metrics.playsToday = 1; metrics.lastPlayDate = t; }
  if (typeof data.fastestCorrect === 'number' && data.fastestCorrect < metrics.fastestCorrect) metrics.fastestCorrect = data.fastestCorrect;
  if (typeof data.maxStreak === 'number' && data.maxStreak > metrics.maxStreak) metrics.maxStreak = data.maxStreak;
  if (data.total > 0 && data.mistakes === 0) metrics.noMistakeRuns++;
if (data.total > 0 && (Number(data.correctCount) || 0) === 0) { metrics.hasZeroScore = true; metrics.zeroLossStreak++; } else metrics.zeroLossStreak = 0;
  if (data.total > 0 && data.timeouts === data.total) metrics.allTimeouts = true;
  const h = new Date().getHours();
  if (h >= 2 && h <= 4) metrics.playedAtNight = true;
  if (h >= 5 && h <= 7) metrics.playedEarlyMorning = true;
   metrics.lastPercent = data.percent;
  const lvl = Number(data.levelId);
  if (lvl && lvl !== 99999 && lvl !== 88888 && !metrics.playedLevels.includes(lvl)) metrics.playedLevels.push(lvl);
  await saveMetrics();
  return checkAndUnlock(false);
}
async function achList() {
  if (!unlockedSet) await loadUnlocked();
  return (w.ACHIEVEMENTS || []).map(a => ({ ...a, unlocked: unlockedSet.has(a.id) }));
}
async function renderAchModal() {
  const body = d.getElementById('ach-body');
  if (!body) return;
  const items = await achList();
  const totalUnlocked = items.filter(i => i.unlocked).length;
  const counter = d.getElementById('ach-counter');
  if (counter) counter.textContent = totalUnlocked + ' / ' + items.length;
  body.innerHTML = '';
  (w.ACH_CATEGORIES || []).forEach(cat => {
    const group = items.filter(i => i.cat === cat.id);
    if (!group.length) return;
    const sec = d.createElement('section');
    sec.className = 'ach-group';
    const h = d.createElement('h3');
    h.className = 'ach-group-title';
    h.textContent = cat.icon + ' ' + w.L(cat.name) + ' (' + group.filter(g => g.unlocked).length + '/' + group.length + ')';
    sec.appendChild(h);
    const grid = d.createElement('div');
    grid.className = 'ach-grid';
    group.forEach(a => {
      const el = d.createElement('div');
      el.className = 'ach-item' + (a.unlocked ? ' unlocked' : '');
      el.innerHTML = '<div class="ach-icon">' + a.icon + '</div><div class="ach-text"><div class="ach-title">' + escapeHtml(w.L(a.title)) + '</div><div class="ach-desc">' + escapeHtml(w.L(a.desc)) + '</div></div>' + (a.unlocked ? '<div class="ach-check">✓</div>' : '');
      grid.appendChild(el);
    });
    sec.appendChild(grid);
    body.appendChild(sec);
  });
}
function openAchModal() {
  const m = d.getElementById('ach-modal');
  if (!m) return;
  renderAchModal();
  m.classList.add('show');
}
function closeAchModal() { const m = d.getElementById('ach-modal'); if (m) m.classList.remove('show'); }
w.Ach = { loadMetrics, recordVisit, recordRound, checkAndUnlock, list: achList, openModal: openAchModal, closeModal: closeAchModal, renderModal: renderAchModal };
function openOtherGamesModal() {
  const m = d.getElementById('igames-modal');
  if (!m) return;
  if (m.parentElement !== d.body) d.body.appendChild(m);
  renderOtherGames();
  m.classList.add('show');
}
function closeOtherGamesModal() {
  const m = d.getElementById('igames-modal');
  if (m) m.classList.remove('show');
}
w.openOtherGamesModal = openOtherGamesModal;
w.closeOtherGamesModal = closeOtherGamesModal;
function getAnimalId(img){ return String(img || '').split('/').pop().replace(/\.(png|jpe?g)$/i, '');}
w.getAnimalId = getAnimalId;
let __animalMapCache = null;
function getAnimalMap(){ if (__animalMapCache) return __animalMapCache; const byId={}; (w.REGIONS || []).forEach(reg=>{ (reg.levels || []).forEach(lvl=>{ const qz=(w.QUIZZES ||{})[lvl.id]; if (!qz || !Array.isArray(qz.questions)) return; qz.questions.forEach(qn=>{ const id=getAnimalId(qn.img); if (!id || byId[id]) return; if (!Array.isArray(qn.options)) return; const ansOpt=qn.options[qn.answer]; if (!ansOpt) return; byId[id]={ id, img: qn.img, name: ansOpt, desc: qn.description};});});}); __animalMapCache=byId; return byId;}
w.getAnimalMap = getAnimalMap;
function shuffleInPlace(arr){ const a=arr.slice(); for (let i=a.length - 1; i >0; i--){ const j=Math.floor(Math.random() * (i + 1)); const tmp=a[i]; a[i]=a[j]; a[j]=tmp;} return a;}
const __poolCache = new Map();
function getPoolAnimals(pool) {
  const key = pool.join(',');
  if (__poolCache.has(key)) return __poolCache.get(key);
  const byId = getAnimalMap();
  const arr = pool.map(id => byId[id]).filter(Boolean);
  if (__poolCache.size >= 25) {
    const oldestKey = __poolCache.keys().next().value;
    __poolCache.delete(oldestKey);
  }
  __poolCache.set(key, arr);
  return arr;
}
function buildSingleThemedQuiz(levelId){ const nid=Number(levelId); 
const themedDef=(w.THEMED_LEVELS || []).find(l=>Number(l.id)===nid); 
  if (themedDef){ const animals = getPoolAnimals(themedDef.pool || []);
    if (animals.length < 4) return null; const count=Math.min(themedDef.count || animals.length, animals.length); 
    const picked=shuffleInPlace(animals).slice(0, count); const questions=picked.map(correct=>{ const others=shuffleInPlace(animals.filter(a=>a.id !==correct.id)).slice(0, 3); const opts=shuffleInPlace([correct].concat(others)); const answer=opts.findIndex(o=>o.id===correct.id); return{ animalId: correct.id, img: correct.img, options: opts.map(o=>o.name), answer, description: correct.desc};}); 
    return{ regionKey: 'themed', mode: 'text', sub: themedDef.name, questions};} 
    const photoDef=(w.PHOTO_LEVELS || []).find(l=>Number(l.id)===nid); 
    if (photoDef){ const animals = getPoolAnimals(photoDef.pool || []);
      const need=Math.max(2, Math.min(4, photoDef.optionCount || 4)); 
      if (animals.length < need) return null; const count=Math.min(photoDef.count || animals.length, animals.length);
       const picked=shuffleInPlace(animals).slice(0, count); const questions=picked.map(correct=>{ 
        const others=shuffleInPlace(animals.filter(a=>a.id !==correct.id)).slice(0, need - 1); 
        const opts=shuffleInPlace([correct].concat(others)); const answer=opts.findIndex(o=>o.id===correct.id);
         return{ animalId: correct.id, name: correct.name, images: opts.map(o=>o.img), answer, description: correct.desc};});
          return{ regionKey: 'photo', mode: 'photo', optionCount: need, sub: photoDef.name, questions};} return null;}
w.buildSingleThemedQuiz = buildSingleThemedQuiz;
const DEFAULT_UNLOCKED = [
  1001, 1002, 1003,
  2001, 2002, 2003
];
const CURRENT_GATING_VER = 5;
let gatingCache = null;
async function gatingLoad(forceReload) {
  if (gatingCache && !forceReload) return gatingCache;
  try {
    const storedVer = asNumber(await storageGet('unlocked_v'), 0);
    let arr = await storageGet('unlocked');
    if (!Array.isArray(arr)) arr = [];
    if (storedVer < CURRENT_GATING_VER) {
      const storedUnlocked = arr.map(Number).filter(n => !isNaN(n) && n > 0);
      arr = Array.from(new Set([...DEFAULT_UNLOCKED, ...storedUnlocked]));
      await storageSet('unlocked', arr);
      await storageSet('unlocked_v', CURRENT_GATING_VER);
      console.log('Gating upgrade → v' + CURRENT_GATING_VER, arr);
    } else {
      const merged = Array.from(new Set([...DEFAULT_UNLOCKED, ...arr.map(Number).filter(Boolean)]));
      if (merged.length !== arr.length) await storageSet('unlocked', merged);
      arr = merged;
    }
    gatingCache = arr;
    if (w.__SYNCED__) w.__SYNCED__.unlocked = arr.slice();
    return arr;
  } catch (e) {
    console.warn('gatingLoad failed:', e);
    gatingCache = DEFAULT_UNLOCKED.slice();
    return gatingCache;
  }
}
async function isUnlocked(levelId) {
  const nid = Number(levelId);
  if (nid === DAILY_ID) return true;
  if (nid === 88888) return true;
  if (isPurchasedLevel(nid)) return true;
  if (isTempUnlockedLevel(nid)) return true;
  const list = await gatingLoad();
  return list.includes(nid);
}
const SERVICE_LEVEL_IDS = new Set([88888, 99999, 3001, 3002]);
async function unlockLevel(levelId) {
  const n = Number(levelId);
  if (!n || n <= 0 || SERVICE_LEVEL_IDS.has(n) || n >= 3000) return false;
  const list = await gatingLoad();
  if (!list.includes(n)) {
    list.push(n);
    gatingCache = list;
    await storageSet('unlocked', list);
    if (w.__SYNCED__) w.__SYNCED__.unlocked = list.slice();
  }
  return true;
}
w.Gating = { DEFAULT_UNLOCKED, loadUnlocked: gatingLoad, isUnlocked, unlockLevel, showUnlockModal: (id, cb) => showPurchaseModal(id, cb), _invalidate: () => { gatingCache = null; } };
async function initVK() {
  console.log('🔑 initVK(): старт');
  if (!w.vkBridge) {
    console.warn('🔑 vkBridge не найден, инициализация VK пропущена');
    return;
  }
  console.log('🔑 P.userId (из URL):', P.userId, '| launchParams.vk_user_id:', launchParams.vk_user_id, '| viewer_id:', launchParams.viewer_id);
  await vkSend('VKWebAppInit', {}, 3000);
  let uid = P.userId;
  if (!uid) {
    const info = await vkSend('VKWebAppGetUserInfo', {}, 3000);
    console.log('🔑 VKWebAppGetUserInfo ответ:', info);
    if (info && info.id) {
      uid = info.id;
      w.id = info.id;
      try { sessionStorage.setItem('id', info.id); } catch (e) {}
    }
  }
  if (!uid) {
    const sp = new URLSearchParams(location.search);
    const viewerId = sp.get('viewer_id');
    if (viewerId) {
      uid = parseInt(viewerId);
      w.id = uid;
      try { sessionStorage.setItem('id', uid); } catch (e) {}
    }
  }
  if (!uid) console.warn('🔑 initVK(): НЕ УДАЛОСЬ получить uid!');
if (uid) P.userId = uid;
  console.log('🔑 initVK(): ФИНАЛЬНЫЙ P.userId =', P.userId);
  showBanner();
  preloadRewardedAd();
}
async function initYandex() {
  const sdkReady = await new Promise(resolve => {
    if (typeof YaGames !== 'undefined') return resolve(true);
    let waited = 0;
    const iv = setInterval(() => {
      waited += 200;
      if (typeof YaGames !== 'undefined') { clearInterval(iv); resolve(true); }
      else if (waited >= 10000) { clearInterval(iv); console.warn('Yandex Games SDK not loaded within 10s'); resolve(false); }
    }, 200);
  });
  if (!sdkReady || typeof YaGames === 'undefined') { console.warn('YaGames is not available — skipping Yandex init'); return; }
  if (!isYandex) {
    isYandex = true;
    platform = 'yandex';
    P.isYandex = true;
    P.platform = 'yandex';
    P.isStandalone = false;
    cls.toggle('is-yandex', true);
    cls.toggle('is-standalone', false);
  }
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('YaGames.init timeout')), 7000));
    ysdk = await Promise.race([YaGames.init(), timeout]);
  } catch (e) { console.warn('YaGames.init failed', e); return; }
  try {
    const sdkLang = ysdk.environment.i18n.lang || 'ru';
    const normalized = normalizeLang(sdkLang);
    let hasManual = false;
    try { hasManual = Boolean(localStorage.getItem(LANG_STORAGE_KEY)); } catch (e) {}
    if (!hasManual && SUPPORTED.includes(normalized) && normalized !== LANG) {
      setGameLanguage(normalized, false);
      console.log('Yandex lang override →', LANG);
    }
    d.documentElement.lang = LANG;
  } catch (e) {}
  try {
    const t = new Promise((_, rej) => setTimeout(() => rej(new Error('getPlayer timeout')), 5000));
    ysdkPlayer = await Promise.race([ysdk.getPlayer(), t]);
    try {
      const uid = ysdkPlayer.getUniqueID && ysdkPlayer.getUniqueID();
      if (uid) { w.id = uid; sessionStorage.setItem('id', uid); }
    } catch (e) {}
  } catch (e) { ysdkPlayer = null; console.warn('getPlayer failed', e); }
try {
ysdk.on('game_api_pause', function () {
  isGamePaused = true;
  yandexGameplayStop();
  stopBgMusic();
  if (w.__currentQuizPause) { try { w.__currentQuizPause(); } catch (e) {} }
});
ysdk.on('game_api_resume', function () {
  isGamePaused = false;
  const qs = d.getElementById('quiz-screen');
  if (qs && qs.classList.contains('active')) yandexGameplayStart();
  if (canPlayMusic()) startBgMusic();
  if (w.__currentQuizResume) { try { w.__currentQuizResume(); } catch (e) {} }
});

  } catch (e) {}
  if (w.__appReady) trySendLoadingReady();
}
async function updateAuthButton() {
  const btns = d.querySelectorAll('#yandex-auth-btn');
  if (!btns.length) return;
  if (!isYandex || !ysdk) { btns.forEach(b => b.style.display = 'none'); return; }
 try{ let p=ysdkPlayer; if (!p && ysdk.getPlayer){ p=await ysdk.getPlayer(); ysdkPlayer=p;
    }
    let authorized = false;
    if (p && typeof p.isAuthorized === 'function') authorized = p.isAuthorized();
    else if (p && typeof p.getMode === 'function') authorized = p.getMode() !== 'lite';
    btns.forEach(b => b.style.display = authorized ? 'none' : '');
  } catch (e) { 
    btns.forEach(b => b.style.display = ''); 
  }
}
function openAuthModal() { const m = d.getElementById('auth-modal'); if (m) m.classList.add('show'); }
function closeAuthModal() { const m = d.getElementById('auth-modal'); if (m) m.classList.remove('show'); }
async function doYandexAuth() {
  closeAuthModal();
  if (!isYandex || !ysdk) { toast(w.t('authUnavail2'), true); return; }
  let available = false;
  try { available = await ysdk.isAvailableMethod('auth.openAuthDialog'); } catch (e) {}
  if (!available) { toast(w.t('authUnavail'), true); return; }
  const ok = await safeCall(async () => {
    await ysdk.auth.openAuthDialog();
    ysdkPlayer = await safeCall(() => ysdk.getPlayer(), null, 'getPlayer');
    await syncAllOnStart();
    const curTotal = Math.max(0, Math.floor(Number((w.__SYNCED__ && w.__SYNCED__.total) || 0)));
    if (ysdk && ysdk.leaderboards && ysdkPlayer && typeof ysdkPlayer.isAuthorized === 'function' && ysdkPlayer.isAuthorized()) {
      ysdk.leaderboards.setLeaderboardScore('bestscore', curTotal).catch(() => {});
    }
    updateAuthButton();
    return true;

  }, false, 'openAuthDialog');
  if (ok) toast(w.t('authOk')); else toast(w.t('authFail'));
}
async function canShowShortcut() {
  if (!isYandex || !ysdk || !ysdk.shortcut) return false;
  const p = await safeCall(() => ysdk.shortcut.canShowPrompt(), null, 'canShowPrompt');
  return !!(p && p.canShow);
}
async function showShortcut() {
  if (!isYandex || !ysdk || !ysdk.shortcut) { toast(w.t('shortcutYa'), true); return; }
  try {
    const r = await ysdk.shortcut.showPrompt();
    if (r && r.outcome === 'accepted') toast(w.t('shortcutOk'));
  } catch (e) { toast(w.t('shortcutFail'), true); }
}
async function updateShortcutButton() {
  const btns = d.querySelectorAll('[data-yandex-shortcut]');

  if (!btns.length) return;
  let show = false;
  if (isYandex) {
    try { show = await canShowShortcut(); } catch (e) { show = false; }
  }
  btns.forEach(b => {
    if (show) {
      b.style.removeProperty('display');
    } else {
      b.style.setProperty('display', 'none', 'important');
    }
  });
}
async function openYandexLeaderboard() {
  if (!isYandex || !ysdk) { toast(w.t('topVKOnly')); return; }
  const modal = d.getElementById('yandex-leaderboard-modal');
  const body = d.getElementById('yandex-leaderboard-body');
  if (!modal || !body) return;
  body.innerHTML = '<p class="modal-text">' + w.t('leaderboardLoading') + '</p>';
  modal.classList.add('show');
  let isAuth = false;
  try {
    if (ysdkPlayer && typeof ysdkPlayer.isAuthorized === 'function') isAuth = ysdkPlayer.isAuthorized();
    else if (ysdkPlayer && typeof ysdkPlayer.getMode === 'function') isAuth = ysdkPlayer.getMode() !== 'lite';
  } catch (e) {}
  try {
    const entries = await ysdk.leaderboards.getEntries('bestscore', { quantityTop: 10, includeUser: true, quantityAround: 3 });
    let authBanner = '';
    if (!isAuth) {
      authBanner = '<div style="margin-bottom:12px;text-align:center;">' +
        '<button type="button" class="btn btn-primary" onclick="document.getElementById(\'yandex-leaderboard-modal\').classList.remove(\'show\');doYandexAuth();">' +
        escapeHtml(w.t('authYandex')) + '</button></div>';
    }
    if (!entries || !entries.entries || entries.entries.length === 0) {
      body.innerHTML = authBanner + '<p class="modal-text">' + w.t('leaderboardEmpty') + '</p>';
      return;
    }
    let html = authBanner + '<div class="ach-group"><div class="ach-grid">';
    entries.entries.forEach(e => {
      const name = (e.player && e.player.publicName) || w.t('leaderboardPlayer');
      let avatarSrc = '';
      try {
        if (e.player && typeof e.player.getAvatarSrc === 'function') {
          avatarSrc = e.player.getAvatarSrc('small') || '';
        }
      } catch (err) {}
      const avatarHtml = avatarSrc
        ? '<img src="' + escapeHtml(avatarSrc) + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">'
        : (e.rank <= 3 ? '🏅' : '👤');
      const row = w.t('leaderboardRow')
        .replace('{rank}', e.rank)
        .replace('{score}', e.score);
      html += '<div class="ach-item unlocked"><div class="ach-icon">' +
        avatarHtml +
        '</div><div class="ach-text"><div class="ach-title">' + escapeHtml(name) +
        '</div><div class="ach-desc">' + escapeHtml(row) + '</div></div></div>';
    });
    html += '</div></div>';
    body.innerHTML = html;
  } catch (e) {
    console.warn('Yandex leaderboard error:', e);
    body.innerHTML = '<p class="modal-text" style="color:var(--danger);">' + w.t('leaderboardError') + '</p>';
  }
}

w.openYandexLeaderboard = openYandexLeaderboard;
async function getAllGames() {
  if (!isYandex || !ysdk || !ysdk.features || !ysdk.features.GamesAPI) return [];
  const data = await safeCall(() => ysdk.features.GamesAPI.getAllGames(), null, 'getAllGames');
  return (data && Array.isArray(data.games)) ? data.games : [];
}
async function getGameByID(appID) {
  if (!isYandex || !ysdk || !ysdk.features || !ysdk.features.GamesAPI) return null;
  const data = await safeCall(() => ysdk.features.GamesAPI.getGameByID(appID), null, 'getGameByID');
  return (data && data.isAvailable && data.game) ? data.game : null;
}
w.openAuthModal = openAuthModal;
w.closeAuthModal = closeAuthModal;
w.doYandexAuth = doYandexAuth;
w.updateAuthButton = updateAuthButton;
w.showShortcut = showShortcut;
w.canShowShortcut = canShowShortcut;
w.updateShortcutButton = updateShortcutButton;
w.getAllGames = getAllGames;
w.getGameByID = getGameByID;
let __syncResolve;
w.whenReady = new Promise(res => { __syncResolve = res; });
async function syncAllOnStart() {
  const DEFAULT_LVL = (w.Gating && w.Gating.DEFAULT_UNLOCKED) || [1001, 1002, 1003, 2001, 2002, 2003];
 try {
const [unlockedRaw, collectionRaw, starsRaw, totalRaw, gatingVerRaw, mapUnlockedRaw] = await Promise.all([
      storageGet('unlocked'), storageGet('collection'), storageGet('stars'), storageGetTotal(), storageGet('unlocked_v'), storageGet('map_unlocked')
    ]);
    const storedVer = asNumber(gatingVerRaw, 0);
    const CURRENT_VER = 5;
    let unlocked;
    if (storedVer < CURRENT_VER) {
      const storedUnlocked = asArray(unlockedRaw).map(Number).filter(n => !isNaN(n) && n > 0);
      unlocked = Array.from(new Set([...DEFAULT_LVL, ...storedUnlocked]));
      try { await storageSet('unlocked', unlocked); } catch (e) {}
      try { await storageSet('unlocked_v', CURRENT_VER); } catch (e) {}
      if (w.Gating && w.Gating._invalidate) w.Gating._invalidate();
      console.log('Gating upgrade → v' + CURRENT_VER, unlocked);
    } else {
      const storedUnlocked = asArray(unlockedRaw).map(Number).filter(n => !isNaN(n) && n > 0);
      unlocked = Array.from(new Set([...DEFAULT_LVL, ...storedUnlocked]));
      if (storedUnlocked.length !== unlocked.length) { try { await storageSet('unlocked', unlocked); } catch (e) {} }
    }
    const collection = asArray(collectionRaw).filter(x => typeof x === 'string');
    const stars = asObject(starsRaw);
    for (const k in stars) {
      const v = asNumber(stars[k], 0);
      stars[k] = Math.max(0, Math.min(3, v));
    }
    const total = asNumber(totalRaw, 0);
   const storedMapUnlocked = asArray(mapUnlockedRaw).map(Number).filter(n => !isNaN(n) && n > 0);
    const cleanedMapUnlocked = storedMapUnlocked.filter(n => (n !== 1 && n !== 1001) || Number(stars[n]) > 0);
    const mapUnlocked = Array.from(new Set([2001, ...cleanedMapUnlocked]));
    if (storedMapUnlocked.length !== mapUnlocked.length || !storedMapUnlocked.includes(2001)) {
      try { await storageSet('map_unlocked', mapUnlocked); } catch (e) {}
    }
  w.__SYNCED__ = { unlocked, collection, stars, total, mapUnlocked };
    if (w.Gating && w.Gating.loadUnlocked) { try { await w.Gating.loadUnlocked(true); } catch (e) {} }
    mergeTempUnlocks();
    await syncMaxMapLevel();
    updateCategoriesBtnVisibility();
    updateTotalScoreUI(total);
    console.log('Sync complete:', w.__SYNCED__);
  } catch (e) {
    console.warn('Sync failed:', e);
       w.__SYNCED__ = { unlocked: DEFAULT_LVL, collection: [], stars: {}, total: 0, mapUnlocked: [2001] };
  }
  if (__syncResolve) __syncResolve(w.__SYNCED__);
}
w.syncAllOnStart=syncAllOnStart;
let __readySent=false;
let __menuShown=false; function trySendLoadingReady(){ if (__readySent) return false; if (!isYandex || !ysdk || !ysdk.features || !ysdk.features.LoadingAPI) return false; try{ ysdk.features.LoadingAPI.ready(); __readySent=true; console.log('✅ Yandex LoadingAPI.ready() sent'); return true;} catch (e){ console.warn('LoadingAPI.ready() failed:', e); return false;}}
let __starsCreated = false;
function hideLoadingAndShowMenu(){
    if (typeof __bootWatchdogTimer !== 'undefined') clearTimeout(__bootWatchdogTimer);
    if (__menuShown) return;
    __menuShown=true;
    const loading=d.getElementById('loading-screen');
    if (loading){ loading.classList.add('hidden'); setTimeout(()=>{ loading.style.display='none';}, 400);}
    d.body.classList.add('app-ready');
    const root=d.getElementById('app-root');
    if (root) root.classList.add('visible');
    w.__appReady=true;
    trySendLoadingReady();
}
let __factListCache = null;
function getFactList() {
  if (__factListCache) return __factListCache;
  const list = [];
  (w.REGIONS || []).forEach(reg => {
    reg.levels.forEach(lvl => {
      const qz = (w.QUIZZES || {})[lvl.id];
      if (!qz || !Array.isArray(qz.questions)) return;
      qz.questions.forEach(qn => {
        list.push({ img: qn.img, name: w.L(qn.options[qn.answer]), desc: w.L(qn.description) });
      });
    });
  });
  __factListCache = list;
  return list;
}
function getMapLevels() {
  const photos = (w.PHOTO_LEVELS || [])
    .filter(lvl => !lvl.isFullSet)
    .map(lvl => ({ ...lvl, kind: 'photo' }));
  const themed = (w.THEMED_LEVELS || [])
    .filter(lvl => !lvl.isFullSet)
    .map(lvl => ({ ...lvl, kind: 'themed' }));
  const regions = [];
  (w.REGIONS || []).forEach(reg => {
    reg.levels.forEach(lvl => {
      if (!lvl.isFullSet) regions.push({ ...lvl, regionKey: reg.id, kind: 'region' });
    });
  });
  const others = themed.concat(regions);
  const list = [];
  const maxLen = Math.max(photos.length, others.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < photos.length) list.push(photos[i]);
    if (i < others.length) list.push(others[i]);
  }
  return list;
}
function getMaxOpenedMapLevel() {
  const mapUnlocked = (w.__SYNCED__ && Array.isArray(w.__SYNCED__.mapUnlocked))
    ? w.__SYNCED__.mapUnlocked
    : new Array();
  const mapUnlockedSet = new Set(mapUnlocked.map(Number));
  const starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  const mapLevels = getMapLevels();
  let maxNum = 0;
  mapLevels.forEach((lvl, idx) => {
    const nid = Number(lvl.id);
    if (mapUnlockedSet.has(nid) && Number(starsMap[nid]) >= 2) {
      maxNum = Math.max(maxNum, idx + 1);
    }
  });
  return maxNum;
}
w.getMaxOpenedMapLevel = getMaxOpenedMapLevel;
async function syncMaxMapLevel() {
  const maxNum = getMaxOpenedMapLevel();
  await storageSet('maxlvl', maxNum);
  if (w.StartMenu && typeof w.StartMenu.updateStats === 'function') {
    w.StartMenu.updateStats();
  }
  return maxNum;
}
function isLevel92Completed() {
  const mapLevels = getMapLevels();
  const lvl92 = mapLevels.item ? mapLevels.item(91) : mapLevels.slice(91, 92).pop();
  if (!lvl92) return false;
  const nid = Number(lvl92.id);
  const starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  return Number(starsMap[nid]) >= 2;
}
function updateCategoriesBtnVisibility() {
  const btn = d.getElementById('startCategoriesBtn');
  if (!btn) return;
  const unlocked = isLevel92Completed();
  btn.style.display = unlocked ? '' : 'none';
}
w.updateCategoriesBtnVisibility = updateCategoriesBtnVisibility;
async function unlockMapLevel(levelId) {
  const n = Number(levelId);
  if (!n || n <= 0) return false;
  const list = (w.__SYNCED__ && Array.isArray(w.__SYNCED__.mapUnlocked))
    ? w.__SYNCED__.mapUnlocked
    : new Array();
  if (!list.includes(n)) {
    list.push(n);
    if (w.__SYNCED__) w.__SYNCED__.mapUnlocked = list;
    await storageSet('map_unlocked', list);
    await syncMaxMapLevel();
    if (w.Ach && typeof w.Ach.checkAndUnlock === 'function') {
      await w.Ach.checkAndUnlock(false);
    }
  }
  return true;
}
const MAP_PATH_POINTS=[{x:12.9,y:10.8},{x:32.9,y:7.7},{x:33,y:8.6},{x:49.6,y:4.2},{x:47.9,y:7.9},{x:67.9,y:3.8},{x:66.5,y:6.9},{x:87.4,y:6.2},{x:74.6,y:11.6},{x:73.7,y:14.4},{x:52.5,y:13.6},{x:50.3,y:12.8},{x:28,y:15.1},{x:25,y:17.8},{x:53.1,y:22.9},{x:17.5,y:25.9},{x:18.3,y:22.7},{x:45.1,y:20},{x:46.6,y:17.8},{x:74.7,y:21.3},{x:81.1,y:17.3},{x:51,y:24.4},{x:28.8,y:25.6},{x:41,y:30.2},{x:49.1,y:28.6},{x:75.3,y:31.4},{x:81,y:30.2},{x:83.2,y:35.4},{x:56.1,y:34.7},{x:51.3,y:34.1},{x:25.9,y:35.8},{x:27.1,y:33.1},{x:5.4,y:34.7},{x:4.8,y:37.7},{x:2,y:41},{x:27.1,y:42.3},{x:31.3,y:40.8},{x:52.6,y:41.1},{x:52.9,y:42.3},{x:78.5,y:44.4},{x:76.3,y:40.7},{x:94.4,y:44.4},{x:76.2,y:47.5},{x:69.5,y:48.1},{x:48.4,y:47.9},{x:46.7,y:47.7},{x:23.9,y:53.4},{x:22.5,y:51.6},{x:8.2,y:46.4},{x:8.2,y:48},{x:4.2,y:54.9},{x:4.9,y:57.9},{x:6.3,y:60.8},{x:34.6,y:58.4},{x:35.3,y:53.7},{x:60.5,y:53},{x:61.1,y:56.1},{x:86.8,y:55.7},{x:84.9,y:59.3},{x:80.3,y:60.3},{x:49.1,y:58.3},{x:43.5,y:60.9},{x:44.3,y:63.1},{x:74.8,y:63.8},{x:78.5,y:63.2},{x:82.5,y:68.8},{x:53.3,y:65.9},{x:39.8,y:66},{x:19.1,y:63.7},{x:19.2,y:67.9},{x:2.4,y:72.1},{x:28.1,y:73.2},{x:32.3,y:71.6},{x:63.1,y:72.1},{x:64.4,y:73.9},{x:90.5,y:73.6},{x:56.8,y:77.4},{x:50.9,y:74},{x:10.5,y:77.7},{x:5.2,y:77.2},{x:39.5,y:80.2},{x:73,y:81.8},{x:74.7,y:82.3},{x:68.7,y:86.8},{x:40.1,y:87.9},{x:37.3,y:83},{x:73.3,y:91.2},{x:62.8,y:92.6},{x:56.7,y:97},{x:49,y:96.3},{x:24.6,y:94.3},{x:20.1,y:93.2}];
async function renderMap() {
  const container = d.getElementById('map-nodes');
  const player = d.getElementById('map-player');
  if (!container || !player) return;
  const colArr = (w.__SYNCED__ && w.__SYNCED__.collection) || [];
  const allIds = new Set();
  (w.REGIONS || []).forEach(reg => {
    reg.levels.forEach(lvl => {
      const qz = (w.QUIZZES || {})[lvl.id];
      if (!qz) return;
      qz.questions.forEach(qn => allIds.add(w.getAnimalId(qn.img)));
    });
  });
  const mapColEl = d.querySelector('[data-map-col-count]');
  if (mapColEl) mapColEl.textContent = Math.min(colArr.length, allIds.size);
  await w.Ach.checkAndUnlock(true);
  const achItems = await w.Ach.list();
  const mapAchBadge = d.getElementById('map-ach-badge');
  if (mapAchBadge) mapAchBadge.textContent = achItems.filter(i => i.unlocked).length;
  container.innerHTML = '';
  const mapUnlocked = (w.__SYNCED__ && w.__SYNCED__.mapUnlocked) || Array.of(2001);
  const mapUnlockedSet = new Set(mapUnlocked.map(Number));
  const starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  const mapLevels = getMapLevels();
  let lastUnlockedIdx = 0;
  mapLevels.forEach((lvl, idx) => {
    if (mapUnlockedSet.has(Number(lvl.id))) lastUnlockedIdx = idx;
  });
  let playerIdx = lastUnlockedIdx;
  if (w.__mapSelectedLevelId != null) {
    const selIdx = mapLevels.findIndex(l => Number(l.id) === Number(w.__mapSelectedLevelId));
    if (selIdx !== -1 && mapUnlockedSet.has(Number(mapLevels[selIdx].id))) {
      playerIdx = selIdx;
    }
  }
  const mapPlayBtn = d.getElementById('map-play-btn');
  if (mapPlayBtn && mapLevels[lastUnlockedIdx]) {
    const curLvl = mapLevels[lastUnlockedIdx];
    const curId = Number(curLvl.id);
    const curStars = Math.floor(Number(starsMap[curId]) || 0);
    const nextIdx = lastUnlockedIdx + 1;
    const nextLvl = nextIdx < mapLevels.length ? mapLevels[nextIdx] : null;
    const nextPreUnlocked = nextLvl && !mapUnlockedSet.has(Number(nextLvl.id)) && curStars >= 2;
    mapPlayBtn.onclick = () => {
      if (nextPreUnlocked) {
        showMapUnlockAdModal(nextLvl, nextIdx);
      } else {
        pushRoute({ name: 'quiz', levelId: curId, fromMap: true });
      }
    };
  }
  mapLevels.forEach((lvl, idx) => {
    const nid = Number(lvl.id);
    const isOpen = mapUnlockedSet.has(nid);
    const stars = Math.max(0, Math.min(3, Math.floor(Number(starsMap[nid]) || 0)));
    const isCompleted = isOpen && starsMap[nid] != null;
    const isCurrent = idx === lastUnlockedIdx;
    const prevLvl = idx > 0 ? mapLevels[idx - 1] : null;
    const prevStars = prevLvl ? Math.floor(Number(starsMap[Number(prevLvl.id)]) || 0) : 0;
    const isPrevOpen = prevLvl ? mapUnlockedSet.has(Number(prevLvl.id)) : true;
    const isPreUnlocked = !isOpen && isPrevOpen && prevStars >= 2;
    const node = d.createElement('div');
    node.className = 'map-node';
    node.dataset.levelId = nid;
    const pt = MAP_PATH_POINTS[idx];
    if (pt) {
      node.style.left = pt.x + '%';
      node.style.top = pt.y + '%';
    }
    if (isCompleted) {
      node.classList.add('completed');
    } else if (isOpen) {
      node.classList.add('unlocked');
      if (isCurrent) node.classList.add('current');
    } else if (isPreUnlocked) {
      node.classList.add('pre-unlocked');
    } else {
      node.classList.add('locked');
    }
    const qz = (w.QUIZZES || {})[nid];
    const icon = lvl.icon || (qz && qz.questions && qz.questions[0] ? '⛰️' : '❓');
    if (!isOpen && !isPreUnlocked) {
      node.innerHTML = lockedIcon('1.2em');
    } else {
      node.textContent = icon;
    }
    if (isCompleted) {
      const starsEl = d.createElement('div');
      starsEl.className = 'map-node-stars' + (stars > 0 ? ' has-stars' : '');
      starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      node.appendChild(starsEl);
    } else if (isPreUnlocked) {
      const adBadge = d.createElement('div');
      adBadge.className = 'map-node-stars';
      adBadge.innerHTML = tvIcon('1em');
      node.appendChild(adBadge);
    }
    node.addEventListener('click', () => handleMapNodeClick(lvl, idx, mapLevels, isPreUnlocked));
    container.appendChild(node);
  });
  requestAnimationFrame(() => positionPlayer(player, playerIdx, false));
  const progressFill = d.getElementById('map-progress-fill');
  if (progressFill) {
    const progress = mapLevels.length > 0 ? ((lastUnlockedIdx + 1) / mapLevels.length) * 100 : 0;
    progressFill.style.width = progress + '%';
  }
  renderDailyBadge();
}
function positionPlayer(playerEl, nodeIndex, animate) {
  w.__lastMapNodeIdx = nodeIndex;
  const canvas = d.getElementById('map-canvas');
  const container = d.getElementById('map-nodes');
  if (!canvas || !container || !playerEl) return;
  const nodes = container.querySelectorAll('.map-node');
  const target = nodes[nodeIndex];
  if (!target) return;
  playerEl.style.transition = animate
    ? 'left 0.45s cubic-bezier(.22,1,.36,1), top 0.45s cubic-bezier(.22,1,.36,1)'
    : 'none';
  const canvasRect = canvas.getBoundingClientRect();
  const nodeRect = target.getBoundingClientRect();
  const playerW = playerEl.offsetWidth || 44;
  const playerH = playerEl.offsetHeight || 44;
  const gap = 4; 
  let left = nodeRect.right - canvasRect.left + gap;
  if (left + playerW > canvasRect.width - 4) {
    left = Math.max(4, nodeRect.left - canvasRect.left - playerW - gap);
  }
  const top = (nodeRect.top - canvasRect.top) + (nodeRect.height - playerH) / 2;
  playerEl.style.left = Math.round(left) + 'px';
  playerEl.style.top = Math.round(top) + 'px';
}
let __mapResizeTimer = null;
w.addEventListener('resize', () => {
  if (currentPage !== 'map') return;
  clearTimeout(__mapResizeTimer);
  __mapResizeTimer = setTimeout(() => {
    const playerEl = d.getElementById('map-player');
    if (playerEl && typeof w.__lastMapNodeIdx === 'number') {
      positionPlayer(playerEl, w.__lastMapNodeIdx, false);
    }
  }, 150);
});
function showMapLockedModal() {
  let modal = d.getElementById('mapLockedModal');
  if (!modal) {
    modal = d.createElement('div');
    modal.id = 'mapLockedModal';
    modal.className = 'modal';
    d.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div class="modal-content modal-narrow">' +
      '<button type="button" class="modal-close" data-act="close" aria-label="close">×</button>' +
      '<img src="icons/cat.png" alt="" class="map-locked-sprite">' +
      '<h2 class="modal-title">' + escapeHtml(w.t('mapLockedTitle')) + '</h2>' +
      '<p class="modal-text">' + escapeHtml(w.t('mapLockedDesc')) + '</p>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn-primary" data-act="ok" style="width:100%;">' + escapeHtml(w.t('okBtn')) + '</button>' +
      '</div>' +
    '</div>';
  const close = () => modal.classList.remove('show');
  modal.querySelector('[data-act="close"]').onclick = close;
  modal.querySelector('[data-act="ok"]').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  modal.classList.add('show');
}
function showMapUnlockAdModal(lvl, idx) {
  const nid = Number(lvl.id);
  let modal = d.getElementById('mapUnlockAdModal');
  if (!modal) {
    modal = d.createElement('div');
    modal.id = 'mapUnlockAdModal';
    modal.className = 'modal';
    d.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div class="modal-content modal-narrow">' +
      '<button type="button" class="modal-close" data-act="close" aria-label="close">×</button>' +
      '<div class="modal-emoji" id="mapUnlockAdIcon"></div>' +
      '<h2 class="modal-title">' + escapeHtml(w.t('readyTitle')) + '</h2>' +
      '<p class="modal-text">' + escapeHtml(w.t('mapUnlockAdDesc')) + '</p>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn-primary" data-act="watch">' +
          tvIcon('1.2em') + ' <span>' + escapeHtml(w.t('watchBtn')) + '</span>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" data-act="cancel">' + escapeHtml(w.t('cancelBtn')) + '</button>' +
      '</div>' +
    '</div>';
  const close = () => modal.classList.remove('show');
  modal.querySelector('[data-act="close"]').onclick = close;
  modal.querySelector('[data-act="cancel"]').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  const iconBox = modal.querySelector('#mapUnlockAdIcon');
  if (iconBox) iconBox.textContent = lvl.icon || '🐾';
  const watchBtn = modal.querySelector('[data-act="watch"]');
  watchBtn.disabled = false;
  watchBtn.innerHTML = tvIcon('1.2em') + ' <span>' + escapeHtml(w.t('watchBtn')) + '</span>';
  watchBtn.onclick = async () => {
    if (watchBtn.disabled) return;
    watchBtn.disabled = true;
    const prevHtml = watchBtn.innerHTML;
    watchBtn.textContent = w.t('loadingAd');
    let ok = false;
    try {
      ok = await w.showRewardedAd();
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      if (watchBtn.isConnected) {
        watchBtn.disabled = false;
        watchBtn.innerHTML = prevHtml;
      }
      return;
    }
    modal.classList.remove('show');
    await unlockMapLevel(nid);
    playOgg('buy_cat');
    toast(w.t('levelOpenedToast'));
    await renderMap();
    const player = d.getElementById('map-player');
    if (player) {
      positionPlayer(player, idx, true);
    }
  };
  modal.classList.add('show');
}
async function handleMapNodeClick(lvl, idx, mapLevels, isPreUnlocked) {
  const nid = Number(lvl.id);
  const mapUnlocked = (w.__SYNCED__ && w.__SYNCED__.mapUnlocked) || Array.of(2001);
  const mapUnlockedSet = new Set(mapUnlocked.map(Number));
  if (mapUnlockedSet.has(nid)) {
    w.__mapSelectedLevelId = nid;
    const player = d.getElementById('map-player');
    if (player) positionPlayer(player, idx, true);
    pushRoute({ name: 'quiz', levelId: nid, fromMap: true });
    return;
  }
  if (!isPreUnlocked) {
    showMapLockedModal();
    return;
  }
  showMapUnlockAdModal(lvl, idx);
}
w.renderMap = renderMap;
async function renderIndex(){ const colArr=(w.__SYNCED__ && w.__SYNCED__.collection) || [];
const animalId = w.getAnimalId;
 const allIds=new Set(); 
 (w.REGIONS || []).forEach(reg=>{ reg.levels.forEach(lvl=>{ const qz=(w.QUIZZES ||{})[lvl.id]; if (!qz) return; qz.questions.forEach(qn=>allIds.add(animalId(qn.img)))})}); const totalAnimals=allIds.size; const haveAnimals=Math.min(colArr.length, totalAnimals); const colEl=d.querySelector('[data-col-count]'); if (colEl) colEl.textContent=haveAnimals; 
 await w.Ach.checkAndUnlock(true);
const items=await w.Ach.list();
const opened=items.filter(i=>i.unlocked).length;
const badge=d.getElementById('ach-badge');
if (badge) badge.textContent=opened; 
const animals = getFactList();
if (animals.length){ const dt=new Date(); 
const day = Math.floor(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 86400000);
const seed = (day * 2654435761) >>> 0;
const item = animals[seed % animals.length];  
  const fi=d.getElementById('fact-img'); const fn=d.getElementById('fact-name'); const fd=d.getElementById('fact-desc'); if (fi){ fi.src=item.img; fi.alt=item.name} if (fn) fn.textContent=item.name; if (fd) fd.textContent=item.desc; const fb=d.getElementById('fact-block'); if (fb) fb.hidden=false} const holder=d.getElementById('regions'); if (!holder) return; holder.innerHTML='';
 const unlocked=(w.__SYNCED__ && w.__SYNCED__.unlocked) || [];
const unlockedSet=new Set(unlocked.map(Number));
const __now = Date.now();
for (const k in MECH.purchased) if (MECH.purchased[k]) unlockedSet.add(Number(k));
for (const k in MECH.tempUnlocks) if (MECH.tempUnlocks[k] > __now) unlockedSet.add(Number(k));
   const starsMap=asObject(w.__SYNCED__ && w.__SYNCED__.stars); const starsHtml=levelId=>{ const s=Math.max(0,Math.min(3,Math.floor(Number(starsMap[levelId])||0))); return '<span class="stars' + (s>0?' has-stars':'') + '">' + '★'.repeat(s) + '☆'.repeat(3 - s) + '</span>'}; 
  const renderLevelCard=(l, qz, container)=>{ const isOpen=unlockedSet.has(Number(l.id)); const el=d.createElement('button'); el.type='button';
el.className = 'level-card' + (isOpen ? '' : ' locked');
    if (isOpen) el.dataset.href='#/quiz/' + l.id;
    const adTitle=escapeHtml(w.t('titleAd'));     
const _price = getLevelPrice(Number(l.id));
const _ptsHtml = ptsIcon('1.1em');
const isThreeStars = Math.floor(Number(starsMap[l.id]) || 0) >= 3;
const actionsHtml = !isOpen
  ? '<div class="level-actions"><span class="level-price">' + _ptsHtml + ' ' + _price + '</span></div>'
  : (isThreeStars ? '<div class="level-actions"><span class="level-open">▶</span></div>' : '');
const qCount = (qz && qz.questions) ? qz.questions.length : (l.count || 0);
el.innerHTML='<span class="level-name">' + (l.icon ? l.icon + ' ' : '') + escapeHtml(w.L(l.name)) + '</span><span class="level-meta">' + qCount + ' ' + w.t('questions') + '</span>' + starsHtml(l.id) + actionsHtml; if (!isOpen){ el.addEventListener('click', ()=>{ w.Gating.showUnlockModal(l.id, ()=>{ if (!el.parentNode){ if (currentPage==='index') renderIndex(); return;} 
const a=d.createElement('button'); a.type='button'; a.className='level-card'; a.dataset.href='#/quiz/' + l.id; a.innerHTML='<span class="level-name">' + (l.icon ? l.icon + ' ' : '') + escapeHtml(w.L(l.name)) + '</span>' + '<span class="level-meta">' + qCount + ' ' + w.t('questions') + '</span>' + starsHtml(l.id); el.replaceWith(a);});});} container.appendChild(el)};
const OPEN_KEY=storageKey('cat_open'); let openState={}; try{ const raw=safeLocalGet(OPEN_KEY); if (raw) openState=JSON.parse(raw) ||{}} catch (e){} const saveOpenState=()=>{ try{ safeLocalSet(OPEN_KEY, JSON.stringify(openState))} catch (e){}}; const makeSection=(titleHtml, sectionKey)=>{ const sec=d.createElement('section');
sec.className = 'card collapsible';
 if (openState[sectionKey]) sec.classList.add('open'); const header=d.createElement('button'); header.type='button'; header.className='region-title collapsible-header'; header.innerHTML='<span>' + titleHtml + '</span><span class="toggle-arrow">▼</span>'; header.addEventListener('click', ()=>{ sec.classList.toggle('open'); openState[sectionKey]=sec.classList.contains('open'); saveOpenState()}); const body=d.createElement('div'); body.className='collapsible-body'; const grid=d.createElement('div'); grid.className='levels'; body.appendChild(grid); sec.appendChild(header); sec.appendChild(body); return{ sec, grid}}; if (Array.isArray(w.THEMED_LEVELS) && w.THEMED_LEVELS.length){ const{ sec, grid}=makeSection( '🎨 ' + w.L({ ru: 'Тематические викторины', en: 'Themed quizzes', tr: 'Tematik testler'}), 'themed' ); const themedSorted=[...w.THEMED_LEVELS].sort((a, b)=>{ const ao=unlockedSet.has(Number(a.id)) ? 0 : 1; const bo=unlockedSet.has(Number(b.id)) ? 0 : 1; return ao - bo});
themedSorted.forEach(l => { renderLevelCard(l, (w.QUIZZES || {})[l.id], grid); });
  if (grid.children.length) holder.appendChild(sec)} if (Array.isArray(w.PHOTO_LEVELS) && w.PHOTO_LEVELS.length){ const{ sec, grid}=makeSection( '🎯 ' + w.L({ ru: 'Фото-викторины', en: 'Photo quizzes', tr: 'Foto testler'}), 'photo' ); const photoSorted=[...w.PHOTO_LEVELS].sort((a, b)=>{ const ao=unlockedSet.has(Number(a.id)) ? 0 : 1; const bo=unlockedSet.has(Number(b.id)) ? 0 : 1; return ao - bo});
 photoSorted.forEach(l => { renderLevelCard(l, (w.QUIZZES || {})[l.id], grid); });
  if (grid.children.length) holder.appendChild(sec)} (w.REGIONS || []).forEach(reg=>{ const{ sec, grid}=makeSection( reg.icon + ' ' + escapeHtml(w.L(reg.name)), 'region_' + reg.id ); reg.levels.forEach(l=>{ const qz=(w.QUIZZES ||{})[l.id]; renderLevelCard(l, qz, grid)}); holder.appendChild(sec)})
renderDailyBadge();
renderProgress();
}
async function renderQuiz(levelId){
  const curRoute = parseHash();
  const fallbackPage = isLevel92Completed() ? 'index' : 'map';
  const originPage = (curRoute && curRoute.fromPage && curRoute.fromPage !== 'quiz')
    ? curRoute.fromPage
    : (curRoute && curRoute.fromMap ? 'map' : fallbackPage);
  const originStartMenu = Boolean(curRoute && curRoute.fromStartMenu);
  w.__quizFromMap = originPage === 'map';
  const returnToOrigin = (replace) => {
    pushRoute({ name: originPage, startMenuOpen: originStartMenu }, Boolean(replace));
  };
  ['lock-home-btn', 'quiz-start-home-btn', 'home-btn'].forEach(btnId => {
    const btn = d.getElementById(btnId);
    if (btn) btn.onclick = () => returnToOrigin(false);
  });
  const nid=Number(levelId);
if (nid === DAILY_ID) {
  ensureDaily();
  if (MECH && MECH.daily && MECH.daily.completed) {
    w.__autoStartQuiz = false;
    returnToOrigin(true);
    return null;
  }
  const qs = getDailyQuestions();
  if (!qs.length) { w.__autoStartQuiz = false; returnToOrigin(true); return null; }
  w.QUIZZES[DAILY_ID] = {
    regionKey: 'daily',
    sub: { ru: 'Вызов дня', en: 'Daily challenge', tr: 'Günlük meydan okuma' },
    questions: qs
  };
}
if (nid >= 1000 && nid !== DAILY_ID && nid !== 88888) {
  const single = buildSingleThemedQuiz(nid);
  if (single) w.QUIZZES[nid] = single;
}
  const quiz = (w.QUIZZES || {})[String(levelId)];
  if (!quiz) { w.__autoStartQuiz = false; returnToOrigin(true); return null; }
 const $=(s)=>d.querySelector(s); 
 const state={ order: [], index: 0, score: 0, correctCount: 0, answers: 0, timeLeft: 0, maxTime: 10, timerId: null, answered: false, finished: false, streak: 0, maxStreak: 0, fastestCorrect: 99, timeouts: 0, roundCollection: new Set(), used5050: false,
  currentLevel: 1};
   const homeScreen=$('#home-screen'); const quizScreen=$('#quiz-screen'); const resultScreen=$('#result-screen'); const lockScreen=$('#lock-screen'); const screens=[homeScreen, quizScreen, resultScreen, lockScreen]; const show=el=>screens.forEach(s=>s && s.classList.toggle('active', s===el)); const animalId = w.getAnimalId; const calcStars=percent=>{ if (percent >=90) return 3; if (percent >=70) return 2; if (percent >=50) return 1; return 0;
  };
const region = (w.REGIONS || []).find(r => r.id === quiz.regionKey);
const badgeEl = $('#home-region');
if (badgeEl) {
if (region) {
    badgeEl.textContent = (region.icon ? region.icon + ' ' : '') + w.L(region.name);
    badgeEl.style.display = '';
} else if (quiz.regionKey === 'daily') {
    badgeEl.textContent = '🎁 ' + w.L({ ru: 'Вызов дня', en: 'Daily challenge', tr: 'Günlük meydan okuma' });
    badgeEl.style.display = '';
} else if (quiz.regionKey === 'tutorial') {
    badgeEl.textContent = '🎓 ' + w.L({ ru: 'Обучение', en: 'Tutorial', tr: 'Öğretici' });
    badgeEl.style.display = '';
} else {
    const nid = Number(levelId);
    const themedLevel = (w.THEMED_LEVELS || []).find(l => Number(l.id) === nid);
    const photoLevel  = (w.PHOTO_LEVELS  || []).find(l => Number(l.id) === nid);
    if (themedLevel) {
      badgeEl.textContent = '🎨 ' + w.L({ ru: 'Тематическая викторина', en: 'Themed quiz', tr: 'Tematik test' });
      badgeEl.style.display = '';
    } else if (photoLevel) {
      badgeEl.textContent = '🎯 ' + w.L({ ru: 'Фото-викторина', en: 'Photo quiz', tr: 'Foto test' });
      badgeEl.style.display = '';
    } else {
      badgeEl.textContent = '';
      badgeEl.style.display = 'none';
    }
}
}
$('#home-title').textContent = quiz.sub ? w.L(quiz.sub) : '';
const _nid = Number(levelId);
const _lvl = (w.THEMED_LEVELS || []).find(l => Number(l.id) === _nid)
          || (w.PHOTO_LEVELS  || []).find(l => Number(l.id) === _nid);
const _emojiEl = $('#home-emoji');
if (_emojiEl) {
  if (_lvl && _lvl.icon) {
    _emojiEl.textContent = _lvl.icon;
  } else {
    _emojiEl.innerHTML = (w.UiSprite && typeof w.UiSprite.html === 'function')
      ? w.UiSprite.html('mountain', '1em')
      : '⛰️';
  }
  _emojiEl.style.display = '';
}
$('#home-count').textContent = quiz.questions.length;
  const starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  const starsCount = Math.max(0, Math.min(3, Math.floor(Number(starsMap[levelId]) || 0)));
  const hStars = $('#home-stars');
  if (hStars) {
    hStars.textContent = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
    hStars.classList.toggle('has-stars', starsCount > 0);
  }
  const mapUnlockedList = (w.__SYNCED__ && w.__SYNCED__.mapUnlocked) || Array.of(2001);
  const isOpenedOnMap = mapUnlockedList.map(Number).includes(Number(levelId));
  const gateUnlocked = isOpenedOnMap || (await w.Gating.isUnlocked(levelId));
  if (!gateUnlocked) w.__autoStartQuiz = false;
  if (w.__autoStartQuiz && gateUnlocked) {
    show(quizScreen);
  } else {
    show(gateUnlocked ? homeScreen : lockScreen);
  }
$('#lock-watch-btn').onclick = () => {
    showPurchaseModal(levelId, () => { show(homeScreen); });
};
  const shuffle = arr => {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
function startQuiz() {
  if (Number(levelId) === DAILY_ID && MECH && MECH.daily && MECH.daily.completed) {
    returnToOrigin(false);
    return;
  }
  if (Number(levelId) >= 1000 && Number(levelId) !== 88888) {
    const fresh = buildSingleThemedQuiz(Number(levelId));
    if (fresh && Array.isArray(fresh.questions) && fresh.questions.length) {
      quiz.questions = fresh.questions;
    }
  }
  state.order = shuffle(quiz.questions.map((_, i) => i));
  state.index = 0; state.score = 0; state.correctCount = 0; state.answers = 0;
  state.answered = true;
  state.finished = false; state.streak = 0;
  state.maxStreak = 0; state.fastestCorrect = 99; state.timeouts = 0;
  state.roundCollection = new Set();
  let mapNodeNum = null;
  if (w.__quizFromMap) {
    const mapIdx = getMapLevels().findIndex(l => Number(l.id) === Number(levelId));
    if (mapIdx !== -1) mapNodeNum = mapIdx + 1;
  }
  show(quizScreen);
  renderBonusCounter();
  renderQuestion(true);
  state.answered = true;
  const __isTut = Number(levelId) === 88888;
  if (!__isTut && typeof w.showLevelSequence === 'function') {
    w.showLevelSequence(mapNodeNum, () => {
      state.answered = false;
      if (isYandex) yandexGameplayStart();
      startTimer();
    });
  } else {
    state.answered = false;
    if (isYandex) yandexGameplayStart();
    startTimer();
  }
}
function renderQuestion(skipTimer) {
    state.answered = false;
    const cur = quiz.questions[state.order[state.index]];
 if (!cur){ if (state.index >=quiz.questions.length - 1) return finishQuiz(); state.index++; return renderQuestion();}
    $('#counter').textContent = (state.index + 1) + ' / ' + quiz.questions.length;
    $('#score-val').textContent = state.score;
    $('#progress-fill').style.width = (state.index / quiz.questions.length * 100) + '%';
    const imgEl = $('#question-img');
    const txtEl = $('#question-text');
    const box = $('#options');
    if (!box) return;
    box.innerHTML = '';
    const isPhoto = quiz.mode === 'photo';
    const bodyEl = d.querySelector('.quiz-body');
    if (bodyEl) bodyEl.classList.toggle('photo-mode', isPhoto);
    if (isPhoto) {
      if (imgEl) { imgEl.hidden = true; imgEl.removeAttribute('src'); }
      if (txtEl) { txtEl.hidden = false; txtEl.textContent = w.L(cur.name) || '—'; }
      box.classList.add('photo-options');
      box.classList.toggle('cols-2', (cur.images || []).length === 2);
      if (!Array.isArray(cur.images) || cur.images.length === 0) {
        console.warn('Photo question has no images');
        state.answers++; state.timeouts++; return finishQuestion();
      }
 cur.images.forEach((src, i)=>{ const b=d.createElement('button'); b.type='button'; b.className='option photo-option'; b.dataset.i=i; const im=d.createElement('img'); im.src=src; im.alt='';
im.onerror=function (){ this.style.opacity='.3'; this.style.background='linear-gradient(135deg,#ffe3ef 0%,#e6e1ff 100%)'; this.alt='🐾';};
        b.appendChild(im);
        b.addEventListener('click', () => selectOption(i));
        box.appendChild(b);
      });
    } else {
 if (txtEl){ txtEl.hidden=true; txtEl.textContent='';} if (imgEl){ imgEl.hidden=false; imgEl.style.opacity=''; imgEl.src=cur.img || ''; imgEl.alt=''; imgEl.onerror=function (){ this.style.opacity='.25'; this.style.background='linear-gradient(135deg,#ffe3ef 0%,#e6e1ff 100%)'; this.alt='🐾';};
        imgEl.onload = function () { this.style.opacity = ''; };
      }
      box.classList.remove('photo-options', 'cols-2');
      const opts = Array.isArray(cur.options) ? cur.options : [];
      opts.forEach((opt, i) => {
        const b = d.createElement('button');
        b.type = 'button';
        b.className = 'option';
        b.textContent = w.L(opt) || '—';
        b.dataset.i = i;
        b.addEventListener('click', () => selectOption(i));
        box.appendChild(b);
      });
    }
    const desc = $('#description');
    if (desc) { desc.hidden = true; desc.textContent = ''; }
    const nb = $('#next-btn');
 if (nb){ nb.hidden=true; nb.textContent=(state.index >=quiz.questions.length - 1) ? w.t('results') : w.t('next');}
try{ const nextIdx=state.order[state.index + 1]; if (nextIdx !=null){ const nextQ=quiz.questions[nextIdx]; if (nextQ){ if (Array.isArray(nextQ.images)){ nextQ.images.forEach(src=>{ const im=new Image(); im.src=src;});} else if (nextQ.img){ const im=new Image(); im.src=nextQ.img;}}}} catch (e){}
    state.used5050 = false;
    state.maxTime = 10;
    const hintBtn = $('#hint-btn');
    if (hintBtn) hintBtn.disabled = (Number(levelId) === 88888);
    if (!skipTimer) {
      startTimer();
    } else {
      state.timeLeft = 10;
      updateTimer();
    }
  }
  function startTimer() {
    stopTimer();
    state.maxTime = 10;
    state.timeLeft = 10;
    updateTimer();
    if (Number(levelId) === 88888) return;
    state.timerId = setInterval(() => {
      if (state.timeLeft <= 0) { stopTimer(); timeUp(); return; }
      state.timeLeft--;
      updateTimer();
       if (state.timeLeft > 0 && state.timeLeft <= 3 && w.Sound && typeof w.Sound.playTick === 'function') {
        w.Sound.playTick(state.timeLeft);
      }
      if (state.timeLeft <= 0) { stopTimer(); timeUp(); }
    }, 1000);
  }
  function updateTimer() {
    const maxT = Math.max(10, state.maxTime || 10);
    const val = Math.max(0, Math.min(maxT, state.timeLeft));
    const valEl = document.getElementById('timer-val');
    const fillEl = document.getElementById('timer-fill');
    const timerEl = document.getElementById('timer');
    if (valEl) valEl.textContent = val;
    if (fillEl) fillEl.style.width = (val / maxT) * 100 + '%';
    if (timerEl) timerEl.classList.toggle('warning', val <= 5);
  }
  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }
  function selectOption(i) {
    if (state.answered) return;
    const clickedBtn = d.querySelector(`#options .option[data-i="${i}"]`);
    if (clickedBtn && (clickedBtn.disabled || clickedBtn.classList.contains('disabled'))) return;
    state.answered = true;
    stopTimer();
    const cur = quiz.questions[state.order[state.index]];
    const correct = cur.answer;
    const optCount = quiz.mode === 'photo' ? (Array.isArray(cur.images) ? cur.images.length : 0) : (Array.isArray(cur.options) ? cur.options.length : 0);
    if (typeof correct !== 'number' || optCount === 0 || correct < 0 || correct >= optCount) {
      console.warn('Invalid answer index:', correct);
      state.answers++;
      finishQuestion();
      return;
    }
    const isRight = (i === correct);
    Array.from(d.querySelectorAll('#options .option')).forEach(o => {
      o.classList.add('disabled');
      const idx = +o.dataset.i;
      if (isRight && idx === correct) o.classList.add('correct');
      else if (!isRight && idx === i) o.classList.add('wrong');
    });
    try { (i === correct) ? w.Sound.playCorrect() : w.Sound.playWrong(); } catch (e) {}
if (i === correct) {
  state.correctCount++;
  playConfetti(getConfettiCount());
  state.score++;
  const __isTutorialQ = Number(levelId) === 88888;
  const bonus = __isTutorialQ ? 0 : onCorrectAnswer();
  if (bonus > 0) state.score += bonus;
  $('#score-val').textContent = state.score;
  if (!__isTutorialQ) {
    const delta = Math.max(0, (Number(state.score) || 0) - (Number(state.creditedScore) || 0));
    if (delta > 0) {
      state.creditedScore = Number(state.score) || 0;
      const prevTotal = Number((w.__SYNCED__ && w.__SYNCED__.total) != null ? w.__SYNCED__.total : w.score) || 0;
      const nextTotal = prevTotal + delta;
      if (w.__SYNCED__) w.__SYNCED__.total = nextTotal;
      w.score = nextTotal;
      if (typeof w.updateTotalScoreUI === 'function') w.updateTotalScoreUI(nextTotal);
      storageSetTotal(nextTotal).catch(() => {});
    }
  }
  const id = cur.animalId || animalId(cur.img || (cur.images && cur.images[cur.answer]) || '');
  if (id && !__isTutorialQ) {
    state.roundCollection.add(id);
    if (w.__SYNCED__) {
      if (!Array.isArray(w.__SYNCED__.collection)) w.__SYNCED__.collection = [];
      if (!w.__SYNCED__.collection.includes(id)) {
        w.__SYNCED__.collection.push(id);
        w.storageSet('collection', w.__SYNCED__.collection).catch(() => {});
      }
    }
  }
  const timeSpent = Math.max(0, (state.maxTime || 10) - Math.max(0, state.timeLeft));
  if (timeSpent < state.fastestCorrect) state.fastestCorrect = timeSpent;
  state.streak++;
  if (state.streak > state.maxStreak) state.maxStreak = state.streak;
} else state.streak = 0;
       state.answers++;
    finishQuestion(isRight);
  }
function timeUp() {
  if (state.answered) return;
  state.answered = true;
  const cur = quiz.questions[state.order[state.index]];
  const optCount = quiz.mode === 'photo'
    ? (Array.isArray(cur && cur.images) ? cur.images.length : 0)
    : (Array.isArray(cur && cur.options) ? cur.options.length : 0);
  if (!cur || typeof cur.answer !== 'number' || optCount === 0 || cur.answer < 0 || cur.answer >= optCount) {
    console.warn('Invalid answer index in timeUp');
    state.answers++;
    state.timeouts++;
    state.streak = 0;
    finishQuestion(false);
    return;
  }
  Array.from(d.querySelectorAll('#options .option')).forEach(o => {
    o.classList.add('disabled');
  });
  try { w.Sound.playWrong(); } catch (e) {}
  state.answers++;
  state.timeouts++;
  state.streak = 0;
  finishQuestion(false);
}
  function finishQuestion(isRight) {
    const cur = quiz.questions[state.order[state.index]];
    const dEl = $('#description');
    if (dEl) {
      if (isRight && cur && cur.description) {
        dEl.textContent = w.L(cur.description);
        dEl.hidden = false;
      } else {
        dEl.textContent = '';
        dEl.hidden = true;
      }
    }
    const hintBtn = $('#hint-btn');
    if (hintBtn) hintBtn.disabled = true;
    $('#next-btn').hidden = false;
  }
function nextQuestion() {
  if (state.index >= quiz.questions.length - 1) return finishQuiz();
  state.index++;
  renderQuestion();
}
async function finishQuiz() {
  if (state.finished) return;
  state.finished = true;
  const finishedState = state;
  stopTimer();
  try { w.Sound.playFanfare(); } catch (e) {}
  show(resultScreen);
  if (isYandex) yandexGameplayStop();
  const confettiEl = d.querySelector('.result-confetti');
  if (confettiEl) {
    confettiEl.style.animation = 'none';
    void confettiEl.offsetWidth;
    confettiEl.style.animation = '';
  }
  const total = quiz.questions.length;
  const pct = total > 0 ? Math.round((finishedState.correctCount / total) * 100) : 0;
  const earnedStars = calcStars(pct);
  $('#res-total').textContent = total;
  $('#res-correct').textContent = finishedState.correctCount;
  $('#res-wrong').textContent = finishedState.answers - finishedState.correctCount;
  $('#res-percent').textContent = pct + '%';
  const starsEl = $('#res-stars');
  if (starsEl) {
    starsEl.textContent = '★'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    starsEl.classList.toggle('has-stars', earnedStars > 0);
  }
  const isTutorial = Number(levelId) === 88888;
  if (isTutorial) return;
  try {
    await claimReadyQuests();
    const [mapRaw, colRaw, totalRaw] = await Promise.all([
      w.storageGet('stars'),
      w.storageGet('collection'),
      storageGetTotal()
    ]);
    let map = (mapRaw && typeof mapRaw === 'object' && !Array.isArray(mapRaw)) ? mapRaw : {};
    let colList = Array.isArray(colRaw) ? colRaw : [];
    let totalScore = (typeof totalRaw === 'number' && !isNaN(totalRaw)) ? totalRaw : 0;
    const prevStars = Number(map[levelId]) || 0;
    if (earnedStars > prevStars) map[levelId] = earnedStars;
    finishedState.roundCollection.forEach(id => { if (!colList.includes(id)) colList.push(id); });
    const remScore = Math.max(0, (Number(finishedState.score) || 0) - (Number(finishedState.creditedScore) || 0));
    finishedState.creditedScore = Number(finishedState.score) || 0;
    totalScore += remScore;
    await Promise.all([
      w.storageSet('stars', map),
      w.storageSet('collection', colList),
      storageSetTotal(totalScore)
    ]);
    if (w.__SYNCED__) {
      w.__SYNCED__.stars = map;
      w.__SYNCED__.collection = colList;
      w.__SYNCED__.total = totalScore;
    }
    w.score = totalScore;
    w.updateTotalScoreUI(totalScore);
    if (isYandex && ysdk && ysdk.leaderboards && ysdkPlayer && typeof ysdkPlayer.isAuthorized === 'function' && ysdkPlayer.isAuthorized()) {
      ysdk.leaderboards.setLeaderboardScore('bestscore', totalScore).catch(() => {});
    }
    await syncMaxMapLevel();
    updateCategoriesBtnVisibility();
  } catch (e) {
    console.warn('finishQuiz save failed:', e);
  }
  try {
    if (w.Ach && w.Ach.recordRound) {
      await w.Ach.recordRound({
        levelId,
        score: finishedState.score,
        correctCount: finishedState.correctCount,
        total,
        percent: pct,
        mistakes: finishedState.answers - finishedState.correctCount,
        fastestCorrect: finishedState.fastestCorrect,
        maxStreak: finishedState.maxStreak,
        timeouts: finishedState.timeouts
      });
    }
  } catch (e) {}
  onQuizFinish({
    levelId, score: finishedState.score, correctCount: finishedState.correctCount,
    total, percent: pct, maxStreak: finishedState.maxStreak
  });
  if (__interstitialDelayTimer) clearTimeout(__interstitialDelayTimer);
__interstitialDelayTimer = setTimeout(() => {
  __interstitialDelayTimer = null;
  try { w.showInterstitial(); } catch (e) {}
}, 400);
}
 $('#start-btn').onclick = () => withLock(startQuiz);
  $('#next-btn').onclick = () => withLock(nextQuestion);
$('#quit-btn').onclick = () => {
    stopTimer();
    if (typeof w.hideLevelSequence === 'function') w.hideLevelSequence();
    if (isYandex) yandexGameplayStop();
    returnToOrigin(false);
};
  $('#restart-btn').onclick = () => withLock(startQuiz);
$('#home-btn').onclick = () => {
  returnToOrigin(false);
};
if (w.__autoStartQuiz) {
  w.__autoStartQuiz = false;
  startQuiz();
}
let __pausedTimeLeft = null;
 function pauseQuiz(){ if (!state.timerId) return; if (state.finished || state.answered) return; __pausedTimeLeft=state.timeLeft; stopTimer();} 
 function resumeQuiz(){ if (__pausedTimeLeft==null) return; if (state.finished || state.answered) return; const remain=__pausedTimeLeft; __pausedTimeLeft=null; state.timeLeft=remain; updateTimer(); state.timerId=setInterval(()=>{ if (state.timeLeft <=0){ stopTimer(); timeUp(); return;} state.timeLeft--; updateTimer(); if (state.timeLeft > 0 && state.timeLeft <= 3 && w.Sound && typeof w.Sound.playTick === 'function') { w.Sound.playTick(state.timeLeft); } if (state.timeLeft <=0){ stopTimer(); timeUp();}}, 1000);} 
const hintModal = d.getElementById('hintModal');
const hintBtn = $('#hint-btn');
const hint5050Btn = d.getElementById('hint5050Btn');
const hintTimeBtn = d.getElementById('hintTimeBtn');
const hintCloseBtn = d.getElementById('hintModalClose');
w.__hintAdInProgress = false;
function closeHintModal(shouldResume) {
  if (w.__hintAdInProgress) return;
  if (hintModal) hintModal.classList.remove('show');
  if (shouldResume) resumeQuiz();
}
if (hintBtn && hintModal) {
  hintBtn.onclick = () => {
    if (state.answered || state.finished || w.__hintAdInProgress) return;
    pauseQuiz();
    const optsCount = d.querySelectorAll('#options .option:not(.disabled)').length;
    if (hint5050Btn) hint5050Btn.disabled = state.used5050 || optsCount <= 2;
    if (hintTimeBtn) hintTimeBtn.disabled = Number(levelId) === 88888;
    hintModal.classList.add('show');
  };
}
if (hintCloseBtn) hintCloseBtn.onclick = () => closeHintModal(true);
if (hintModal) {
  hintModal.onclick = (e) => {
    if (e.target === hintModal) closeHintModal(true);
  };
}
async function handleUseHint(type, btn) {
  if (!btn || btn.disabled || w.__hintAdInProgress) return;
  w.__hintAdInProgress = true;
  if (hint5050Btn) hint5050Btn.disabled = true;
  if (hintTimeBtn) hintTimeBtn.disabled = true;
  if (hintCloseBtn) hintCloseBtn.disabled = true;
  const prevHtml = btn.innerHTML;
  btn.textContent = w.t('loadingAd');
  let ok = false;
  try {
    ok = await w.showRewardedAd();
  } catch (e) {
    ok = false;
  } finally {
    w.__hintAdInProgress = false;
    if (hintCloseBtn) hintCloseBtn.disabled = false;
  }
  if (btn.isConnected) btn.innerHTML = prevHtml;
  if (!ok) {
    const optsCount = d.querySelectorAll('#options .option:not(.disabled)').length;
    if (hint5050Btn) hint5050Btn.disabled = state.used5050 || optsCount <= 2;
    if (hintTimeBtn) hintTimeBtn.disabled = Number(levelId) === 88888;
    return;
  }
  if (type === '5050') {
    const cur = quiz.questions[state.order[state.index]];
    const correctIdx = cur ? cur.answer : -1;
    const wrongBtns = Array.from(d.querySelectorAll('#options .option:not(.disabled)'))
      .filter(el => Number(el.dataset.i) !== correctIdx);
    shuffle(wrongBtns).slice(0, 2).forEach(el => {
      el.classList.add('wrong', 'disabled', 'hint-eliminated');
      el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
    });
    state.used5050 = true;
  }
 else if (type === 'time') {
    const baseRemain = __pausedTimeLeft != null ? __pausedTimeLeft : state.timeLeft;
    const nextRemain = baseRemain + 20;
    state.maxTime = Math.max(state.maxTime || 10, nextRemain);
    if (__pausedTimeLeft != null) {
      __pausedTimeLeft = nextRemain;
    } else {
      state.timeLeft = nextRemain;
    }
    updateTimer();
  }
  if (w.Sound && typeof w.Sound.playHint === 'function') {
    w.Sound.playHint();
  }
  closeHintModal(true);
}
if (hint5050Btn) hint5050Btn.onclick = () => handleUseHint('5050', hint5050Btn);
if (hintTimeBtn) hintTimeBtn.onclick = () => handleUseHint('time', hintTimeBtn);
function cleanup(){
  stopTimer();
  if (typeof w.hideLevelSequence === 'function') w.hideLevelSequence();
  if (w.__currentQuizCleanup===cleanup) w.__currentQuizCleanup=null;
  if (w.__currentQuizPause===pauseQuiz) w.__currentQuizPause=null;
  if (w.__currentQuizResume===resumeQuiz) w.__currentQuizResume=null;
}
 w.__currentQuizCleanup=cleanup; w.__currentQuizPause=pauseQuiz; w.__currentQuizResume=resumeQuiz; return cleanup;}
async function renderCollection() {
  const body = d.getElementById('col-body');
  if (!body) return;
const animalId = w.getAnimalId;
  const list = asArray(w.__SYNCED__ && w.__SYNCED__.collection);
  const collected = new Set(Array.isArray(list) ? list.map(String) : []);
  body.innerHTML = '';
  const seen = new Set();  
  let opened = 0;
  (w.REGIONS || []).forEach(region => {
    const animals = [];
    region.levels.forEach(lvl => {
      const qz = (w.QUIZZES || {})[lvl.id];
      if (!qz) return;
      qz.questions.forEach(qn => {
        const id = animalId(qn.img);
        if (!id || seen.has(id)) return;  
        seen.add(id);
        animals.push({
          id,
          img: qn.img,
          name: w.L(qn.options[qn.answer]),
          desc: w.L(qn.description)
        });
      });
    });
    if (!animals.length) return;          
    animals.forEach(a => { if (collected.has(a.id)) opened++; });
    const sec = d.createElement('section');
    sec.className = 'col-region';
    sec.innerHTML = '<h2 class="region-title">' + region.icon + ' ' + escapeHtml(w.L(region.name)) + '</h2>';
    const grid = d.createElement('div');
    grid.className = 'collection-grid';
    animals.forEach(a => {
      const isOpen = collected.has(a.id);
      const item = d.createElement('button');
      item.type = 'button';
      item.className = 'collection-item' + (isOpen ? ' unlocked' : ' locked');
      if (isOpen) {
 item.innerHTML = '<img src="' + a.img + '" alt="' + escapeHtml(a.name) +
  '" loading="lazy" onerror="this.style.opacity=\'.3\';this.style.background=\'linear-gradient(135deg,#ffe3ef,#e6e1ff)\'">';
        item.addEventListener('click', () => openColModal(a));
      } else {
item.innerHTML = '<span class="col-lock"><span class="emoji-icon" aria-hidden="true">' + ((w.UiSprite && w.UiSprite.has('locked')) ? w.UiSprite.html('locked') : '🔒') + '</span></span>';
        item.disabled = true;
      }
      grid.appendChild(item);
    });
    sec.appendChild(grid);
    body.appendChild(sec);
  });
  const counter = d.getElementById('col-counter');
  if (counter) counter.textContent = opened + ' / ' + seen.size;
}
function openColModal(a) {
  const m = d.getElementById('col-modal');
  if (!m) return;
  d.getElementById('modal-img').src = a.img;
  d.getElementById('modal-img').alt = a.name;
  d.getElementById('modal-title').textContent = a.name;
  d.getElementById('modal-desc').textContent = a.desc;
  m.classList.add('show');
}
function closeColModal() { const m = d.getElementById('col-modal'); if (m) m.classList.remove('show'); }
let currentPage = null;
function refreshLocalization() {
  applyStaticI18n();
  if (w.Sound && w.Sound.apply) w.Sound.apply();
  if (w.Theme && w.Theme.apply) w.Theme.apply();
  renderDailyBadge();
  renderProgress();
  renderBonusCounter();
  renderQuestsIfOpen();
  if (currentPage === 'index') renderIndex();
  else if (currentPage === 'map') renderMap();
  else if (currentPage === 'collection') renderCollection();
  const igm = d.getElementById('igames-modal');
  if (igm && igm.classList.contains('show')) renderOtherGames();
}
async function renderOtherGames() {
  const grid = d.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (isYandex) {
    let games = [];
    try { games = await w.getAllGames(); } catch (e) {}
    if (!games.length) {
      try {
        const g = await w.getGameByID(535101);
        if (g) games.push(g);
      } catch (e) {}
    }
    if (!games.length) {
      grid.innerHTML = '<p class="modal-text">' + w.t('otherGamesEmpty') + '</p>';
      return;
    }
    games.forEach(g => {
      const a = d.createElement('button');
      a.type = 'button';
      a.className = 'game-card';
      a.addEventListener('click', () => window.open(g.url, '_blank'));
      const iconHtml = g.iconURL ? '<img class="game-icon" src="' + g.iconURL + '" alt="" loading="lazy">' : '<span class="emoji">🎲</span>';
      a.innerHTML = iconHtml + '<span class="name">' + escapeHtml(g.title || '') + '</span>';
      grid.appendChild(a);
    });
    return;
  }
function renderCard(opts) {
    const a = d.createElement('button');
    a.type = 'button';
    a.className = 'game-card';
    a.addEventListener('click', () => {
      const vkPlatform = (P.launchParams && P.launchParams.vk_platform) || '';
      if (vkPlatform === 'desktop_web') {
        window.open(opts.url, '_blank');
        return;
      }
      if (isVK || isOK) {
        vkSend('VKWebAppOpenURL', { url: opts.url }, 5000)
          .then(res => { if (!res) window.open(opts.url, '_blank'); })
          .catch(() => window.open(opts.url, '_blank'));
      } else {
        window.open(opts.url, '_blank');
      }
    });
    const iconHtml = opts.iconURL ? '<img class="game-icon" src="' + opts.iconURL + '" alt="" loading="lazy">' : (opts.emoji ? '<span class="emoji">' + opts.emoji + '</span>' : '');
    a.innerHTML = iconHtml + '<span class="name">' + escapeHtml(opts.title || '') + '</span>';
    grid.appendChild(a);
}
const VK_GAMES = [
  { href: 'https://vk.com/app54634418', emoji: '💭', name: { ru: 'Словарекс', en: 'Slovarex', tr: 'Slovarex' },               iconURL: 'games/slovarex.jpg' },
  { href: 'https://vk.com/app54636699', emoji: '🍎',name: { ru: 'Найди слова', en: 'Find Words', tr: 'Kelime Bul' },               iconURL: 'games/naydi-slova.jpg' },
  { href: 'https://vk.ru/app51399364',  emoji: '9️', name: { ru: 'Судоку для самых умных', en: 'Smart Sudoku', tr: 'Akıllı Sudoku' },iconURL: 'games/sudoku.jpg' },
  { href: 'https://vk.com/app54620141', emoji: '🧩', name: { ru: 'ТЕТРА', en: 'TETRA', tr: 'TETRA' },               iconURL: 'games/tetra.jpg' },
  { href: 'https://vk.com/app54659768', emoji: '🕹️', name: { ru: 'Тетра Дарк', en: 'Tetra Dark', tr: 'Tetra Dark' },           iconURL: 'games/tetra-dark.jpg' },
  { href: 'https://vk.com/app54678489', emoji: '🎨', name: { ru: 'Раскраска', en: 'Coloring Book', tr: 'Boyama Kitabı' },              iconURL: 'games/raskraska.jpg' }
];
const OK_GAMES = [
        { href: 'https://ok.ru/app/512005443175', emoji: '💭', name: { ru: 'Словарекс', en: 'Slovarex', tr: 'Slovarex' },                 iconURL: 'games/slovarex.jpg' },
            { href: "https://ok.ru/app/512004943223", emoji: "🍎", name: { ru: 'Найди слова', en: 'Find Words', tr: 'Kelime Bul' },          iconURL: "games/naydi-slova.jpg" },
        { href: 'https://ok.ru/app/512005458660', emoji: '🕹️', name: { ru: 'Тетра Дарк', en: 'Tetra Dark', tr: 'Tetra Dark' },          iconURL: 'games/tetra-dark.jpg'},
        { href: 'https://ok.ru/app/512005390848', emoji: '9️', name: { ru: 'Судоку для самых умных', en: 'Smart Sudoku', tr: 'Akıllı Sudoku' }, iconURL: 'games/sudoku.jpg' },
        { href:"https://ok.ru/app/512004963709",  emoji:"🎨",name: { ru: 'Раскраска', en: 'Coloring Book', tr: 'Boyama Kitabı' },                 iconURL: 'games/raskraska.jpg' },
        { href: 'https://ok.ru/app/512005107616', emoji: '🧩', name: { ru: 'ТЕТРА', en: 'TETRA', tr: 'TETRA' },                iconURL: 'games/tetra.jpg' }
];
const list = isOK ? OK_GAMES : VK_GAMES;
list.forEach(g => {
  renderCard({
    url: g.href,
    title: w.L(g.name),
    emoji: g.emoji,
    iconURL: g.iconURL || null
  });
});
}
function bindGlobalUI() {
  d.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#/"], button[data-href^="#/"]');
    if (!link) return;
    e.preventDefault();
    const raw = link.getAttribute('href') || link.dataset.href;
    const h = raw.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (!parts.length) {
      if (currentPage === 'collection') {
        const curRoute = parseHash();
        const fallback = isLevel92Completed() ? 'index' : 'map';
        const target = (curRoute && curRoute.fromPage && curRoute.fromPage !== 'collection')
          ? curRoute.fromPage
          : fallback;
        pushRoute({
          name: target,
          startMenuOpen: Boolean(curRoute && curRoute.fromStartMenu)
        });
        return;
      }
      return pushRoute({ name: isLevel92Completed() ? 'index' : 'map' });
    }
    if (parts[0] === 'quiz') {
      const id = parseInt(parts[1], 10);
      const levelId = isNaN(id) || id < 1 ? 1 : id;
      const fromPage = (currentPage && currentPage !== 'quiz')
        ? currentPage
        : (isLevel92Completed() ? 'index' : 'map');
      const pageIndex = d.getElementById('page-index');
      if (currentPage === 'index' && pageIndex && !pageIndex.classList.contains('page-exit')) {
        pageIndex.classList.add('page-exit');
        setTimeout(() => {
          pageIndex.classList.remove('page-exit');
          pushRoute({ name: 'quiz', levelId, fromPage: 'index' });
        }, 720);
        return;
      }
      return pushRoute({ name: 'quiz', levelId, fromPage });
    }
    if (parts[0] === 'collection') {
      const startEl = d.getElementById('startScreen');
      const fromStartMenu = Boolean(startEl && !startEl.classList.contains('hidden'));
      return pushRoute({
        name: 'collection',
        fromPage: currentPage || (isLevel92Completed() ? 'index' : 'map'),
        fromStartMenu
      });
    }
    pushRoute({ name: isLevel92Completed() ? 'index' : 'map' });
  });
  const achModal = d.getElementById('ach-modal');
  if (achModal) {
    achModal.querySelectorAll('.modal-close, .modal-back, [data-act="close"]')
      .forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        closeAchModal();
      }));
    achModal.addEventListener('click', e => { if (e.target === achModal) closeAchModal(); });
  }
  const colModal = d.getElementById('col-modal');
  if (colModal) {
    colModal.querySelectorAll('.modal-close, .modal-back')
      .forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        closeColModal();
      }));
    colModal.addEventListener('click', e => { if (e.target === colModal) closeColModal(); });
  }
  const authModal = d.getElementById('auth-modal');
  if (authModal) {
    authModal.querySelectorAll('.modal-close, [data-act="close"]')
      .forEach(b => b.addEventListener('click', closeAuthModal));
    authModal.addEventListener('click', e => { if (e.target === authModal) closeAuthModal(); });
  }
  const yandexLbModal = d.getElementById('yandex-leaderboard-modal');
  if (yandexLbModal) {
    yandexLbModal.querySelectorAll('.modal-close')
      .forEach(b => b.addEventListener('click', () => yandexLbModal.classList.remove('show')));
    yandexLbModal.addEventListener('click', e => { if (e.target === yandexLbModal) yandexLbModal.classList.remove('show'); });
  }
  const igamesModal = d.getElementById('igames-modal');
  if (igamesModal) {
    igamesModal.querySelectorAll('.modal-close, .modal-back')
      .forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        closeOtherGamesModal();
      }));
    igamesModal.addEventListener('click', e => { if (e.target === igamesModal) closeOtherGamesModal(); });
  }
  const langModal = d.getElementById('langModal');
  if (langModal) {
    const closeLang = () => langModal.classList.remove('show');
    const closeBtn = d.getElementById('langModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeLang);
    langModal.addEventListener('click', e => { if (e.target === langModal) closeLang(); });
    langModal.querySelectorAll('.lang-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setGameLanguage(btn.dataset.lang, true);
        closeLang();
      });
    });
  }
const mapDailyBtn = d.getElementById('map-daily-btn');
if (mapDailyBtn) {
mapDailyBtn.addEventListener('click', startDailyChallenge);
}
const mapQuestsBtn = d.getElementById('map-quests-btn');
if (mapQuestsBtn) {
mapQuestsBtn.addEventListener('click', openQuestsModal);
}
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAchModal();
      closeColModal();
      closeAuthModal();
      closeOtherGamesModal();
      const mapUnlockAd = d.getElementById('mapUnlockAdModal');
if (mapUnlockAd) mapUnlockAd.classList.remove('show');
      if (yandexLbModal) yandexLbModal.classList.remove('show');
      const mapLocked = d.getElementById('mapLockedModal');
      if (mapLocked) mapLocked.classList.remove('show');
      const hintM = d.getElementById('hintModal');
      if (hintM && hintM.classList.contains('show') && !w.__hintAdInProgress) {
        hintM.classList.remove('show');
        if (typeof w.__currentQuizResume === 'function') w.__currentQuizResume();
      }
    }
  });
}
function pauseAllAudioOnBlur() {
  try {
    if (bgAudio && !bgAudio.paused) {
      bgAudio.__pausedByVisibility = true;
      bgAudio.pause();
    }
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend().catch(() => {});
    }
  } catch (e) {}
}
function resumeAllAudioOnFocus() {
  try {
    if (d.visibilityState === 'hidden') return;
    if (audioCtx && audioCtx.state === 'suspended' && canPlaySfx()) {
      audioCtx.resume().catch(() => {});
    }
    if (bgAudio && bgAudio.__pausedByVisibility) {
      bgAudio.__pausedByVisibility = false;
      if (canPlayMusic()) {
        bgAudio.play().catch(() => {});
      }
    }
  } catch (e) {}
}
d.addEventListener('visibilitychange', () => {
  if (d.visibilityState === 'hidden') {
    pauseAllAudioOnBlur();
    if (typeof w.__currentQuizPause === 'function') {
      try { w.__currentQuizPause(); } catch (e) {}
    }
  } else if (d.visibilityState === 'visible') {
    resumeAllAudioOnFocus();
    if (isVK || isOK) showBanner(true);
    if (typeof w.__currentQuizResume === 'function') {
      try { w.__currentQuizResume(); } catch (e) {}
    }
    if (w.__appReady && (isVK || isOK || isYandex)) {
      (async () => {
        try {
          await w.Theme.load();
          const remoteSound = await remoteGet('sound_mode');
          if (remoteSound !== null && [0, 1, 2].includes(Number(remoteSound)) && Number(remoteSound) !== soundMode) {
            soundMode = Number(remoteSound);
            safeLocalSet(storageKey('sound_mode'), String(soundMode));
            applySoundState();
          }
          await syncAllOnStart();
          await loadMechanicsCloud();
          mergeTempUnlocks();
          renderDailyBadge();
          renderProgress();
          if (currentPage === 'index') await renderIndex();
          else if (currentPage === 'map') {
            ['mapUnlockAdModal', 'mapLockedModal'].forEach(mid => {
              const m = d.getElementById(mid);
              if (m) m.classList.remove('show');
            });
            await renderMap();
          }
          else if (currentPage === 'collection') await renderCollection();
        } catch (e) {}
      })();
    }
  }
});
w.addEventListener('blur', pauseAllAudioOnBlur);
w.addEventListener('focus', resumeAllAudioOnFocus);
const PAGE_IDS = ['index', 'quiz', 'collection', 'map'];
let currentPageCleanup = null;
function parseHash() {
  if (window.history.state && window.history.state.vkRoute) {
    return window.history.state.vkRoute;
  }
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'map') return { name: 'map' };
  if (!parts.length) return { name: 'index' };
  if (parts[0] === 'quiz') {
    const id = parseInt(parts[1], 10);
    return { name: 'quiz', levelId: isNaN(id) || id < 1 ? 1 : id };
  }
  if (parts[0] === 'collection') return { name: 'collection' };
  return { name: 'index' };
}
function pushRoute(route, replace) {
  const nextRoute = Object.assign({ startMenuOpen: false }, route);
  const state = { vkRoute: nextRoute };
  if (replace) window.history.replaceState(state, '', location.pathname + location.search);
  else window.history.pushState(state, '', location.pathname + location.search);
  navigate();
}
w.pushRoute = pushRoute;
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + label + ' after ' + ms + 'ms')), ms))
  ]);
}
async function navigate() {
  if (typeof currentPageCleanup === 'function') {
    try { currentPageCleanup(); } catch (e) {}
    currentPageCleanup = null;
  }
  [
    'mapUnlockAdModal', 'mapLockedModal', 'extrasUnlockModal', 'hintModal',
    'ach-modal', 'col-modal', 'igames-modal', 'extrasQuestsModal',
    'extrasHelpModal', 'auth-modal', 'yandex-leaderboard-modal'
  ].forEach(mid => {
    const m = d.getElementById(mid);
    if (m) m.classList.remove('show');
  });
  d.querySelectorAll('.hero-more').forEach(menu => menu.setAttribute('hidden', ''));
  d.querySelectorAll('[id$="MoreToggle"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  const route = parseHash();
  if (route.name !== 'index' || route.startMenuOpen) {
    d.querySelectorAll('#regions .collapsible.open').forEach(sec => sec.classList.remove('open'));
    safeLocalSet(storageKey('cat_open'), '{}');
  }
  const startEl = d.getElementById('startScreen');
  if (!window.history.state || !window.history.state.vkRoute) {
    route.startMenuOpen = Boolean(startEl && !startEl.classList.contains('hidden'));
    window.history.replaceState({ vkRoute: route }, '', location.pathname + location.search);
  }
  if (route.startMenuOpen) {
    if (w.StartMenu && typeof w.StartMenu.show === 'function') {
      w.StartMenu.show();
    } else if (startEl) {
      startEl.classList.remove('hidden', 'start-exit');
    }
  } else if (startEl && !startEl.classList.contains('hidden') && !startEl.classList.contains('start-exit')) {
    startEl.classList.add('hidden');
  }
  PAGE_IDS.forEach(p => {
    const el = d.getElementById('page-' + p);
    if (el) el.classList.toggle('active', p === route.name);
  });
  currentPage = route.name;
  if (route.name !== 'quiz' && isYandex) yandexGameplayStop();
  try {
    if (route.name === 'index') {
      await renderIndex();
    } else if (route.name === 'map') {
      await renderMap();
    } else if (route.name === 'quiz') {
      const cleanup = await renderQuiz(route.levelId);
      currentPageCleanup = cleanup;
    } else if (route.name === 'collection') {
      await renderCollection();
    }
  } catch (e) { console.warn('navigate error', e); }
  try { window.scrollTo(0, 0); } catch (e) {}
  renderBonusCounter();
}const DAILY_ID = 99999;
const SURPRISE_PERIOD = 15;
const MECH_KEY = storageKey('quiz_extras_v1');
const MECH = {
  purchased: {},
  tempUnlocks: {},
  daily: { date: '', completed: false, streak: 0, lastCompletedDate: '' },
  quests: { date: '', quests: [] },
  surprise: { counter: 0 }
};
const QUESTS_POOL = [
  { id: 'solve5',   text: { ru: 'Ответь на 5 вопросов',   en: 'Answer 5 questions',     tr: '5 soruyu yanıtla' },      stat: 'solve',   target: 5,  reward: 3 },
  { id: 'solve10',  text: { ru: 'Ответь на 10 вопросов',  en: 'Answer 10 questions',    tr: '10 soruyu yanıtla' },     stat: 'solve',   target: 10, reward: 4 },
  { id: 'solve15',  text: { ru: 'Ответь на 15 вопросов',  en: 'Answer 15 questions',    tr: '15 soruyu yanıtla' },     stat: 'solve',   target: 15, reward: 5 },
  { id: 'quiz2',    text: { ru: 'Пройди 2 викторины',     en: 'Complete 2 quizzes',     tr: '2 testi tamamla' },       stat: 'quiz',    target: 2,  reward: 2 },
  { id: 'quiz3',    text: { ru: 'Пройди 3 викторины',     en: 'Complete 3 quizzes',     tr: '3 testi tamamla' },       stat: 'quiz',    target: 3,  reward: 3 },
  { id: 'stars1',   text: { ru: 'Получи 3 звезды',        en: 'Earn 3 stars',           tr: '3 yıldız kazan' },        stat: 'stars3',  target: 1,  reward: 3 },
  { id: 'perfect1', text: { ru: 'Пройди без ошибок',      en: 'Finish with no mistakes', tr: 'Hatasız tamamla' },       stat: 'perfect', target: 1,  reward: 3 },
  { id: 'streak5',  text: { ru: '5 правильных подряд',    en: '5 correct in a row',     tr: 'Art arda 5 doğru' },      stat: 'streak',  target: 5,  reward: 3 },
  { id: 'streak10', text: { ru: '10 правильных подряд',   en: '10 correct in a row',    tr: 'Art arda 10 doğru' },     stat: 'streak',  target: 10, reward: 5 }
];
async function boot() {
  w.addEventListener('error', function (e) {
    console.error('Global error:', e && e.message, e && e.filename, e && e.lineno);
  });
  w.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e && e.reason);
    e.preventDefault();
  });
  try {
    try {
      const savedMode = safeLocalGet(storageKey('sound_mode'));
      if (savedMode !== null && [0, 1, 2].includes(Number(savedMode))) {
        soundMode = Number(savedMode);
      } else {
        const localSound = safeLocalGet(storageKey('sound_on'));
        soundMode = (localSound === null || JSON.parse(localSound) !== false) ? 1 : 0;
      }
    } catch (e) { soundMode = 1; }
    attachAudioUnlock();
    attachSfxToUI();
    applyStaticI18n();
    applyTheme();
    applySoundState();
    if (isVK || isOK) {
      try {
        if (window.__vkBridgeReady) await window.__vkBridgeReady;
      } catch (e) {}
      if (window.vkBridge) {
        await initVK();
        try {
          window.vkBridge.subscribe(function (event) {
            const type = event && event.detail && event.detail.type;
if (type === 'VKWebAppViewHide') {
  console.log('VK ViewHide');
  isGamePaused = true;
  stopBgMusic();
  if (w.__currentQuizPause) { try { w.__currentQuizPause(); } catch (e) {} }
}
if (type === 'VKWebAppViewRestore') {
  console.log('VK ViewRestore');
  isGamePaused = false;
  if (canPlayMusic()) startBgMusic();
  if (w.__currentQuizResume) { try { w.__currentQuizResume(); } catch (e) {} }
}

          });
        } catch (e) { console.warn('VK subscribe failed', e); }
      } else {
        console.warn('VK Bridge unavailable — running in fallback mode');
      }
    } else {
      const hasYa = isYandex || typeof YaGames !== 'undefined' || w.__YANDEX_SDK_LOADED__ === true;
      if (hasYa) {
        if (!isYandex) {
          isYandex = true;
          platform = 'yandex';
          P.isYandex = true;
          P.platform = 'yandex';
          P.isStandalone = false;
          cls.toggle('is-yandex', true);
          cls.toggle('is-standalone', false);
          console.log('Yandex detected at runtime');
        }
        await initYandex();
      }
      w.addEventListener('yandex-sdk-ready', async () => {
        if (isYandex) return;
        isYandex = true;
        platform = 'yandex';
        P.isYandex = true;
        P.platform = 'yandex';
        P.isStandalone = false;
        cls.toggle('is-yandex', true);
        cls.toggle('is-standalone', false);
        console.log('Yandex detected (late load)');
        try { await initYandex(); } catch (e) { console.warn(e); }
        try { await syncAllOnStart(); } catch (e) {}
        try { await updateAuthButton(); } catch (e) {}
        try { await updateShortcutButton(); } catch (e) {}
        try { renderIndex(); } catch (e) {}
          if (w.__appReady) trySendLoadingReady();
      }, { once: true });
    }
    await w.Theme.load();
    try {
      const remoteSound = await remoteGet('sound_mode');
      if (remoteSound !== null && [0, 1, 2].includes(Number(remoteSound))) {
        soundMode = Number(remoteSound);
        safeLocalSet(storageKey('sound_mode'), String(soundMode));
        applySoundState();
      }
    } catch (e) {}
    await syncAllOnStart();
    try { await w.Ach.loadMetrics(); } catch (e) {}
    try { await loadUnlocked(); } catch (e) {}
    if (w.Ach && w.Ach.recordVisit) { try { await w.Ach.recordVisit(); } catch (e) {} }
    try { await updateAuthButton(); } catch (e) {}
    try { await updateShortcutButton(); } catch (e) {}
       bindGlobalUI();
    initMechanics();
  } catch (e) { console.warn('Boot error:', e); }
  const initRoute = {
    name: isLevel92Completed() ? 'index' : 'map',
    startMenuOpen: true
  };
  window.history.replaceState({ vkRoute: initRoute }, '', location.pathname + location.search);
  w.addEventListener('popstate', navigate);
  try { await withTimeout(navigate(), 5000, 'navigate'); }
  catch (e) { console.warn('Navigate timed out / failed:', e); }
  try { hideLoadingAndShowMenu(); } catch (e) { console.error('hideLoading failed:', e); }
}
const __bootWatchdogTimer = setTimeout(() => {
  if (d.body.classList.contains('app-ready') && d.querySelector('.page.active')) return;
  console.warn('Boot watchdog: forcing loader hide / home page');
  try {
    hideLoadingAndShowMenu();
    if (!d.querySelector('.page.active')) {
      const idx = d.getElementById('page-index');
      if (idx) idx.classList.add('active');
      try { currentPage = 'index'; } catch (_) {}
    }
    try { Promise.resolve(renderIndex()).catch(e => console.warn('watchdog renderIndex:', e)); } catch (e) {}
  } catch (e) {
    console.error('Watchdog error:', e);
  }
}, 15000);
w.addEventListener('pagehide', () => {
    clearAdTimers();
  if (isYandex) yandexGameplayStop();
  if (soundMode > 0) { try { Sound.stopBg(); } catch (e) {} }
  if (w.__currentQuizPause) { try { w.__currentQuizPause(); } catch (e) {} }
});
if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
else boot();
w.VKApp = { storageGet, storageSet, showRewardedAd, showInterstitial, infr, toast, openAuthModal, closeAuthModal, doYandexAuth, openOtherGamesModal, closeOtherGamesModal };
function loadMechanics() {
  try {
    const raw = safeLocalGet(MECH_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;
    if (data.purchased && typeof data.purchased === 'object') MECH.purchased = data.purchased;
    if (data.tempUnlocks && typeof data.tempUnlocks === 'object') MECH.tempUnlocks = data.tempUnlocks;
    if (data.daily && typeof data.daily === 'object') MECH.daily = data.daily;
    if (data.quests && typeof data.quests === 'object') MECH.quests = data.quests;
    if (data.surprise && typeof data.surprise === 'object') MECH.surprise = data.surprise;
  } catch (e) {}
}
function saveMechanics() {
  try { safeLocalSet(MECH_KEY, JSON.stringify(MECH)); } catch (e) {}
}
async function loadMechanicsCloud() {
  try {
    const res = await remoteGetWithStatus('quiz_extras_cloud');
    if (!res.ok) return;
    const cloud = res.value;
    if (!cloud || typeof cloud !== 'object') {
      if (Object.keys(MECH.purchased).length || Object.keys(MECH.tempUnlocks).length) {
        saveMechanicsCloud();
      }
      return;
    }
    const beforeStr = JSON.stringify({ p: MECH.purchased, u: MECH.tempUnlocks, d: MECH.daily });
    if (cloud.purchased && typeof cloud.purchased === 'object') {
      for (const k in cloud.purchased) if (cloud.purchased[k]) MECH.purchased[k] = true;
    }
    if (cloud.tempUnlocks && typeof cloud.tempUnlocks === 'object') {
      const now = Date.now();
      for (const k in cloud.tempUnlocks) {
        if (cloud.tempUnlocks[k] > now && (cloud.tempUnlocks[k] > (MECH.tempUnlocks[k] || 0))) {
          MECH.tempUnlocks[k] = cloud.tempUnlocks[k];
        }
      }
    }
    if (cloud.daily && typeof cloud.daily === 'object') {
      const cd = cloud.daily;
      if (cd.lastCompletedDate && (!MECH.daily.lastCompletedDate || cd.lastCompletedDate > MECH.daily.lastCompletedDate)) {
        MECH.daily.lastCompletedDate = cd.lastCompletedDate;
      }
      if ((cd.streak || 0) > (MECH.daily.streak || 0)) MECH.daily.streak = cd.streak;
      if (cd.date === todayStr() && cd.completed) MECH.daily.completed = true;
    }
    if (cloud.quests && typeof cloud.quests === 'object' && cloud.quests.date === todayStr()) {
      MECH.quests = cloud.quests;
    }
    safeLocalSet(MECH_KEY, JSON.stringify(MECH));
    const afterStr = JSON.stringify({ p: MECH.purchased, u: MECH.tempUnlocks, d: MECH.daily });
    const cloudStr = JSON.stringify({ p: cloud.purchased || {}, u: cloud.tempUnlocks || {}, d: cloud.daily || {} });
    if (afterStr !== cloudStr || beforeStr !== cloudStr) {
      saveMechanicsCloud();
    }
  } catch (e) {}
}
function saveMechanicsCloud() {
  if (!w.storageSet) return;
  try {
    w.storageSet('quiz_extras_cloud', {
      purchased: MECH.purchased,
      tempUnlocks: MECH.tempUnlocks,
      daily: MECH.daily,
      quests: MECH.quests
    }).catch(function () {});
  } catch (e) {}
}
function ptsIcon(size) {
  return (w.UiSprite && typeof w.UiSprite.html === 'function') ? w.UiSprite.html('points', size || '1em') : '🍎';
}
function tvIcon(size) {
  return (w.UiSprite && typeof w.UiSprite.html === 'function') ? w.UiSprite.html('tv', size || '1em') : '📺';
}
function lockedIcon(size) {
  return (w.UiSprite && typeof w.UiSprite.html === 'function') ? w.UiSprite.html('locked', size || '1em') : '🔒';
}
function getLevelPrice(levelId) {
  const nid = Number(levelId);
    const themedFull = (w.THEMED_LEVELS || []).find(l => Number(l.id) === nid && l.isFullSet);
  if (themedFull) return Math.max(100, (themedFull.count || 0) * 3);
  const photoFull = (w.PHOTO_LEVELS || []).find(l => Number(l.id) === nid && l.isFullSet);
  if (photoFull) return Math.max(100, (photoFull.count || 0) * 3);
  for (const reg of (w.REGIONS || [])) {
    const regFull = (reg.levels || []).find(l => Number(l.id) === nid && l.isFullSet);
    if (regFull) return Math.max(100, (regFull.count || 0) * 3);
  }
  let idx = 0;
  for (const reg of (w.REGIONS || [])) {
    for (const lvl of reg.levels) {
      if (Number(lvl.id) === nid) return 40 + idx * 10;          
      idx++;
    }
  }
  for (let i = 0; i < (w.THEMED_LEVELS || []).length; i++) {
    if (Number(w.THEMED_LEVELS[i].id) === nid) return 32 + Math.floor(i / 4) * 9;  
  }
  for (let i = 0; i < (w.PHOTO_LEVELS || []).length; i++) {
    if (Number(w.PHOTO_LEVELS[i].id) === nid) return 26 + Math.floor(i / 7) * 10;   
  }
  return 40;
}
function getLevelName(levelId) {
  const nid = Number(levelId);
  for (const reg of (w.REGIONS || [])) {
    for (const lvl of reg.levels) {
      if (Number(lvl.id) === nid) return w.L ? w.L(lvl.name) : lvl.name;
    }
  }
  for (const lvl of (w.THEMED_LEVELS || [])) {
    if (Number(lvl.id) === nid) return w.L ? w.L(lvl.name) : lvl.name;
  }
  for (const lvl of (w.PHOTO_LEVELS || [])) {
    if (Number(lvl.id) === nid) return w.L ? w.L(lvl.name) : lvl.name;
  }
  return w.t('categoryFallback');
}
function isPurchasedLevel(levelId) { return !!MECH.purchased[Number(levelId)]; }
function isTempUnlockedLevel(levelId) {
  const nid = Number(levelId);
  const exp = MECH.tempUnlocks[nid];
  if (!exp) return false;
  if (exp <= Date.now()) { delete MECH.tempUnlocks[nid]; saveMechanics(); return false; }
  return true;
}
async function purchaseLevel(levelId) {
  const nid = Number(levelId);
  if (isPurchasedLevel(nid)) return true;
  const price = getLevelPrice(nid);
  const total = Number(w.__SYNCED__ && w.__SYNCED__.total) || 0;
  if (total < price) { toast(w.t('notEnoughBerries')); return false; }
  const newTotal = total - price;
await storageSetTotal(newTotal);
  if (w.__SYNCED__) w.__SYNCED__.total = newTotal;
  if (w.updateTotalScoreUI) w.updateTotalScoreUI(newTotal);
  MECH.purchased[nid] = true;
  saveMechanics();
  saveMechanicsCloud();
  try { if (w.Gating && w.Gating.unlockLevel) await w.Gating.unlockLevel(nid); } catch (e) {}
  if (w.__SYNCED__ && Array.isArray(w.__SYNCED__.unlocked) && w.__SYNCED__.unlocked.indexOf(nid) === -1) {
    w.__SYNCED__.unlocked.push(nid);
  }
   playOgg('buy_cat');
  toast(w.t('catOpenedForever'));
  if (w.Ach && typeof w.Ach.checkAndUnlock === 'function') {
    await w.Ach.checkAndUnlock(false);
  }
  return true;
}
async function unlockLevelViaAd(levelId) {
  if (!w.showRewardedAd) return false;
  try { const ok = await w.showRewardedAd(); if (!ok) return false; } catch (e) { return false; }
  const nid = Number(levelId);
  MECH.tempUnlocks[nid] = Date.now() + 24 * 60 * 60 * 1000;
  saveMechanics();
  saveMechanicsCloud();
  if (w.__SYNCED__ && Array.isArray(w.__SYNCED__.unlocked) && w.__SYNCED__.unlocked.indexOf(nid) === -1) {
    w.__SYNCED__.unlocked.push(nid);
  }
   playOgg('buy_cat');
  toast(w.t('catOpened24h'));
  if (w.Ach && typeof w.Ach.checkAndUnlock === 'function') {
    await w.Ach.checkAndUnlock(false);
  }
  return true;
}
function showPurchaseModal(levelId, onUnlocked) {
  const nid = Number(levelId);
  if (isPurchasedLevel(nid) || isTempUnlockedLevel(nid)) {
    if (typeof onUnlocked === 'function') onUnlocked(nid);
    return;
  }
  const alreadyUnlocked = (w.__SYNCED__ && Array.isArray(w.__SYNCED__.unlocked))
    ? w.__SYNCED__.unlocked.map(Number).includes(nid)
    : false;
  if (alreadyUnlocked) {
    if (typeof onUnlocked === 'function') onUnlocked(nid);
    return;
  }
  const price = getLevelPrice(nid);
  const total = Number(w.__SYNCED__ && w.__SYNCED__.total) || 0;
  const canBuy = total >= price;
  const name = getLevelName(nid);
  let modal = d.getElementById('extrasUnlockModal');
  if (!modal) {
    modal = d.createElement('div');
    modal.id = 'extrasUnlockModal';
    modal.className = 'modal';
    d.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div class="modal-content">' +
      '<button class="modal-close" data-act="close" aria-label="close">×</button>' +
      '<h2>' + lockedIcon('1.5em') + ' ' + escapeHtml(name) + escapeHtml(w.t('catClosedSuffix')) + '</h2>' +
      '<p>' + w.t('buyModalDesc').replace('{price}', price) + '</p>' +
       '<div class="extras-modal-actions">' +
        '<button class="btn btn-primary" data-act="buy"' + (canBuy ? '' : ' disabled') + '>' +
         ' <span>' + escapeHtml(w.t('buyForBtn').replace('{price}', price)) + '</span>' +  ptsIcon('1.2em') +
        '</button>' +
        '<button class="btn btn-secondary" data-act="ad">' +
          tvIcon('1.2em') + ' ' + escapeHtml(w.t('watch24hBtn')) +
        '</button>' +
        '<button class="btn btn-ghost" data-act="cancel">' + escapeHtml(w.t('cancelBtn')) + '</button>' +
      '</div>' +
    '</div>';
  modal.classList.add('show');
  const close = () => modal.classList.remove('show');
  modal.querySelector('[data-act="close"]').onclick = close;
  modal.querySelector('[data-act="cancel"]').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  const buyBtn = modal.querySelector('[data-act="buy"]');
  if (buyBtn) buyBtn.onclick = async () => {
    if (!canBuy || buyBtn.disabled) return;
    buyBtn.disabled = true;
    try {
      if (await purchaseLevel(nid)) { close(); if (typeof onUnlocked === 'function') onUnlocked(nid); }
    } finally {
      if (buyBtn.isConnected) buyBtn.disabled = false;
    }
  };
  const adBtn = modal.querySelector('[data-act="ad"]');
  if (adBtn) adBtn.onclick = async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.textContent = w.t('loadingAd');
    const ok = await unlockLevelViaAd(nid);
    if (btn.isConnected) {
      btn.disabled = false;
      btn.innerHTML = prev;
    }
    if (ok) { close(); if (typeof onUnlocked === 'function') onUnlocked(nid); }
  };
}
function hashDate(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function ensureQuests() {
  const t = todayStr();
  if (MECH.quests.date === t && Array.isArray(MECH.quests.quests) && MECH.quests.quests.length) return;
  let seed = hashDate(t + '_quests');
  const pool = QUESTS_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  MECH.quests = { date: t, quests: pool.slice(0, 3).map(q => Object.assign({}, q, { progress: 0, claimed: false })) };
  saveMechanics();
}
function updateQuestProgress(stat, amount) {
  ensureQuests();
  let changed = false;
  for (const q of MECH.quests.quests) {
    if (q.stat !== stat || q.claimed) continue;
    if (q.progress >= q.target) continue;
    if (stat === 'streak') {
      const nv = Math.min(q.target, Math.max(q.progress, Number(amount) || 0));
      if (nv > q.progress) { q.progress = nv; changed = true; }
    } else {
      const nv = Math.min(q.target, q.progress + (Number(amount) || 0));
      if (nv > q.progress) { q.progress = nv; changed = true; }
    }
  }
  if (changed) { saveMechanics(); renderQuestsIfOpen(); }
}
let __claimingQuests = false;
async function claimReadyQuests() {
  if (__claimingQuests) return 0;
  const ready = MECH.quests.quests.filter(q => !q.claimed && q.progress >= q.target);
  if (!ready.length) return 0;
  __claimingQuests = true;
  try {
    const earned = ready.reduce((sum, q) => sum + q.reward, 0);
    const total = Number(w.__SYNCED__ && w.__SYNCED__.total) || 0;
    const newTotal = total + earned;
    await storageSetTotal(newTotal);
    if (w.__SYNCED__) w.__SYNCED__.total = newTotal;
    if (w.updateTotalScoreUI) w.updateTotalScoreUI(newTotal);
    ready.forEach(q => { q.claimed = true; });
    saveMechanics();
    saveMechanicsCloud();
    toast(w.t('questRewardToast').replace('{n}', earned));
    return earned;
  } finally {
    __claimingQuests = false;
  }
}
function renderQuestsList() {
  const list = d.getElementById('extrasQuestsList');
  if (!list) return;
  ensureQuests();
  list.innerHTML = MECH.quests.quests.map(q => {
    const poolDef = QUESTS_POOL.find(p => p.id === q.id);
    const qText = w.L((poolDef && poolDef.text) || q.text);
    const done = q.progress >= q.target;
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    return '<div class="extras-quest' + (done ? ' extras-quest--done' : '') + '">' +
      '<div class="extras-quest__head">' +
        '<span class="extras-quest__text">' + escapeHtml(qText) + '</span>' +
        '<span class="extras-quest__reward">' + ptsIcon('1em') + ' +' + q.reward + '</span>' +
      '</div>' +
      '<div class="extras-quest__bar"><div class="extras-quest__fill" style="width:' + pct + '%"></div></div>' +
      '<div class="extras-quest__prog">' + (done ? escapeHtml(w.t('questDone')) : q.progress + ' / ' + q.target) + '</div>' +
    '</div>';
  }).join('');
}
function renderQuestsIfOpen() {
  const m = d.getElementById('extrasQuestsModal');
  if (m && m.classList.contains('show')) renderQuestsList();
}
function openQuestsModal() {
  renderQuestsList();
  const m = d.getElementById('extrasQuestsModal');
  if (m) {
    if (m.parentElement !== d.body) d.body.appendChild(m);
    m.classList.add('show');
  }
}
function ensureDaily() {
  const t = todayStr();
  if (MECH.daily.date !== t) { MECH.daily.date = t; MECH.daily.completed = false; }
  if (MECH.daily.lastCompletedDate) {
    const y = yesterdayStr();
    if (MECH.daily.lastCompletedDate !== t && MECH.daily.lastCompletedDate !== y) MECH.daily.streak = 0;
  }
  saveMechanics();
}
function collectAllQuestions() {
  const all = [];
  const seen = new Set();
  (w.REGIONS || []).forEach(reg => {
    reg.levels.forEach(lvl => {
      const qz = (w.QUIZZES || {})[lvl.id];
      if (qz && Array.isArray(qz.questions)) {
        qz.questions.forEach(qn => {
          const aid = w.getAnimalId ? w.getAnimalId(qn.img) : (qn.img || '');
          if (aid && !seen.has(aid)) { seen.add(aid); all.push(qn); }
        });
      }
    });
  });
  return all;
}
function getDailyQuestions() {
  const all = collectAllQuestions();
  if (!all.length) return [];
  let seed = hashDate(todayStr());
  const arr = all.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr.slice(0, Math.min(10, arr.length));
}
function startDailyChallenge() {
  ensureDaily();
  if (MECH.daily.completed) { toast(w.t('dailyAlready')); return; }
  const qs = getDailyQuestions();
  if (!qs.length) { toast(w.t('dailyUnavail')); return; }
  w.QUIZZES[DAILY_ID] = {
    regionKey: 'daily',
    sub: { ru: 'Вызов дня', en: 'Daily challenge', tr: 'Günlük meydan okuma' },
    questions: qs
  };
  const fromPage = (currentPage && currentPage !== 'quiz')
    ? currentPage
    : (isLevel92Completed() ? 'index' : 'map');
  const pageIndex = d.getElementById('page-index');
  if (currentPage === 'index' && pageIndex && !pageIndex.classList.contains('page-exit')) {
    pageIndex.classList.add('page-exit');
    setTimeout(() => {
      pageIndex.classList.remove('page-exit');
      pushRoute({ name: 'quiz', levelId: DAILY_ID, fromPage: 'index' });
    }, 720);
    return;
  }
  pushRoute({ name: 'quiz', levelId: DAILY_ID, fromPage });
}
function completeDaily() {
  ensureDaily();
  if (MECH.daily.completed) return;
  MECH.daily.completed = true;
  MECH.daily.streak = (MECH.daily.streak || 0) + 1;
  MECH.daily.lastCompletedDate = todayStr();
  saveMechanics();
  saveMechanicsCloud();
  toast(w.t('dailyCompletedToast'));
  renderDailyBadge();
}
function renderDailyBadge() {
  ensureDaily();
  ['extrasDailyBtn', 'map-daily-btn'].forEach(btnId => {
    const btn = d.getElementById(btnId);
    if (!btn) return;
    if (MECH.daily.completed) {
      btn.textContent = w.t('dailyDone');
      btn.classList.add('extras-daily-btn--done');
    } else {
      btn.innerHTML = '<span class="extras-daily-btn__icon">🎁</span> ' + escapeHtml(w.t('dailyTitle'));
      btn.classList.remove('extras-daily-btn--done');
    }
  });
  const streakEl = d.getElementById('extrasDailyStreak');
  if (streakEl) {
    const s = Number(MECH.daily.streak) || 0;
    if (s > 0) {
      if (w.LANG === 'en') {
        streakEl.textContent = 'Streak: ' + s + (s === 1 ? ' day in a row' : ' days in a row');
      } else if (w.LANG === 'tr') {
        streakEl.textContent = 'Seri: art arda ' + s + ' gün';
      } else {
        let word = 'дней';
        const m100 = s % 100, m10 = s % 10;
        if (m100 < 11 || m100 > 14) {
          if (m10 === 1) word = 'день';
          else if (m10 >= 2 && m10 <= 4) word = 'дня';
        }
        streakEl.textContent = 'Серия: ' + s + ' ' + word + ' подряд';
      }
      streakEl.style.display = 'block';
    } else streakEl.style.display = 'none';
  }
}
function onCorrectAnswer() {
  MECH.surprise.counter = (MECH.surprise.counter || 0) + 1;
  let bonus = 0;
  if (MECH.surprise.counter % SURPRISE_PERIOD === 0) {
    bonus = 1;
    toast(w.t('bonusToast'));
  }
  saveMechanics();
  updateQuestProgress('solve', 1);
  claimReadyQuests(); 
  renderBonusCounter();
  return bonus;
}
function renderBonusCounter() {
  const el = d.getElementById('extrasBonusCounter');
  if (!el) return;
  const quizScreen = d.getElementById('quiz-screen');
  const isQuizActive = quizScreen && quizScreen.classList.contains('active');
  if (!isQuizActive) { el.style.display = 'none'; return; }
  const c = MECH.surprise.counter || 0;
  const left = SURPRISE_PERIOD - (c % SURPRISE_PERIOD);
  el.style.display = 'inline-flex';
  el.textContent = w.t('bonusCounter').replace('{n}', left);
}
function findNextLockedLevel() {
  const unlocked = new Set((w.__SYNCED__ && w.__SYNCED__.unlocked) || []);
  const total = Number(w.__SYNCED__ && w.__SYNCED__.total) || 0;
  let best = null;
  const consider = (lvl) => {
    const nid = Number(lvl.id);
    if (unlocked.has(nid)) return;
    if (isPurchasedLevel(nid) || isTempUnlockedLevel(nid)) return;
    const price = getLevelPrice(nid);
const need = Math.max(0, price - total);
if (!best || price < best.price) best = { level: lvl, price, need, levelId: nid };
  };
  (w.REGIONS || []).forEach(reg => reg.levels.forEach(consider));
  (w.THEMED_LEVELS || []).forEach(consider);
  (w.PHOTO_LEVELS || []).forEach(consider);
  return best;
}
function renderProgress() {
  const el = d.getElementById('extrasProgress');
  if (!el) return;
  const next = findNextLockedLevel();
  if (!next) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  const name = w.L ? w.L(next.level.name) : next.level.name;
  const total = Number(w.__SYNCED__ && w.__SYNCED__.total) || 0;
  const ready = next.need <= 0;
  el.innerHTML =
    '<span class="extras-progress__label">' + lockedIcon('1.1em') + ' ' + escapeHtml(name) + '</span>' +
    '<span class="extras-progress__right">' + ptsIcon('1.1em') + ' ' +
    (ready
      ? escapeHtml(w.t('progressReady').replace('{price}', next.price))
      : escapeHtml(w.t('progressNeed').replace('{total}', total).replace('{price}', next.price).replace('{need}', next.need))) +
    '</span>';
}
function openHelpModal() {
  const m = d.getElementById('extrasHelpModal');
  if (m) {
    if (m.parentElement !== d.body) d.body.appendChild(m);
    m.classList.add('show');
  }
}
function onQuizFinish(data) {
  if (!data) return;
  if (Number(data.levelId) === DAILY_ID) {
    if (Number(data.total) > 0 && Number(data.correctCount) === Number(data.total)) {
      completeDaily();
    } else {
      toast(w.t('dailyNeedAll'));
    }
  }
  updateQuestProgress('quiz', 1);
  if (Number(data.percent) >= 90) updateQuestProgress('stars3', 1);
  if (Number(data.total) > 0 && Number(data.correctCount) === Number(data.total)) updateQuestProgress('perfect', 1);
  if (Number(data.maxStreak) > 0) updateQuestProgress('streak', Number(data.maxStreak));
  claimReadyQuests().then(() => renderProgress());
  renderDailyBadge();
}
function mergeTempUnlocks() {
  if (!w.__SYNCED__) return;
  if (!Array.isArray(w.__SYNCED__.unlocked)) w.__SYNCED__.unlocked = [];
  const now = Date.now();
  let changed = false;
  for (const nid in MECH.tempUnlocks) {
    if (MECH.tempUnlocks[nid] > now) {
      if (w.__SYNCED__.unlocked.indexOf(Number(nid)) === -1) w.__SYNCED__.unlocked.push(Number(nid));
    } else { delete MECH.tempUnlocks[nid]; changed = true; }
  }
  if (changed) saveMechanics();
}
const _oggCache = {};
['levelup', 'buy_cat', 'menu_select'].forEach(name => {
  try {
    const a = new Audio('sounds/' + name + '.ogg');
    a.preload = 'auto';
    _oggCache[name] = a;
  } catch (e) {}
});
function playOgg(name) {
  if (!canPlaySfx()) return;
  try {
    const base = _oggCache[name];
    if (!base) return;
    const inst = base.cloneNode();
    inst.volume = 0.8;
    inst.play().catch(() => {});
  } catch (e) {}
}
let _deviceTier = null;
function getDeviceTier() {
    if (_deviceTier !== null) return _deviceTier;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isNarrow   = window.innerWidth < 768;
    const isMobile   = isMobileUA || isNarrow;
    const cores = navigator.hardwareConcurrency || 0;
    const ram   = navigator.deviceMemory || 0; 
    const weakCPU = cores > 0 && cores <= 2;
    const lowRAM  = ram   > 0 && ram   <= 2;
    if (isMobile && (weakCPU || lowRAM)) _deviceTier = 'weak';
    else if (isMobile)                   _deviceTier = 'mobile';
    else                                 _deviceTier = 'desktop';
    return _deviceTier;
}
w.playOgg = playOgg;
function getConfettiCount() {
    const tier = (typeof getDeviceTier === 'function') ? getDeviceTier() : 'desktop';
    if (tier === 'weak')   return 7;
    if (tier === 'mobile') return 12;
    return 22;
}
function playConfetti(count) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!count || count <= 0) return;
    const oldLayer = document.querySelector('.confetti-layer');
    if (oldLayer) oldLayer.remove();
    const isWeak = (typeof getDeviceTier === 'function') && getDeviceTier() === 'weak';
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    const frag = document.createDocumentFragment();
    const colors = ['#667eea','#764ba2','#10b981','#f59e0b','#ef4444','#4a9eff','#43a047'];
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.background = colors[i % colors.length];
        c.style.left = (5 + Math.random() * 90) + '%';
        c.style.animationDelay = (Math.random() * 0.2) + 's';
        c.style.animationDuration = (1.3 + Math.random() * 0.6) + 's';
        c.style.setProperty('--rot', isWeak ? '0deg' : (Math.floor(Math.random() * 720 - 360) + 'deg'));
        c.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
        frag.appendChild(c);
    }
    layer.appendChild(frag);
    document.body.appendChild(layer);
    setTimeout(() => {
        if (layer.parentNode) layer.remove();
    }, 2400);
}
function initMechanics() {
const MAXLVL_KEY = 'maxlvl';
let maxReachedLevel = 1;
async function loadMaxLevel() {
  const saved = await storageGet(MAXLVL_KEY);
  maxReachedLevel = Math.max(1, Number(saved) || 1);
  if (window.StartMenu) window.StartMenu.updateStats();
  return maxReachedLevel;
}
async function updateMaxLevel(lvlNum) {
  const n = Number(lvlNum) || 1;
  if (n > maxReachedLevel) {
    maxReachedLevel = n;
    await storageSet(MAXLVL_KEY, maxReachedLevel);
    if (window.StartMenu && typeof window.StartMenu.updateStats === 'function') {
      window.StartMenu.updateStats();
    }
  }
}
let _levelSeq = 0;
let _levelSeqTimer = null;
function showLevelSequence(level, cb) {
    const ov = document.getElementById('levelOverlay');
    const box = document.getElementById('levelOverlayBox');
    if (!ov || !box) { cb(); return; }
    if (_levelSeqTimer) {
        clearTimeout(_levelSeqTimer);
        _levelSeqTimer = null;
    }
    if (ov.parentElement !== document.body) {
        document.body.appendChild(ov);
    }
    const seq = ++_levelSeq;
    const hasLevel = level != null && Number(level) > 0;
    const steps = hasLevel
        ? ['<div class="level-overlay__line">' + escapeHtml(w.t('levelWord')) + '</div><div class="level-overlay__line">' + level + '</div>', '3', '2', '1']
        : ['3', '2', '1'];
    let i = 0;
    clearLevelDeco(ov);
    spawnLevelDeco(ov);
    ov.classList.add('show');
    (function next() {
        if (seq !== _levelSeq) return;
        if (i >= steps.length) {
            _levelSeqTimer = null;
            ov.classList.remove('show');
            clearLevelDeco(ov);
            cb();
            return;
        }
        const isTitleStep = hasLevel && i === 0;
        box.innerHTML = isTitleStep ? steps[0] : '<div class="level-overlay__line">' + steps[i] + '</div>';
        box.style.animation = 'none';
        void box.offsetWidth;
        box.style.animation = '';
        if (typeof playOgg === 'function') {
            playOgg(isTitleStep ? 'levelup' : 'menu_select');
        }
        _levelSeqTimer = setTimeout(next, isTitleStep ? 1800 : 700);
        i++;
    })();
}
function hideLevelSequence() {
    _levelSeq++;
    if (_levelSeqTimer) {
        clearTimeout(_levelSeqTimer);
        _levelSeqTimer = null;
    }
    const ov = document.getElementById('levelOverlay');
    if (ov) {
        ov.classList.remove('show');
        clearLevelDeco(ov);
    }
}
function clearLevelDeco(ov) {
if (!ov) return;
ov.querySelectorAll('.level-overlay__deco').forEach(function (el) { el.remove(); });
}
function spawnLevelDeco(ov) {
    if (!ov) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var tier = (typeof getDeviceTier === 'function') ? getDeviceTier() : 'desktop';
    var isMobile = (tier === 'mobile' || tier === 'weak');
    var items = [
        { type: 'leaf',  dx: -95, dy: 68, s: .9  },
        { type: 'star',  dx: -58, dy: 84, s: .85 },
        { type: 'berry', dx: -20, dy: 92, s: 1   },
        { type: 'berry', dx:  20, dy: 92, s: .85 },
        { type: 'star',  dx:  58, dy: 84, s: .85 },
        { type: 'leaf',  dx:  95, dy: 68, s: .9  }
    ];
    items.forEach(function (it, i) {
        var el = document.createElement('div');
        el.className = 'start-deco start-deco--' + it.type + (isMobile ? '' : ' start-deco-float') + ' level-overlay__deco';
        el.style.left = 'calc(50% + ' + it.dx + 'px)';
        el.style.top  = 'calc(50% + ' + it.dy + 'px)';
        el.style.transform = 'translate(-50%, -50%) scale(' + it.s + ')';
        if (!isMobile) {
            el.style.animationDelay = (i * .2) + 's';
        }
        el.style.zIndex = '1';
        ov.appendChild(el);
    });
}
function createGameDeco() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.game-deco').forEach(function (el) { el.remove(); });
    [
        { type: 'cloud', x: 8, y: 12, s: 1 }, { type: 'cloud', x: 78, y: 8, s: .8 }, { type: 'cloud', x: 85, y: 70, s: .7 },
        { type: 'star',  x: 15, y: 70, s: 1 }, { type: 'star',  x: 90, y: 30, s: .8 }, { type: 'star',  x: 5, y: 45, s: .6 },
        { type: 'leaf',  x: 20, y: 85, s: 1 }, { type: 'leaf',  x: 72, y: 88, s: .9 },
        { type: 'berry', x: 30, y: 15, s: 1 }, { type: 'berry', x: 65, y: 18, s: .8 }, { type: 'berry', x: 92, y: 55, s: .7 }
    ].forEach(function (it, i) {
        var el = document.createElement('div');
        el.className = 'start-deco start-deco--' + it.type + ' start-deco-float game-deco';
        el.style.left = it.x + '%';
        el.style.top = it.y + '%';
        el.style.transform = 'scale(' + it.s + ')';
        el.style.animationDelay = (i * .3) + 's';
        document.body.appendChild(el);
    });
}
w.showLevelSequence = showLevelSequence;
w.hideLevelSequence = hideLevelSequence;
w.updateMaxLevel = updateMaxLevel;
loadMaxLevel();
createGameDeco();
window.startRandomGame = function (skipIntro) {
  var unlocked = (window.__SYNCED__ && window.__SYNCED__.unlocked) || new Array();
  var available = new Array();
  for (var i = 0; i < unlocked.length; i++) {
    var n = Number(unlocked[i]);
    if (n > 0 && n < 1000 && window.QUIZZES[String(n)]) available.push(n);
  }
  if (!available.length) available = new Array(1);
  var pick = available[Math.floor(Math.random() * available.length)];
  if (skipIntro) {
    w.__autoStartQuiz = true;
  }
  pushRoute({ name: 'quiz', levelId: pick });
};
window.startMapGame = function (skipIntro) {
  var mapUnlocked = (window.__SYNCED__ && window.__SYNCED__.mapUnlocked) || new Array(2001);
  var mapUnlockedSet = new Set(mapUnlocked.map(Number));
  var starsMap = asObject(w.__SYNCED__ && w.__SYNCED__.stars);
  var mapLevels = getMapLevels();
  var lastIdx = 0;
  mapLevels.forEach(function (lvl, idx) {
    if (mapUnlockedSet.has(Number(lvl.id))) {
      lastIdx = idx;
    }
  });
  var curLvl = mapLevels[lastIdx] || { id: 2001 };
  var targetLevelId = Number(curLvl.id);
  var curStars = Math.floor(Number(starsMap[targetLevelId]) || 0);
  var nextLvl = (lastIdx + 1 < mapLevels.length) ? mapLevels[lastIdx + 1] : null;
  var nextPreUnlocked = nextLvl && !mapUnlockedSet.has(Number(nextLvl.id)) && curStars >= 2;
  if (nextPreUnlocked) {
    pushRoute({ name: 'map' });
    setTimeout(function () {
      var tut = d.getElementById('extrasTutOverlay');
      if (tut && tut.style.display !== 'none') return;
      showMapUnlockAdModal(nextLvl, lastIdx + 1);
    }, 120);
    return;
  }
  if (skipIntro) {
    w.__autoStartQuiz = true;
  }
  w.__quizFromMap = true;
  pushRoute({ name: 'quiz', levelId: targetLevelId, fromPage: 'map' });
};
  loadMechanics();
   claimReadyQuests();
  ensureQuests();
  ensureDaily();
  renderDailyBadge();
if (window.StartMenu && window.StartMenu.init) window.StartMenu.init(); updateCategoriesBtnVisibility();
['menuHomeBtn', 'mapMenuHomeBtn'].forEach(btnId => {
  const btn = d.getElementById(btnId);
  if (btn) {
    btn.addEventListener('click', () => {
      pushRoute({
        name: currentPage || (isLevel92Completed() ? 'index' : 'map'),
        startMenuOpen: true
      });
    });
  }
});
  loadMechanicsCloud().then(() => {
        ensureQuests();
    ensureDaily();
     claimReadyQuests();
    renderDailyBadge();
    renderProgress();
    mergeTempUnlocks();
    if (currentPage === 'index') { try { renderIndex(); } catch (e) {} }
  });
  const dailyBtn = d.getElementById('extrasDailyBtn');
  if (dailyBtn) dailyBtn.onclick = startDailyChallenge;
  const questsBtn = d.getElementById('extrasQuestsBtn');
  if (questsBtn) questsBtn.onclick = openQuestsModal;
  ['extrasHelpBtn', 'mapHelpBtn'].forEach(btnId => {
    const btn = d.getElementById(btnId);
    if (btn) btn.onclick = openHelpModal;
  });
  const questsModal = d.getElementById('extrasQuestsModal');
  if (questsModal) {
    questsModal.querySelectorAll('.modal-close, [data-act="close"]').forEach(b => {
      b.onclick = () => questsModal.classList.remove('show');
    });
    questsModal.onclick = (e) => { if (e.target === questsModal) questsModal.classList.remove('show'); };
  }
  const helpModal = d.getElementById('extrasHelpModal');
  if (helpModal) {
    helpModal.querySelectorAll('.modal-close, [data-act="close"]').forEach(b => {
      b.onclick = () => helpModal.classList.remove('show');
    });
    const tutBtn = helpModal.querySelector('[data-act="tutorial"]');
    if (tutBtn) tutBtn.onclick = () => {
      helpModal.classList.remove('show');
      if (w.GameTutorial && typeof w.GameTutorial.start === 'function') w.GameTutorial.start(true);
    };
    helpModal.onclick = (e) => { if (e.target === helpModal) helpModal.classList.remove('show'); };
  }
  setTimeout(() => {
    mergeTempUnlocks();
    renderProgress();
    renderDailyBadge();
  }, 300);
  (function tryAutoTutorial(n) {
    n = n || 0;
    if (n > 100) return;
    if (!w.__appReady) { setTimeout(() => tryAutoTutorial(n + 1), 200); return; }
    if (!w.GameTutorial || typeof w.GameTutorial.start !== 'function') return;
    (async () => {
      let passed = false;
      try {
        passed = (typeof w.GameTutorial.hasPassedAsync === 'function')
          ? await w.GameTutorial.hasPassedAsync()
          : w.GameTutorial.hasPassed();
      } catch (e) { passed = w.GameTutorial.hasPassed(); }
      if (!passed) {
        try { w.GameTutorial.start(); } catch (e) { console.warn('Tutorial auto-start failed:', e); }
      }
    })();
  })(0);
}
w.startDailyChallenge = startDailyChallenge;
w.openQuestsModal = openQuestsModal;
w.openHelpModal = openHelpModal;
w.toggleHeroMore = function (btnEl) {
    const activePage = d.querySelector('.page.active');
    const toggle = btnEl || (activePage && activePage.querySelector('[id$="MoreToggle"]')) || d.getElementById('heroMoreToggle');
    const menu = (toggle && toggle.parentElement && toggle.parentElement.querySelector('.hero-more'))
      || (activePage && activePage.querySelector('.hero-more'))
      || d.getElementById('heroMoreMenu');
    if (!menu) return;
    const willShow = menu.hasAttribute('hidden');
    if (willShow) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
    if (toggle) toggle.setAttribute('aria-expanded', willShow ? 'true' : 'false');
};
})(window, document);
