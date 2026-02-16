let phones = [];
let currentQuestion = null;
let questionCount = 0;
let correctCount = 0;
const totalQuestions = 5;

const ranks = [
  { min: 5, messages: ["🎉 True Millennial! You know your Nokias!"] },
  { min: 3, messages: ["👍 Retro Fan! Not bad, but could remember more!"] },
  { min: 0, messages: ["😅 Time Traveler? You might have missed the Nokia era!"] }
];

// Screen elements
const menu = document.getElementById("menu");
const infoScreen = document.getElementById("info-screen");
const supportScreen = document.getElementById("support-screen");
const quizScreen = document.getElementById("quiz-screen");

const playBtn = document.getElementById("play-btn");
const infoBtn = document.getElementById("info-btn");
const supportBtn = document.getElementById("support-btn");
const infoBack = document.getElementById("info-back");
const supportBack = document.getElementById("support-back");

playBtn.addEventListener("click", startQuiz);
infoBtn.addEventListener("click", () => switchScreen(infoScreen));
supportBtn.addEventListener("click", () => switchScreen(supportScreen));
infoBack.addEventListener("click", () => switchScreen(menu));
supportBack.addEventListener("click", () => switchScreen(menu));

function switchScreen(screen) {
  menu.classList.add("hidden");
  infoScreen.classList.add("hidden");
  supportScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

async function startQuiz() {
  if (phones.length === 0) {
    const res = await fetch("phones.json");
    phones = await res.json();
  }

  questionCount = 0;
  correctCount = 0;
  switchScreen(quizScreen);
  nextQuestion();
}

function nextQuestion() {
  if (questionCount >= totalQuestions) {
    showSessionResult();
    return;
  }

  questionCount++;
  const type = Math.random() < 0.5 ? 0 : 1;
  const correctPhone = phones[Math.floor(Math.random() * phones.length)];
  const distractors = phones
    .filter(p => p.model !== correctPhone.model)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  const options = [...distractors, correctPhone].sort(() => 0.5 - Math.random());

  currentQuestion = { type, correct: correctPhone, options };
  displayQuestion(currentQuestion);
}

function displayQuestion(question) {
  const container = document.getElementById("options");
  container.innerHTML = "";
  document.getElementById("result").innerHTML = "";

  if (question.type === 0) {
    document.getElementById("question-text").textContent = "Which phone is this?";
    fetchImage(question.correct.wiki).then(imgUrl => {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.className = "phone-img";
      container.appendChild(img);
      question.options.forEach(opt => createOptionButton(opt.model, opt === question.correct));
    });
  } else {
    document.getElementById("question-text").textContent =
      `${question.correct.fact} (Year: ${question.correct.year})`;
    question.options.forEach(opt => {
      fetchImage(opt.wiki).then(imgUrl => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `<img src="${imgUrl}" class="phone-img">`;
        btn.addEventListener("click", () => checkAnswer(opt === question.correct, question.correct));
        container.appendChild(btn);
      });
    });
  }

  if (question.type === 0) {
    question.options.forEach(opt => createOptionButton(opt.model, opt === question.correct));
  }
}

function createOptionButton(text, isCorrect) {
  const container = document.getElementById("options");
  const btn = document.createElement("button");
  btn.className = "option-btn";
  btn.textContent = text;
  btn.addEventListener("click", () => checkAnswer(isCorrect, currentQuestion.correct));
  container.appendChild(btn);
}

function checkAnswer(isCorrect, correctPhone) {
  if (isCorrect) correctCount++;
  const result = document.getElementById("result");

  if (isCorrect) {
    result.innerHTML = `✅ Correct! ${correctPhone.model} — Released ${correctPhone.year}`;
  } else {
    result.innerHTML = `❌ Wrong! Correct answer: ${correctPhone.model} — Released ${correctPhone.year}`;
  }

  setTimeout(nextQuestion, 2000);
}

function showSessionResult() {
  const container = document.getElementById("options");
  container.innerHTML = "";
  document.getElementById("question-text").textContent = "Session Complete!";
  const resultDiv = document.getElementById("result");

  let rankMessage = "You finished!";
  for (const rank of ranks) {
    if (correctCount >= rank.min) {
      rankMessage = rank.messages[Math.floor(Math.random() * rank.messages.length)];
      break;
    }
  }

  resultDiv.innerHTML = `You got ${correctCount} / ${totalQuestions} correct.<br>${rankMessage}<br><br>`;

  // Show buttons: Play Again or Back to Menu
  const playAgainBtn = document.createElement("button");
  playAgainBtn.className = "menu-btn";
  playAgainBtn.textContent = "Play Again";
  playAgainBtn.addEventListener("click", startQuiz);
  resultDiv.appendChild(playAgainBtn);

  const menuBtn = document.createElement("button");
  menuBtn.className = "menu-btn";
  menuBtn.textContent = "Back to Menu";
  menuBtn.addEventListener("click", () => switchScreen(menu));
  resultDiv.appendChild(menuBtn);
}

async function fetchImage(wikiPage) {
  try {
    const url =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query" +
      "&titles=" + wikiPage +
      "&prop=pageimages" +
      "&pithumbsize=300" +
      "&format=json" +
      "&origin=*";

    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];

    return page.thumbnail ? page.thumbnail.source : "";
  } catch {
    return "";
  }
}