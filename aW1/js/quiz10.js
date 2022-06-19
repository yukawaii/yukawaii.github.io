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
        question: "<img src = '../mem/img/125.png' width='250' height='250' />",
        options: ["Журавль", "Казарка", "Сизоворонка", "Ибис"],
        answer: 0,
        description: "Журавль черношеий. Пара строит гнездо на небольшом возвышении, окруженном водой, или прямо на воде",
    }, {
        question: "<img src = '../mem/img/126.png' width='250' height='250' />",
        options: ["Капибара", "Панда", "Россомаха", "Ленивец"],
        answer: 1,
        description: "Панда большая.  Китайское название - «медведь-кошка», хорошо лазает по деревьям",
    },{
        question: "<img src = '../mem/img/127.png' width='250' height='250' />",
        options: ["Сверчок", "Саранча", "Богомол", "Кузнечик"],
        answer: 2,
        description: "Богомол китайский. Подкарауливает свою добычу в засаде.",
    },{
        question: "<img src = '../mem/img/128.png' width='250' height='250' />",
        options: ["Попугай", "Казарка", "Кеклик", "Калибри"],
        answer: 0,
        description: "Попугай кольчатый красноголовый. Шумная птица. Настоящий виртуоз в полете. ",
    },{
        question: "<img src = '../mem/img/129.png' width='250' height='250' />",
        options: ["Росомаха", "Панда", "Ленивец", "Лиса"],
        answer: 1,
        description: "Панда малая. Днем отдыхает в кроне деревьев или в дупле, укрывшись хвостом",
    },{
        question: "<img src = '../mem/img/130.png' width='250' height='250' />",
        options: ["Медуза", "Коралл", "Рыба-зебра", "Кальмар"],
        answer: 2,
        description: "Рыба-зебра. В каждом плавнике спрятаны острые ядовитые иглы",
    },
    {
        question: "<img src = '../mem/img/131.png' width='250' height='250' />",
        options: ["Утка-мандаринка", "Лебедь", "Ибис", "Гусь"],
        answer: 0,
        description: "Утка-мандаринка. Зимовать отправляются в отдельные регионы Китая и Японии.",
    },
    {
        question: "<img src = '../mem/img/132.png' width='250' height='250' />",
        options: ["Осёл", "Олень", "Лось", "Антилопа"],
        answer: 1,
        description: "Олень хохлатый. Любит различные травы, листья и плоды",
    },
    {
        question: "<img src = '../mem/img/133.png' width='250' height='250' />",
        options: ["Карась", "Иваси", "Скумбрия", "Окунь"],
        answer: 3,
        description: "Окунь китайский отличается превосходным зрением. Свою добычу высматривает среди камней, травы",
    },{
        question: "<img src = '../mem/img/134.png' width='250' height='250' />",
        options: ["Цапля", "Колпица", "Журавль", "Аист"],
        answer: 0,
        description: "Цапля восточная рифовая гнездится большими колониями, часто с пеликанами и бакланами.",
    },{
        question: "<img src = '../mem/img/135.png' width='250' height='250' />",
        options: ["Козёл", "Буйвол", "Баран", "Такин"],
        answer: 3,
        description: "Такин.Для питания важна соль, поэтому часто обитает неподалеку от соленых озер.",
    },{
        question: "<img src = '../mem/img/136.png' width='250' height='250' />",
        options: ["Гюрза", "Уж", "Полоз", "Кобра"],
        answer: 2,
        description: "Полоз тонкохвостый. Маленькие змейки с первых мгновений своей жизни предоставлены сами себе",
    },{
        question: "<img src = '../mem/img/137.png' width='250' height='250' />",
        options: ["Попугай", "Удод", "Бородач", "Кукушка"],
        answer: 1,
        description: "Удод.  Голос напоминает «уп-уп-уп» или «уд-уд-уд»",
    },{
        question: "<img src = '../mem/img/138.png' width='250' height='250' />",
        options: ["Обезьяна", "Горилла", "Примат", "Гиббон"],
        answer: 3,
        description: "Гиббон белорукий. Передвигается с помощью длинных сильных рук и цепких пальцев.",
    },{
        question: "<img src = '../mem/img/139.png' width='250' height='250' />",
        options: ["Акула", "Кит", "Касатка", "Дельфин"],
        answer: 0,
        description: "Акула китовая. Не может размножаться до 30-летнего возраста. ",
    },{
        question: "<img src = '../mem/img/140.png' width='250' height='250' />",
        options: ["Казуарка", "Кеклик", "Клест-еловик", "Снегирь"],
        answer: 2,
        description: "Клест-еловик. Быстро летает, издает звуки «кэп-кэп-кэп».",
    },{
        question: "<img src = '../mem/img/141.png' width='250' height='250' />",
        options: ["Росомаха", "Медведь", "Панда", "Пума"],
        answer: 1,
        description: "Медведь гималайский. Основа рациона — листья и побеги растений, иногда животные.",
    },{
        question: "<img src = '../mem/img/142.png' width='250' height='250' />",
        options: ["Аллигатор", "Крокодил", "Саламандра", "Ящерица"],
        answer: 0,
        description: "Аллигатор китайский. После выхода из спячки долгое время греется на солнце.",
    }
    ]
  
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