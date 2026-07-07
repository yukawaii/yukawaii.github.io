// js/quizEngine.js
// Универсальный движок для викторин (работает с любым массивом вопросов)
// Используется в wordQuiz.html и может быть адаптирован для других викторин

let quizState = {};

function initQuiz(questions, totalQuestions, timePerQuestion, onComplete) {
    // Перемешиваем и выбираем нужное количество
    const shuffled = shuffle([...questions]);
    const selected = shuffled.slice(0, totalQuestions || 30);
    
    quizState = {
        questions: selected,
        currentIndex: 0,
        correctCount: 0,
        totalAttempted: 0,
        totalWrong: 0,
        timePerQuestion: timePerQuestion || 10,
        timerId: null,
        timeLeft: timePerQuestion || 10,
        isAnswered: false,
        onComplete: onComplete || function() {}
    };
    
    showQuestion();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
    const state = quizState;
    if (state.currentIndex >= state.questions.length) {
        finishQuiz();
        return;
    }
    
    const q = state.questions[state.currentIndex];
    document.getElementById('questionText').innerHTML = q.question;
    document.getElementById('currentQuestionNum').textContent = state.currentIndex + 1;
    document.getElementById('correctAnswers').textContent = state.correctCount;
    
    // Варианты ответов
    const optionBox = document.getElementById('optionBox');
    optionBox.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = opt;
        div.dataset.index = idx;
        div.addEventListener('click', () => handleAnswer(idx));
        optionBox.appendChild(div);
    });
    
    // Сброс состояния
    state.isAnswered = false;
    document.getElementById('answerDescription').className = 'answer-description';
    document.getElementById('answerDescription').textContent = '';
    document.getElementById('nextBtn').className = 'btn next-question-btn';
    document.getElementById('resultBtn').className = 'btn see-result-btn';
    document.getElementById('timeUpText').className = 'time-up-text';
    
    // Запуск таймера
    startTimer();
}

function startTimer() {
    const state = quizState;
    state.timeLeft = state.timePerQuestion;
    updateTimerDisplay();
    
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft <= 0) {
            clearInterval(state.timerId);
            // Время вышло – автоматически отмечаем как неправильный ответ
            if (!state.isAnswered) {
                document.getElementById('timeUpText').className = 'time-up-text show';
                // Показываем правильный ответ
                const q = state.questions[state.currentIndex];
                const options = document.querySelectorAll('.option');
                options.forEach((el, idx) => {
                    el.classList.add('already-answered');
                    if (idx === q.correct) {
                        el.classList.add('show-correct');
                    }
                });
                // Показываем объяснение
                const desc = document.getElementById('answerDescription');
                desc.textContent = q.explanation || 'Правильный ответ выделен.';
                desc.className = 'answer-description show';
                state.isAnswered = true;
                state.totalAttempted++;
                state.totalWrong++;
                // Показать кнопку "Дальше" или "Результат"
                showNextOrResult();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('remainingTime');
    el.textContent = quizState.timeLeft;
    if (quizState.timeLeft <= 3) {
        el.className = 'remaining-time less-time';
    } else {
        el.className = 'remaining-time';
    }
}

function handleAnswer(selectedIdx) {
    const state = quizState;
    if (state.isAnswered) return;
    clearInterval(state.timerId);
    state.isAnswered = true;
    state.totalAttempted++;
    
    const q = state.questions[state.currentIndex];
    const options = document.querySelectorAll('.option');
    let isCorrect = (selectedIdx === q.correct);
    
    // Отключаем клики
    options.forEach(el => el.classList.add('already-answered'));
    
    // Подсвечиваем
    options.forEach((el, idx) => {
        if (idx === q.correct) el.classList.add('correct');
        else if (idx === selectedIdx && !isCorrect) el.classList.add('wrong');
    });
    
    if (isCorrect) {
        state.correctCount++;
    } else {
        state.totalWrong++;
    }
    document.getElementById('correctAnswers').textContent = state.correctCount;
    
    // Показываем объяснение
    const desc = document.getElementById('answerDescription');
    desc.textContent = q.explanation || (isCorrect ? 'Верно!' : 'Неверно. Попробуй запомнить.');
    desc.className = 'answer-description show';
    
    showNextOrResult();
}

function showNextOrResult() {
    const state = quizState;
    if (state.currentIndex + 1 < state.questions.length) {
        document.getElementById('nextBtn').className = 'btn next-question-btn show';
        document.getElementById('nextBtn').onclick = () => {
            state.currentIndex++;
            showQuestion();
        };
    } else {
        document.getElementById('resultBtn').className = 'btn see-result-btn show';
        document.getElementById('resultBtn').onclick = finishQuiz;
    }
}

function finishQuiz() {
    const state = quizState;
    if (state.timerId) clearInterval(state.timerId);
    
    // Скрыть игровой экран, показать результаты
    document.getElementById('quizBox').className = 'quiz-box custom-box';
    document.getElementById('resultBox').className = 'quiz-over-box custom-box show';
    
    document.getElementById('totalQuestions').textContent = state.questions.length;
    document.getElementById('totalAttempt').textContent = state.totalAttempted;
    document.getElementById('totalCorrect').textContent = state.correctCount;
    document.getElementById('totalWrong').textContent = state.totalWrong;
    const percent = state.totalAttempted > 0 ? Math.round((state.correctCount / state.totalAttempted) * 100) : 0;
    document.getElementById('percentage').textContent = percent + '%';
    
    if (state.onComplete) state.onComplete(state);
  // ===== НАЧИСЛЕНИЕ ЗВЁЗД =====
    let earned = 0;
    if (state.totalAttempted > 0 && state.totalWrong === 0) {
        earned = 3; // без ошибок
    } else if (state.totalAttempted > 0) {
        earned = 1; // просто за прохождение
    }
    if (earned > 0 && typeof window.addStars === 'function') {
        window.addStars(earned);
        // Показываем в результатах
        const resultText = document.getElementById('star-earned');
        if (resultText) {
            resultText.textContent = `⭐ +${earned}`;
        }
    }
}

// Экспортируем для использования в других скриптах
window.initQuiz = initQuiz;