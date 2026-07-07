// Получаем элементы по ID
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
    // ХА СТРОКА
    question: "Как читается эта мора? <br> <img src='../mem/img/26.png' width='120' height='120' />",
    options: ["СА", "ХА", "Н", "О"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/27.png' width='120' height='120' />",
    options: ["ХИ", "Я", "СЭ", "НО"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/28.png' width='120' height='120' />",
    options: ["ВА", "ЦУ", "ФУ", "РУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/29.png' width='120' height='120' />",
    options: ["СА", "ХЭ", "ЦУ", "РО"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/30.png' width='120' height='120' />",
    options: ["Ё", "ХО", "НУ", "МА"],
    answer: 1,
},
// МA-line
{
    question: "Как читается эта мора? <br> <img src='../mem/img/31.png' width='120' height='120' />",
    options: ["МУ", "СЭ", "РУ", "МА"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/32.png' width='120' height='120' />",
    options: ["МА", "ВА", "МИ", "НО"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/33.png' width='120' height='120' />",
    options: ["ТА", "ТЭ", "МУ", "КО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/34.png' width='120' height='120' />",
    options:["НИ", "МЭ", "ЦУ", "О"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/35.png' width='120' height='120' />",
    options: ["МО", "ТО", "У", "Э"],
    answer: 0,
},
//  РА-line
{
    question: "Как читается эта мора? <br> <img src='../mem/img/36.png' width='120' height='120' />",
    options: ["Ё", "РА", "КИ", "ЦУ"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/37.png' width='120' height='120' />",
    options: ["КА", "ТЭ", "РИ", "СИ"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/40.png' width='120' height='120' />",
    options: ["И", "КЭ", "РУ", "О"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/38.png' width='120' height='120' />",
    options:["КА", "КЭ", "ФУ", "РЭ"],
    answer: 3,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/39.png' width='120' height='120' />",
    options: ["РО", "ТЭ", "ЦУ", "СО"],
    answer: 0,
},
// СТРОКА ЯЮЁ ВА О Н
{
    question: "Как читается эта мора? <br> <img src='../mem/img/41.png' width='120' height='120' />",
    options: ["Я", "НЭ", "Ё", "ЦУ"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/42.png' width='120' height='120' />",
    options: ["КА", "Ю", "НУ", "И"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/43.png' width='120' height='120' />",
    options: ["Ё", "ТИ", "Ю", "ВА"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/44.png' width='120' height='120' />",
    options:["ХА", "ВА", "ФУ", "СО"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src='../mem/img/45.png' width='120' height='120' />",
    options: ["А", "НЭ", "О", "ТО"],
    answer: 2,
},
{
    question: "Как читается эта мора? <br> <img src='../mem/img/46.png' width='120' height='120' />",
    options: ["Н", "Ю", "Я", "У"],
    answer: 0,
}]

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
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

    // ===== НАЧИСЛЕНИЕ ЗВЁЗД =====
    var earned = 0;
    if (attempt > 0 && (attempt - score) === 0) {
        earned = 3; // без ошибок
    } else if (attempt > 0) {
        earned = 1; // просто за прохождение
    }
    if (earned > 0 && typeof window.addStars === 'function') {
        window.addStars(earned);
        var starEl = document.getElementById('star-earned');
        if (starEl) {
            starEl.textContent = '⭐ +' + earned;
        }
    }
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

console.log("✅ Викторина Уровень 2 загружена!");