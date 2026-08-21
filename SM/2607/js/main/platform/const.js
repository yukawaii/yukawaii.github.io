// ============================================================
//  CONST – общие константы и утилиты для Game и Event
// ============================================================

const MAX_CHARGES = 20;
const COOLDOWN_MS = 120000;
const DRAG_THRESHOLD = 8;

// Размеры доски
const DEFAULT_ROWS = 7;
const DEFAULT_COLS = 9;
const MOBILE_ROWS = 9;   // для портретной ориентации на мобильных
const MOBILE_COLS = 7;

/**
 * Вычислить размеры доски в зависимости от ориентации и устройства
 * @returns {{ rows: number, cols: number, isMobile: boolean, isPortrait: boolean }}
 */
function computeBoardSize() {
    // Используем глобальный Device
    const isMobile = Device.isMobile;
    const isPortrait = Device.isPortrait;

    let rows, cols;
    if (isMobile && isPortrait) {
        rows = MOBILE_ROWS;
        cols = MOBILE_COLS;
    } else {
        rows = DEFAULT_ROWS;
        cols = DEFAULT_COLS;
    }
    return { rows, cols, isMobile, isPortrait };
}

/**
 * Показать всплывающее сообщение над клеткой
 * @param {HTMLCanvasElement} canvas
 * @param {number} scaleX
 * @param {number} scaleY
 * @param {number} cellWidth
 * @param {number} cellHeight
 * @param {number} row
 * @param {number} col
 * @param {string} messageKey
 * @param {number} duration
 */
function showFloatingMessage(canvas, scaleX, scaleY, cellWidth, cellHeight, row, col, messageKey, duration = 3000) {
    const message = getText(messageKey, messageKey);
    if (!message) return;

    const old = document.querySelector('.floating-message');
    if (old) old.remove();

    const canvasRect = canvas.getBoundingClientRect();
    const cellCenterX = col * cellWidth + cellWidth / 2;
    const cellCenterY = row * cellHeight + cellHeight / 2;
    const x = canvasRect.left + cellCenterX / scaleX;
    const y = canvasRect.top + cellCenterY / scaleY;

    const el = document.createElement('div');
    el.className = 'floating-message';
    el.textContent = message;
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    document.body.appendChild(el);

    requestAnimationFrame(() => {
        el.classList.add('show');
    });

    setTimeout(() => {
        el.classList.remove('show');
        el.classList.add('hide');
    }, duration - 200);

    setTimeout(() => {
        el.remove();
    }, duration + 300);
}

/**
 * Нарисовать круговой таймер перезарядки
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} cell - объект клетки с charges, cooldownEnd
 * @param {number} x - левый верхний угол клетки
 * @param {number} y
 * @param {number} cw - ширина клетки
 * @param {number} ch - высота клетки
 * @param {boolean} isMobile
 */
function drawCooldownTimer(ctx, cell, x, y, cw, ch, isMobile) {
    if (!cell || cell.charges === undefined || cell.charges === Infinity) return;
    if (cell.cooldownEnd <= Date.now()) return;

    const now = Date.now();
    const remaining = cell.cooldownEnd - now;
    if (remaining <= 0) return;

    const progress = Math.min(remaining / COOLDOWN_MS, 1);
    const radius = Math.min(cw, ch) * 0.25;
    const cx = x + cw - radius - 4;
    const cy = y + ch - radius - 4;

    ctx.save();
    ctx.globalAlpha = 0.85;
    if (!isMobile) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    if (!isMobile) {
        ctx.shadowBlur = 0;
    }

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * (1 - progress);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.85, startAngle, endAngle);
    ctx.strokeStyle = '#ffdd77';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd77';
    ctx.fill();

    ctx.restore();
}

function showPausedMessage() {
    // Если игра не на паузе — ничего не делаем
    if (!Game.isPaused) return;
    
    // Показываем тост в центре экрана (или над любой клеткой)
    if (Game.canvas) {
        showFloatingMessage(
            Game.canvas,
            Game.scaleX,
            Game.scaleY,
            Game.cellWidth,
            Game.cellHeight,
            Math.floor(Game.rows / 2),
            Math.floor(Game.cols / 2),
            'pause_title',
            1500
        );
    }
}

// ============================================================
//  DEVICE DETECTION
// ============================================================

const Device = {
    isMobile: false,
    isLowPerformance: false,
    isTablet: false,
    isTouch: false,
    isPortrait: false,
};

function updateDeviceState() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    const isMobile = isTouch && (w < 768 || h < 600);
    const isTablet = isTouch && !isMobile && w >= 768 && w < 1024;
    const isLowPerformance = isMobile && (w < 480 || h < 480 || (window.devicePixelRatio && window.devicePixelRatio > 2.5));

    Device.isMobile = isMobile;
    Device.isLowPerformance = isLowPerformance;
    Device.isTablet = isTablet;
    Device.isTouch = isTouch;
    Device.isPortrait = h > w;
}

updateDeviceState();
window.addEventListener('resize', updateDeviceState);
window.addEventListener('orientationchange', () => setTimeout(updateDeviceState, 300));

window.Device = Device;
window.updateDeviceState = updateDeviceState;