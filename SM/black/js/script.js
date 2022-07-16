const directions = ['Вверх', 'Вниз', 'Влево', 'Вправо'];
const multipliers = ['x2', 'x3'];
const colors = ['#6CC5D9', '#F2D857', '#F2B279', '#F2762E', '#DC3A4B', '#0FD081'];
vkBridge.subscribe((e) => console.log("vkBridge event", e));
vkBridge.send("VKWebAppInit", {});
// Document elements
const messageLine = document.getElementById('message-line');
const smallText = document.getElementById('small-text');
const clock = document.getElementById('clock');
const instructions = document.getElementById('instructions');
const mobileButtons = document.getElementById('mobile-buttons');
const mobileUpArrow = document.getElementById('up-arrow');
const mobileLeftArrow = document.getElementById('left-arrow');
const mobileRightArrow = document.getElementById('right-arrow');
const mobileDownArrow = document.getElementById('down-arrow');

// Game data
let actualDirections = [];
let directionsRecorded = [];
let score = 0;
let initialSmallText = '. . .';
let gameStatus = true;
let isTouchEnabled = false;
const startingTimeInterval = 2100;
function myAdd1(){
    vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
  .then(data => console.log(data.result))
  .catch(error => console.log(error));
  }
  
// Game functions
function selectValueAtRandom(arr) {
    const index = Math.floor(Math.random() * arr.length);
    const direction = arr[index];
    return direction;
}

function checkIfEqual(arrOne, arrTwo) {
    if (arrOne.length === arrTwo.length) {
        for (let i = 0; i < arrOne.length; i++) {
            if (arrOne[i] !== arrTwo[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function buildDirections() {
    const direction = selectValueAtRandom(directions);
    let multiplier;
    let secondDirection; 
    let secondMultiplier;
    
    const shouldContinue = (probability) => {
        const num = Math.ceil(Math.random() * probability);
        if (num === probability) {
            return true;
        }
        return false;
    }

    if (shouldContinue(3) && score > 30) {
        multiplier = selectValueAtRandom(multipliers);
    }

    if (shouldContinue(2) && score > 40) {
        secondDirection = selectValueAtRandom(directions);
    }

    if (secondDirection !== undefined && shouldContinue(3) && score > 60) {
        secondMultiplier = selectValueAtRandom(multipliers);
    }

    let directionsToPrint = [direction];

    const optionalText = [multiplier, secondDirection, secondMultiplier];

    for (text of optionalText) {
        if (text !== undefined) {
            directionsToPrint.push(text);
        }
    }

    return directionsToPrint;

}

function printDirections() {
    let newDirections = buildDirections();
    let message = '';
    for (let i = 0; i < newDirections.length; i++) {
        let j = 1;
        if (directions.includes(newDirections[i])) {
            if (newDirections[i + 1] !== null && multipliers.includes(newDirections[i + 1])) {
                if (newDirections[i + 1] === multipliers[0]) {
                    j = 2;
                } else if (newDirections[i + 1] === multipliers[1]) {
                    j = 3;
                }
            }
            for (let k = 0; k < j; k++) {
                actualDirections.push(newDirections[i]);
            }
        }

        message += '<span style="color:' + colors[i] + '">' + newDirections[i] + ' </span>';
        if (i + 1 === newDirections.length) {
            message = message.substr(0, message.length - 1);
        }
    }
    return message;
}

function checkArrowDirection(event) {
    if (event.defaultPrevented) {
      return;
    }
  
    switch (event.key) {
      case 'ArrowDown':
        directionsRecorded.push('Вниз');
        addTextToSmallText('Вниз');
        break;
      case 'ArrowUp':
        directionsRecorded.push('Вверх');
        addTextToSmallText('Вверх');
        break;
      case 'ArrowLeft':
        directionsRecorded.push('Влево');
        addTextToSmallText('Влево');
        break;
      case 'ArrowRight':
        directionsRecorded.push('Вправо');
        addTextToSmallText('Вправо');
        break;
      default:
        return;
    }
}

function checkUserInput() {
    return checkIfEqual(actualDirections, directionsRecorded);
}

function addTextToSmallText(text) {
    const wordColor = getWordColor(directionsRecorded.length - 1);
    if (smallText.innerHTML === initialSmallText) {
        smallText.innerHTML = '<span style="color:' + wordColor + '">' + text + '</span>';
    } else {
        smallText.innerHTML += ', <span style="color:' + wordColor + '">' + text + '</span>';
    }
}

function getWordColor(wordNumber) {
    if (actualDirections[wordNumber] === directionsRecorded[wordNumber]) {
        return colors[5];
    }
    return colors[4];
}

function increaseScore() {
    score += 10;
}

function clearData() {
    actualDirections = [];
    directionsRecorded = [];
}

function getSpeed(score) {
    const multiplier = score/10;
    let newTime = startingTimeInterval;
    if (multiplier > 3) {
        newTime *= (1 - (multiplier/100));
    }
    return newTime;
}

function reloadPage() {
    location.reload();
}

function addInstructions() {
    instructions.style.opacity = .95;
    instructions.style.color = '#FFFFFF';
}

function clearAllIntervals() {
    clearInterval(replaceInterval);
    clearInterval(clockInterval);
}

function updateClock() {
    currentClock = clock.innerHTML;
    const clockArr = currentClock.split(':');
    let minute = parseInt(clockArr[0]); 
    let singleDigitSeconds = parseInt(clockArr[1][1]);
    let doubleDigitSeconds = parseInt(clockArr[1][0]);
    singleDigitSeconds++;

    if (singleDigitSeconds > 9) {
        doubleDigitSeconds++;
        singleDigitSeconds = 0;
    }

    if (doubleDigitSeconds > 5) {
        minute++;
        doubleDigitSeconds = 0;
    }

    if (minute > 59) {
        clock.innerHTML = `Получено достижение: "Быстрый гепард"!`;
    } else {
        clock.innerHTML = `${minute}:${doubleDigitSeconds}${singleDigitSeconds}`;
    }
}

function styleEndGameClock() {
    clock.style.color = colors[3];
}

function setEndGameMessage() {
    messageLine.innerHTML = 'Игра окончена';
    sessionStorage.setItem("score1", score);
    smallText.innerHTML = '<span style="color:#F2D857;">Очки: ' + score + '</span><span style="color:#6CC5D9;"> Играть ещё?</span>';
}

function addPlayAgainInstructions() {
    instructions.style.opacity = .95;
    instructions.style.color = '#FFFFFF';
    if (isTouchEnabled) {
        instructions.innerHTML = "Нажми на экран";
    } else {
        instructions.innerHTML = "Нажми любую клавишу";
    }
}

function startGame(currentSpeed) {
    clearTimeout(instructionsTimeout);
    window.removeEventListener('click', advanceGame);
    window.removeEventListener('keydown', advanceGame);
    window.removeEventListener('touchend', handleMobileStart);
    window.addEventListener('keydown', checkArrowDirection);
    clock.style.opacity = 1;
    clock.style.color = '#a9a9a9';
    clockInterval = setInterval(updateClock, 1000);
    replaceInterval = setInterval(advanceGame, currentSpeed);
}

function levelUp(currentSpeed) {
    increaseScore();
    clearInterval(replaceInterval);
    replaceInterval = setInterval(advanceGame, currentSpeed);
}
   //получение очков из вк
   function getsc(){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "getscore", "params":
     {"user_id": userid, "v":"5.131",
      "access_token":"bd17d005bd17d005bd17d00549bd6b1b43bbd17bd17d005df87316362d28b5eab868dac", global:1}})
    .then(data => {console.log("Очков на вк:" + data.response);
      // *назначение переменных*
   (score2 = data.response);
      return data.response;
    })
    .catch(error => console.log(error));} ;

//отправка очков в вк
function sendscore(){
  getsc();
  var userid = sessionStorage.getItem('userid');
  var score1 = sessionStorage.getItem('score1');
  var scorsum= score1+score2;
  sessionStorage.setItem("scorsum", scorsum);
  vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
{"client_secret":"Pl4TYB00x4HZc4SiqXhj", 
"user_id":userid, "activity_id":2, "value":scorsum, "v":"5.131",
 "access_token":"bd17d005bd17d005bd17d00549bd6b1b43bbd17bd17d005df87316362d28b5eab868dac",
 "global":1}})
 .then(data => {console.log("Ответ на добавление очков:" + data.response);
})
.catch(error => console.log(error)); }

function endGame() {
    gameStatus = false;
    myAdd1();
    clearAllIntervals();
    window.removeEventListener('keydown', checkArrowDirection);
    if (isTouchEnabled) {
        handleMobileEnd();
    }
    styleEndGameClock();
    setEndGameMessage();
    setTimeout(function() {
        window.addEventListener('keydown', reloadPage);
        window.addEventListener('click', reloadPage);
        window.addEventListener('touchend', reloadPage);
    }, 500);
    instructions.style.opacity = 0;
    playAgainInstructionsTimeout = setTimeout(addPlayAgainInstructions, 1200);
    
}

function advanceGame() {
    const checkGameStatus = checkUserInput();
    let currentSpeed = getSpeed(score);
    if (score > 0) {
        instructions.style.opacity = 0;
        instructions.style.color = '#000000';
    }
    if (checkGameStatus) {
        console.log('Очки: ' + score);
        console.log(`Скорость: ${getSpeed(score)} мс`);
        if (actualDirections.length !== 0) {
            levelUp(currentSpeed);
        } else {
            startGame(currentSpeed);
        }
        clearData();
        messageLine.innerHTML = printDirections();
        smallText.innerHTML = initialSmallText;
    } else {
        endGame();
    }
}

function handleMobileStart() {
    isTouchEnabled = true;
    mobileButtons.style.display = 'flex';
    mobileUpArrow.addEventListener('touchend', pressUpArrowKey);
    mobileLeftArrow.addEventListener('touchend', pressLeftArrowKey);
    mobileRightArrow.addEventListener('touchend', pressRightArrowKey);
    mobileDownArrow.addEventListener('touchend', pressDownArrowKey);
    advanceGame();
}

function handleMobileEnd() {
    mobileUpArrow.removeEventListener('touchend', pressUpArrowKey);
    mobileLeftArrow.removeEventListener('touchend', pressLeftArrowKey);
    mobileRightArrow.removeEventListener('touchend', pressRightArrowKey);
    mobileDownArrow.removeEventListener('touchend', pressDownArrowKey);
}

function changeArrowColor(key) {
    key.style.color = '#F2B279';
    setTimeout(function() {
        key.style.color = '#FFFFFF';
    }, 200);
}

function pressUpArrowKey() {
    window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowUp'}));
    changeArrowColor(mobileUpArrow);
}

function pressLeftArrowKey() {
    window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowLeft'}));
    changeArrowColor(mobileLeftArrow);
}

function pressRightArrowKey() {
    window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowRight'}));
    changeArrowColor(mobileRightArrow);
}

function pressDownArrowKey() {
    window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowDown'}));
    changeArrowColor(mobileDownArrow);
}

// Start game here
window.addEventListener('click', advanceGame);
window.addEventListener('keydown', advanceGame);
window.addEventListener('touchend', handleMobileStart);

instructionsTimeout = setTimeout(addInstructions, 800);



