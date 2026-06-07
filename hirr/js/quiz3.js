const questionText = document.getElementById("question-text");
const optionBox = document.querySelector(".option-box");
const currentQuestionNum = document.querySelector(".current-question-num");
const answerDescription = document.querySelector(".answer-description");
const nextQuestionBtn = document.querySelector(".next-question-btn");
const correctAnswers = document.querySelector(".correct-answers");
const seeResultBtn = document.querySelector(".see-result-btn");
const remainingTime = document.querySelector(".remaining-time");
const timeUpText = document.querySelector(".time-up-text");
const quizHomeBox = document.querySelector(".quiz-home-box");
const quizBox = document.querySelector(".quiz-box");
const quizOverBox = document.querySelector(".quiz-over-box");
const startAgainQuizBtn = document.querySelector(".start-again-quiz-btn");
const goHomeBtn = document.querySelector(".go-home-btn");
const startQuizBtn = document.querySelector(".start-quiz-btn");
const nameText = document.getElementById("myForm");
const finalMsg = document.querySelector(".finalMsg");

let attempt = 0;
let questionIndex = 0;
let score = 0;
let number = 0;
let myArray = [];
let interval;

const myApp = [{
    question: "Как читается эта мора? <br> <img src = '../mem/img/7.png' width='100' height='100' />",
    options: ["СА", "НИ", "У", "О"],
    answer: 3,
},
 {
    question: "Как читается эта мора? <br> <img src = '../mem/img/10.png' width='100' height='100' />",
    options: ["Ю", "КИ", "А", "О"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/9.png' width='100' height='100' />",
    options: ["НА", "И", "ЦУ", "О"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/8.png' width='100' height='100' />",
    options: ["А", "НЭ", "У", "О"],
    answer: 2,
  /*  description: "The answer is innerHTML.", Тут можно добавить пояснения к ответу */
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/6.png' width='100' height='100' />",
    options: ["А", "Ё", "Э", "ТО"],
    answer: 2,
},
// KA-line
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/2.png' width='100' height='100' />",
    options: ["МА", "СЭ", "СУ", "KА"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/3.png' width='100' height='100' />",
    options: ["А", "КЭ", "КИ", "НО"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/4.png' width='100' height='100' />",
    options: ["НА", "КУ", "ТЭ", "КО"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/5.png' width='100' height='100' />",
    options:["КЭ", "МИ", "ЦУ", "СО"],
    answer: 0,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/1.png' width='100' height='100' />",
    options: ["НО", "ТО", "КО", "ВА"],
    answer: 2,
},
//  CA-line
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/11.png' width='100' height='100' />",
    options: ["Ю", "ТЭ", "Н", "СА"],
    answer: 3,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/12.png' width='100' height='100' />",
    options: ["Ё", "ВА", "КА", "СИ"],
    answer: 3,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/13.png' width='100' height='100' />",
    options: ["ТИ", "КЭ", "СУ", "ТО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/14.png' width='100' height='100' />",
    options:["НА", "СЭ", "ФУ", "СО"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/15.png' width='100' height='100' />",
    options: ["Н", "СО", "ЦУ", "У"],
    answer: 1,
},
// СТРОКА ТА
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/16.png' width='100' height='100' />",
    options: ["ХЭ", "ТЭ", "ТА", "ЦУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/17.png' width='100' height='100' />",
    options: ["ТИ", "О", "НУ", "КИ"],
    answer: 0,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/18.png' width='100' height='100' />",
    options: ["ТИ", "ЦУ", "СУ", "НО"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/19.png' width='100' height='100' />",
    options:["КУ", "СУ", "ФУ", "ТЭ"],
    answer: 3,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/20.png' width='100' height='100' />",
    options: ["СА", "ТО", "ЦУ", "ХО"],
    answer: 1,
},
// СТРОКА НА
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/21.png' width='100' height='100' />",
    options: ["МА", "Э", "НА", "ЦУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/22.png' width='100' height='100' />",
    options: ["НА", "НИ", "СУ", "ТИ"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/23.png' width='100' height='100' />",
    options: ["ВА", "ЦУ", "НУ", "ФУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/24.png' width='100' height='100' />",
    options:["У", "НЭ", "ФУ", "ХЭ"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/25.png' width='100' height='100' />",
    options: ["НО", "ХЭ", "ЦУ", "МИ"],
    answer: 0,
},
    {
    // ХА СТРОКА
    question: "Как читается эта мора? <br> <img src = '../mem/img/26.png' width='100' height='100' />",
    options: ["СА", "ХА", "Н", "О"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/27.png' width='100' height='100' />",
    options: ["Я", "ХИ", "СЭ", "НО"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/28.png' width='100' height='100' />",
    options: ["ВА", "ЦУ", "ФУ", "РУ"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/29.png' width='100' height='100' />",
    options: ["СА", "ХЭ", "ЦУ", "РО"],
    answer: 1,
  /*  description: "The answer is innerHTML.", Тут можно добавить пояснения к ответу */
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/30.png' width='100' height='100' />",
    options: ["ХО", "Ю", "НУ", "Ё"],
    answer: 0,
},
// МA-line
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/31.png' width='100' height='100' />",
    options: ["МА", "СЭ", "РУ", "KО"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/32.png' width='100' height='100' />",
    options: ["МА", "ВА", "МИ", "НО"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/33.png' width='100' height='100' />",
    options: ["ТА", "МУ", "РА", "КО"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/34.png' width='100' height='100' />",
    options:["НИ", "МЭ", "ЦУ", "О"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/35.png' width='100' height='100' />",
    options: ["МО", "ТО", "У", "Э"],
    answer: 0,
},
//  РА-line
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/36.png' width='100' height='100' />",
    options: ["РУ", "РА", "КИ", "ЦУ"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/37.png' width='100' height='100' />",
    options: ["КА", "ТЭ", "РИ", "СИ"],
    answer: 2,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/40.png' width='100' height='100' />",
    options: ["И", "КЭ", "РУ", "О"],
    answer: 2,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/38.png' width='100' height='100' />",
    options:["КА", "КЭ", "ФУ", "РЭ"],
    answer: 3,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/39.png' width='100' height='100' />",
    options: ["РО", "ТЭ", "ЦУ", "СО"],
    answer: 0,
},
// СТРОКА ЯЮЁ ВА О Н
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/41.png' width='100' height='100' />",
    options: ["Я", "НЭ", "Ё", "ЦУ"],
    answer: 0,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/42.png' width='100' height='100' />",
    options: ["КА", "Ю", "НУ", "И"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/43.png' width='100' height='100' />",
    options: ["ТИ", "Ё", "Ю", "ВА"],
    answer: 1,
}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/44.png' width='100' height='100' />",
    options:["ХА", "ВА", "ФУ", "СО"],
    answer: 1,

}, {
    question: "Как читается эта мора? <br> <img src = '../mem/img/45.png' width='100' height='100' />",
    options: ["А", "НЭ", "О", "ТО"],
    answer: 2,
},
{
    question: "Как читается эта мора? <br> <img src = '../mem/img/46.png' width='100' height='100' />",
    options: ["Н", "Ю", "Я", "У"],
    answer: 0,
}]


function load() {
    //console.log("test");
    number++;
    questionText.innerHTML = myApp[questionIndex].question;
    createOptions();
    scoreBoard();
    currentQuestionNum.innerHTML = number + " / " + myApp.length;
}

function createOptions() {
    optionBox.innerHTML = "";
    for (let i = 0; i < myApp[questionIndex].options.length; i++) {
        // console.log(myApp[questionIndex].options[i]);
        const option = document.createElement("div");
        option.innerHTML = myApp[questionIndex].options[i];
        option.classList.add("option");
        option.id = i;
        option.setAttribute("onclick", "check(this)");
        optionBox.appendChild(option);
    }
}

function generateRandomQuestion() {
    let randomNumber = Math.floor(Math.random() * (myApp.length));
    let hitDuplicate = 0;
    if (myArray.length == 0) {
        questionIndex = randomNumber;
    } else {
        for (let i = 0; i < myArray.length; i++) {
            if (randomNumber == myArray[i]) {
                hitDuplicate = 1;
                // console.log("found duplicate")
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
    // console.log(myArray);
    load();

}

function check(ele) {
    // console.log(ele.id);
    const id = ele.id;
    if (id == myApp[questionIndex].answer) {
        // console.log("correct");
        ele.classList.add("correct");
        score++;
        scoreBoard();
    } else {
        // console.log("wrong");
        ele.classList.add("wrong");
        // show correct answer when clicked answer is wrong;
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

    if (number / (myApp.length) == 1) {
        // console.log("over");
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
    let timeLimit = 5;
    remainingTime.classList.remove("less-time");
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
    // answer description will only show if it is definied
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

nextQuestionBtn.addEventListener("click", nextQuestion);

function nextQuestion() {
    // questionIndex++;
    generateRandomQuestion();
    // load();
    hideNextQuestionBtn();
    hideAnswerDescription();
    hideTimeUpText();
    startTimer();
}

function quizResult() {
    document.querySelector(".total-questions").innerHTML = myApp.length;
    document.querySelector(".total-attempt").innerHTML = attempt;
    document.querySelector(".total-correct").innerHTML = score;
    document.querySelector(".total-wrong").innerHTML = attempt - score;
    const percentage = (score / (myApp.length)) * 100;
    document.querySelector(".percentage").innerHTML = Math.floor(percentage) + "%";
}

let namesAndScores = JSON.parse(localStorage.getItem("namesAndScores"));

    if (namesAndScores === null) {
        namesAndScores = [
                {"name": "Melody",
                "score": "100%"}
        ]
    };

function resetQuiz() {
    attempt = 0;
    // questionIndex = 0;
    score = 0;
    number = 0;
    myArray = [];
}

function quizOver() {
    nextQuestionBtn.classList.remove("show");
    seeResultBtn.classList.add("show");
}

seeResultBtn.addEventListener("click", () => {
    // quizBox.style.display = "none";
    quizBox.classList.remove("show");
    seeResultBtn.classList.remove("show");
    quizOverBox.classList.add("show");
    quizResult();
})

startAgainQuizBtn.addEventListener("click", () => {
    quizBox.classList.add("show");
    quizOverBox.classList.remove("show");
    resetQuiz();
    nextQuestion();
})

goHomeBtn.addEventListener("click", () => {
    quizOverBox.classList.remove("show");
    quizHomeBox.classList.add("show");
    resetQuiz();
})

startQuizBtn.addEventListener("click", () => {
    quizBox.classList.add("show");
    quizHomeBox.classList.remove("show");
    startTimer();
    generateRandomQuestion();
})

// // window.onload = () => {
//     // load();
//     startTimer();
//     generateRandomQuestion();
// }