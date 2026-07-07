// ===== ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ И СВАЙПА =====
function disableContextMenuAndSwipe() {
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    if (touch) {
      window._touchStartX = touch.clientX;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    const touch = e.touches[0];
    if (touch && window._touchStartX) {
      const deltaX = touch.clientX - window._touchStartX;
      if (Math.abs(deltaX) > 30) {
        e.preventDefault();
        return false;
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    if (window.scrollY === 0 && e.touches[0].clientY < 50) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });

  document.addEventListener('dblclick', function(e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  console.log('🚫 Контекстное меню и свайп отключены');
}

// ===== VK BRIDGE ИНИЦИАЛИЗАЦИЯ =====
// ===== VK BRIDGE ИНИЦИАЛИЗАЦИЯ (упрощённая, по рабочему примеру) =====
function initVKBridge() {
  console.log('🔌 Инициализация VK Bridge...');

  // Проверяем, что глобальный объект vkBridge загружен
  if (typeof vkBridge === 'undefined') {
    console.warn('⚠️ VK Bridge не загружен');
    return;
  }

  // Сохраняем в window для доступа из других скриптов (wordsPage.js и т.д.)
  window.vkBridge = vkBridge;

  // Подписываемся на события (обработка скрытия/восстановления приложения)
  vkBridge.subscribe((e) => {
    if (e.detail.type === 'VKWebAppViewHide') {
      console.log('📱 Приложение скрыто');
      // Можно добавить паузу для игр, если нужно
    }
    if (e.detail.type === 'VKWebAppViewRestore') {
      console.log('📱 Приложение восстановлено');
    }
  });

  // Отправляем команду инициализации
  vkBridge.send('VKWebAppInit')
    .then(() => {
      console.log('✅ VK Bridge инициализирован');
      showBannerAd(); // показываем баннер после успешной инициализации
    })
    .catch((error) => {
      console.error('❌ Ошибка инициализации VK Bridge:', error);
    });
}

// ===== РЕКЛАМНЫЙ БАННЕР =====
function showBannerAd() {
  console.log('📢 Запуск рекламного баннера...');

  const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;

  if (!bridge) {
    console.warn('⚠️ VK Bridge не доступен');
    return;
  }

  bridge.send('VKWebAppShowBannerAd', { 
    banner_location: 'bottom' 
  })
  .then((data) => {
    console.log('✅ Баннер показан:', data);
  })
  .catch((error) => {
    console.error('❌ Ошибка баннера:', error);
  });
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С VK =====
function share2() {
  const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
  
  if (bridge) {
    bridge.send('VKWebAppShowShareBox', { link: window.location.href })
      .then((data) => {
        console.log('✅ Поделились:', data);
      })
      .catch((error) => {
        console.error('❌ Ошибка при шеринге:', error);
      });
  } else {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      }).catch(() => {});
    } else {
      alert('Поделиться можно через VK Bridge');
    }
  }
}

function favor1() {
  const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
  
  if (bridge) {
    bridge.send('VKWebAppAddToFavorites', {})
      .then((data) => {
        console.log('✅ Добавлено в избранное:', data);
      })
      .catch((error) => {
        console.error('❌ Ошибка добавления в избранное:', error);
      });
  } else {
    alert('Добавьте страницу в закладки браузера');
  }
}

function joingroup() {
  const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
  
  if (bridge) {
    bridge.send('VKWebAppJoinGroup', { group_id: 12345678 })
      .then((data) => {
        console.log('✅ Подписались на группу:', data);
      })
      .catch((error) => {
        console.error('❌ Ошибка подписки на группу:', error);
      });
  } else {
    alert('Подпишитесь на нашу группу в VK!');
  }
}

// ===== СОЗДАНИЕ КОСМИЧЕСКОГО ФОНА =====
function createCosmicBackground() {
  const oldBg = document.getElementById('cosmic-bg');
  if (oldBg) oldBg.remove();

  const bg = document.createElement('div');
  bg.id = 'cosmic-bg';
  document.body.prepend(bg);

  const starColors = ['#ffffff', '#f0e6ff', '#c8b8ff', '#ffd6e8', '#b8d4ff', '#ffd700'];
  
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 4 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.background = starColors[Math.floor(Math.random() * starColors.length)];
    star.style.setProperty('--duration', (Math.random() * 5 + 2) + 's');
    star.style.animationDelay = (Math.random() * 6) + 's';
    star.style.opacity = Math.random() * 0.8 + 0.2;
    star.style.boxShadow = `0 0 ${Math.random() * 8 + 2}px ${star.style.background}`;
    bg.appendChild(star);
  }

  const meteorColors = ['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
  
  for (let i = 0; i < 3; i++) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    const color = meteorColors[Math.floor(Math.random() * meteorColors.length)];
    meteor.style.left = (Math.random() * 70 + 10) + '%';
    meteor.style.top = (Math.random() * 40 + 5) + '%';
    meteor.style.animationDuration = (Math.random() * 10 + 8) + 's';
    meteor.style.animationDelay = '0s';
    meteor.style.background = color;
    meteor.style.boxShadow = `0 0 12px 4px ${color}40, 0 0 40px 8px ${color}20`;
    meteor.style.width = '4px';
    meteor.style.height = '4px';
    bg.appendChild(meteor);
  }

  const nebulaColors = [
    'rgba(120, 40, 200, 0.15)',
    'rgba(200, 50, 150, 0.10)',
    'rgba(40, 80, 220, 0.12)',
    'rgba(220, 100, 50, 0.08)'
  ];
  
  for (let i = 0; i < 4; i++) {
    const nebula = document.createElement('div');
    nebula.style.cssText = `
      position: absolute;
      width: ${Math.random() * 60 + 30}%;
      height: ${Math.random() * 40 + 20}%;
      left: ${Math.random() * 70}%;
      top: ${Math.random() * 70}%;
      background: radial-gradient(ellipse, ${nebulaColors[i % nebulaColors.length]} 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(40px);
      pointer-events: none;
      opacity: 0.6;
    `;
    bg.appendChild(nebula);
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'cosmic';
  applyThemeToBackground(currentTheme);

  console.log('✅ Космический фон создан!');
  return bg;
}

// ===== ПРИМЕНЕНИЕ ТЕМЫ К ФОНУ =====
function applyThemeToBackground(themeName) {
  const bg = document.getElementById('cosmic-bg');
  if (!bg) return;

  switch(themeName) {
    case 'cosmic':
      bg.style.background = 'radial-gradient(ellipse at 20% 50%, rgba(80, 20, 160, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30, 60, 200, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(200, 50, 150, 0.2) 0%, transparent 50%), #0a0a1a';
      break;
    case 'pastel':
      bg.style.background = 'radial-gradient(ellipse at 30% 40%, rgba(244, 114, 182, 0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(251, 191, 36, 0.15) 0%, transparent 50%), #faf0f5';
      break;
    case 'blue':
      bg.style.background = 'radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), #0a1628';
      break;
    default:
      bg.style.background = 'radial-gradient(ellipse at 20% 50%, rgba(80, 20, 160, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30, 60, 200, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(200, 50, 150, 0.2) 0%, transparent 50%), #0a0a1a';
  }
}

// ===== УПРАВЛЕНИЕ ТЕМАМИ =====
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('preferredTheme', themeName);
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });

  applyThemeToBackground(themeName);
}

function loadSavedTheme() {
  const saved = localStorage.getItem('preferredTheme');
  const theme = saved || 'cosmic';
  setTheme(theme);
  return theme;
}

// ===== УНИВЕРСАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ =====
function initApp() {
  console.log('🚀 Инициализация приложения...');
  
  disableContextMenuAndSwipe();
  createCosmicBackground();
  loadSavedTheme();
  initVKBridge();

  if (document.getElementById('cosmic-bg')) {
    console.log('✅ Фон успешно создан и виден');
  } else {
    console.error('❌ Ошибка: фон не создан!');
    setTimeout(() => {
      createCosmicBackground();
    }, 100);
  }
}

// ===== ЗАПУСК =====
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp);
}

setTimeout(() => {
  if (!document.getElementById('cosmic-bg')) {
    console.warn('⚠️ Фон не найден, создаем принудительно...');
    createCosmicBackground();
    loadSavedTheme();
  }
}, 500);


console.log('📱 App.js полностью загружен!');
