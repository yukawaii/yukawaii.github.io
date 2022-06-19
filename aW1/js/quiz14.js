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
        question: "<img src = '../mem/img/173.png' width='250' height='250' />",
        options: ["Горгулья", "Гарпия", "Тетерев", "Сова"],
        answer: 1,
        description: "Гарпия филиппинская. Живут и охотятся парами на обезьян.",
    }, {
        question: "<img src = '../mem/img/174.png' width='250' height='250' />",
        options: ["Панда", "Муравьед", "Бобёр", "Медедь"],
        answer: 3,
        description: "Медведь малайский. Может поедать ящериц и мелких амфибий, разграблять плантации кокосовых пальм",
    },{
        question: "<img src = '../mem/img/175.png' width='250' height='250' />",
        options: ["Линкия", "Сиали", "Коралл", "Медуза"],
        answer: 0,
        description: "Линкия синяя. Может размножаться несколькими способами.",
    },{
        question: "<img src = '../mem/img/176.png' width='250' height='250' />",
        options: ["Горгулья", "Казарка", "Аргус", "Павлин"],
        answer: 2,
        description: "Аргус. Не любит шума, предпочитает скрываться от посторонних глаз.",
    },{
        question: "<img src = '../mem/img/177.png' width='250' height='250' />",
        options: ["Бородач", "Гиббон", "Орангутан", "Носач"],
        answer: 3,
        description: "Носач.  Превосходный пловец: может прыгать в воду прямо с высокого дерева ",
    },{
        question: "<img src = '../mem/img/178.png' width='250' height='250' />",
        options: ["Аллигатор", "Гавиал", "Рыба-пила", "Змееед"],
        answer: 1,
        description: "Гавиал. Доживает до 80–100 лет.",
    },
    {
        question: "<img src = '../mem/img/179.png' width='250' height='250' />",
        options: ["Махаон", "Пестрянка", "Павлиноглазка", "Бархатница"],
        answer: 2,
        description: "Павлиноглазка атлас. Жизнь состоит из четырех стадий: яйцо, личинка, куколка и имаго.",
    },
    {
        question: "<img src = '../mem/img/180.png' width='250' height='250' />",
        options: ["Макак-резус", "Гиббон", "Долгопят", "Мартышка"],
        answer: 0,
        description: "Макак-резус.  В стае царит матриархат, самок в среднем в четыре раза больше, чем самцов",
    },
    {
        question: "<img src = '../mem/img/181.png' width='250' height='250' />",
        options: ["Уж", "Кобра", "Полоз", "Ящерица"],
        answer: 1,
        description: "Кобра индийская.е. Убежищами ей служат глиняные сооружения, полости под камнями, покинутые холмики термитов",
    },{
        question: "<img src = '../mem/img/182.png' width='250' height='250' />",
        options: ["Рогонос", "Клювонос", "Бирюза", "Рогоклюв"],
        answer: 3,
        description: "Рогоклюв длиннохвостый.Яркая окраска помогает птицам не терять друг друга из поля зрения.",
    },{
        question: "<img src = '../mem/img/183.png' width='250' height='250' />",
        options: ["Гремлин", "Белка-летяга", "Лемур", "Долгопят"],
        answer: 3,
        description: "Долгопят филиппинский. Обладает превосходным слухом, различает даже малейшие шорохи.",
    },{
        question: "<img src = '../mem/img/184.png' width='250' height='250' />",
        options: ["Морская звезда", "Коралл", "Ёж", "Манта"],
        answer: 2,
        description: "Еж грифельный морской.",
    },{
        question: "<img src = '../mem/img/185.png' width='250' height='250' />",
        options: ["Альциона", "Колибри", "Синица", "Сизоворотка"],
        answer: 0,
        description: "Альциона белошейная. Живут парами, которые сохраняют вне периода размножения.",
    },{
        question: "<img src = '../mem/img/186.png' width='250' height='250' />",
        options: ["Кабан", "Бабирусса", "Носорог", "Як"],
        answer: 1,
        description: "Бабирусса. Врагами являются одичавшие собаки, серьезную угрозу представляют браконьеры",
    },{
        question: "<img src = '../mem/img/187.png' width='250' height='250' />",
        options: ["Уж", "Полоз", "Питон", "Анаконда"],
        answer: 2,
        description: "Питон сетчатый. Одна из самых крупных змей в мире: длина тела достигает 10 м и более.",
    }    ]
  
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
    sessionStorage.setItem("score1", score);
    sendscore();
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