// В самом верху файла, где идут начальные настройки:
if (typeof isGameStarted === 'undefined') {
    var isGameStarted = false;
}
if (typeof isGameOver === 'undefined') {
    var isGameOver = false;
}

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
//context.scale (20,20);
const blockSize = 40;

//play intro
introSound = new Audio('audio/tetrismf.mp3');
loopSound = new Audio('audio/tetrisloop.mp3');
collideSound = new Audio('audio/tetriscollide.mp3')
rotateSound = new Audio('audio/tetrisrotate.mp3')
sweepSound = new Audio('audio/tetrissweep.mp3') 
pauseSound = new Audio('audio/tetrispause.mp3') 
gameoverSound = new Audio('audio/tetrisgameover.wav') 
highspinsSound = new Audio('audio/tetrishighspins.wav') 
levelupSound = new Audio('audio/tetrislevelup.wav') 
introSound.volume = .03
loopSound.volume = .015
collideSound.volume = .04
rotateSound.volume = .015
sweepSound.volume = .25
pauseSound.volume = .1
gameoverSound.volume = .03
highspinsSound.volume = .02
levelupSound.volume = .1

 isGameStarted = false;
isGameOver = false;


CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
      this.sound.play();
    }
    this.stop = function(){
      this.sound.pause();
    }
}
//проверка вкл или выкл звуки
var mut = false;
//выключить звуки
function mutebtn() {
    if (mut===false){
    introSound.volume = .0
    loopSound.volume = .0
    collideSound.volume = .0
    rotateSound.volume = .0
    sweepSound.volume = .0
    pauseSound.volume = .0
    gameoverSound.volume = .0
    highspinsSound.volume = .0
    levelupSound.volume = .0
    mut=true;
    document.getElementById("mute").src = "./muteoff.png";
}
    // иначе - включить. Кнопка одна для вкл выкл
    else {
        introSound.volume = .03
        loopSound.volume = .015
        collideSound.volume = .04
        rotateSound.volume = .015
        sweepSound.volume = .25
        pauseSound.volume = .1
        gameoverSound.volume = .03
        highspinsSound.volume = .02
        levelupSound.volume = .1
        mut = false;
        document.getElementById("mute").src = "./mute.png";
    }
}

function levelUp(){
    player.level++
    levelupSound.pause()
    levelupSound.currentTime = 0;
    levelupSound.play()
}
function arenaSweep(){
    let rowCount = 1;
    
    outer: for (let y = arena.length -1; y > 0; --y) {
        for(x = 0; x < arena[y].length; ++x){
            if(arena[y][x] == 0){
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        player.lines ++
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2

        // handle level ups
        if(player.lines >= 5 && player.level == 1){
            levelUp()
        } else if(player.lines >= 10 && player.level == 2){
            levelUp()
        } else if(player.lines >= 20 && player.level == 3){
            levelUp()
        } else if(player.lines >= 40 && player.level == 4){
            levelUp()
        } else if(player.lines >= 80 && player.level == 5){
            levelUp()
        } else if(player.lines >= 160 && player.level == 6){
            levelUp()
        } else if(player.lines >= 320 && player.level == 7){
            levelUp()
        } else if(player.lines >= 640 && player.level == 8){
            levelUp()
        } else {
            sweepSound.pause()
            sweepSound.currentTime = 0;
            sweepSound.play()
        }

    }
}

function collide(arena, player){
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y ){
        for (let x = 0; x < m[y].length; ++x){
            if(m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0 ){
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--){
        matrix.push(new Array(w).fill(0))
    }
    return matrix
} 

const pieces = 'ILJOTSZ'

function createPiece(type){
    switch (type){
        case "T":
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ]
        case "O":
            return [
                [2, 2],
                [2, 2]
            ]
        case "L":
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ]
        case "J":
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ]
        
        case "I":
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ]
        case "S":
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ]
        case "Z":
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ]
        default:
    }
}

function drawGame(){
    //draw matrix
    context.fillStyle='#000'
    context.fillRect(0,100, canvas.width, canvas.height)
    drawMatrix(arena, {x:0, y:0})
    drawMatrix(player.matrix, player.pos);

    //draw scoreboard
    context.fillStyle='#111'
    context.fillRect(0,0, canvas.width, 100)

    context.textAlign = "center"
    context.fillStyle='#888'
    context.font = '24px Russo One';
    context.fillText("Очки:", canvas.width /8, 30)
    context.fillStyle='#fff'
    context.font = '40px Russo One';
    context.fillText(player.score, canvas.width /8, 70)

    context.textAlign = "center"
    context.fillStyle='#888'
    context.font = '20px Russo One';
    context.fillText("Линий:", canvas.width /5 * 2, 30)
    context.fillStyle='#fff'
    context.font = '40px Russo One';
    context.fillText(player.lines, canvas.width /5 * 2, 70)

    context.textAlign = "center"
    context.fillStyle='#888'
    context.font = '20px Russo One';
    context.fillText("Уровень:", canvas.width /5 * 3, 30)
    context.fillStyle='#fff'
    context.font = '40px Russo One';
    context.fillText(player.level, canvas.width /5 * 3, 70)

    context.textAlign = "left"
    drawNextMatrix(player.nextMatrix, {x: canvas.width /5 * 4 , y: 10})
}

function drawPausedScreen(){
    context.fillStyle='#333'
    context.fillRect(0,0, canvas.width, canvas.height)
    context.fillStyle='white'
    context.font = '32px Russo One';
    context.textAlign = "center";
    context.fillText("Пауза", canvas.width /2, canvas.height /2)
    context.font = '18px Russo One';
    context.fillText("Нажмите кнопку ДАЛЬШЕ", canvas.width /2, canvas.height /1.8)
    
}

function drawGameOverScreen(){
    context.fillStyle = 'rgba(30,25,25,0.075)';
    context.fillRect(0,100, canvas.width, canvas.height)
    context.fillStyle='white'
    context.font = '32px Russo One';
    context.textAlign = "center";
    context.fillText("Игра окончена", canvas.width /2, canvas.height /2)
    context.font = '18px Russo One';
    context.fillText("Попробуйте ещё раз", canvas.width /2, canvas.height /1.8)
    
}

function drawMainMenu(){
    context.fillStyle='#303040'
    context.fillRect(0,0, canvas.width, canvas.height)
    context.fillStyle='white'
    context.font = '32px Russo One';
    context.textAlign = "center";
    context.fillText("Поиграем в тетрис?", canvas.width /2, canvas.height /2)

    if(window.localStorage.getItem('highscore') !== null){
        context.font = '18px Russo One';
        context.fillText("Рекорды: " + window.localStorage.getItem('highscore'), canvas.width /2, canvas.height /3)
    };
    
    context.font = '18px Russo One';
    context.fillText("Нажмите кнопку СТАРТ, чтобы начать", canvas.width /2, canvas.height /1.8)
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                context.fillStyle = colors[value];
                context.roundRect(x * blockSize + offset.x * blockSize, 100 + y * blockSize + offset.y * blockSize, 1 * blockSize, 1 * blockSize, 5).fill()
                context.strokeStyle = "black"
                context.strokeRect(x * blockSize + offset.x * blockSize, 100 + y * blockSize + offset.y * blockSize, 1 * blockSize, 1 * blockSize)
            }
        });
    });
}

function drawNextMatrix(matrix, offset) {
    const scale = 20
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                context.fillStyle = colors[value];
                context.roundRect(x * scale + offset.x,  y * scale + offset.y, 1 * scale, 1 * scale, 5).fill()
                
                context.strokeStyle = "black"
                context.strokeRect(x * scale + offset.x , y * scale + offset.y , 1 * scale, 1 * scale)
            }
        });
    });
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function merge (arena, player){
    player.matrix.forEach((row, y)=>{
        row.forEach((value,x)=>{
            if(value !== 0){
                arena[y + player.pos.y][x + player.pos.x] = value
            }
            
        })
    })
}

function playerDrop(){
    player.pos.y++
    if(collide(arena,player)){
        player.pos.y--
        merge(arena, player);
        playerReset();
        arenaSweep();
        collideSound.pause()
        collideSound.currentTime = 0;
        collideSound.play()
    }
    dropCounter = 0
}

function playerMove(dir){
    player.pos.x += dir
    if(collide(arena, player)){
        player.pos.x -= dir;
    }
}

function playerReset(){
    player.matrix = player.nextMatrix
    player.nextMatrix=(createPiece(pieces[pieces.length * Math.random() | 0]))
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if(collide(arena, player)){
        arena.forEach(row => row.fill(0));
        if(window.localStorage.getItem('highscore') !== null){
            if(player.score > window.localStorage.getItem('highscore')){
                window.localStorage.setItem('highscore', player.score);
            }
        }
        
        endGame()
    }
}

function playerRotate(dir){
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir)
    while(collide(arena, player)){
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if(offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos
            return;
        }
    }



    if(!player.crazySpins){
        rotateSound.pause()
        rotateSound.currentTime = 0;
        rotateSound.play()
        player.spins++
    }
    if(player.spins > 25){
        player.crazySpins = true
        loopSound.pause()
        highspinsSound.pause()
        highspinsSound.currentTime = 0;
        highspinsSound.play()
        player.spins = 0

        highspinsSound.addEventListener('ended', function() {

            player.crazySpins = false
            if (typeof loopSound.loop == 'boolean')
            {
                loopSound.loop = true;
            }
            else
            {
                loopSound.addEventListener('ended', function() {
                    this.currentTime = 0;
                                   this.play();
                }, false);
            }
            loopSound.play();
        }, false);
    }


}

function rotate(matrix, dir){
    for(let y = 0; y < matrix.length; ++y){
        for(let x = 0; x < y; ++x){
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }

}

let animationFrameId = null; // Переменная для контроля цикла анимации

function update(time = 0){
    // 1. Если игра на паузе
    if (gameState.paused) {
        drawPausedScreen();
        animationFrameId = null; 
        return; // Полностью останавливаем функцию, не вызывая следующий кадр!
    } 

    // 2. Если игра окончена
    if (gameState.over || isGameOver) {
        drawGameOverScreen();
        animationFrameId = null;
        return; // Полностью останавливаем функцию, не вызывая следующий кадр!
    }

    // 3. Если игра запущена и идет процесс
    if (gameState.initialized) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;

        // Корректный расчет интервала падения, чтобы он не уходил в минус на высоких уровнях
        const currentInterval = Math.max(50, dropInterval - (player.level * 150));

        if (dropCounter > currentInterval) {
            playerDrop();
        }
        
        drawGame();
    } else {
        // Если еще на главном экране
        drawMainMenu();
    }

    // Запускаем следующий кадр ТОЛЬКО если игра активно идет
    animationFrameId = requestAnimationFrame(update);
}
const arena = createMatrix(12,20);

const player = {
    pos: {x: 5, y: 0},
    matrix: (createPiece(pieces[pieces.length * Math.random() | 0])),
    nextMatrix: (createPiece(pieces[pieces.length * Math.random() | 0])),
    score: 0,
    spins: 0,
    crazySpins: false,
    level: 1,
    lines: 0
}

const gameState = {
    initalized: false,
    paused: false,
    introSongPlayed: false,
    gameOver: false
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
]

document.addEventListener('keydown', event => {
    switch(event.code){
        case "KeyW":
            playerRotate(-1);
            break;
        case "KeyS":
            playerDrop();
            break;
        case "KeyA":
            playerMove(-1)
            break;
        case "KeyD":
            playerMove(+1)
            break;
        case "Escape":
            endGame()
            break;
        default:
    }
})

// Вставляйте этот код прямо сюда, под document.addEventListener('keydown', ...)

function initMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRot = document.getElementById('btn-rot');

    if (!btnLeft) return;

    // Движение Влево
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof isGameStarted !== 'undefined' && isGameStarted && !isGameOver && !gameState.paused) {
            playerMove(-1);
        }
    });

    // Движение Вправо
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof isGameStarted !== 'undefined' && isGameStarted && !isGameOver && !gameState.paused) {
            playerMove(+1);
        }
    });

    // Поворот фигуры (Большая красная кнопка)
    btnRot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof isGameStarted !== 'undefined' && isGameStarted && !isGameOver && !gameState.paused) {
            playerRotate(-1);
        }
    });

    // Ускоренное падение Вниз
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof isGameStarted !== 'undefined' && isGameStarted && !isGameOver && !gameState.paused) {
            playerDrop();
        }
    });
}

// Запуск джойстика
initMobileControls();



function initAudio() {
    if(gameState.introSongPlayed){
        loopSound.play();
    } else {
        loopSound.pause();
        loopSound.currentTime = 0;
        introSound.play()
    }
    //play loop when intro ends
    introSound.addEventListener('ended', function() {
        gameState.introSongPlayed = true
        
        if (typeof loopSound.loop == 'boolean')
        {
            loopSound.loop = true;
        }
        else
        {
            loopSound.addEventListener('ended', function() {
                this.currentTime = 0;
                this.play();
            }, false);
        }
        loopSound.play();
    }, false);
}

function pauseGame() {
    gameState.paused = true;
    
    // Просто мягко замораживаем фоновый трек на месте, не сбрасывая его время в 0
    if (typeof loopSound !== 'undefined') {
        loopSound.pause();
    }
    // Если играет вступительная мелодия, её тоже ставим на паузу
    if (typeof introSound !== 'undefined') {
        introSound.pause();
    }
}

function resumeGame() {
    if (gameState.paused) {
        gameState.paused = false;
        lastTime = performance.now();
        update();
        
        // ВОЗОБНОВЛЯЕМ МУЗЫКУ ПРИ СНЯТИИ С ПАУЗЫ
        if (typeof loopSound !== 'undefined') {
            // Проверяем вашу переменную mut: если mut === false (звук ВКЛЮЧЕН), то запускаем мелодию
            if (mut === false) {
                loopSound.play().catch(err => console.log("Браузер заблокировал звук:", err));
            }
        }
    }
}


function startGame(){
    // Сбрасываем флаги при старте новой игры
    isGameStarted = true;
    isGameOver = false;
    gameState.over = false;
    gameState.paused = false;

    gameoverSound.pause();
    gameoverSound.currentTime = 0;
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    
    playerReset();
    initAudio();
    
    // Безопасный сброс анимации перед запуском
    if (typeof animationFrameId !== 'undefined' && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastTime = 0;
    dropCounter = 0;

    update();
    gameState.initialized = true;

    console.log("Игра началась");
}
function stopSounds() {
    introSound.pause();
    introSound.currentTime = 0;
    loopSound.pause();
    loopSound.currentTime = 0;
    highspinsSound.pause();
    highspinsSound.currentTime = 0;
}

function endGame() {
    window.isGameOver = true;
    gameState.over = true;

    // Звуковое сопровождение проигрыша
    stopSounds();
    gameOverSound.pause();
    gameOverSound.currentTime = 0;
    gameOverSound.play();

    // // --- ОТПРАВЛЯЕМ РЕКОРД НАДЁЖНО ДО РЕКЛАМЫ ---
    // Вызываем нашу новую функцию сохранения в VK Storage
    if (typeof player !== 'undefined' && typeof saveVKScore === 'function') {
        saveVKScore(player.score);
    }

    // // ИЗМЕНЕННЫЙ ВЫЗОВ SWEETALERT СО СЛУШАТЕЛЕМ НАЖАТИЯ КНОПКИ «OK»
    swal({
        title: "Игра окончена!",
        text: "Вы проиграли. Попробуйте еще раз!",
        icon: "error",
        button: "OK"
    }).then(() => {
        // ЭТОТ КОД СРАБОТАЕТ, КОГДА ИГРОК НАЖМЕТ «OK» В ОКНЕ
        console.log("Игрок закрыл окно проигрыша. Запускаем межстраничную рекламу...");

        // Вызываем рекламу ВКонтакте вместо Яндекса
        if (typeof showVKFullscreenAd === 'function') {
            showVKFullscreenAd();
        }
    });
}



// Функции-обертки для кнопок HTML (Пауза и Дальше)
function pauseGame() {
    gameState.paused = true;
    
    // Мягко ставим фоновую музыку на паузу (не сбрасывая время в 0)
    if (typeof loopSound !== 'undefined') {
        loopSound.pause();
    }
    // Если у вас играют другие фоновые звуки, их тоже можно приостановить здесь:
    if (typeof introSound !== 'undefined') introSound.pause();
    if (typeof highspinsSound !== 'undefined') highspinsSound.pause();
}


function resumeGame() {
    if (gameState.paused) {
        gameState.paused = false;
        lastTime = performance.now();
        update();
        
        // ВОЗОБНОВЛЯЕМ МУЗЫКУ ПРИ ВЫХОДЕ ИЗ ПАУЗЫ
        // Проверяем, не выключен ли звук кнопкой Mute в игре
        if (typeof loopSound !== 'undefined' && !gameState.muted) { 
            // Используйте имя переменной флага звука (например, player.muted или gameState.muted), если оно у вас другое
            loopSound.play().catch(err => console.log("Браузер заблокировал автозвук:", err));
        }
    }
}
// Вспомогательные функции уведомлений
function showNotStartedAlert() {
    Swal.fire({
        title: "Внимание!",
        text: "Игра еще не начата. Пожалуйста, сначала нажмите кнопку 'СТАРТ'!",
        icon: "warning",
        confirmButtonText: "Понятно"
    });
}

function showGameOverAlert() {
    Swal.fire({
        title: "Игра завершена!",
        text: "Эта сессия окончена. Нажмите кнопку 'СТАРТ', чтобы сбросить поле.",
        icon: "info",
        confirmButtonText: "Хорошо"
    });
}

// Исправленная функция разводки кликов (если вы используете клики по Canvas)
function startPauseResume(){
    if (!isGameStarted) {
        startGame();
        return;
    }

    if (isGameOver) {
        showGameOverAlert();
        return;
    }

    if (gameState.initialized) {
        if (gameState.paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

// Запуск начального экрана меню при первой загрузке страницы
update();
