// Получаем элементы по ID (более надежно)
const questionText = document.getElementById("questionText");
const optionBox = document.getElementById("optionBox");
const currentQuestionNum = document.getElementById("currentQuestionNum");
const answerDescription = document.getElementById("answerDescription");
const nextQuestionBtn = document.getElementById("nextBtn");
const correctAnswers = document.getElementById("correctAnswers");
const seeResultBtn = document.getElementById("resultBtn");
const remainingTime = document.getElementById("remainingTime");
const timeUpText = document.getElementById("timeUpText");
const quizHomeBox = document.getElementById("homeBox");
const quizBox = document.getElementById("quizBox");
const quizOverBox = document.getElementById("resultBox");
const startAgainQuizBtn = document.getElementById("startAgainBtn");
const startQuizBtn = document.getElementById("startQuizBtn");

let attempt = 0;
let questionIndex = 0;
let score = 0;
let number = 0;
let myArray = [];
let interval;

const myApp = [{
    question: "Как читается эта мора? <br> <img src='../mem/img/7.png' width='120' height='120' />",
    options: ["СА", "НИ", "У", "О"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/10.png' width='120' height='120' />",
    options: ["А", "A", "СЭ", "О"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/9.png' width='120' height='120' />",
    options: ["НА", "И", "ЦУ", "О"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/8.png' width='120' height='120' />",
    options: ["А", "НЭ", "У", "О"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/6.png' width='120' height='120' />",
    options: ["А", "Э", "НУ", "ТО"],
    answer: 1,
},
// KA-line
{
    question: "Как читается эта мора? <br> <img src='../mem/img/2.png' width='120' height='120' />",
    options: ["KO", "СЭ", "KA", "ТО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/3.png' width='120' height='120' />",
    options: ["А", "КЭ", "КИ", "НО"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/4.png' width='120' height='120' />",
    options: ["НА", "ТЭ", "КУ", "КО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/5.png' width='120' height='120' />",
    options:["НИ", "КЭ", "ЦУ", "СО"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/1.png' width='120' height='120' />",
    options: ["НО", "KО", "СО", "CО"],
    answer: 1,
},
//  CA-line
{
    question: "Как читается эта мора? <br> <img src='../mem/img/11.png' width='120' height='120' />",
    options: ["СА", "ТЭ", "КИ", "ЦУ"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/12.png' width='120' height='120' />",
    options: ["КА", "ТЭ", "НУ", "СИ"],
    answer: 3,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/13.png' width='120' height='120' />",
    options: ["ТИ", "КЭ", "СУ", "ТО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/14.png' width='120' height='120' />",
    options:["НА", "СЭ", "ФУ", "СО"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/15.png' width='120' height='120' />",
    options: ["А", "СЭ", "CO", "TО"],
    answer: 2,
},
// СТРОКА ТА
{
    question: "Как читается эта мора? <br> <img src='../mem/img/16.png' width='120' height='120' />",
    options: ["ХА", "НЭ", "СИ", "ТА"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/17.png' width='120' height='120' />",
    options: ["КА", "ТИ", "НУ", "КИ"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/18.png' width='120' height='120' />",
    options: ["ТИ", "ЦУ", "СУ", "НО"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/19.png' width='120' height='120' />",
    options:["ТЭ", "КА", "ФУ", "СО"],
    answer: 0,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/20.png' width='120' height='120' />",
    options: ["СА", "ТО", "ЦУ", "ТА"],
    answer: 1,
},
// СТРОКА НА
{
    question: "Как читается эта мора? <br> <img src='../mem/img/21.png' width='120' height='120' />",
    options: ["НИ", "ТЭ", "СИ", "НА"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/22.png' width='120' height='120' />",
    options: ["НИ", "НА", "СУ", "ТИ"],
    answer: 0,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/23.png' width='120' height='120' />",
    options: ["ТИ", "ЦУ", "НУ", "КУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/24.png' width='120' height='120' />",
    options:["КУ", "НЭ", "ФУ", "СЭ"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/25.png' width='120' height='120' />",
    options: ["НО", "СЭ", "ЦУ", "СА"],
    answer: 0,
}]

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ИНТЕГРАЦИИ С HTML =====
window.startGame = function() {
    resetQuiz();
    quizBox.classList.add('show');
    startTimer();
    generateRandomQuestion();
}

window.restartGame = function() {
    resetQuiz();
    quizBox.classList.add('show');
    quizOverBox.classList.remove('show');
    startTimer();
    generateRandomQuestion();
}

window.nextQuestion = function() {
    if (number < myApp.length) {
        generateRandomQuestion();
        hideNextQuestionBtn();
        hideAnswerDescription();
        hideTimeUpText();
        startTimer();
    }
}

function load() {
    number++;
    questionText.innerHTML = myApp[questionIndex].question;
    createOptions();
    scoreBoard();
     currentQuestionNum.innerHTML = number; 
}

function createOptions() {
    optionBox.innerHTML = "";
    for (let i = 0; i < myApp[questionIndex].options.length; i++) {
        const option = document.createElement("div");
        option.innerHTML = myApp[questionIndex].options[i];
        option.classList.add("option");
        option.id = i;
        option.setAttribute("onclick", "check(this)");
        optionBox.appendChild(option);
    }
}

function generateRandomQuestion() {
    if (myArray.length >= myApp.length) {
        quizOver();
        return;
    }
    
    let randomNumber = Math.floor(Math.random() * (myApp.length));
    let hitDuplicate = 0;
    if (myArray.length == 0) {
        questionIndex = randomNumber;
    } else {
        for (let i = 0; i < myArray.length; i++) {
            if (randomNumber == myArray[i]) {
                hitDuplicate = 1;
            }
        }
        if (hitDuplicate == 1) {
            generateRandomQuestion();
            return;
        } else {
            questionIndex = randomNumber;
        }
    }

    myArray.push(randomNumber);
    load();
}

function check(ele) {
    const id = ele.id;
    if (id == myApp[questionIndex].answer) {
        ele.classList.add("correct");
        score++;
        scoreBoard();
    } else {
        ele.classList.add("wrong");
        for (let i = 0; i < optionBox.children.length; i++) {
            if (optionBox.children[i].id == myApp[questionIndex].answer) {
                optionBox.children[i].classList.add("show-correct");
            }
        }
    }
    attempt++;
    disableOptions();
    showAnswerDescription();
    showNextQuestionBtn();
    stopTimer();

    if (myArray.length >= myApp.length) {
        quizOver();
    }
}

function timeIsUp() {
    showTimeUpText();
    for (let i = 0; i < optionBox.children.length; i++) {
        if (optionBox.children[i].id == myApp[questionIndex].answer) {
            optionBox.children[i].classList.add("show-correct");
        }
    }
    disableOptions();
    showAnswerDescription();
    showNextQuestionBtn();
}

function startTimer() {
    let timeLimit = 10;
    remainingTime.classList.remove("less-time");
    remainingTime.innerHTML = timeLimit;
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        timeLimit--;
        if (timeLimit < 10) {
            timeLimit = "0" + timeLimit;
        }
        if (timeLimit < 6) {
            remainingTime.classList.add("less-time");
        }

        remainingTime.innerHTML = timeLimit;
        if (timeLimit == 0) {
            clearInterval(interval);
            timeIsUp();
        }
    }, 1000)
}

function stopTimer() {
    clearInterval(interval);
}

function disableOptions() {
    for (let i = 0; i < optionBox.children.length; i++) {
        optionBox.children[i].classList.add("already-answered");
    }
}

function showAnswerDescription() {
    if (typeof myApp[questionIndex].description !== "undefined") {
        answerDescription.classList.add("show");
        answerDescription.innerHTML = myApp[questionIndex].description;
    }
}

function hideAnswerDescription() {
    answerDescription.classList.remove("show");
    answerDescription.innerHTML = "";
}

function showNextQuestionBtn() {
    nextQuestionBtn.classList.add("show");
}

function hideNextQuestionBtn() {
    nextQuestionBtn.classList.remove("show");
}

function showTimeUpText() {
    timeUpText.classList.add("show");
}

function hideTimeUpText() {
    timeUpText.classList.remove("show");
}

function scoreBoard() {
    correctAnswers.innerHTML = score;
}

function quizResult() {
    document.getElementById("totalQuestions").innerHTML = myApp.length;
    document.getElementById("totalAttempt").innerHTML = attempt;
    document.getElementById("totalCorrect").innerHTML = score;
    document.getElementById("totalWrong").innerHTML = attempt - score;
    const percentage = (score / (myApp.length)) * 100;
    document.getElementById("percentage").innerHTML = Math.floor(percentage) + "%";
}

function resetQuiz() {
    attempt = 0;
    score = 0;
    number = 0;
    myArray = [];
    if (interval) {
        clearInterval(interval);
    }
    remainingTime.innerHTML = "10";
    remainingTime.classList.remove("less-time");
    hideTimeUpText();
    hideNextQuestionBtn();
    hideAnswerDescription();
    seeResultBtn.classList.remove("show");
}

function quizOver() {
    nextQuestionBtn.classList.remove("show");
    seeResultBtn.classList.add("show");
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
seeResultBtn.addEventListener("click", function() {
    quizBox.classList.remove("show");
    seeResultBtn.classList.remove("show");
    quizOverBox.classList.add("show");
    quizResult();
});

startAgainQuizBtn.addEventListener("click", function() {
    quizOverBox.classList.remove("show");
    quizBox.classList.add("show");
    window.restartGame();
});

startQuizBtn.addEventListener("click", function() {
    quizHomeBox.classList.remove("show");
    window.startGame();
});

nextQuestionBtn.addEventListener("click", function() {
    window.nextQuestion();
});

// Проверяем, что все элементы найдены
console.log("✅ Элементы викторины загружены:");
console.log("questionText:", questionText);
console.log("optionBox:", optionBox);
console.log("nextQuestionBtn:", nextQuestionBtn);
// ===== ДОПОЛНИТЕЛЬНАЯ АДАПТАЦИЯ ДЛЯ ТЕЛЕФОНОВ =====
// Убираем задержку при касании на мобильных
document.addEventListener('touchstart', function() {}, {passive: true});

// Добавляем поддержку touch для кнопок
document.querySelectorAll('.option').forEach(el => {
    el.addEventListener('touchstart', function(e) {
        // Не даем событию сработать дважды
    }, {passive: true});
});

console.log('📱 Адаптация для мобильных устройств включена');