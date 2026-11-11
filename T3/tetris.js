let arenaWidth = 10;
let arenaHeight = 20;
let arena = [];
let soundMuted = false;
let musicMuted = true;
let currentMusicTrack = null;
let isGameStarted = false;
let isGameOver = false;
let audioInitialized = false;
let selectedMode = 'classic';
let selectedDifficulty = 'medium';
let difficultyMultiplier = 1;
let slowDownInterval = null;
let isSlowDownActive = false;
let comboDisplayTimer = null;
let dailyBonusClaimedToday = false; 
let lastInterstitialAdTime = 0; 
let pendingSlowDown = false;
let slowDownTimerId = null;
let currentScrollPage = 1;
const SCROLLS_PER_PAGE = 5;
const TOTAL_SCROLLS = 100;
let currentCollectionPage = 1;
let currentCollectionCategory = null;
const COLLECTION_ITEMS_PER_PAGE = 15;
const CATEGORY_ORDER = ['blocks', 'animals', 'plants', 'space'];
const BONUS_TYPES={STAR:{symbol:"⭐",points:3,color:"#FFD700",label:"Звезда"},CLOVER:{symbol:"🍀",points:2,color:"#22c55e",label:"Клевер"},CANDY:{symbol:"🍬",points:1,color:"#f472b6",label:"Конфета"}};
let activeBonus = null;
let bonusSpawnCooldown = 0;
const BONUS_SPAWN_CHANCE = 0.15;
const BONUS_MAX_COOLDOWN = 7;
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const CYBER_COLORS={I:"#00ffff",O:"#FFE138",T:"#ff00ff",S:"#00ff66",Z:"#ff0055",L:"#ffaa00",J:"#0066ff"},colors=[null,CYBER_COLORS.I,CYBER_COLORS.O,CYBER_COLORS.T,CYBER_COLORS.S,CYBER_COLORS.Z,CYBER_COLORS.L,CYBER_COLORS.J];function calculateOptimalArenaWidth(){const e=document.querySelector(".canvas-container");if(!e)return 14;const t=e.getBoundingClientRect().width-12;if(t<=0)return 14;return/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)?t>=500?18:t>=400?16:14:t>=1e3?24:t>=800?22:t>=600?20:22}function updateCanvasSize(){const e=document.querySelector(".canvas-container");if(!e)return;const t=e.getBoundingClientRect(),n=.85*window.innerHeight,r=t.width-12,c=Math.min(t.height-12,n);r<=0||c<=0||(canvas.width=r,canvas.height=c)}function createMatrix(e,t){const n=[];for(;t--;)n.push(new Array(e).fill(0));return n}function createPiece(e){switch(e){case"T":return[[0,0,0],[1,1,1],[0,1,0]];case"O":return[[2,2],[2,2]];case"L":return[[0,3,0],[0,3,0],[0,3,3]];case"J":return[[0,4,0],[0,4,0],[4,4,0]];case"I":return[[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];case"S":return[[0,6,6],[6,6,0],[0,0,0]];case"Z":return[[7,7,0],[0,7,7],[0,0,0]];default:return[[0]]}}const pieces="ILJOTSZ",tetraPieces={I:{shape:[[1,1,1]],color:CYBER_COLORS.I},L:{shape:[[1,0],[1,1]],color:CYBER_COLORS.L},J:{shape:[[0,1],[1,1]],color:CYBER_COLORS.J},Z:{shape:[[1,1,0],[0,1,1]],color:CYBER_COLORS.Z},S:{shape:[[0,1,1],[1,1,0]],color:CYBER_COLORS.S},O:{shape:[[1,1],[1,1]],color:CYBER_COLORS.O},T:{shape:[[0,1,0],[1,1,1],[0,1,0]],color:CYBER_COLORS.T}};
const tetraKeys = ['I', 'L', 'J', 'Z', 'S', 'O', 'T'];
function createTetraPiece(){const e=tetraKeys[Math.floor(Math.random()*tetraKeys.length)],t=tetraPieces[e],o=t.shape.map((e=>[...e]));return o._color=t.color,o._key=e,o}function rotateTetraMatrix(e){const t=e._key;if("O"===t||"T"===t){const t=e.map((e=>[...e]));return t._color=e._color,t._key=e._key,t}const o=e.length,r=e[0].length,c=[];for(let t=0;t<r;t++){c[t]=[];for(let r=o-1;r>=0;r--)c[t].push(e[r][t])}return c._color=e._color,c._key=e._key,c}
const pentaPieces={I:{shape:[[1,1,1,1,1]],color:CYBER_COLORS.I},L:{shape:[[1,0],[1,0],[1,0],[1,1]],color:CYBER_COLORS.L},J:{shape:[[0,1],[0,1],[0,1],[1,1]],color:CYBER_COLORS.J},Z:{shape:[[1,1,0],[0,1,0],[0,1,1]],color:CYBER_COLORS.Z},S:{shape:[[0,1,1],[0,1,0],[1,1,0]],color:CYBER_COLORS.S},T:{shape:[[1,1,1],[0,1,0],[0,1,0]],color:CYBER_COLORS.T},P:{shape:[[1,1],[1,1],[1,0]],color:CYBER_COLORS.O}};
const pentaKeys = ['I', 'L', 'J', 'Z', 'S', 'T', 'P'];
function createPentaPiece(){const e=pentaKeys[Math.floor(Math.random()*pentaKeys.length)],t=pentaPieces[e],o=t.shape.map((e=>[...e]));return o._color=t.color,o._key=e,o}function rotatePentaMatrix(e){const t=e.length,o=e[0].length,n=[];for(let r=0;r<o;r++){n[r]=[];for(let o=t-1;o>=0;o--)n[r].push(e[o][r])}return n._color=e._color,n._key=e._key,n}
const player={pos:{x:5,y:0},matrix:null,nextMatrix:null,score:0,lines:0,level:1,spins:0,crazySpins:!1,isTetraMode:!1,isPentaMode:!1},gameState={initialized:!1,paused:!1,introSongPlayed:!1,gameOver:!1};
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationFrameId = null;
let gameOverAnimation = {
    active: false,
    startTime: 0,
    duration: 4000,
    matrix: null,
    pos: { x: 0, y: 0 }
};
function collide(arena, player) {
    if (player.isTetraMode) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const arenaY = y + o.y;
                    const arenaX = x + o.x;
                    if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) return true;
                    const cell = arena[arenaY]?.[arenaX];
                    if (cell !== 0 && cell !== 'bonus') return true;
                }
            }
        }
        return false;
    }
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                const arenaY = y + o.y;
                const arenaX = x + o.x;
                if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) return true;
                const cell = arena[arenaY]?.[arenaX];
                if (cell !== 0 && cell !== 'bonus') return true;
            }
        }
    }
    return false;
}
function spawnBonus(){if(activeBonus)return;if(bonusSpawnCooldown>0)return void bonusSpawnCooldown--;const o=["STAR","CLOVER","CANDY"],e=o[Math.floor(Math.random()*o.length)],n=BONUS_TYPES[e];let a;a="easy"===selectedDifficulty?arenaHeight-5:"medium"===selectedDifficulty?arenaHeight-8:5;let t,r,l=0,i=!1;for(;l<50&&!i;)r=Math.floor(Math.random()*a),t=Math.floor(Math.random()*arenaWidth),arena[r]&&0===arena[r][t]&&(i=!0),l++;i&&(activeBonus={type:e,x:t,y:r,symbol:n.symbol,points:n.points,color:n.color,label:n.label},arena[r][t]="bonus")}function checkBonusCollision(){if(!activeBonus)return!1;for(let o=0;o<player.matrix.length;o++)for(let e=0;e<player.matrix[o].length;e++){const n=player.pos.y+o,a=player.pos.x+e;if(arena[n]&&"bonus"===arena[n][a]){const o=activeBonus;return arena[n][a]=0,player.score+=o.points,"function"==typeof saveVKScore&&saveVKScore(player.score),showBonusNotification(o),activeBonus=null,bonusSpawnCooldown=BONUS_MAX_COOLDOWN,"undefined"!=typeof gameAudio&&gameAudio.playOneShot("levelup",.15),!0}}return!1}
function showBonusNotification(bonus) {
    const t = window.getText || (key => key);
    const bonusText = t('bonus') || 'Бонус!';
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; bottom: 30px; left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(20, 20, 30, 0.92);
        border: 2px solid ${bonus.color || '#FFD700'};
        border-radius: 20px; padding: 16px 30px;
        display: flex; align-items: center; gap: 16px;
        z-index: 99999; opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(20px);
        font-family: 'Russo One', sans-serif;
        pointer-events: none;
    `;
    notification.innerHTML = `
        <span>${bonus.symbol}</span>
        <div>
            <span style="color: #fff; text-transform: uppercase;">${bonusText}</span>
            <span style="color: ${bonus.color}; display: block;">${bonus.label}</span>
        </div>
        <span style="color: ${bonus.color}; font-weight: bold;">+${bonus.points}</span>
    `;
    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-30px)';
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 400);
    }, 2000);
}
function merge(o,a){if(a.isTetraMode||a.isPentaMode){const e=a.matrix._color||"#ff0000";a.matrix.forEach(((r,i)=>{r.forEach(((r,t)=>{if(0!==r){const r=a.pos.y+i,n=a.pos.x+t;r>=0&&r<arenaHeight&&n>=0&&n<arenaWidth&&"bonus"!==o[r][n]&&(o[r][n]=e)}}))}))}else a.matrix.forEach(((e,r)=>{e.forEach(((e,i)=>{if(0!==e){const t=a.pos.y+r,n=a.pos.x+i;t>=0&&t<arenaHeight&&n>=0&&n<arenaWidth&&"bonus"!==o[t][n]&&(o[t][n]=e)}}))}))}
function arenaSweep() {
    let rowsCleared = 0;
    let rowMultiplier = 1;
    for (let y = arenaHeight - 1; y >= 0; y--) {
        let full = true;
        for (let x = 0; x < arenaWidth; x++) {
            if (arena[y][x] === 0 || arena[y][x] === 'bonus') {
                full = false;
                break;
            }
        }
        if (full) {
            const row = arena.splice(y, 1)[0];
            arena.unshift(new Array(arenaWidth).fill(0));
            rowsCleared++;
            player.lines++;
            let pointsPerLine;
            if (selectedDifficulty === 'easy') pointsPerLine = 1;
            else if (selectedDifficulty === 'hard') pointsPerLine = 3;
            else pointsPerLine = 2;
            player.score += rowMultiplier * pointsPerLine;
            rowMultiplier *= 2;
            y++;
        }
    }
  rowsCleared>1&&showComboDisplay(rowsCleared);
rowsCleared>0&&(Math.random()<BONUS_SPAWN_CHANCE&&!activeBonus&&spawnBonus(),bonusSpawnCooldown>0&&bonusSpawnCooldown--);
    let oldLevel = player.level;
    if (player.lines >= 5 && player.level === 1) player.level = 2;
    else if (player.lines >= 10 && player.level === 2) player.level = 3;
    else if (player.lines >= 20 && player.level === 3) player.level = 4;
    else if (player.lines >= 40 && player.level === 4) player.level = 5;
    else if (player.lines >= 80 && player.level === 5) player.level = 6;
    else if (player.lines >= 160 && player.level === 6) player.level = 7;
    else if (player.lines >= 320 && player.level === 7) player.level = 8;
    else if (player.lines >= 640 && player.level === 8) player.level = 9;
oldLevel!==player.level&&"undefined"!=typeof gameAudio&&gameAudio.playOneShot("levelup",.2),rowsCleared>0&&"undefined"!=typeof gameAudio&&gameAudio.playOneShot("sweep",.25),"function"==typeof saveVKScore&&player&&void 0!==player.score&&saveVKScore(player.score);
    return rowsCleared;
}
function playerDrop(){player.pos.y++,collide(arena,player)&&(player.pos.y--,merge(arena,player),checkBonusCollision(),playerReset(),arenaSweep(),"undefined"!=typeof gameAudio&&gameAudio.playOneShot("collide",.05)),dropCounter=0}function playerMove(e){player.pos.x+=e,collide(arena,player)&&(player.pos.x-=e),"undefined"!=typeof gameAudio&&!gameState.paused&&isGameStarted&&gameAudio.playOneShot("rotate",.02)}
function rotate(e,r){for(let r=0;r<e.length;++r)for(let t=0;t<r;++t)[e[t][r],e[r][t]]=[e[r][t],e[t][r]];r>0?e.forEach((e=>e.reverse())):e.reverse()}
function playerRotate(e){const a=player.pos.x;let r=1;if(player.isTetraMode){const e=player.matrix.map((e=>[...e])),a=rotateTetraMatrix(player.matrix);player.matrix=a;const r=arenaWidth-player.matrix[0].length;return player.pos.x<0&&(player.pos.x=0),player.pos.x>r&&(player.pos.x=r),collide(arena,player)?void(player.matrix=e):void("undefined"!=typeof gameAudio&&gameAudio.playOneShot("rotate",.15))}if(player.isPentaMode){const e=player.matrix.map((e=>[...e])),a=rotatePentaMatrix(player.matrix);player.matrix=a;const r=arenaWidth-player.matrix[0].length;return player.pos.x<0&&(player.pos.x=0),player.pos.x>r&&(player.pos.x=r),collide(arena,player)?void(player.matrix=e):void("undefined"!=typeof gameAudio&&gameAudio.playOneShot("rotate",.15))}for(rotate(player.matrix,e);collide(arena,player);)if(player.pos.x+=r,r=-(r+(r>0?1:-1)),r>player.matrix[0].length)return rotate(player.matrix,-e),void(player.pos.x=a);player.crazySpins||("undefined"!=typeof gameAudio&&gameAudio.playOneShot("rotate",.15),player.spins++),player.spins>25&&(player.crazySpins=!0,"undefined"!=typeof gameAudio&&gameAudio.playOneShot("highspins",.2),player.spins=0,setTimeout((()=>{player.crazySpins=!1}),2e3))}function playerReset(){player.isTetraMode?(player.matrix=player.nextMatrix,player.nextMatrix=createTetraPiece()):player.isPentaMode?(player.matrix=player.nextMatrix,player.nextMatrix=createPentaPiece()):(player.matrix=player.nextMatrix,player.nextMatrix=createPiece(pieces[Math.floor(Math.random()*pieces.length)])),player.pos.y=0;const e=arenaWidth-player.matrix[0].length;player.pos.x=Math.floor(e/2),collide(arena,player)&&startGameOverAnimation()}
function startGameOverAnimation(){gameOverAnimation.active=!0,gameOverAnimation.startTime=Date.now(),gameOverAnimation.matrix=player.matrix.map((a=>[...a])),gameOverAnimation.pos={x:player.pos.x,y:player.pos.y},gameState.initialized=!1,isGameStarted=!1,gameState.paused=!1,stopSounds(),animationFrameId&&cancelAnimationFrame(animationFrameId),lastTime=0,dropCounter=0,update()}
function drawGameOverAnimation() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    if (!canvasWidth || !canvasHeight) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const topPanelHeight = isMobile ? 42 : 80;
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);
    const FIGURE_SCALE = 1.8;
    let scaledBlockSize = blockSize * FIGURE_SCALE;
    let finalBlockSize = scaledBlockSize;
    if (finalBlockSize * arenaWidth > canvasWidth) finalBlockSize = canvasWidth / arenaWidth;
    if (finalBlockSize * arenaHeight > gameAreaHeight) finalBlockSize = gameAreaHeight / arenaHeight;
    blockSize = finalBlockSize;
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            const value = arena[y][x];
            if (value !== 0 && value !== 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                let fillColor;
                if (typeof value === 'string' && value.startsWith('#')) fillColor = value;
                else fillColor = colors[value] || '#FFF';
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            }
        }
    }
    const elapsed = Date.now() - gameOverAnimation.startTime;
    const maxDuration = gameOverAnimation.duration;
    if (elapsed < maxDuration) {
        const blinkPhase = Math.floor(elapsed / 300) % 2;
        const alpha = blinkPhase ? 0.3 : 1.0;
        const matrix = gameOverAnimation.matrix;
        const pos = gameOverAnimation.pos;
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const value = matrix[y][x];
                if (value !== 0) {
                    const posX = offsetX + (pos.x + x) * blockSize;
                    const posY = offsetY + (pos.y + y) * blockSize;
                    let fillColor;
                    if ((isTetra || isPenta) && matrix._color) fillColor = matrix._color;
                    else fillColor = colors[value] || '#FF0D72';
                    if (alpha < 1) context.globalAlpha = 0.3;
                    context.fillStyle = fillColor;
                    context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.strokeStyle = "rgba(255,0,0,0.8)";
                    context.lineWidth = 2;
                    context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.globalAlpha = 1.0;
                    context.shadowBlur = 15;
                    context.shadowColor = 'rgba(255,0,0,0.5)';
                    context.strokeStyle = 'rgba(255,0,0,0.3)';
                    context.lineWidth = 3;
                    context.strokeRect(posX - 2, posY - 2, blockSize + 3, blockSize + 3);
                    context.shadowBlur = 0;
                }
            }
        }
        const t = window.getText || (key => key);
        context.fillStyle = 'rgba(0,0,0,0.4)';
        context.fillRect(0, canvasHeight / 2 - 60, canvasWidth, 120);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowBlur = 30;
        context.shadowColor = 'rgba(255,0,0,0.5)';
        context.fillStyle = '#ef4444';
        context.font = `${Math.min(42, canvasWidth / 10)}px Russo One`;
        context.fillText(t('gameOverTitle') || 'ИГРА ОКОНЧЕНА', canvasWidth / 2, canvasHeight / 2 - 10);
        context.shadowBlur = 0;
        context.fillStyle = '#94a3b8';
        context.font = `${Math.min(18, canvasWidth / 20)}px Russo One`;
        context.fillText(t('gameOverBlocked') || 'Фигура не помещается', canvasWidth / 2, canvasHeight / 2 + 40);
        animationFrameId = requestAnimationFrame(() => {
            if (gameOverAnimation.active) drawGameOverAnimation();
        });
    } else {
        gameOverAnimation.active = false;
           endGame();
          }
}
function drawGame() {
    if (!canvas || canvas.width === 0) updateCanvasSize();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isUltraSmall = window.innerWidth <= 280 || window.innerHeight <= 280;
const topPanelHeight = isUltraSmall ? (isMobile ? 28 : 50) : (isMobile ? 42 : 80);
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);
    const FIGURE_SCALE = 1.8;
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);
    let scaledBlockSize = blockSize * FIGURE_SCALE;
    let finalBlockSize = scaledBlockSize;
    if (finalBlockSize * arenaWidth > canvasWidth) finalBlockSize = canvasWidth / arenaWidth;
    if (finalBlockSize * arenaHeight > gameAreaHeight) finalBlockSize = gameAreaHeight / arenaHeight;
    blockSize = finalBlockSize;
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    const arenaLeft = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const arenaTop = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    const arenaWidthPx = blockSize * arenaWidth;
    const arenaHeightPx = blockSize * arenaHeight;
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);
    context.save();
    context.shadowBlur = 15;
    context.shadowColor = '#22c55e';
    context.beginPath();
    context.rect(arenaLeft - 1, arenaTop - 1, arenaWidthPx + 2, arenaHeightPx + 2);
    context.strokeStyle = '#166534';
    context.lineWidth = Math.max(2, blockSize * 0.12);
    context.stroke();
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = '#22c55e';
    context.lineWidth = Math.max(2.5, blockSize * 0.1);
    context.stroke();
    context.beginPath();
    context.rect(arenaLeft + 1, arenaTop + 1, arenaWidthPx - 2, arenaHeightPx - 2);
    context.strokeStyle = '#4ade80';
    context.lineWidth = 1.5;
    context.stroke();
    const cornerLength = Math.min(15, blockSize * 1.5);
    context.strokeStyle = '#86efac';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop - 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop - 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop - 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop - 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    context.shadowBlur = 25;
    context.shadowColor = '#22c55e';
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    context.lineWidth = 1;
    context.stroke();
    context.shadowBlur = 0;
    context.restore();
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            const value = arena[y][x];
            if (value !== 0 && value !== 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                let fillColor;
                if (typeof value === 'string' && value.startsWith('#')) fillColor = value;
                else fillColor = colors[value] || '#FFF';
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            } else if (value === 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                const pulse = Math.sin(Date.now() / 300) * 0.1 + 0.2;
                context.fillStyle = `rgba(255, 215, 0, ${pulse})`;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                context.lineWidth = 2;
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                let symbol = '⭐';
                if (activeBonus && activeBonus.x === x && activeBonus.y === y) symbol = activeBonus.symbol;
                context.fillStyle = '#000';
                context.font = `${blockSize * 0.55}px sans-serif`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(symbol, posX + blockSize/2, posY + blockSize/2);
            }
        }
    }
    if (player && player.matrix) {
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        for (let y = 0; y < player.matrix.length; y++) {
            for (let x = 0; x < player.matrix[y].length; x++) {
                const value = player.matrix[y][x];
                if (value !== 0) {
                    const posX = offsetX + (player.pos.x + x) * blockSize;
                    const posY = offsetY + (player.pos.y + y) * blockSize;
                    let fillColor;
                    if ((isTetra || isPenta) && player.matrix._color) fillColor = player.matrix._color;
                    else fillColor = colors[value] || '#FFF';
                    context.fillStyle = fillColor;
                    context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.strokeStyle = "rgba(0,0,0,0.4)";
                    context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                }
            }
        }
    }
const t = window.getText || (key => key);
context.fillStyle = '#111';
context.fillRect(0, 0, canvasWidth, topPanelHeight);
const titleFontSize = isUltraSmall 
    ? Math.min(5, canvasWidth / 40) 
    : (isMobile ? Math.min(12, canvasWidth / 25) : Math.min(22, canvasWidth / 20));
const valueFontSize = isUltraSmall 
    ? Math.min(7, canvasWidth / 25) 
    : (isMobile ? Math.min(18, canvasWidth / 16) : Math.min(36, canvasWidth / 12));
const textYTitle = isUltraSmall ? 10 : (isMobile ? 16 : 30);
const textYValue = isUltraSmall ? 22 : (isMobile ? 36 : 65);
context.textAlign = "center";
context.fillStyle = '#888';
context.font = `${titleFontSize}px Russo One`;
context.fillText(t('score'), canvasWidth * 0.12, textYTitle);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.score : 0, canvasWidth * 0.12, textYValue);
context.fillStyle = '#888';
context.font = `${titleFontSize * 0.8}px Russo One`;
context.fillText(t('lines'), canvasWidth * 0.32, textYTitle);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.lines : 0, canvasWidth * 0.32, textYValue);
context.fillStyle = '#888';
context.font = `${titleFontSize * 0.8}px Russo One`;
context.fillText(t('level'), canvasWidth * 0.52, textYTitle);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.level : 1, canvasWidth * 0.52, textYValue);
    if (player && player.nextMatrix) {
        const nextX = canvasWidth * 0.70;
        const nextY = isMobile ? 5 : 12;
        let blockNext = Math.min(isMobile ? 9 : 12, canvasWidth / 18);
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        for (let y = 0; y < player.nextMatrix.length; y++) {
            for (let x = 0; x < player.nextMatrix[y].length; x++) {
                const value = player.nextMatrix[y][x];
                if (value !== 0) {
                    let fillColor;
                    if ((isTetra || isPenta) && player.nextMatrix._color) fillColor = player.nextMatrix._color;
                    else fillColor = colors[value] || '#FFF';
                    context.fillStyle = fillColor;
                    context.fillRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
                    context.strokeStyle = "rgba(0,0,0,0.3)";
                    context.strokeRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
                }
            }
        }
    }
}
function update(time = 0) {
    if (gameOverAnimation.active) {
        drawGameOverAnimation();
        return;
    }
    if (gameState.paused) {
        if (typeof drawGame === 'function') drawGame();
        if (canvas && context) {
            const t = window.getText || (key => key);
            context.fillStyle = 'rgba(0,0,0,0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = `${Math.min(32, canvas.width / 15)}px Russo One`;
            context.textAlign = "center";
            context.fillText(t('pauseTitle') || 'ПАУЗА', canvas.width / 2, canvas.height / 2);
            context.font = `${Math.min(18, canvas.width / 25)}px Russo One`;
            context.fillText(t('pauseHint') || 'Нажмите "Дальше"', canvas.width / 2, canvas.height / 1.7);
        }
        animationFrameId = requestAnimationFrame(update);
        return;
    }
    if (isGameOver || !isGameStarted) {
        if (typeof drawGame === 'function') drawGame();
        if (isGameOver && canvas && context) {
            const t = window.getText || (key => key);
            context.fillStyle = 'rgba(0,0,0,0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = `${Math.min(32, canvas.width / 15)}px Russo One`;
            context.textAlign = "center";
            context.fillText(t('gameOverTitle') || 'ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2);
            context.font = `${Math.min(18, canvas.width / 25)}px Russo One`;
            context.fillText(t('tryAgain') || 'Попробуйте ещё раз', canvas.width / 2, canvas.height / 1.7);
        }
        animationFrameId = requestAnimationFrame(update);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    const currentInterval = Math.max(80, dropInterval - (player.level * 35));
    if (dropCounter > currentInterval) {
        playerDrop();
        if (typeof drawGame === 'function') drawGame();
    }
    if (typeof drawGame === 'function') drawGame();
    animationFrameId = requestAnimationFrame(update);
}
function startGame() {
       __endGameRunning = false;  
    hideSlowDownIndicator();
    isSlowDownActive = false;
    pendingSlowDown = false;
    if (slowDownTimerId) {
        clearTimeout(slowDownTimerId);
        slowDownTimerId = null;
    }
if (selectedDifficulty === 'easy') arenaWidth = 12;
else if (selectedDifficulty === 'hard') arenaWidth = 16;
else arenaWidth = 14;
    arenaHeight = 18;
    if (selectedDifficulty === 'easy') {
        difficultyMultiplier = 0.5;
        dropInterval = 1400;
    } else if (selectedDifficulty === 'hard') {
        difficultyMultiplier = 1.5;
        dropInterval = 500;
    } else {
        difficultyMultiplier = 1;
        dropInterval = 1000;
    }
    arena = createMatrix(arenaWidth, arenaHeight);
    for (let i = 0; i < arenaHeight; i++) {
        for (let j = 0; j < arenaWidth; j++) arena[i][j] = 0;
    }
    activeBonus = null;
    bonusSpawnCooldown = 0;
    isGameStarted = true;
    isGameOver = false;
    gameState.over = false;
    gameState.paused = false;
    gameState.initialized = true;
    gameState.introSongPlayed = false;
    updatePauseButtonText();
    pendingSlowDown = false;
if (slowDownTimerId) {
    clearTimeout(slowDownTimerId);
    slowDownTimerId = null;
}
isSlowDownActive = false;
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    player.spins = 0;
    player.crazySpins = false;
    if (selectedMode === 'tetra') {
        player.isTetraMode = true;
        player.isPentaMode = false;
        player.matrix = createTetraPiece();
        player.nextMatrix = createTetraPiece();
    } else if (selectedMode === 'penta') {
        player.isTetraMode = false;
        player.isPentaMode = true;
        player.matrix = createPentaPiece();
        player.nextMatrix = createPentaPiece();
    } else {
        player.isTetraMode = false;
        player.isPentaMode = false;
        player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }
    const matrixWidth = player.matrix[0].length;
    const maxX = arenaWidth - matrixWidth;
    player.pos.x = Math.floor(maxX / 2);
    player.pos.y = 0;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    dropCounter = 0;
    update();
}
async function startGameWithAudio() {
    console.log("startGameWithAudio вызван");
    if (typeof gameAudio !== 'undefined' && !gameAudio.initialized) {
        await gameAudio.init();
        console.log('✅ Аудио инициализировано');
    }
    if (typeof gameAudio !== 'undefined') {
        gameAudio.resumeAll();
        console.log('✅ Аудио контексты возобновлены');
        gameAudio.ensureMusicContextActive();
        await new Promise(r => setTimeout(r, 50));
    }
    startGame();
    if (typeof gameAudio !== 'undefined' && gameAudio.initialized) {
        if (!musicMuted && !soundMuted) {
            console.log('🎵 Запускаем музыку после загрузки');
            playBackgroundMusic();
        }
    }
}
let __endGameRunning = false;
function endGame() {
    if (__endGameRunning) return;
    if (gameOverAnimation.active) return;
    __endGameRunning = true;
    if (slowDownTimerId) {
        clearTimeout(slowDownTimerId);
        slowDownTimerId = null;
    }
    isSlowDownActive = false;
    pendingSlowDown = false;
    hideSlowDownIndicator();
if (selectedDifficulty) savePlayedDifficulty();
    isGameOver = true;
    updateRecordText();
    updateHighscoreDisplay();
    isGameStarted = false;
    gameState.over = true;
    gameState.initialized = false;
    gameState.paused = false;
    const finalScore = player ? (player.score || 0) : 0;
    if (typeof saveVKScore === 'function') saveVKScore(finalScore);
    if (typeof saveTotalProgress === 'function') saveTotalProgress();
    if (typeof syncAllDataToVK === 'function') syncAllDataToVK();
    showGameOverModal(finalScore);   
    updatePauseButtonText();
    drawGame();
}
function pauseGame() {
    if (gameState.paused) return;
    gameState.paused = true;
    if (typeof gameAudio !== 'undefined') {
        gameAudio.pauseAll();
        gameAudio.stopMusic();
    }
    if (typeof window.notifyGameplayStop === 'function') {
        window.notifyGameplayStop();
    }
    updatePauseButtonText();
}
function resumeGame() {
    if (!gameState.paused) return;
    if (pendingSlowDown) {
        pendingSlowDown = false;
        applySlowDownEffect();
    }
    gameState.paused = false;
    lastTime = performance.now();
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.resumeAll();
        if (!gameAudio.musicStarted && currentMusicTrack) {
            console.log('🔄 Музыка не возобновилась, перезапускаем:', currentMusicTrack);
            gameAudio.playMusic(currentMusicTrack, 0.08);
        }
    }
    if (typeof window.notifyGameplayStart === 'function') {
        window.notifyGameplayStart();
    }
    updatePauseButtonText();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
}
function togglePauseResume() {
    const t = window.getText || (key => key);
    if (!isGameStarted) {
        showCustomModal({
            title: t('attention') || 'Внимание!',
            text: t('startGameFirst') || 'Сначала начните игру через главное меню!',
            type: 'warning',
            button: t('ok') || 'OK'
        });
        return;
    }
    if (isGameOver) {
        showCustomModal({
            title: t('gameOverTitle') || 'Игра завершена!',
            text: t('newGameFromMenu') || 'Начните новую игру через главное меню!',
            type: 'info',
            button: t('ok') || 'OK'
        });
        return;
    }
    if (gameState.paused) resumeGame();
    else {
        pauseGame();
        if (typeof showVKFullscreenAd === 'function') showVKFullscreenAd();
    }
}
function returnToMenu() {
    if (isGameStarted && !isGameOver && !gameState.paused) pauseGame();
    if (typeof gameAudio !== 'undefined') {
        gameAudio.stopAll(); 
    }
    if (slowDownTimerId) {
        clearTimeout(slowDownTimerId);
        slowDownTimerId = null;
    }
    pendingSlowDown = false;
    isGameStarted = false;
    isGameOver = false;
    gameState.initialized = false;
    gameState.paused = false;
    gameState.over = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
}
function updatePauseButtonText() {
    const btn = document.getElementById('pause-resume-btn');
    if (!btn) return;
    const t = window.getText || (key => key);
    if (gameState.paused) {
        btn.textContent = t('resume');
        btn.setAttribute('data-i18n', 'resume');
    } else {
        btn.textContent = t('pause');
        btn.setAttribute('data-i18n', 'pause');
    }
}
async function playBackgroundMusic() {
    if (musicMuted || !gameAudio || !gameAudio.initialized) return;
    if (gameAudio.musicStarted && gameAudio.currentMusicTrack === currentMusicTrack) return;
    let track;
    const isClassic = selectedMode === 'classic';
    if (isClassic && selectedDifficulty === 'easy') track = '2';
    else if (isClassic && selectedDifficulty === 'medium') track = '4';
    else if (isClassic && selectedDifficulty === 'hard') track = '1';
    else if (!isClassic && selectedDifficulty === 'easy') track = '2';
    else if (!isClassic && selectedDifficulty === 'medium') track = '1';
    else track = '1';
    currentMusicTrack = track;
    let attempts = 0;
    const maxAttempts = 40;
    while (attempts < maxAttempts) {
        if (gameAudio.buffers[track]) {
            gameAudio.ensureMusicContextActive();
            await new Promise(r => setTimeout(r, 30));
            gameAudio.playMusic(track, 0.08);
            return;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    setTimeout(() => {
        if (!gameAudio.musicStarted && gameAudio.buffers[track]) {
            gameAudio.ensureMusicContextActive();
            gameAudio.playMusic(track, 0.08);
        }
    }, 5000);
}
function stopSounds() {
    if (typeof gameAudio !== 'undefined') gameAudio.stopLoop();
}
function toggleSound() {
    if (typeof gameAudio === 'undefined') return;
    soundMuted = !soundMuted;
    if (typeof gameAudio.setMuted === 'function') {
        gameAudio.setMuted(soundMuted);
    } else {
        if (gameAudio.sfxGain) {
            gameAudio.sfxGain.gain.value = soundMuted ? 0 : 0.3;
        }
        gameAudio.muted = soundMuted;
    }
    updateSoundIcon();
}
function toggleMusic() {
    if (typeof gameAudio === 'undefined') return;
    musicMuted = !musicMuted;
    gameAudio.setMusicMuted(musicMuted);
    updateMusicIcon();    
    if (!musicMuted && isGameStarted && !isGameOver && !gameState.paused) {
        if (!gameAudio.musicStarted) {
            playBackgroundMusic();
        }
    }
}
function updateSoundIcon() {
    const soundIcons = document.querySelectorAll('#sound-icon, #menu-sound-icon, #sound-btn svg');
    const isMuted = soundMuted;
    soundIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `<path fill="#8899a6" d="M7 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#ccd6dd" d="m13 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#8899a6" d="M28.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 31 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 33 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>`;
        } else {
            icon.innerHTML = `<path fill="#8899a6" d="M2 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#ccd6dd" d="m8 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#8899a6" d="M29 32.019a.945.945 0 0 1-.615-1.666c3.603-3.071 5.668-7.551 5.668-12.29s-2.066-9.219-5.669-12.29a.947.947 0 0 1 1.229-1.44a18.02 18.02 0 0 1 6.333 13.73a18.02 18.02 0 0 1-6.332 13.729a.94.94 0 0 1-.614.227"/><path fill="#8899a6" d="M26.27 28.959a.927.927 0 0 1-.592-1.645a12.04 12.04 0 0 0 4.394-9.315a12.05 12.05 0 0 0-4.311-9.245a.929.929 0 0 1 1.196-1.422a13.9 13.9 0 0 1 4.973 10.667c0 4.172-1.848 8.089-5.069 10.746a.92.92 0 0 1-.591.214"/><path fill="#8899a6" d="M23.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 26 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 28 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>`;
        }
    });
}
function updateMusicIcon() {
    const musicIcons = document.querySelectorAll('#music-icon, #menu-music-icon, #music-btn svg');
    const isMuted = musicMuted;
    musicIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `<g fill="none" fill-rule="evenodd" clip-rule="evenodd"><path fill="#8fbffa" d="M12.734.33a1.2 1.2 0 0 0-.55.019L4.605 2.452a1.22 1.22 0 0 0-.897 1.167V9.06a2.463 2.463 0 1 0 1.488 2.09V5.162l.827.736l6.205-1.745v2.458a2.463 2.463 0 1 0 1.488 2.09V1.518A1.216 1.216 0 0 0 12.734.33"/><path fill="#2859c5" d="M.22.22a.75.75 0 0 0 0 1.06l12.5 12.5a.75.75 0 1 0 1.06-1.06L1.28.22a.75.75 0 0 0-1.06 0"/></g>`;
        } else {
            icon.innerHTML = `<path fill="#8fbffa" fill-rule="evenodd" d="M12.781.23a1.2 1.2 0 0 0-.555.02h-.006L4.587 2.369a1.23 1.23 0 0 0-.905 1.177V9.04a2.477 2.477 0 1 0 1.5 2.277V6.076l7.09-1.97V6.57a2.477 2.477 0 1 0 1.5 2.345V1.403a1.226 1.226 0 0 0-.99-1.172Z" clip-rule="evenodd"/>`;
        }
    });
}
function initAudio() {
    if (typeof gameAudio === 'undefined') return;
    if (!gameAudio.initialized) {
        gameAudio.init().then(() => {
            gameAudio.resumeAll();
            audioInitialized = true;
            if (!musicMuted && !soundMuted && isGameStarted && !isGameOver && !gameState.paused) {
                playBackgroundMusic();
            }
        }).catch(e => console.warn('Ошибка инициализации аудио:', e));
        return;
    }
    if (gameAudio.audioContext && gameAudio.audioContext.state === 'suspended') {
        gameAudio.resumeAll();
    }
    if (!gameAudio.musicStarted && !musicMuted && isGameStarted && !isGameOver && !gameState.paused) {
        playBackgroundMusic();
    }
}
function showGameOverModal(score) {
    const modal = document.getElementById('gameover-modal');
    const scoreEl = document.getElementById('gameover-score');
    if (modal) {
        if (scoreEl) scoreEl.textContent = score;
        let buttonsContainer = modal.querySelector('.gameover-buttons-container');
        if (!buttonsContainer) {
            const contentDiv = modal.querySelector('div[style*="border: 2px solid rgba(239, 68, 68, 0.4)"]');
            if (contentDiv) {
                const oldBtns = contentDiv.querySelectorAll('button');
                oldBtns.forEach(btn => {
                    const text = btn.textContent.trim();
                    if (text.includes('Новая игра') || text.includes('В меню')) {
                    } else {
                        btn.remove();
                    }
                });
                buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'gameover-buttons-container';
                buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 16px;';
                const existingBtns = contentDiv.querySelectorAll('button');
                const newGameBtn = contentDiv.querySelector('button[onclick*="closeGameOverModal"]');
                const menuBtn = contentDiv.querySelector('button[onclick*="closeGameOverModalAndMenu"]');
const continueBtn = document.createElement('button');
continueBtn.style.cssText = `
    width: 100%; 
    padding: 14px 20px;              
    font-size: 16px;                
    font-family: 'Russo One', sans-serif; text-transform: uppercase;
    letter-spacing: 2px; color: #fff;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none; border-radius: 14px; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
    display: flex; align-items: center; justify-content: center; gap: 10px;
    min-height: 50px;              
`;
                continueBtn.innerHTML = '🧹 Продолжить за рекламу';
                continueBtn.onclick = handleContinueWithAd;
                buttonsContainer.appendChild(continueBtn);
                if (newGameBtn) {
        newGameBtn.style.cssText = `
    width: 100%;
    padding: 14px 20px;             
    font-size: 16px;              
    font-family: 'Russo One', sans-serif; text-transform: uppercase;
    letter-spacing: 2px; color: #fff;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none; border-radius: 14px; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
    min-height: 50px;              
`;
                    buttonsContainer.appendChild(newGameBtn);
                }
                if (menuBtn) {
       menuBtn.style.cssText = `
    width: 100%;
    padding: 10px 15px;             
    font-size: 14px;                
    font-family: 'Russo One', sans-serif; text-transform: uppercase;
    letter-spacing: 2px; color: #94a3b8;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; cursor: pointer; transition: all 0.2s;
    min-height: 50px;               
`;
                    buttonsContainer.appendChild(menuBtn);
                }
                contentDiv.appendChild(buttonsContainer);
            }
        }
        modal.style.display = 'flex';
        if (typeof updateInterfaceLanguage === 'function') updateInterfaceLanguage();
    }
}
function closeGameOverModal() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'flex';
}
function closeGameOverModalAndMenu() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    if (typeof returnToMenu === 'function') returnToMenu();
}
function selectMode(mode) {
    selectedMode = mode;
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
    const diffModal = document.getElementById('difficulty-modal');
    const modeName = document.getElementById('difficulty-mode-name');
    if (modeName) {
        const t = window.getText || (key => key);
        if (mode === 'classic') modeName.textContent = t('modeClassic');
        else if (mode === 'tetra') modeName.textContent = t('modeTetra');
        else if (mode === 'penta') modeName.textContent = t('modePenta');
    }
    if (diffModal) diffModal.style.display = 'flex';
}
function closeDifficultyModal() {
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
}
function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    savePlayedDifficulty();
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
   startGameWithAudio(); 
}
function saveTotalProgress() {
    if (typeof player === 'undefined' || !player) return;
    const currentGameScore = player.score || 0;
    const currentTotal = parseInt(localStorage.getItem('totalScore') || '0');
    const newTotal = currentTotal + currentGameScore;
    localStorage.setItem('totalScore', newTotal);
    window.totalScore = newTotal;
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_total_score_v1', newTotal);
    }
    console.log(`📊 Общий прогресс: +${currentGameScore} = ${newTotal} очков`);
}
function savePlayedDifficulty() {
    if (!selectedDifficulty) return;
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    if (!playedDifficulties.includes(selectedDifficulty)) {
        playedDifficulties.push(selectedDifficulty);
        localStorage.setItem('playedDifficulties', JSON.stringify(playedDifficulties));
        if (typeof saveToVKStorage === 'function') {
            saveToVKStorage('tetris_difficulties_v1', playedDifficulties);
        }
        console.log('✅ Сохранена сложность:', selectedDifficulty);
    }
}
document.addEventListener('keydown', event => {
    if (!isGameStarted || isGameOver || gameState.paused) return;
    switch (event.code) {
        case "KeyW":
        case "ArrowUp":
            event.preventDefault();
            playerRotate(-1);
            break;
        case "KeyS":
        case "ArrowDown":
            event.preventDefault();
            playerDrop();
            break;
        case "KeyA":
        case "ArrowLeft":
            event.preventDefault();
            playerMove(-1);
            break;
        case "KeyD":
        case "ArrowRight":
            event.preventDefault();
            playerMove(+1);
            break;
        case "Escape":
            event.preventDefault();
            if (!gameState.paused) pauseGame();
            else resumeGame();
            break;
    }
});
function initMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRot = document.getElementById('btn-rot');
    if (!btnLeft) return;
    const repeatIntervals = {};
    function startRepeating(id, action, interval = 150) {
        if (repeatIntervals[id]) return; 
        if (isGameStarted && !isGameOver && !gameState.paused) {
            action();
        }
        repeatIntervals[id] = setInterval(() => {
            if (isGameStarted && !isGameOver && !gameState.paused) {
                action();
            }
        }, interval);
    }
    function stopRepeating(id) {
        if (repeatIntervals[id]) {
            clearInterval(repeatIntervals[id]);
            delete repeatIntervals[id];
        }
    }
    function onLeftStart(e) {
        e.preventDefault();
        startRepeating('moveLeft', () => playerMove(-1), 150);
    }
    function onLeftEnd(e) {
        e.preventDefault();
        stopRepeating('moveLeft');
    }
    function onRightStart(e) {
        e.preventDefault();
        startRepeating('moveRight', () => playerMove(1), 150);
    }
    function onRightEnd(e) {
        e.preventDefault();
        stopRepeating('moveRight');
    }
    function onDownStart(e) {
        e.preventDefault();
        startRepeating('drop', () => playerDrop(), 70); 
    }
    function onDownEnd(e) {
        e.preventDefault();
        stopRepeating('drop');
    }
    function onRotate(e) {
        e.preventDefault();
        if (isGameStarted && !isGameOver && !gameState.paused) {
            playerRotate(-1);
        }
    }
    btnLeft.addEventListener('touchstart', onLeftStart);
    btnLeft.addEventListener('touchend', onLeftEnd);
    btnLeft.addEventListener('touchcancel', onLeftEnd);
    btnLeft.addEventListener('mousedown', onLeftStart);
    btnLeft.addEventListener('mouseup', onLeftEnd);
    btnRight.addEventListener('touchstart', onRightStart);
    btnRight.addEventListener('touchend', onRightEnd);
    btnRight.addEventListener('touchcancel', onRightEnd);
    btnRight.addEventListener('mousedown', onRightStart);
    btnRight.addEventListener('mouseup', onRightEnd);
    btnDown.addEventListener('touchstart', onDownStart);
    btnDown.addEventListener('touchend', onDownEnd);
    btnDown.addEventListener('touchcancel', onDownEnd);
    btnDown.addEventListener('mousedown', onDownStart);
    btnDown.addEventListener('mouseup', onDownEnd);
    btnRot.addEventListener('touchstart', onRotate);
    btnRot.addEventListener('touchcancel', (e) => e.preventDefault());
    btnRot.addEventListener('mousedown', onRotate);
}
initMobileControls();
document.addEventListener('click', initAudio);
document.addEventListener('touchstart', initAudio);
        document.addEventListener('visibilitychange', function() {
                        if (document.hidden) {
                            if (isGameStarted && !isGameOver && !gameState.paused) {
                                pauseGame();
                                console.log('📱 Вкладка скрыта — игра на паузе. Нажмите "Дальше" чтобы продолжить.');
                            }       
                          if (typeof gameAudio !== 'undefined') {
    gameAudio.pauseAll();
}
                        }            
                    });
document.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
canvas.addEventListener('selectstart', (e) => { e.preventDefault(); return false; });
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateCanvasSize();
        if (typeof drawGame === 'function') drawGame();
    }, 100);
});
window.addEventListener('blur', function() {
    if (isGameStarted && !isGameOver && !gameState.paused) {
        pauseGame();
        console.log('📱 Окно потеряло фокус — игра на паузе');
    }
});
window.addEventListener('focus', function() {
    console.log('📱 Окно получило фокус — игра на паузе, нажмите "Дальше"');
});
document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (typeof drawGame === 'function') drawGame();
    }, 50);
});
document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.d-btn, .rotate-btn, .iksweb, .iksweb1')) return;
    e.preventDefault();
}, { passive: false });
setTimeout(() => {
    updateCanvasSize();
    arena = createMatrix(arenaWidth, arenaHeight);
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.x = Math.floor((arenaWidth - player.matrix[0].length) / 2);
    const container = document.querySelector('.canvas-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.2s ease';
        setTimeout(() => { container.style.opacity = '1'; }, 200);
    }
    update();
    dailyBonusClaimedToday = isDailyBonusClaimedToday();
    updateDailyBonusStatus();
}, 100);
window.addEventListener('load', function() {
    setTimeout(function() {
        updateCanvasSize();
        drawGame();
        const container = document.querySelector('.canvas-container');
        if (container) container.style.opacity = '1';
    }, 200);
});
const COLLECTION_CATEGORIES = {
    blocks: {
        id: 'blocks', nameKey: 'collectionBlocks', icon: '🧱', folder: 'blocks',
        requirement: 'easy', total: 50, price: 200
    },
    animals: {
        id: 'animals', nameKey: 'collectionAnimals', icon: '🐾', folder: 'animals',
        requirement: 'medium', total: 50, price: 200
    },
    plants: {
        id: 'plants', nameKey: 'collectionPlants', icon: '🌿', folder: 'plants',
        requirement: 'medium', total: 50, price: 200
    },
    space: {
        id: 'space', nameKey: 'collectionSpace', icon: '🚀', folder: 'cos',
        requirement: 'hard', total: 50, price: 200
    }
};
function checkCategoryUnlocked(categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    if (!category) return false;
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    return playedDifficulties.includes(category.requirement);
}
function getUnlockedCountInCategory(categoryId, totalScore) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    if (totalScore < baseScore) return 0;
    const remainingScore = totalScore - baseScore;
    return Math.min(Math.floor(remainingScore / 200), category.total);
}
function updateCollectionsProgress() {
    const progressEl = document.getElementById('collections-progress');
    if (!progressEl) return;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    let unlocked = 0;
    let total = 0;
    for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
        total += category.total;
        if (checkCategoryUnlocked(key)) {
            unlocked += getUnlockedCountInCategory(key, savedScore);
        }
    }
    progressEl.textContent = `${unlocked}/${total}`;
    window.collectionsProgress = { unlocked, total };
}
function openCollections() {
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'none';
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
let html = `
<div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 14, 0.92); z-index: 10001; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(20px);" id="collections-modal" onclick="if(event.target===this)closeCollections()">
<div class="modal-content" style="background: rgba(20, 20, 30, 0.95); border: 2px solid rgba(52, 211, 153, 0.3); border-radius: 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: relative; text-align: center; max-height: 90vh; overflow-y: auto; padding: 20px 15px;">
<button class="modal-close-btn" onclick="closeCollections()" style="position: absolute; top: 10px; right: 20px; background: none; border: none; color: #64748b; cursor: pointer; transition: all 0.2s; font-family: 'Russo One', sans-serif; padding: 12px; touch-action: manipulation; line-height: 1; z-index: 10; font-size: 28px;">✕</button>           
     <h2 class="neon-title" style="color: #34d399; text-transform: uppercase; letter-spacing: 2px; font-family: 'Russo One', sans-serif; font-size: clamp(18px, 5vw, 28px);">🖼️ ${t('collections') || 'Коллекции'}</h2>
                <p style="color: #64748b; letter-spacing: 1px; margin-bottom: 25px; font-family: 'Russo One', sans-serif; font-size: clamp(12px, 2.5vw, 16px);">
                    ${t('yourScore') || 'Ваш счёт'}: <span style="color: #34d399; font-weight: bold;">${savedScore}</span>
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
    `;
    for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
        const name = t(category.nameKey) || category.nameKey;
        const isUnlocked = checkCategoryUnlocked(key);
        const unlockedCount = isUnlocked ? getUnlockedCountInCategory(key, savedScore) : 0;
        const total = category.total;
        const isComplete = isUnlocked && unlockedCount >= total;
        let buttonStyle, onClickAction, rightText;
        if (isUnlocked) {
            buttonStyle = `color: #fff; background: ${isComplete ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'}; border: none; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); cursor: pointer;`;
            onClickAction = `onclick="openCollectionCategory('${key}')"`;
            rightText = `
                <span style="color: ${isComplete ? '#86efac' : '#93c5fd'}; font-weight: normal; margin-left: auto; display: flex; align-items: center; gap: 4px; font-size: clamp(12px, 2vw, 16px);">
                    ${unlockedCount}/${total}
                    ${isComplete ? getCheckmarkSVG() : ''}
                </span>
            `;
        } else {
            buttonStyle = `color: #64748b; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); cursor: default;`;
            onClickAction = `onclick="showLockedCategory('${key}')"`;
            rightText = `<span style="font-size: clamp(18px, 4vw, 24px); color: #475569; margin-left: auto;">🔒</span>`;
        }
        html += `
            <button ${onClickAction}
                    style="width: 100%; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; 
                        ${buttonStyle}
                        display: flex; align-items: center; gap: 12px; justify-content: center;
                        border-radius: 16px; transition: all 0.2s; min-height: 56px; padding: 10px 16px; font-size: clamp(12px, 2.5vw, 18px);">
                <span style="font-size: clamp(20px, 5vw, 32px);">${category.icon}</span>
                <span style="flex: 1; text-align: left;">${name}</span>
                ${rightText}
            </button>
        `;
    }
    const oldModal = document.getElementById('collections-modal');
    if (oldModal) oldModal.remove();
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}
function closeCollections() {
    const modal = document.getElementById('collections-modal');
    if (modal) modal.remove();
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex';
}
    function openCollectionCategory(categoryId) {
        const category = COLLECTION_CATEGORIES[categoryId];
        if (!category) {
            console.error('❌ Категория не найдена:', categoryId);
            return;
        }
        const t = window.getText || (key => key);
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        if (!checkCategoryUnlocked(categoryId)) {
            showLockedCategory(categoryId);
            return;
        }
        currentCollectionCategory = categoryId;
        currentCollectionPage = 1;
        renderCollectionCategory(categoryId, 1);
    }
function renderCollectionCategory(categoryId, page) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    if (!checkCategoryUnlocked(categoryId)) {
        showLockedCategory(categoryId);
        return;
    }
    const categoryName = t(category.nameKey) || category.nameKey;
    const totalItems = category.total;
    const totalPages = Math.ceil(totalItems / COLLECTION_ITEMS_PER_PAGE);
    const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + COLLECTION_ITEMS_PER_PAGE, totalItems);
let html = `
<div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 14, 0.92); z-index: 10002; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(20px);" id="collection-category-modal" onclick="if(event.target===this)closeCollectionCategory()">
<div id="collection-category-content" class="modal-content" style="background: rgba(20, 20, 30, 0.95); border: 2px solid rgba(52, 211, 153, 0.3); border-radius: 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: relative; text-align: center; max-height: 90vh; overflow-y: auto; padding: 15px 10px;">
<button class="modal-close-btn"  onclick="closeCollectionCategory()" style="position: absolute; top: 10px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; transition: all 0.2s; font-family: 'Russo One', sans-serif; padding: 10px; touch-action: manipulation; line-height: 1; z-index: 10;">✕</button>         
       <h2 style="color: #34d399; font-size: clamp(20px, 5vw, 26px); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-family: 'Russo One', sans-serif;">
                    ${category.icon} ${categoryName}
                </h2>
                <p style="color: #64748b; font-size: clamp(12px, 2.5vw, 14px); letter-spacing: 1px; margin-bottom: 18px; font-family: 'Russo One', sans-serif;">
                    ${t('collectionProgress') || 'Прогресс'}: ${unlockedCount}/${totalItems}
                </p>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 10px;">
    `;
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const itemId = `${categoryId}${i}`;
        const isAvailable = i <= unlockedCount;
        const isClaimed = progress[itemId] || false;
        const imgPath = `images/${category.folder}/${i}.png`;
        let bgColor, borderColor, clickAction, content;
isClaimed?(bgColor="rgba(52, 211, 153, 0.08)",borderColor="rgba(52, 211, 153, 0.4)",clickAction=`openFullImage('${imgPath}', ${i}, '${categoryId}')`,content=`<img src="${imgPath}" alt="${categoryName} ${i}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`):isAvailable?(bgColor="rgba(255, 215, 0, 0.08)",borderColor="rgba(255, 215, 0, 0.3)",clickAction=`claimCollectionItem('${categoryId}', ${i}, ${page})`,content=`\n                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">\n                    <span style="font-size: clamp(22px, 5vw, 28px);">✋</span>\n                    <span style="font-size: clamp(6px, 1.5vw, 8px); color: #fcd34d; font-family: 'Russo One', sans-serif; margin-top: 2px;">${t("getBonus")||"Забрать"}</span>\n                </div>\n            `):(bgColor="rgba(30,30,40,0.5)",borderColor="rgba(255,255,255,0.05)",clickAction=`showLockReason('${categoryId}', ${i})`,content='\n                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">\n                    <span style="font-size: clamp(22px, 5vw, 28px);">🔒</span>\n                </div>\n            ');
        html += `
            <div style="aspect-ratio: 3/4; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px; cursor: pointer; transition: all 0.2s; overflow: hidden;" onclick="${clickAction}">
                ${content}
            </div>
        `;
    }
    html += `
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 25px; border-top: none !important;">
                    <button onclick="changeCollectionPage(-1)" style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 50%; cursor: pointer; color: #94a3b8; font-size: 20px; transition: all 0.2s; font-family: 'Russo One', sans-serif;">◀</button>
                    <span style="color: #64748b; font-size: clamp(12px, 2.5vw, 15px); font-family: 'Russo One', sans-serif;">${page} / ${totalPages}</span>
                    <button onclick="changeCollectionPage(1)" style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 50%; cursor: pointer; color: #94a3b8; font-size: 20px; transition: all 0.2s; font-family: 'Russo One', sans-serif;">▶</button>
                </div>
            </div>
        </div>
    `;
    const oldModal = document.getElementById('collection-category-modal');
    if (oldModal) oldModal.remove();
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}
function changeCollectionPage(direction) {
    const category = COLLECTION_CATEGORIES[currentCollectionCategory];
    const totalPages = Math.ceil(category.total / COLLECTION_ITEMS_PER_PAGE);
    const newPage = currentCollectionPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentCollectionPage = newPage;
        renderCollectionCategory(currentCollectionCategory, currentCollectionPage);
    }
}
function closeCollectionCategory() {
    const modal = document.getElementById('collection-category-modal');
    if (modal) modal.remove();
    openCollections();
}
function claimCollectionItem(categoryId, index, page) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const itemId = `${categoryId}${index}`;
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    if (remainingScore < index * 200) {
        showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', `${t('needMorePointsFor') || 'Нужно ещё'} ${index * 200 - remainingScore} ${t('points') || 'очков'}.`, 'info');
        return;
    }
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    if (progress[itemId]) {
        showSimpleModal(t('alreadyClaimed') || '✅ Уже получено', t('alreadyClaimedText') || 'Эта картинка уже в вашей коллекции.', 'info');
        return;
    }
    progress[itemId] = true;
    localStorage.setItem('collectionsProgress', JSON.stringify(progress));
    if (typeof claimCollectionItemWithSync === 'function') {
        claimCollectionItemWithSync(itemId);
    } else if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_collections_v1', progress);
    }
    createConfetti(100);
    const categoryName = t(category.nameKey);
    const itemName = `${category.icon} ${categoryName} #${index}`;
    const imgPath = `images/${category.folder}/${index}.png`;
    updateCollectionCard(categoryId, index, page);
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100006; display: flex; justify-content: center; align-items: center; background: url('1.jpg') no-repeat center center fixed; background-size: cover;`;
    modal.id = 'collection-claim-modal';
    modal.innerHTML = `
        <div class="modal-content" style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
<button class="modal-close-btn" onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -50px; right: -10px; background: none; border: none; color: #fff; font-size: 32px; cursor: pointer; font-family: 'Russo One', sans-serif; padding: 12px; touch-action: manipulation; line-height: 1; z-index: 10; text-shadow: 0 0 20px rgba(0,0,0,0.8);">✕</button>
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${t('newExhibit') || 'Новый экспонат!'}</h2>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-family: 'Russo One', sans-serif;">${t('youGot') || 'Ты получил'}</p>
            <p style="color: #34d399; font-size: 20px; margin-bottom: 24px; font-family: 'Russo One', sans-serif; font-weight: bold;">${itemName}</p>
            <button onclick="openFullImage('${imgPath}', ${index}, '${categoryId}'); setTimeout(() => { const modal = document.getElementById('collection-claim-modal'); if(modal) modal.remove(); }, 100);" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">${t('showPicture') || 'Показать картинку'}</button>
            <button onclick="this.parentElement.parentElement.remove(); renderCollectionCategory('${categoryId}', ${page});" style="width: 100%; margin-top: 8px; padding: 12px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; cursor: pointer; transition: all 0.2s;">${t('ok') || 'OK'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}
function updateCollectionCard(categoryId, index, page) {
    const modal = document.getElementById('collection-category-modal');
    if (!modal) return;
    const grid = modal.querySelector('div[style*="grid-template-columns: repeat(5, 1fr)"]');
    if (!grid) return;
    const cards = grid.querySelectorAll('div[style*="aspect-ratio: 3/4"]');
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const cardIndex = index - startIndex - 1;
    if (cardIndex >= 0 && cardIndex < cards.length) {
        const card = cards[cardIndex];
        const category = COLLECTION_CATEGORIES[categoryId];
        const imgPath = `images/${category.folder}/${index}.png`;
        const t = window.getText || (key => key);
        card.style.background = 'rgba(52, 211, 153, 0.08)';
        card.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        card.onclick = function() { openFullImage(imgPath, index, categoryId); };
        card.innerHTML = `<img src="${imgPath}" alt="${category.nameKey} ${index}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`;
        const progressEl = modal.querySelector('p[style*="color: #64748b; font-size: 13px"]');
        if (progressEl) {
            const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
            const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
            progressEl.textContent = `${t('collectionProgress') || 'Прогресс'}: ${unlockedCount}/${category.total}`;
        }
    }
}
function openFullImage(imgPath, index, categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10003;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(10px);
    `;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 0;
    `;
    modal.appendChild(overlay);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
modal.innerHTML = `
    <div class="full-image-modal" style="
        background: #1a1a2e; 
        border: 2px solid rgba(52, 211, 153, 0.3); 
        border-radius: 30px; 
        padding: 25px 20px 20px; 
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        animation: modalPopIn 0.3s ease;
        position: relative;
    ">
        <button class="modal-close-btn" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif; padding: 10px; touch-action: manipulation; line-height: 1; z-index: 10;">✕</button>
        <img src="${imgPath}" alt="${t(category.nameKey)} ${index}" style="max-width: 100%; max-height: 80%; border-radius: 16px; object-fit: contain;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E%3Crect width=%22300%22 height=%22400%22 fill=%22%231a1a2e%22/%3E%3Ctext x=%22150%22 y=%22200%22 text-anchor=%22middle%22 fill=%22%2364748b%22 font-family=%22sans-serif%22 font-size=%2220%22%3ENo image%3C/text%3E%3C/svg%3E'">
        <p style="color: #e2e8f0; text-align: center; margin-top: 12px; font-family: 'Russo One', sans-serif; font-size: 14px; flex-shrink: 0;">${t(category.nameKey)} ${index}</p>
    </div>
`;
    document.body.appendChild(modal);
}
function showLockedCategory(categoryId) {
    const t = window.getText || (key => key);
    const category = COLLECTION_CATEGORIES[categoryId];
    const difficultyNames = { 'easy': t('easy') || 'Легко', 'medium': t('medium') || 'Средне', 'hard': t('hard') || 'Сложно' };
    const reqName = difficultyNames[category.requirement] || category.requirement;
    showSimpleModal(t('scrollLockedTitle') || '🔒 Закрыто', `${t('collectionUnlockRequirement') || 'Чтобы открыть эту коллекцию, сыграйте на сложности'} "${reqName}".`, 'info');
}
function showLockReason(categoryId, index) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    const neededScore = index * 200;
    if (remainingScore < neededScore) {
        const missingPoints = neededScore - remainingScore;
        showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', `${t('needMorePointsFor') || 'Нужно ещё'} ${missingPoints} ${t('points') || 'очков'}.`, 'info');
        return;
    }
    showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', t('pictureNotAvailable') || 'Эта картинка пока недоступна.', 'info');
}
function showSimpleModal(title, text, icon = 'info') {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
            z-index: 100005;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(15px);
    `;
modal.innerHTML += `
    <div class="modal-content" style="border: 2px solid rgba(52, 211, 153, 0.3); max-width: 400px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px);">
        <button class="modal-close-btn" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()">✕</button>
        <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${title}</h2>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">${text}</p>
        <button class="modal-action-btn" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff;">${window.getText('ok') || 'OK'}</button>
    </div>
`;
    document.body.appendChild(modal);
}
function createConfetti(count = 80) {
    const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#34d399', '#f472b6', '#f59e0b'];
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const isCircle = Math.random() > 0.5;
        confetti.style.cssText = `
            position: fixed; left: ${Math.random() * 100}vw; top: -10px;
            width: ${isCircle ? size : size * 0.4}px; height: ${isCircle ? size : size * 1.2}px;
            background: ${color}; border-radius: ${isCircle ? '50%' : '2px'};
            z-index: 100007; pointer-events: none; opacity: 0;
            transform: rotate(${Math.random() * 360}deg);
            animation: confetti-fall ${Math.random() * 2 + 1.5}s ease-in forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}
function getScrollsProgress() {
    return JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
}
function claimScroll(scrollId) {
    const t = window.getText || (key => key);
    const playerScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const totalScore = Math.max(playerScore, savedScore);
    if (!isScrollUnlocked(scrollId, totalScore)) {
        openScrollTextModal(scrollId);
        return;
    }
    const progress = getScrollsProgress();
    if (progress[scrollId]) {
        openScrollTextModal(scrollId);
        return;
    }
    progress[scrollId] = true;
    localStorage.setItem('scrollsProgress', JSON.stringify(progress));
    if (typeof claimScrollWithSync === 'function') {
        claimScrollWithSync(scrollId);
    } else if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_scrolls_v1', progress);
    }
    renderScrolls();
    openScrollTextModal(scrollId);
}
function isScrollUnlocked(scrollId, playerScore) {
    const totalScore = Math.max(playerScore || 0, parseInt(localStorage.getItem('totalScore') || '0'));
    if (scrollId <= 50) return totalScore >= scrollId * 100;
    else {
        const baseScore = 50 * 100;
        const additional = (scrollId - 50) * 300;
        return totalScore >= baseScore + additional;
    }
}
function getScrollText(id) {
    let lang = window.gameLanguage || 'ru';
    const RUSSIAN_LANGS = ['ru', 'uk', 'be', 'kk', 'uz', 'ky', 'tg', 'hy', 'az', 'ka', 'mo', 'tk'];
    if (RUSSIAN_LANGS.includes(lang)) lang = 'ru';
    else if (lang === 'tr') lang = 'tr';
    else lang = 'en';
    const textObj = window.SCROLLS_TEXT ? window.SCROLLS_TEXT[id] : null;
    if (!textObj) {
        if (lang === 'ru') return '📜 Текст будет добавлен позже.';
        if (lang === 'tr') return '📜 Metin daha sonra eklenecek.';
        return '📜 Text will be added later.';
    }
    return textObj[lang] || textObj['en'] || textObj['ru'] || 'Текст не найден';
}
function renderScrolls() {
    console.log('renderScrolls вызван, currentScrollPage:', currentScrollPage);
    const container = document.getElementById('scrolls-container');
    const scoreEl = document.getElementById('scrolls-player-score');
    const pageInfo = document.getElementById('scrolls-page-info');
    if (!container) return;
    const currentScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const playerScore = Math.max(currentScore, savedScore);
    const progress = getScrollsProgress();
    if (scoreEl) scoreEl.textContent = formatScore(playerScore);
    const totalPages = Math.ceil(TOTAL_SCROLLS / SCROLLS_PER_PAGE);
    if (currentScrollPage > totalPages) currentScrollPage = totalPages;
    if (currentScrollPage < 1) currentScrollPage = 1;
    const startIndex = (currentScrollPage - 1) * SCROLLS_PER_PAGE;
    const endIndex = Math.min(startIndex + SCROLLS_PER_PAGE, TOTAL_SCROLLS);
    container.innerHTML = '';
    let scrollText = window.getText ? window.getText('scroll') : 'Свиток';
"scroll"===scrollText&&(scrollText="Свиток");for(let e=startIndex+1;e<=endIndex;e++){const o=isScrollUnlocked(e,playerScore),a=progress[e]||!1;let r="🔒",l="rgba(255, 255, 255, 0.02)",n="rgba(255, 255, 255, 0.05)",s="",t="",c="";a?(r=getCheckmarkSVG(),l="rgba(52, 211, 153, 0.05)",n="rgba(52, 211, 153, 0.2)",s="box-shadow: 0 0 15px rgba(52, 211, 153, 0.05);",c=`openScrollTextModal(${e})`):o?(r="✋",l="rgba(255, 215, 0, 0.08)",n="rgba(255, 215, 0, 0.3)",s="box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);",t="animation: pulse-gold 1.5s ease-in-out infinite;",c=`claimScroll(${e})`):(r="🔒",c=`openScrollTextModal(${e})`);const i=document.createElement("div");i.className="scroll-item",i.style.cssText=`display: flex; justify-content: space-between; align-items: center; background: ${l}; border: 1px solid ${n}; border-radius: 12px; cursor: pointer; transition: all 0.2s; ${s} ${t}`,i.onclick=()=>{a?openScrollTextModal(e):o?claimScroll(e):openScrollTextModal(e)},i.onmouseover=()=>{i.style.borderColor=a?"rgba(52, 211, 153, 0.5)":o?"rgba(255, 215, 0, 0.5)":"rgba(255, 255, 255, 0.15)",i.style.background=a?"rgba(52, 211, 153, 0.08)":o?"rgba(255, 215, 0, 0.12)":"rgba(255, 255, 255, 0.04)"},i.onmouseout=()=>{i.style.borderColor=a?"rgba(52, 211, 153, 0.2)":o?"rgba(255, 215, 0, 0.3)":"rgba(255, 255, 255, 0.05)",i.style.background=a?"rgba(52, 211, 153, 0.05)":o?"rgba(255, 215, 0, 0.08)":"rgba(255, 255, 255, 0.02)"},i.innerHTML=`<span style="color: ${a?"#e2e8f0":o?"#fcd34d":"#64748b"}; font-family: 'Russo One', sans-serif; font-size: 15px;">${scrollText} ${e}${o&&!a?' <span style="font-size: 11px; color: #fcd34d;">✨</span>':""}</span><span style="font-size: 22px; transition: all 0.3s; display: flex; align-items: center;">${r}</span>`,container.appendChild(i)}const pageSpan=document.querySelector("#scrolls-modal .pagination-page");pageSpan&&(pageSpan.textContent=`${currentScrollPage} / ${totalPages}`);
}
function nextScrollPage(){const e=Math.ceil(TOTAL_SCROLLS/SCROLLS_PER_PAGE);currentScrollPage<e&&(currentScrollPage++,renderScrolls())}function prevScrollPage(){currentScrollPage>1&&(currentScrollPage--,renderScrolls())}function getCheckmarkSVG(){return'<span class="achievement-item__checkmark" style="display: inline-block; width: 24px; height: 24px; flex-shrink: 0; position: relative;">\n        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">\n            <circle cx="12" cy="12" r="11" stroke="#34d399" stroke-width="2" fill="rgba(52, 211, 153, 0.1)"/>\n            <path class="checkmark-path" d="M7 12L10.5 16L17 8" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 30; stroke-dashoffset: 0; animation: checkmarkDraw 2s ease-in-out infinite;"/>\n        </svg>\n    </span>'}function openScrollsModal(){"function"==typeof loadTotalProgress&&loadTotalProgress();const e=document.getElementById("scrolls-modal");e&&(e.style.display="flex",renderScrolls())}function closeScrollsModal(){const e=document.getElementById("scrolls-modal");e&&(e.style.display="none");const t=document.getElementById("rewards-center-modal");t&&(t.style.display="flex")}function openScrollTextModal(e){const t=player?player.score:0,n=parseInt(localStorage.getItem("totalScore")||"0"),o=Math.max(t,n),l=getScrollsProgress(),s=isScrollUnlocked(e,o),a=l[e]||!1;if(s&&!a)return void claimScroll(e);if(!s){const t=window.getText||(e=>e),n=e<=50?100*e:5e3+300*(e-50),o=document.createElement("div");return o.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        z-index: 100001;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        backdrop-filter: blur(8px);\n        -webkit-backdrop-filter: blur(15px);\n    ",o.innerHTML+=`\n        <div class="modal-content" style="border: 2px solid rgba(239, 68, 68, 0.3); max-width: 400px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px);">\n            <button class="modal-close-btn" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()">✕</button>\n            \x3c!-- Убрали строку с замком --\x3e\n            <h2 style="color: #ef4444; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${t("scrollLockedTitle")}</h2>\n            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px; font-family: 'Russo One', sans-serif; line-height: 1.6;">${t("scrollLockedText")}</p>\n            <p style="color: #fcd34d; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">💡 ${t("needPoints")||"Нужно"}: ${n} ${t("points")||"очков"}</p>\n            <button class="modal-action-btn" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff;">${t("ok")}</button>\n        </div>\n    `,void document.body.appendChild(o)}const i=document.getElementById("scroll-text-modal"),r=document.getElementById("scroll-text-title"),d=document.getElementById("scroll-text-content");i&&r&&d&&(r.textContent=`📜 ${window.getText?window.getText("scroll"):"Свиток"} ${e}`,d.textContent=getScrollText(e),i.style.display="flex","function"==typeof updateInterfaceLanguage&&updateInterfaceLanguage())}function closeScrollTextModal(){const e=document.getElementById("scroll-text-modal");e&&(e.style.display="none")}function openRewardsCenter(){document.querySelectorAll('[id$="-modal"]').forEach((e=>{"rewards-center-modal"!==e.id&&"scroll-text-modal"!==e.id&&(e.style.display="none")}));const e=document.getElementById("rewards-center-modal");if(!e)return;e.style.cssText="display: flex; position: fixed ; top: 0 ; left: 0; width: 100% ; height: 100% ; z-index: 99999 !important; justify-content: center ; align-items: center ; overflow: auto ; padding: 20px ; background: url('1.jpg') no-repeat center center fixed; background-size: cover;";const t=document.getElementById("rewards-player-score");if(t){const e=parseInt(localStorage.getItem("totalScore")||"0");t.textContent=formatScore(e)}const n=document.getElementById("scrolls-progress");if(n){const e=countUnlockedScrolls(parseInt(localStorage.getItem("totalScore")||"0"));n.textContent=`${e}/100`}updateDailyBonusStatus(),updateCollectionsProgress(),e.style.display="flex"}function closeRewardsCenter(){const e=document.getElementById("rewards-center-modal");e&&(e.style.display="none");const t=document.getElementById("scrolls-modal");t&&(t.style.display="none");const n=document.getElementById("scroll-text-modal");n&&(n.style.display="none");const o=document.getElementById("main-menu-modal");o&&(o.style.display="flex")}function openScrollsFromRewards(){const e=document.getElementById("rewards-center-modal");e&&(e.style.display="none"),openScrollsModal()}function formatScore(e){if(e>=1e6){const t=e/1e6;return t%1==0?t+"M":t.toFixed(1)+"M"}if(e>=1e3){const t=e/1e3;return t%1==0?t+"K":t.toFixed(1)+"K"}return e.toString()}function countUnlockedScrolls(e){let t=0;for(let n=1;n<=TOTAL_SCROLLS;n++)isScrollUnlocked(n,e)&&t++;return t}function getTodayKey(){const e=new Date;return`${e.getFullYear()}-${e.getMonth()}-${e.getDate()}`}function isDailyBonusClaimedToday(){const e=getTodayKey();return localStorage.getItem("dailyBonusDate")===e}function updateDailyBonusStatus(){dailyBonusClaimedToday=isDailyBonusClaimedToday();const e=document.getElementById("daily-bonus-status");e&&(dailyBonusClaimedToday?(e.innerHTML=getCheckmarkSVG(),e.style.color="#34d399",e.style.fontSize="20px",e.style.display="inline-flex",e.style.alignItems="center"):(e.textContent="",e.style.color="#fcd34d",e.style.fontSize="12px"))}function openDailyBonus(){if(dailyBonusClaimedToday=isDailyBonusClaimedToday(),dailyBonusClaimedToday)return void showCustomModal({title:"✅ Уже получено!",text:"Ты уже получил ежедневный бонус сегодня. Возвращайся завтра!",type:"info",button:"OK"});const e=window.getText||(e=>e),t=document.getElementById("daily-bonus-modal");t&&t.remove();const n=document.createElement("div");n.id="daily-bonus-modal",n.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        z-index: 100002;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        background: url('1.jpg') no-repeat center center fixed;\n        background-size: cover;\n    ",n.innerHTML+=`\n    <div class="modal-content" style="background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 2px solid rgba(52, 211, 153, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">\n        <button class="modal-close-btn" onclick="this.closest('#daily-bonus-modal').remove()">✕</button>\n        <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>\n        <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">\n            ${e("dailyBonus")||"Ежедневный бонус"}\n        </h2>\n        <p style="color: #94a3b8; font-size: 14px; font-family: 'Russo One', sans-serif; margin-bottom: 20px;">\n            ${e("dailyBonusText")||"Получить +10 очков?"}\n        </p>\n        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">       \n            <button class="modal-action-btn" onclick="claimDailyBonus()" style="flex: 1 1 auto; min-width: 100px; padding: 12px 14px; font-size: 13px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">\n                🎁+10\n            </button>\n            <button class="modal-action-btn" onclick="claimEnhancedDailyBonus()" style="flex: 1 1 auto; min-width: 120px; padding: 12px 14px; font-size: 13px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">\n                📺+25\n            </button>\n                 <button class="modal-action-btn" onclick="this.closest('#daily-bonus-modal').remove()" style="flex: 1 1 auto; min-width: 80px; padding: 12px 14px; font-size: 13px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">\n                ${e("cancel")||"Отмена"}\n            </button>\n        </div>\n    </div>\n`,document.body.appendChild(n)}
function claimDailyBonus(){if(dailyBonusClaimedToday=isDailyBonusClaimedToday(),dailyBonusClaimedToday){const e=document.getElementById("daily-bonus-modal");return e&&e.remove(),void showCustomModal({title:"✅ Уже получено!",text:"Ты уже получил ежедневный бонус сегодня. Возвращайся завтра!",type:"info",button:"OK"})}const e=getTodayKey();let t=parseInt(localStorage.getItem("totalScore")||"0");t+=10,localStorage.setItem("totalScore",t),window.totalScore=t,"function"==typeof saveToVKStorage&&saveToVKStorage("tetris_total_score_v1",t),localStorage.setItem("dailyBonusDate",e),dailyBonusClaimedToday=!0,"function"==typeof saveToVKStorage&&saveToVKStorage("tetris_daily_bonus_v1",e);const o=document.getElementById("daily-bonus-modal");o&&o.remove(),updateDailyBonusStatus();const a=document.getElementById("rewards-player-score");a&&(a.textContent=formatScore(t)),showSuccessModal("🎉 Бонус получен!","+10 очков в общую копилку!")}function claimEnhancedDailyBonus(){if(dailyBonusClaimedToday=isDailyBonusClaimedToday(),dailyBonusClaimedToday){const e=document.getElementById("daily-bonus-modal");return e&&e.remove(),void showCustomModal({title:"✅ Уже получено!",text:"Ты уже получил ежедневный бонус сегодня. Возвращайся завтра!",type:"info",button:"OK"})}!isGameStarted||isGameOver||gameState.paused||pauseGame();const e=document.getElementById("daily-bonus-modal");e&&e.remove(),showRewardedAdForContinue().then((e=>{if(e){const e=getTodayKey();let t=parseInt(localStorage.getItem("totalScore")||"0");t+=25,localStorage.setItem("totalScore",t),window.totalScore=t,"function"==typeof saveToVKStorage&&saveToVKStorage("tetris_total_score_v1",t),localStorage.setItem("dailyBonusDate",e),dailyBonusClaimedToday=!0,"function"==typeof saveToVKStorage&&saveToVKStorage("tetris_daily_bonus_v1",e),updateDailyBonusStatus();const o=document.getElementById("rewards-player-score");o&&(o.textContent=formatScore(t)),showCustomModal({title:"🎉 Усиленный бонус получен!",text:"+25 очков! Спасибо за просмотр рекламы!",type:"success",button:"OK"})}else showCustomModal({title:"❌ Реклама недоступна",text:"Попробуйте позже или возьмите обычный бонус (+10).",type:"error",button:"OK"}),gameState.paused&&isGameStarted&&!isGameOver&&resumeGame()}))}function showSuccessModal(e,t){const o=document.createElement("div");o.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        z-index: 100003;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n    ";const a=document.createElement("div");a.style.cssText="\n        position: absolute;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        background: rgba(0, 0, 0, 0.6);\n        z-index: -1;\n    ",o.appendChild(a),o.innerHTML+=`\n        <div class="modal-content" style="background: rgba(20, 20, 30, 0.95); border: 2px solid rgba(34, 197, 94, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">\n            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>\n            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${e}</h2>\n            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">${t}</p>\n            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">\n                OK\n            </button>\n        </div>\n    `,document.body.appendChild(o)}function clearTopRows(){hideSlowDownIndicator(),isSlowDownActive=!1,slowDownTimerId&&(clearTimeout(slowDownTimerId),slowDownTimerId=null),pendingSlowDown=!1;let e=!1;for(let t=0;t<7&&t<arenaHeight;t++){for(let o=0;o<arenaWidth;o++)if(0!==arena[t][o]&&"bonus"!==arena[t][o]){e=!0;break}if(e)break}if(!e)return showCustomModal({title:"⚠️ Верхние ряды пусты",text:"Нет блоков для удаления. Продолжайте игру!",type:"info",button:"OK"}),!1;arena.splice(0,7);for(let e=0;e<7;e++)arena.unshift(new Array(arenaWidth).fill(0));for(let e=0;e<7&&e<arenaHeight;e++)for(let t=0;t<arenaWidth;t++)"bonus"===arena[e][t]&&(arena[e][t]=0);player.pos.y=0;const t=arenaWidth-player.matrix[0].length;return player.pos.x=Math.floor(t/2),collide(arena,player)&&(player.pos.y=-1),!0}
let isRewardedAdLoading = false;
function showRewardedAdForContinue(){return new Promise((e=>{if(isRewardedAdLoading)return void e(!1);if("undefined"==typeof vkBridge)return void e(!1);if(!vkInitialized)return void e(!1);if(!navigator.onLine)return void e(!1);isRewardedAdLoading=!0,showLoadingAdModal(),"undefined"!=typeof gameAudio&&gameAudio.pauseAll();let t=!1,i=null,n=!1;function d(){i&&(clearTimeout(i),i=null)}function s(e){d(),t||n||(i=setTimeout((function(){t||n||o(!1)}),e||12e4))}function o(i){if(!t){if(t=!0,d(),document.removeEventListener("visibilitychange",u),closeLoadingAdModal(),isRewardedAdLoading=!1,i){if("function"==typeof preloadRewardedAd)try{preloadRewardedAd()}catch(e){}}else"undefined"!=typeof gameAudio&&gameAudio.resumeAll();e(!!i)}}function u(){document.hidden?(n=!0,d()):t||(n=!1,s(9e4))}document.addEventListener("visibilitychange",u),s(12e4);let r=0;function a(){t||(s(9e4),vkBridge.send("VKWebAppShowNativeAds",{ad_format:"interstitial",use_waterfall:!0}).then((function(e){t||o(!(!e||!0!==e.result&&1!==e.result&&"ok"!==e.result&&"success"!==e.result&&!0!==e.success&&"success"!==e.status))})).catch((function(e){t||o(!1)})))}!function e(){t||(r++,vkBridge.send("VKWebAppCheckNativeAds",{ad_format:"reward"}).then((function(i){if(t)return;const n=i&&(!0===i.result||1===i.result||"ok"===i.result);!n&&r<6?setTimeout(e,3e3):n?vkBridge.send("VKWebAppShowNativeAds",{ad_format:"reward",use_waterfall:!0}).then((function(e){t||(!e||!0!==e.result&&1!==e.result&&"ok"!==e.result&&"success"!==e.result&&!0!==e.success&&"success"!==e.status?a():o(!0))})).catch((function(e){t||a()})):a()})).catch((function(e){t||a()})))}()}))}function showVKFullscreenAd(){const e=Date.now();e-lastInterstitialAdTime<35e3||"undefined"!=typeof vkBridge&&vkBridge.send("VKWebAppShowNativeAds",{ad_format:"interstitial"}).then((t=>{t.result&&(lastInterstitialAdTime=e)})).catch((e=>{}))}
function showLoadingAdModal(){const n=document.createElement("div");if(n.id="loading-ad-modal",n.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        z-index: 100010;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        background: rgba(10, 10, 14, 0.85);\n        backdrop-filter: blur(15px);\n        -webkit-backdrop-filter: blur(15px);\n    ",n.innerHTML='\n        <div class="modal-content" style="text-align: center; color: #fff;">\n            <div style="font-size: 48px; margin-bottom: 20px; animation: pulse 1s ease-in-out infinite;">📺</div>\n            <h2 style="color: #34d399; font-size: 24px; font-family: \'Russo One\', sans-serif; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">\n                Загрузка рекламы...\n            </h2>\n            <p style="color: #94a3b8; font-size: 14px; font-family: \'Russo One\', sans-serif;">\n                Пожалуйста, подождите\n            </p>\n            <div style="margin-top: 20px; width: 60px; height: 60px; margin-left: auto; margin-right: auto;">\n                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; width: 100%; height: 100%;">\n                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>\n                </svg>\n            </div>\n        </div>\n    ',document.body.appendChild(n),!document.getElementById("ad-animation-styles")){const n=document.createElement("style");n.id="ad-animation-styles",n.textContent="\n            @keyframes pulse {\n                0%, 100% { transform: scale(1); opacity: 1; }\n                50% { transform: scale(1.1); opacity: 0.7; }\n            }\n            @keyframes spin {\n                from { transform: rotate(0deg); }\n                to { transform: rotate(360deg); }\n            }\n        ",document.head.appendChild(n)}}
function closeLoadingAdModal(){const o=document.getElementById("loading-ad-modal");o&&o.remove()}
async function handleContinueWithAd() {
    const confirmed = await showContinueConfirmationModal();
    if (!confirmed) return;
    if (!gameState.paused) pauseGame();
    const adShown = await showRewardedAdForContinue();
    if (adShown) {
        const cleared = clearTopRows();
     if (cleared) {
          hideSlowDownIndicator(); 
    isGameOver = false;
    gameState.over = false;
    gameState.initialized = true;
    isGameStarted = true;
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    if (typeof drawGame === 'function') drawGame();
    showCustomModal({
        title: '🧹 Ряды стёрты!',
        text: '7 верхних строк удалены. Нажмите "Дальше" чтобы продолжить игру!',
        type: 'success',
        button: 'OK'
    });
    updatePauseButtonText();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    dropCounter = 0;
    update(); 
} else {
            showCustomModal({
                title: '⚠️ Верхние ряды пусты',
                text: 'Нет блоков для удаления. Продолжайте игру!',
                type: 'info',
                button: 'OK'
            });
        }
    } else {
        showCustomModal({
            title: '❌ Реклама недоступна',
            text: 'Попробуйте позже или начните новую игру.',
            type: 'error',
            button: 'OK'
        });
        if (typeof gameAudio !== 'undefined') gameAudio.resumeAll();
    }
}
function showContinueConfirmationModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'continue-confirm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 100011;
            display: flex;
            justify-content: center;
            align-items: center;
            background: url('1.jpg') no-repeat center center fixed;
            background-size: cover;
        `;
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: -1;
        `;
        modal.appendChild(overlay);
        modal.innerHTML += `
            <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                <div style="font-size: 48px; margin-bottom: 16px;">🧹</div>
                <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-family: 'Russo One', sans-serif;">
                    Продолжить эту игру!
                </h2>
                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-family: 'Russo One', sans-serif; margin-bottom: 8px;">
                    Посмотрите рекламу и <strong style="color: #fcd34d;">сотрите 7 верхних строк</strong>, чтобы продолжить этот раунд!
                </p>
                <p style="color: #64748b; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">
                    ⚡ Ваши очки и прогресс сохранятся
                </p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                   <button id="continue-cancel-btn" style="
    flex: 1 1 130px;
    min-width: 0;
    padding: 14px 12px;
    font-size: clamp(13px, 4vw, 16px);
    letter-spacing: 1px;
    font-family: 'Russo One', sans-serif;
    text-transform: uppercase;
    color: #94a3b8;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
">
    Отмена
</button>
                   <button id="continue-confirm-btn" style="
    flex: 1 1 130px;
    min-width: 0;
    padding: 14px 12px;
    font-size: clamp(13px, 4vw, 16px);
    letter-spacing: 1px;
    font-family: 'Russo One', sans-serif;
    text-transform: uppercase;
    color: #fff;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
    white-space: nowrap;
">
    Продолжить
</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('continue-cancel-btn').onclick = function() {
            modal.remove();
            resolve(false);
        };
        document.getElementById('continue-confirm-btn').onclick = function() {
            modal.remove();
            resolve(true);
        };
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}
function showSlowDownModal(){if(!isGameStarted||isGameOver)return void showCustomModal({title:"⚠️ Игра не активна",text:"Начните игру, чтобы использовать замедление!",type:"info",button:"OK"});if(isSlowDownActive)return void showCustomModal({title:"🐢 Замедление уже активно!",text:"Подождите, пока эффект закончится.",type:"info",button:"OK"});gameState.paused||pauseGame();const n=document.createElement("div");n.id="slowdown-confirm-modal",n.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        z-index: 100020;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        background: url('1.jpg') no-repeat center center fixed;\n        background-size: cover;\n    ";const t=document.createElement("div");t.style.cssText="\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        background: rgba(0, 0, 0, 0.6);\n        z-index: -1;\n    ",n.appendChild(t),n.innerHTML+='\n        <div class="modal-content" style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: clamp(24px, 6vw, 35px) clamp(16px, 5vw, 30px); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">\n            <div style="font-size: 48px; margin-bottom: 16px;">🐢</div>\n            <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-family: \'Russo One\', sans-serif;">\n                Замедлить?\n            </h2>\n            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-family: \'Russo One\', sans-serif; margin-bottom: 8px;">\n                Посмотрите рекламу и <strong style="color: #fcd34d;">замедлите падение фигурок</strong> на <strong>15 секунд</strong>!\n            </p>\n            <p style="color: #64748b; font-size: 13px; font-family: \'Russo One\', sans-serif; margin-bottom: 24px;">\n                ⏱️ Идеально для сложных моментов!\n            </p>\n        <div style="display: flex; flex-wrap: wrap; gap: 12px;">\n                <button onclick="document.getElementById(\'slowdown-confirm-modal\').remove(); if (gameState.paused) resumeGame();" style="flex: 1; padding: 14px; font-size: 16px; font-family: \'Russo One\', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">\n                    Отмена\n                </button>\n                <button onclick="activateSlowDown()" style="flex: 1; padding: 14px; font-size: 16px; font-family: \'Russo One\', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #34d399, #059669); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(52, 211, 153, 0.3);">\n                    🐢 Замедлить\n                </button>\n            </div>\n        </div>\n    ',document.body.appendChild(n)}function activateSlowDown(){const n=document.getElementById("slowdown-confirm-modal");n&&n.remove(),showRewardedAdForContinue().then((n=>{n?(pendingSlowDown=!0,showCustomModal({title:"🐢 Фигурки замедлятся!",text:"Падение замедлено на 15 секунд!",type:"success",button:"OK",timer:2e3})):showCustomModal({title:"❌ Реклама недоступна",text:"Попробуйте позже.",type:"error",button:"OK"})}))}
function applySlowDownEffect(){if(isSlowDownActive)return;isSlowDownActive=!0;const n=dropInterval;dropInterval=3*n,showSlowDownIndicator(),slowDownTimerId&&(clearTimeout(slowDownTimerId),slowDownTimerId=null),slowDownTimerId=setTimeout((()=>{dropInterval=n,isSlowDownActive=!1,hideSlowDownIndicator(),slowDownTimerId=null}),15e3)}function showSlowDownIndicator(){let n=document.getElementById("slowdown-indicator");n||(n=document.createElement("div"),n.id="slowdown-indicator",n.style.cssText="\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            font-size: 48px;\n            color: #34d399;\n            text-shadow: 0 0 40px rgba(52, 211, 153, 0.5);\n            z-index: 9999;\n            pointer-events: none;\n            opacity: 0;\n            transition: opacity 0.3s ease;\n            font-family: 'Russo One', sans-serif;\n            display: flex;\n            flex-direction: column;\n            align-items: center;\n            gap: 8px;\n        ",n.innerHTML='\n            <span>🐢</span>\n            <span style="font-size: 16px; color: #94a3b8;">ЗАМЕДЛЕНИЕ</span>\n            <span style="font-size: 12px; color: #64748b;" id="slowdown-timer">15с</span>\n        ',document.body.appendChild(n)),setTimeout((()=>{n.style.opacity="1"}),100);let o=15;const e=document.getElementById("slowdown-timer");if(e){e.textContent=`${o}с`;const n=setInterval((()=>{o--,o<=0?clearInterval(n):e.textContent=`${o}с`}),1e3)}}function hideSlowDownIndicator(){const n=document.getElementById("slowdown-indicator");n&&(n.style.opacity="0",setTimeout((()=>{n.parentNode&&n.remove()}),400))}
function showComboDisplay(rowsCleared) {
    const oldDisplay = document.getElementById('combo-display');
    if (oldDisplay) oldDisplay.remove();
    if (comboDisplayTimer) {
        clearTimeout(comboDisplayTimer);
        comboDisplayTimer = null;
    }
    if (rowsCleared >= 3) {
        if (typeof gameAudio !== 'undefined') {
            gameAudio.playOneShot('highspins', 0.2);
        }
    }
    const display = document.createElement('div');
    display.id = 'combo-display';
    display.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        font-family: 'Russo One', sans-serif;
        font-size: ${rowsCleared >= 5 ? 80 : rowsCleared >= 4 ? 72 : rowsCleared >= 3 ? 60 : 48}px;
        font-weight: bold;
        color: #fff;
        text-shadow: 
            0 0 30px rgba(255, 215, 0, 0.8),
            0 0 60px rgba(255, 215, 0, 0.4),
            0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 9998;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
        line-height: 1.2;
    `;
let color="#fcd34d",glowColor="rgba(255, 215, 0, 0.8)";rowsCleared>=5?(color="#ff6b6b",glowColor="rgba(255, 107, 107, 0.8)"):rowsCleared>=4?(color="#ff922b",glowColor="rgba(255, 146, 43, 0.8)"):rowsCleared>=3&&(color="#fcc419",glowColor="rgba(252, 196, 25, 0.8)");
    let comboText = `x${rowsCleared}`;
    let subText = `${rowsCleared} линии`;
    if (rowsCleared === 2) subText = `${rowsCleared} линии`;
    else if (rowsCleared === 3) subText = `${rowsCleared} линии`;
    else if (rowsCleared === 4) subText = `${rowsCleared} линии`;
    else if (rowsCleared >= 5) subText = `${rowsCleared} линий`;
if(display.innerHTML=`\n        <div style="color: ${color}; text-shadow: 0 0 40px ${glowColor}, 0 0 80px ${glowColor}40;">\n            ${comboText}\n        </div>\n        <div style="font-size: ${rowsCleared>=5?20:16}px; color: #94a3b8; text-shadow: none; margin-top: -8px;">\n            ${subText}\n        </div>\n    `,document.body.appendChild(display),requestAnimationFrame((()=>{display.style.opacity="1",display.style.transform="translate(-50%, -50%) scale(1)"})),rowsCleared>=3){let e=20;rowsCleared>=5?e=80:rowsCleared>=4&&(e=50),createConfetti(e)}comboDisplayTimer=setTimeout((()=>{display&&(display.style.opacity="0",display.style.transform="translate(-50%, -50%) scale(1.2)",setTimeout((()=>{display.parentNode&&display.remove()}),400)),comboDisplayTimer=null}),1500);
}
let loadingScreenVisible = false;
function showLoadingScreen(message = 'Загрузка...') {
    if (loadingScreenVisible) return;
    loadingScreenVisible = true;
    const overlay = document.createElement('div');
    overlay.id = 'loading-screen-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 10, 14, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-family: 'Russo One', sans-serif;
        transition: opacity 0.3s ease;
        opacity: 1;
    `;
    overlay.innerHTML = `
        <div style="text-align: center; max-width: 300px;">
            <div style="font-size: 48px; margin-bottom: 20px; animation: spin 1.5s linear infinite;">🎵</div>
            <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">${message}</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;" id="loading-status">Подготовка музыки...</p>
            <div style="width: 100%; height: 4px; background: #1e293b; border-radius: 4px; overflow: hidden;">
                <div id="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #34d399, #22c55e); transition: width 0.3s ease;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    if (!document.getElementById('loading-anim-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-anim-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}
function hideLoadingScreen() {
    const overlay = document.getElementById('loading-screen-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            loadingScreenVisible = false;
        }, 300);
    }
}
function updateLoadingStatus(text, progress) {
    const status = document.getElementById('loading-status');
    if (status) status.textContent = text;
    const bar = document.getElementById('loading-progress-bar');
    if (bar && progress !== undefined) {
        bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
}
window.selectMode = selectMode;
window.selectDifficulty = selectDifficulty;
window.closeDifficultyModal = closeDifficultyModal;
window.startGameWithAudio = startGameWithAudio;
window.togglePauseResume = togglePauseResume;
window.returnToMenu = returnToMenu;
window.toggleSound = toggleSound;
window.toggleMusic = toggleMusic;
window.updateSoundIcon = updateSoundIcon;
window.updateMusicIcon = updateMusicIcon;
window.showGameOverModal = showGameOverModal;
window.closeGameOverModal = closeGameOverModal;
window.closeGameOverModalAndMenu = closeGameOverModalAndMenu;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.endGame = endGame;
window.drawGame = drawGame;
window.update = update;
window.player = player;
window.gameState = gameState;
window.isGameStarted = isGameStarted;
window.isGameOver = isGameOver;
window.selectedDifficulty = selectedDifficulty;
window.selectedMode = selectedMode;
window.saveTotalProgress = saveTotalProgress;
window.openScrollsModal = openScrollsModal;
window.closeScrollsModal = closeScrollsModal;
window.openScrollTextModal = openScrollTextModal;
window.closeScrollTextModal = closeScrollTextModal;
window.prevScrollPage = prevScrollPage;
window.nextScrollPage = nextScrollPage;
window.renderScrolls = renderScrolls;
window.countUnlockedScrolls = countUnlockedScrolls;
window.claimScroll = claimScroll;
window.getScrollsProgress = getScrollsProgress;
window.openCollections = openCollections;
window.closeCollections = closeCollections;
window.openCollectionCategory = openCollectionCategory;
window.renderCollectionCategory = renderCollectionCategory;
window.changeCollectionPage = changeCollectionPage;
window.closeCollectionCategory = closeCollectionCategory;
window.openFullImage = openFullImage;
window.checkCategoryUnlocked = checkCategoryUnlocked;
window.getUnlockedCountInCategory = getUnlockedCountInCategory;
window.showLockedCategory = showLockedCategory;
window.showSimpleModal = showSimpleModal;
window.claimCollectionItem = claimCollectionItem;
window.updateCollectionsProgress = updateCollectionsProgress;
window.openRewardsCenter = openRewardsCenter;
window.closeRewardsCenter = closeRewardsCenter;
window.openScrollsFromRewards = openScrollsFromRewards;
window.openDailyBonus = openDailyBonus;
window.claimDailyBonus = claimDailyBonus;
window.showSuccessModal = showSuccessModal;
window.updateDailyBonusStatus = updateDailyBonusStatus;
window.handleContinueWithAd = handleContinueWithAd;
window.clearTopRows = clearTopRows;
window.showContinueConfirmationModal = showContinueConfirmationModal;
window.claimDailyBonus = claimDailyBonus;
window.claimEnhancedDailyBonus = claimEnhancedDailyBonus;
window.openDailyBonus = openDailyBonus;
window.updateDailyBonusStatus = updateDailyBonusStatus;
window.showSlowDownModal = showSlowDownModal;
window.activateSlowDown = activateSlowDown;
window.applySlowDownEffect = applySlowDownEffect;
updateSoundIcon();
updateMusicIcon();
console.log('🔥 Тетрис Дарк загружен!');