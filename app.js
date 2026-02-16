let phones = [];
let currentQuestion = null;
let questionCount = 0;
let correctCount = 0;
const totalQuestions = 5;

// Elements
const screens = {
    menu: document.getElementById("menu"),
    info: document.getElementById("info-screen"),
    support: document.getElementById("support-screen"),
    quiz: document.getElementById("quiz-screen"),
    result: document.getElementById("result-screen")
};

const optionsContainer = document.getElementById("options-container");
const feedbackPanel = document.getElementById("feedback-panel");
const nextBtn = document.getElementById("next-btn");

// Initialization
document.getElementById("play-btn").addEventListener("click", startQuiz);
document.getElementById("info-btn").addEventListener("click", () => switchScreen('info'));
document.getElementById("support-btn").addEventListener("click", () => switchScreen('support'));
document.querySelectorAll('.menu-btn[id$="-back"]').forEach(btn => {
    btn.addEventListener("click", () => switchScreen('menu'));
});
nextBtn.addEventListener("click", nextQuestion);

function switchScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[screenKey].classList.remove("hidden");
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
        showFinalResults();
        return;
    }

    questionCount++;
    feedbackPanel.classList.add("hidden");
    optionsContainer.innerHTML = "Searching the archives...";
    
    document.getElementById("progress").textContent = `Question ${questionCount}/${totalQuestions}`;
    document.getElementById("score").textContent = `Score: ${correctCount}`;

    // Logic for Question Types
    const type = Math.random() < 0.5 ? 'A' : 'B';
    const correctPhone = phones[Math.floor(Math.random() * phones.length)];
    
    // Type A: 4 options | Type B: 3 options
    const distractorCount = (type === 'A') ? 3 : 2;
    
    const distractors = phones
        .filter(p => p.model !== correctPhone.model)
        .sort(() => 0.5 - Math.random())
        .slice(0, distractorCount);

    const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());
    
    displayQuestion(type, correctPhone, options);
}

async function displayQuestion(type, correct, options) {
    optionsContainer.innerHTML = "";
    
    if (type === 'A') {
        // TYPE A: Big Image, 4 Text Buttons
        document.getElementById("question-text").textContent = "Identify this classic Nokia:";
        const imgUrl = await fetchImage(correct.wiki);
        optionsContainer.innerHTML = `<img src="${imgUrl}" class="phone-img-large">`;
        
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = opt.model;
            btn.onclick = () => handleAnswer(opt === correct, correct);
            optionsContainer.appendChild(btn);
        });
    } else {
        // TYPE B: Fact Text, 3 Small Images
        document.getElementById("question-text").textContent = `Which phone was known for: "${correct.fact}"?`;
        const grid = document.createElement("div");
        grid.className = "image-options-grid";
        
        for (let opt of options) {
            const imgUrl = await fetchImage(opt.wiki);
            const card = document.createElement("div");
            card.className = "img-option-card";
            card.innerHTML = `<img src="${imgUrl}" class="phone-img-small">`;
            card.onclick = () => handleAnswer(opt === correct, correct);
            grid.appendChild(card);
        }
        optionsContainer.appendChild(grid);
    }
}

function handleAnswer(isCorrect, phone) {
    if (feedbackPanel.classList.contains("hidden")) { // Prevent double clicks
        if (isCorrect) correctCount++;
        
        const feedbackContent = document.getElementById("feedback-content");
        feedbackContent.innerHTML = isCorrect ? 
            `<h2 style="color:var(--success)">✓ Correct!</h2>` : 
            `<h2 style="color:var(--error)">✗ Wrong</h2>`;
        feedbackContent.innerHTML += `<p>That's the <strong>${phone.model}</strong> (${phone.year}).</p>`;
        
        feedbackPanel.classList.remove("hidden");
        // Disable option clicks after answering
        optionsContainer.style.pointerEvents = "none";
    }
}

function showFinalResults() {
    switchScreen('result');
    document.getElementById("final-stats").innerHTML = `You got ${correctCount} out of ${totalQuestions}`;
    let msg = correctCount === 5 ? "👑 Absolute Legend!" : "📱 Pretty good, Millennial!";
    document.getElementById("rank-message").textContent = msg;
}

async function fetchImage(wikiPage) {
    try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${wikiPage}&prop=pageimages&pithumbsize=300&format=json&origin=*`);
        const data = await res.json();
        const page = Object.values(data.query.pages)[0];
        return page.thumbnail ? page.thumbnail.source : "https://via.placeholder.com/150?text=No+Image";
    } catch { return "https://via.placeholder.com/150?text=Error"; }
}
