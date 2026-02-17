let phones = [];
let questionCount = 0;
let correctCount = 0;
let streak = 0;
let timerInterval;
let timeLeft;

const SFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, type, duration, vol = 0.1) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    correct(s) { 
        this.play(600 + (s * 100), 'sine', 0.2); 
        setTimeout(() => this.play(900 + (s * 100), 'sine', 0.3), 100); 
    },
    wrong() { this.play(120, 'square', 0.4, 0.1); }
};

document.getElementById("play-btn").onclick = startQuiz;
document.getElementById("next-btn").onclick = nextQuestion;

async function startQuiz() {
    if (phones.length === 0) {
        const res = await fetch("phones.json");
        phones = await res.json();
    }
    questionCount = 0;
    correctCount = 0;
    streak = 0;
    switchScreen('quiz-screen');
    nextQuestion();
}

function startTimer() {
    timeLeft = 100;
    const bar = document.getElementById("timer-bar");
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 1.25; // approx 8 seconds total
        bar.style.width = timeLeft + "%";
        bar.style.background = timeLeft < 30 ? "var(--error)" : "var(--success)";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleCheck(false, null, null, true);
        }
    }, 100);
}

function nextQuestion() {
    if (questionCount >= 5) { showResults(); return; }
    questionCount++;
    document.getElementById("feedback-overlay").classList.add("hidden");
    
    const correctPhone = phones[Math.floor(Math.random() * phones.length)];
    const distractors = phones.filter(p => p.model !== correctPhone.model).sort(() => 0.5 - Math.random()).slice(0, 2);
    const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());

    renderQuestion(correctPhone, options);
    startTimer();
}

function renderQuestion(correct, options) {
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    document.getElementById("progress").textContent = `Q: ${questionCount}/5`;
    document.getElementById("score-display").textContent = `${correctCount * 100}`;

    const img = document.createElement("img");
    img.className = "phone-img-large";
    const baseName = correct.model.toLowerCase().replace(/\s+/g, '-');
    img.src = `phones/${baseName}.jpg`;
    img.onerror = () => { img.src = `phones/${baseName}.png`; };
    container.appendChild(img);

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "menu-btn secondary";
        btn.textContent = opt.model;
        btn.onclick = () => handleCheck(opt === correct, correct, btn);
        container.appendChild(btn);
    });
}

function handleCheck(isCorrect, phone, el, isTimeOut = false) {
    clearInterval(timerInterval);
    const overlay = document.getElementById("feedback-overlay");
    const feedbackText = document.getElementById("feedback-text");
    const quizPanel = document.getElementById("quiz-screen");

    if (isCorrect) {
        correctCount++;
        streak++;
        SFX.correct(streak);
        if (el) el.style.background = "var(--success)";
    } else {
        streak = 0;
        SFX.wrong();
        quizPanel.classList.add("shake");
        setTimeout(() => quizPanel.classList.remove("shake"), 400);
        if (el) el.style.background = "var(--error)";
    }

    feedbackText.innerHTML = `
        <h1 style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}">
            ${isTimeOut ? "TIME'S UP!" : (isCorrect ? "JUICY!" : "WRONG!")}
        </h1>
        <p>This is the <b>${phone ? phone.model : "Mystery Phone"}</b></p>
    `;
    overlay.classList.remove("hidden");
}

function showResults() {
    switchScreen('result-screen');
    document.getElementById("final-stats").textContent = `${correctCount} / 5`;
    const stars = document.getElementById("stars-container");
    stars.innerHTML = "";
    for(let i=0; i<5; i++) {
        const s = document.createElement("span");
        s.className = "star " + (i < correctCount ? "active" : "");
        s.innerHTML = "★";
        s.style.animationDelay = (i * 0.15) + "s";
        setTimeout(() => SFX.play(400 + (i * 100), 'sine', 0.1), i * 150);
        stars.appendChild(s);
    }
}

function switchScreen(id) {
    ["menu", "quiz-screen", "result-screen"].forEach(s => document.getElementById(s).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}
