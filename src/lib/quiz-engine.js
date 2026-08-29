/**
 * Reusable multiple-choice quiz engine.
 *
 * Operates on a fixed "shell" of expected element IDs already present in the
 * page (see any src/pages/quizzes/*.astro for the markup contract). A new
 * quiz page only needs to copy that shell, write its own question JSON, and
 * call createQuiz({ root, questions }) — no per-quiz JS required.
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

const OPTION_LABEL_CLASSES =
  "flex cursor-pointer items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-bg) p-3 transition-colors has-[:checked]:border-(--color-accent) has-[:checked]:bg-(--color-accent)/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--color-accent)";

const OPTION_LABEL_CORRECT_CLASSES =
  "flex items-center gap-3 rounded-lg border-2 border-(--color-safe) bg-(--color-safe)/10 p-3";
const OPTION_LABEL_INCORRECT_CLASSES =
  "flex items-center gap-3 rounded-lg border-2 border-(--color-danger) bg-(--color-danger)/10 p-3";
const OPTION_LABEL_NEUTRAL_CLASSES =
  "flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-bg) p-3 opacity-70";

function scoreMessage(score, total) {
  const pct = score / total;
  if (pct === 1) return "Perfect score — you caught every red flag.";
  if (pct >= 0.6) return "Good work — review the explanations above for anything you missed.";
  return "Worth another look — try again after re-reading the explanations.";
}

/**
 * @param {{ root: HTMLElement, questions: QuizQuestion[], itemId?: string }} config
 *   itemId, if given, is a src/data/curriculum.js id — completion (with the
 *   final score) is recorded via progress-store.js when the quiz is finished.
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
      label.className = OPTION_LABEL_CLASSES;
      label.dataset.optionId = option.id;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "option";
      input.value = option.id;
      input.className = "h-4 w-4 accent-(--color-accent)";
      input.addEventListener("change", updateSubmitState);

      const span = document.createElement("span");
      span.className = "flex-1 text-sm text-(--color-text)";
      span.textContent = option.text;

      // Populated on submit — never rely on color alone (WCAG 1.4.1) to show
      // which option was correct and which was picked.
      const marker = document.createElement("span");
      marker.className = "text-xs font-semibold";
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
        label.className = OPTION_LABEL_CORRECT_CLASSES;
        marker.textContent = "✓ Correct answer";
        marker.className = "text-xs font-semibold text-(--color-safe)";
      } else if (input.value === selected.value) {
        label.className = OPTION_LABEL_INCORRECT_CLASSES;
        marker.textContent = "✗ Your answer";
        marker.className = "text-xs font-semibold text-(--color-danger)";
      } else {
        label.className = OPTION_LABEL_NEUTRAL_CLASSES;
      }
    });

    submitBtn.hidden = true;
    scoreEl.textContent = `Score: ${score}`;

    explanationResultEl.textContent = isCorrect ? "Correct!" : "Not quite.";
    explanationPanelEl.className = isCorrect
      ? "mt-5 rounded-lg border-2 border-(--color-safe) bg-(--color-safe)/10 p-4"
      : "mt-5 rounded-lg border-2 border-(--color-danger) bg-(--color-danger)/10 p-4";
    explanationResultEl.className = isCorrect
      ? "font-semibold text-(--color-safe)"
      : "font-semibold text-(--color-danger)";
    explanationTextEl.textContent = question.explanation;
    explanationPanelEl.hidden = false;

    nextBtn.textContent =
      currentIndex === questions.length - 1 ? "See Results" : "Next Question";
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
