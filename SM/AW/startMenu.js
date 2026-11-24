window.StartMenu = (function () {
  'use strict';

  var _initialized = false;
  var _hideTimer = null;
  var EXIT_DURATION = 720;

  var _bindings = [
    { id: 'startPlayBtn', handler: onPlay },
    { id: 'startCategoriesBtn', handler: onCategories },
    { id: 'startMapBtn', handler: onMap },
    { id: 'startHelpBtn', handler: onHelp },
    { id: 'startSoundBtn', handler: onSound },
    { id: 'startThemeBtn', handler: onTheme },
    { id: 'startAchBtn', handler: onAchievements }
  ];

  function init() {
    if (_initialized) return;
    _initialized = true;
    bindEvents();
    updateStats();
    updateSoundIcon();
    createStartDeco();
    window.addEventListener('quiz:sound-changed', updateSoundIcon);
  }

  function destroy() {
    if (!_initialized) return;
    _initialized = false;

    if (_hideTimer) {
      clearTimeout(_hideTimer);
      _hideTimer = null;
    }

    _bindings.forEach(function (item) {
      var el = document.getElementById(item.id);
      if (el) el.removeEventListener('click', item.handler);
    });

    window.removeEventListener('quiz:sound-changed', updateSoundIcon);
    removeStartDeco();
  }

  function bindEvents() {
    _bindings.forEach(function (item) {
      var el = document.getElementById(item.id);
      if (el) el.addEventListener('click', item.handler);
    });
  }

  function hideMenu() {
    var s = document.getElementById('startScreen');
    if (!s) return;

    if (_hideTimer) clearTimeout(_hideTimer);
    s.classList.add('start-exit');

    _hideTimer = setTimeout(function () {
      _hideTimer = null;
      s.classList.remove('start-exit');
      s.classList.add('hidden');
      removeStartDeco();
    }, EXIT_DURATION);
  }

  function onPlay() {
    var s = document.getElementById('startScreen');
    if (!s || s.classList.contains('start-exit')) return;
    if (window.Sound && window.Sound.unlockAndPlay) window.Sound.unlockAndPlay();
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.id === 'page-quiz');
    });
    var homeScr = document.getElementById('home-screen');
    var quizScr = document.getElementById('quiz-screen');
    if (homeScr) homeScr.classList.remove('active');
    if (quizScr) quizScr.classList.add('active');
    if (typeof window.startMapGame === 'function') {
      window.startMapGame(true);
    }
    hideMenu();
  }

  function onCategories() {
    var s = document.getElementById('startScreen');
    if (!s || s.classList.contains('start-exit')) return;
    if (window.Sound && window.Sound.unlockAndPlay) window.Sound.unlockAndPlay();
    if (typeof window.pushRoute === 'function') window.pushRoute({ name: 'index' });
    hideMenu();
  }

  function onMap() {
    var s = document.getElementById('startScreen');
    if (!s || s.classList.contains('start-exit')) return;
    if (window.Sound && window.Sound.unlockAndPlay) window.Sound.unlockAndPlay();
    if (typeof window.pushRoute === 'function') window.pushRoute({ name: 'map' });
    hideMenu();
  }

  function onHelp() {
    if (window.openHelpModal) window.openHelpModal();
  }

  function onSound() {
    if (window.Sound && window.Sound.toggle) window.Sound.toggle();
  }

  function onTheme() {
    if (window.Theme && window.Theme.toggle) window.Theme.toggle();
  }

  function onAchievements() {
    if (window.Ach && window.Ach.openModal) window.Ach.openModal();
  }

  function updateSoundIcon() {
    var btn = document.getElementById('startSoundBtn');
    if (!btn) return;
    var enabled = (window.Sound && typeof window.Sound.isEnabled === 'function')
      ? window.Sound.isEnabled()
      : true;
    var spriteClass = enabled ? 'ui-sprite--soundoff' : 'ui-sprite--soundon';
    btn.innerHTML = '<span class="ui-sprite ' + spriteClass + '" aria-hidden="true"></span>';
  }

  function updateStats() {
    var scoreEl = document.getElementById('startScoreValue');
    var lvlEl = document.getElementById('startMaxLevelValue');
    var total = 0;
    var maxLvl = 1;
    try {
      if (window.__SYNCED__) {
        total = Number(window.__SYNCED__.total) || 0;
      }
      if (typeof window.getMaxOpenedMapLevel === 'function') {
        maxLvl = window.getMaxOpenedMapLevel();
      } else {
        var prefix = (window.__PLATFORM && window.__PLATFORM.storagePrefix) || '';
        var savedMax = localStorage.getItem(prefix + 'aq_maxlvl');
        if (savedMax !== null) {
          maxLvl = Math.max(1, Number(JSON.parse(savedMax)) || 1);
        }
      }
    } catch (e) {}
    if (scoreEl) scoreEl.textContent = total;
    if (lvlEl) lvlEl.textContent = maxLvl;
  }


  function removeStartDeco() {
    var container = document.getElementById('startBg') || document.getElementById('startScreen');
    if (!container) return;
    container.querySelectorAll('.start-deco').forEach(function (el) {
      el.remove();
    });
  }

  function createStartDeco() {
    var container = document.getElementById('startBg') || document.getElementById('startScreen');
    if (!container || container.querySelector('.start-deco')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var frag = document.createDocumentFragment();
    var items = [
      { type: 'cloud', x: 8,  y: 12, s: 1   },
      { type: 'cloud', x: 78, y: 8,  s: .8  },
      { type: 'cloud', x: 85, y: 70, s: .7  },
      { type: 'star',  x: 15, y: 70, s: 1   },
      { type: 'star',  x: 90, y: 30, s: .8  },
      { type: 'star',  x: 5,  y: 45, s: .6  },
      { type: 'leaf',  x: 20, y: 85, s: 1   },
      { type: 'leaf',  x: 72, y: 88, s: .9  },
      { type: 'berry', x: 30, y: 15, s: 1   },
      { type: 'berry', x: 65, y: 18, s: .8  },
      { type: 'berry', x: 92, y: 55, s: .7  }
    ];

    items.forEach(function (it, i) {
      var el = document.createElement('div');
      el.className = 'start-deco start-deco--' + it.type + ' start-deco-float';
      el.style.left = it.x + '%';
      el.style.top = it.y + '%';
      el.style.transform = 'scale(' + it.s + ')';
      el.style.animationDelay = (i * .3) + 's';
      frag.appendChild(el);
    });

    container.appendChild(frag);
  }

  function showMenu() {
    var s = document.getElementById('startScreen');
    if (!s) return;
    if (typeof window.clearAdTimers === 'function') {
      window.clearAdTimers();
    }
    if (_hideTimer) {
      clearTimeout(_hideTimer);
      _hideTimer = null;
    }

    s.classList.remove('hidden', 'start-exit');
    createStartDeco();
    updateStats();
    updateSoundIcon();
  }

  return {
    init: init,
    destroy: destroy,
    show: showMenu,
    updateStats: updateStats,
    updateSoundIcon: updateSoundIcon
  };
})();

