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
    info: document.getElementById("info-screen"),
    support: document.getElementById("support-screen"),
    quiz: document.getElementById("quiz-screen"),
    result: document.getElementById("result-screen")
};

document.getElementById("play-btn").onclick = startQuiz;
document.getElementById("info-btn").onclick = () => switchScreen('info');
document.getElementById("support-btn").onclick = () => switchScreen('support');
document.getElementById("info-back").onclick = () => switchScreen('menu');
document.getElementById("support-back").onclick = () => switchScreen('menu');
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

function nextQuestion() {
    if (questionCount >= totalQuestions) {
        showResults();
        return;
    }
    questionCount++;
    document.getElementById("feedback-overlay").classList.add("hidden");
    
    const type = Math.random() < 0.5 ? 'A' : 'B';
    const correctPhone = phones[Math.floor(Math.random() * phones.length)];
    
    // Both types now use exactly 3 total options (1 correct + 2 distractors)
    const distractors = phones
        .filter(p => p.model !== correctPhone.model)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

    const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());
    renderQuestion(type, correctPhone, options);
}

async function renderQuestion(type, correct, options) {
    const container = document.getElementById("options-container");
    const qText = document.getElementById("question-text");
    container.innerHTML = "Locating handset...";
    
    document.getElementById("progress").textContent = `Q: ${questionCount}/${totalQuestions}`;
    document.getElementById("score-display").textContent = `Score: ${correctCount}`;

    if (type === 'A') {
        qText.textContent = "What model is this?";
        const imgUrl = await fetchWikiImage(correct.wiki);
        container.innerHTML = `<img src="${imgUrl}" class="phone-img-large">`;
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = opt.model;
            btn.onclick = () => handleCheck(opt === correct, correct, btn);
            container.appendChild(btn);
        });
    } else {
        qText.textContent = `"${correct.fact}"`;
        const grid = document.createElement("div");
        grid.className = "image-options-grid";
        for (let opt of options) {
            const imgUrl = await fetchWikiImage(opt.wiki);
            const card = document.createElement("div");
            card.className = "img-option-card";
            card.innerHTML = `<img src="${imgUrl}" class="phone-img-small">`;
            card.onclick = () => handleCheck(opt === correct, correct, card);
            grid.appendChild(card);
        }
        container.innerHTML = "";
        container.appendChild(grid);
    }
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
        <p>This is the <strong>${phone.model}</strong> (${phone.year}).</p>
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
        setTimeout(() => {
            SFX.play(500 + (i * 150), 'sine', 0.1, 0.04);
        }, i * 150);
        starContainer.appendChild(star);
    }
    
    document.getElementById("rank-message").textContent = 
        correctCount === 5 ? "Nokia Legend! 🏆" : (correctCount >= 3 ? "Great Job! 📱" : "Keep Trying! 💾");
}

async function fetchWikiImage(page) {
    try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${page}&prop=pageimages&pithumbsize=400&format=json&origin=*`);
        const data = await res.json();
        const p = Object.values(data.query.pages)[0];
        return p.thumbnail ? p.thumbnail.source : "https://via.placeholder.com/200?text=No+Image";
    } catch { return "https://via.placeholder.com/200?text=Error"; }
}
