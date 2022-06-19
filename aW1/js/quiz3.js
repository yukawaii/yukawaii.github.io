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

const myApp = [
    {
        question: "<img src = '../mem/img/37.png' width='250' height='250' />",
        options: ["Какаду", "Кеа", "Орёл", "Сокол"],
        answer: 1,
        description: " Кеа — единственный попугай, способный жить и размножаться на высоте 1500 м над уровнем моря",
    }, 
    {
        question: "<img src = '../mem/img/38.png' width='250' height='250' />",
        options: ["Литория", "Саламандра", "Варан", "Гаттерия"],
        answer: 3,
        description: "Гаттерия часто селится в подземных норах птиц-буревестников. Вместе мирно живут и птица, и рептилия.",
    }, {
        question: "<img src = '../mem/img/39.png' width='250' height='250' />",
        options: ["Литория", "Лорикет", "Гаттерия", "Кеа"],
        answer: 0,
        description: "Литория коралловопалая. Обладает монотонным голосом, напоминающим звуки «бравк-бравк-бравк».",
    },{
        question: "<img src = '../mem/img/40.png' width='250' height='250' />",
        options: ["Петроика", "Синица", "Кукабара", "Казуар"],
        answer: 0,
        description: "Петроика длинноногая. Отыскав добычу, она уносит и закапывает ее на расстоянии 10 м.",
    },{
        question: "<img src = '../mem/img/41.png' width='250' height='250' />",
        options: ["Корелла", "Казуар", "Павлин", "Пингвин"],
        answer: 3,
        description: "Пингвин великолепный — превосходный ныряльщик, может погружаться на глубину 20–60 м. ",
    },{
        question: "<img src = '../mem/img/42.png' width='250' height='250' />",
        options: ["Казуар", "Кеа", "Пауа ирис", "Рыба-моллюск"],
        answer: 2,
        description: "С помощью большой и крепкой ноги черного цвета папуа прикрепляется к субстрату и так проводит большинство времени.",
    },{
        question: "<img src = '../mem/img/43.png' width='250' height='250' />",
        options: ["Пеликан", "Чайка", "Ласточка", "Олуша"],
        answer: 3,
        description: "Олуша австралийская Может оставаться под водой около 10 секунд.",
    }, {
        question: "<img src = '../mem/img/44.png' width='250' height='250' />",
        options: ["Валлаби", "Кенгуру", "Бурундук", "Лемур"],
        answer: 0,
        description: "Валлаби желтоногий скальный. Питается преимущественно травами, опасается лисиц.",
    }, {
        question: "<img src = '../mem/img/45.png' width='250' height='250' />",
        options: ["Касатка", "Акула синяя", "Дельфин Гектора", "Кит"],
        answer: 2,
        description: "Дельфин Гектора. Находится на грани вымирания — сегодня осталось всего около 110 особей.",
      /*  description: "The answer is innerHTML.", Тут можно добавить пояснения к ответу */
    },{
        question: "<img src = '../mem/img/46.png' width='250' height='250' />",
        options: ["Кулик", "Кулик-сорока", "Ворона", "Галчонок"],
        answer: 1,
        description: "Кулик-сорока изменчивый. Может орудовать клювом как консервным ножом, если необходимо открыть раковину моллюска и т.п.",
    },{
        question: "<img src = '../mem/img/51.png' width='250' height='250' />",
        options: ["Абрикос", "Мандаринка", "Персик", "Киви"],
        answer: 3,
        description: "Киви южный. Образовав пару, они остаются верными друг другу на протяжении всей жизни.",
    }, {
        question: "<img src = '../mem/img/52.png' width='250' height='250' />",
        options: ["Морской котик", "Тюлень", "Варраби", "Пингвин"],
        answer: 0,
        description: "Котик морской новозеландский. Большую часть жизни проводит на суше, но за едой отправляется в море.",
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
    let timeLimit = 10;
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
    sessionStorage.setItem("score1", score);   sendscore();
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