let phones = [];
let questionCount = 0;
let correctCount = 0;
let timerInterval;
let timeLeft;

// Particle System
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * -6 - 2;
        this.gravity = 0.2;
        this.life = 1;
    }
    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 30; i++) particles.push(new Particle(x, y, color));
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

const SFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(freq, type, duration, vol = 0.1) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    correct() { this.play(800, 'sine', 0.2); },
    wrong() { this.play(150, 'square', 0.3, 0.05); }
};

document.getElementById("play-btn").onclick = startQuiz;
document.getElementById("info-btn").onclick = () => switchScreen('info-screen');
document.getElementById("next-btn").onclick = nextQuestion;

async function startQuiz() {
    if (phones.length === 0) {
        const res = await fetch("phones.json");
        phones = await res.json();
    }
    questionCount = 0; correctCount = 0;
    switchScreen('quiz-screen');
    nextQuestion();
}

function startTimer() {
    timeLeft = 100;
    const bar = document.getElementById("timer-bar");
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 1.5; // ~7 seconds
        bar.style.width = timeLeft + "%";
        if (timeLeft <= 0) { clearInterval(timerInterval); handleCheck(false, null, null); }
    }, 100);
}

// Improved Image Loading Fix
function setPhoneImage(img, modelName) {
    const fileName = modelName.toLowerCase().replace(/\s+/g, '-');
    const path = `phones/${fileName}`;
    
    const formats = ['.jpg', '.png', '.jpeg', '.webp'];
    let i = 0;
    
    img.onerror = () => {
        if (i < formats.length - 1) {
            i++;
            img.src = path + formats[i];
        } else {
            img.src = "https://via.placeholder.com/200?text=Image+Not+Found";
            img.onerror = null;
        }
    };
    img.src = path + formats[0];
}

function nextQuestion() {
    if (questionCount >= 5) { showResults(); return; }
    questionCount++;
    document.getElementById("feedback-overlay").classList.add("hidden");
    const correctPhone = phones[Math.floor(Math.random() * phones.length)];
    const distractors = phones.filter(p => p.model !== correctPhone.model).sort(() => 0.5 - Math.random()).slice(0, 2);
    const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());

    const container = document.getElementById("options-container");
    container.innerHTML = "";
    document.getElementById("progress").textContent = `QUESTION ${questionCount}/5`;
    document.getElementById("score-display").textContent = correctCount * 10;

    const img = document.createElement("img");
    img.className = "phone-img-large";
    setPhoneImage(img, correctPhone.model);
    container.appendChild(img);

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "menu-btn secondary";
        btn.textContent = opt.model;
        btn.onclick = () => handleCheck(opt === correctPhone, correctPhone, btn);
        container.appendChild(btn);
    });
    startTimer();
}

function handleCheck(isCorrect, phone, el) {
    clearInterval(timerInterval);
    const overlay = document.getElementById("feedback-overlay");
    const feedbackText = document.getElementById("feedback-text");

    if (isCorrect) {
        correctCount++;
        SFX.correct();
        spawnParticles(window.innerWidth/2, window.innerHeight/2, '#00ff88');
    } else {
        SFX.wrong();
    }

    feedbackText.innerHTML = `
        <h2 style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}">${isCorrect ? 'Correct' : 'Incorrect'}</h2>
        <p>This is the <b>${phone ? phone.model : "target model"}</b></p>
    `;
    overlay.classList.remove("hidden");
}

function showResults() {
    switchScreen('result-screen');
    document.getElementById("final-stats").textContent = `${correctCount} / 5`;
    
    const rankMsg = document.getElementById("rank-message");
    if (correctCount === 5) {
        rankMsg.textContent = "Unstoppable! You know your Nokia history inside out.";
        spawnParticles(window.innerWidth/2, window.innerHeight/2, '#00d2ff');
    } else if (correctCount >= 3) {
        rankMsg.textContent = "Impressive. You remember the golden age of mobile technology.";
    } else {
        rankMsg.textContent = "A good start. Time to refresh your retro tech knowledge!";
    }

    const stars = document.getElementById("stars-container");
    stars.innerHTML = "";
    for(let i=0; i<5; i++) {
        const s = document.createElement("span");
        s.className = "star " + (i < correctCount ? "active" : "");
        s.innerHTML = "★";
        s.style.animationDelay = (i * 0.1) + "s";
        stars.appendChild(s);
    }
}

function switchScreen(id) {
    ["menu", "quiz-screen", "result-screen", "info-screen"].forEach(s => {
        document.getElementById(s).classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
}
