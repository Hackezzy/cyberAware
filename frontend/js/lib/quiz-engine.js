/**
 * Reusable multiple-choice quiz engine — ported from src/lib/quiz-engine.js.
 *
 * The original mixed Tailwind utility-class strings directly into this
 * file's DOM-manipulation code, unlike every other lib file (which was
 * pure logic with zero styling concerns) — so this port isn't a plain
 * copy like the others. Every class name below is real CSS now, defined
 * in frontend/css/components.css, but the logic itself — the state
 * machine, the scoring, the focus management, the accessibility
 * markers — is unchanged.
 *
 * Operates on a fixed "shell" of expected element IDs already present in
 * the page (see any frontend/quizzes/*.html for the markup contract). A
 * new quiz page only needs to copy that shell, write its own question
 * JSON, and call createQuiz({ root, questions, itemId }).
 */

import { markCompleted } from "./progress-store.js";

/** @typedef {{ id: string, text: string }} QuizOption */
/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} question
 * @property {QuizOption[]} options
 * @property {string} correctOptionId
 * @property {string} explanation
 */

function scoreMessage(score, total) {
  const pct = score / total;
  if (pct === 1) return "Perfect score — you caught every red flag.";
  if (pct >= 0.6) return "Good work — review the explanations above for anything you missed.";
  return "Worth another look — try again after re-reading the explanations.";
}

/**
 * @param {{ root: HTMLElement, questions: QuizQuestion[], itemId?: string }} config
 */
export function createQuiz({ root, questions, itemId }) {
  const progressEl = root.querySelector("#quiz-progress");
  const scoreEl = root.querySelector("#quiz-score");
  const progressBarEl = root.querySelector("#progress-bar");
  const questionCardEl = root.querySelector("#question-card");
  const questionTextEl = root.querySelector("#question-text");
  const optionsFieldsetEl = root.querySelector("#options-fieldset");
  const submitBtn = root.querySelector("#submit-answer");
  const explanationPanelEl = root.querySelector("#explanation-panel");
  const explanationResultEl = root.querySelector("#explanation-result");
  const explanationTextEl = root.querySelector("#explanation-text");
  const nextBtn = root.querySelector("#next-question");
  const resultsPanelEl = root.querySelector("#results-panel");
  const resultsScoreEl = root.querySelector("#results-score");
  const resultsMessageEl = root.querySelector("#results-message");
  const retryBtn = root.querySelector("#retry-quiz");

  let currentIndex = 0;
  let score = 0;
  let answered = false;

  function renderQuestion() {
    const question = questions[currentIndex];
    answered = false;

    progressEl.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    scoreEl.textContent = `Score: ${score}`;
    progressBarEl.style.width = `${(currentIndex / questions.length) * 100}%`;
    progressBarEl.parentElement?.setAttribute("role", "progressbar");
    progressBarEl.parentElement?.setAttribute("aria-labelledby", "quiz-progress");
    progressBarEl.parentElement?.setAttribute("aria-valuemin", "0");
    progressBarEl.parentElement?.setAttribute("aria-valuemax", String(questions.length));
    progressBarEl.parentElement?.setAttribute("aria-valuenow", String(currentIndex));

    questionTextEl.textContent = question.question;
    questionTextEl.setAttribute("tabindex", "-1");

    optionsFieldsetEl.innerHTML = "";
    question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      label.dataset.optionId = option.id;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "option";
      input.value = option.id;
      input.className = "quiz-option-radio";
      input.addEventListener("change", updateSubmitState);

      const span = document.createElement("span");
      span.className = "quiz-option-text";
      span.textContent = option.text;

      // Populated on submit — never rely on color alone (WCAG 1.4.1) to show
      // which option was correct and which was picked.
      const marker = document.createElement("span");
      marker.className = "quiz-option-marker";
      marker.dataset.marker = "true";

      label.append(input, span, marker);
      optionsFieldsetEl.appendChild(label);
    });

    submitBtn.disabled = true;
    submitBtn.hidden = false;
    explanationPanelEl.hidden = true;
    questionCardEl.hidden = false;
    resultsPanelEl.hidden = true;

    questionTextEl.focus();
  }

  function updateSubmitState() {
    const hasSelection = Boolean(optionsFieldsetEl.querySelector("input:checked"));
    submitBtn.disabled = !hasSelection;
  }

  function submitAnswer() {
    if (answered) return;
    const selected = optionsFieldsetEl.querySelector("input:checked");
    if (!selected) return;

    const question = questions[currentIndex];
    const isCorrect = selected.value === question.correctOptionId;
    answered = true;
    if (isCorrect) score += 1;

    // Lock in the answer: disable every option so it can't be changed after
    // submitting, and mark the chosen one plus (if wrong) the actually
    // correct one, so the lesson lands even on a miss.
    optionsFieldsetEl.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
      const label = input.closest("label");
      const marker = label.querySelector("[data-marker]");
      if (input.value === question.correctOptionId) {
        label.className = "quiz-option--correct";
        marker.textContent = "✓ Correct answer";
        marker.className = "quiz-option-marker quiz-option-marker--correct";
      } else if (input.value === selected.value) {
        label.className = "quiz-option--incorrect";
        marker.textContent = "✗ Your answer";
        marker.className = "quiz-option-marker quiz-option-marker--incorrect";
      } else {
        label.className = "quiz-option--neutral";
      }
    });

    submitBtn.hidden = true;
    scoreEl.textContent = `Score: ${score}`;

    explanationResultEl.textContent = isCorrect ? "Correct!" : "Not quite.";
    explanationPanelEl.className = isCorrect ? "explanation-panel explanation-panel--correct" : "explanation-panel explanation-panel--incorrect";
    explanationResultEl.className = isCorrect ? "explanation-result explanation-result--correct" : "explanation-result explanation-result--incorrect";
    explanationTextEl.textContent = question.explanation;
    explanationPanelEl.hidden = false;

    nextBtn.textContent = currentIndex === questions.length - 1 ? "See Results" : "Next Question";
    nextBtn.focus();
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    progressBarEl.style.width = "100%";
    questionCardEl.hidden = true;
    resultsPanelEl.hidden = false;
    resultsScoreEl.textContent = `${score} / ${questions.length}`;
    resultsMessageEl.textContent = scoreMessage(score, questions.length);
    resultsPanelEl.querySelector("h2")?.setAttribute("tabindex", "-1");
    resultsPanelEl.querySelector("h2")?.focus();

    if (itemId) {
      markCompleted(itemId, { score, total: questions.length });
    }
  }

  function retry() {
    currentIndex = 0;
    score = 0;
    renderQuestion();
  }

  submitBtn.addEventListener("click", submitAnswer);
  nextBtn.addEventListener("click", goNext);
  retryBtn.addEventListener("click", retry);

  renderQuestion();
}
