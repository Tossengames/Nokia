let phones = [];
let questionCount = 0;
let correctCount = 0;
const totalQuestions = 5;

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
    click() { this.play(600, 'sine', 0.1); },
    correct() { this.play(800, 'sine', 0.1); setTimeout(() => this.play(1200, 'sine', 0.2), 100); },
    wrong() { this.play(150, 'square', 0.3, 0.05); }
};

const screens = {
    menu: document.getElementById("menu"),
    quiz: document.getElementById("quiz-screen"),
    result: document.getElementById("result-screen")
};

document.getElementById("play-btn").onclick = startQuiz;
document.getElementById("next-btn").onclick = nextQuestion;

function switchScreen(key) {
    SFX.click();
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[key].classList.remove("hidden");
}

async function startQuiz() {
    if (phones.length === 0) {
        const res = await fetch("phones.json");
        phones = await res.json();
    }
    questionCount = 0;
    correctCount = 0;
    switchScreen('quiz');
    nextQuestion();
}

// Fixed Image Loader: Tries .jpg, then .png, then .webp
function loadImage(modelName, imgElement) {
    const baseName = modelName.toLowerCase().replace(/\s+/g, '-');
    const extensions = ['jpg', 'png', 'webp', 'jpeg'];
    let index = 0;

    const tryNext = () => {
        if (index < extensions.length) {
            imgElement.src = `phones/${baseName}.${extensions[index]}`;
            index++;
        } else {
            imgElement.src = 'https://via.placeholder.com/200?text=Image+Missing';
        }
    };

    imgElement.onerror = tryNext;
    tryNext(); // Start first attempt
}

function nextQuestion() {
    if (questionCount >= totalQuestions) {
        showResults();
        return;
    }
    questionCount++;
    document.getElementById("feedback-overlay").classList.add("hidden");
    
    // Pick correct answer
    const correctPhone = phones[Math.floor(Math.random() * phones.length)];
    
    // Pick 2 distractors
    let distractors = phones.filter(p => p.model !== correctPhone.model)
                            .sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());

    renderQuestion(correctPhone, options);
}

function renderQuestion(correct, options) {
    const container = document.getElementById("options-container");
    const qText = document.getElementById("question-text");
    container.innerHTML = "";
    
    document.getElementById("progress").textContent = `Q: ${questionCount}/${totalQuestions}`;
    document.getElementById("score-display").textContent = `Score: ${correctCount}`;

    qText.textContent = "Which Nokia is this?";
    
    // Create and load image with fallback
    const img = document.createElement("img");
    img.className = "phone-img-large";
    loadImage(correct.model, img);
    container.appendChild(img);
    
    // Create 3 text buttons
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt.model;
        btn.onclick = () => handleCheck(opt === correct, correct, btn);
        container.appendChild(btn);
    });
}

function handleCheck(isCorrect, phone, el) {
    if (isCorrect) {
        correctCount++;
        SFX.correct();
        el.classList.add("vfx-correct");
    } else {
        SFX.wrong();
        el.classList.add("vfx-wrong");
    }

    const overlay = document.getElementById("feedback-overlay");
    const feedbackText = document.getElementById("feedback-text");
    feedbackText.innerHTML = `
        <h2 style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}">${isCorrect ? 'Correct!' : 'Wrong!'}</h2>
        <p>This is the <strong>${phone.model}</strong>.</p>
    `;
    overlay.classList.remove("hidden");
}

function showResults() {
    switchScreen('result');
    const stats = document.getElementById("final-stats");
    const starContainer = document.getElementById("stars-container");
    stats.textContent = `${correctCount} / ${totalQuestions}`;
    starContainer.innerHTML = ""; 

    for (let i = 0; i < totalQuestions; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.innerHTML = "★";
        if (i < correctCount) star.classList.add("active");
        star.style.animationDelay = `${i * 0.15}s`;
        setTimeout(() => SFX.play(500 + (i * 100), 'sine', 0.1, 0.04), i * 150);
        starContainer.appendChild(star);
    }
}
