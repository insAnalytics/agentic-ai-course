import { useState } from "react";
import LinkedText from "./LinkedText";

interface Question {
  question: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  /** Shown after answering — why the correct answer is right, ideally also why the common wrong answer is tempting. */
  explanation: string;
}

interface QuizGroupProps {
  questions: Question[];
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuizGroup({ questions }: QuizGroupProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === current?.correctIndex;
  const isLast = index === questions.length - 1;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    if (i === current.correctIndex) setCorrectCount((c) => c + 1);
  };

  const advance = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  if (done) {
    const allCorrect = correctCount === questions.length;
    return (
      <div className="card my-6 overflow-hidden">
        <div className="bg-[var(--color-quiz)] px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase">
          Quiz complete
        </div>
        <div className="p-5 text-center">
          <p
            className={`m-0 text-2xl font-extrabold ${allCorrect ? "text-[var(--color-success)]" : "text-[var(--color-quiz-dark)]"}`}
          >
            {correctCount} / {questions.length}
          </p>
          <p className="mt-1 mb-0 text-sm text-[var(--color-ink-soft)]">
            {allCorrect ? "All correct — nice work." : "correct"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-quiz)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Check your understanding</span>
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  i < index || (i === index && answered)
                    ? "white"
                    : i === index
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
          <span className="ml-1 text-xs font-medium text-white/80">
            {index + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="mt-0 mb-3 font-medium text-[var(--color-ink)]">{current.question}</p>
        <div className="flex flex-col gap-2">
          {current.options.map((option, i) => {
            const state = !answered
              ? "unanswered"
              : i === current.correctIndex
                ? "correct"
                : i === selected
                  ? "incorrect"
                  : "unanswered";
            const stateClasses =
              state === "correct"
                ? "bg-[var(--color-success-bg)] ring-1 ring-[var(--color-success)]"
                : state === "incorrect"
                  ? "bg-[var(--color-danger-bg)] ring-1 ring-[var(--color-danger)]"
                  : "bg-[var(--color-quiz-light)] ring-1 ring-transparent hover:ring-[var(--color-quiz)]";
            const badgeClasses =
              state === "correct"
                ? "bg-[var(--color-success)] text-white"
                : state === "incorrect"
                  ? "bg-[var(--color-danger)] text-white"
                  : "bg-[var(--color-quiz)] text-white";
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm disabled:cursor-default ${stateClasses}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${badgeClasses}`}
                >
                  {LETTERS[i]}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-3 rounded-md p-3 text-sm ${
              isCorrect ? "bg-[var(--color-success-bg)]" : "bg-[var(--color-danger-bg)]"
            }`}
          >
            <strong className={isCorrect ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
              {isCorrect ? "Correct." : "Not quite."}
            </strong>{" "}
            <span className="text-[var(--color-ink)]">
              <LinkedText text={current.explanation} />
            </span>
          </div>
        )}

        {answered && (
          <button
            onClick={advance}
            className="mt-3 rounded-md bg-[var(--color-quiz)] px-4 py-1.5 text-sm font-medium text-white"
          >
            {isLast ? "Finish" : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
