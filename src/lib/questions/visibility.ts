import { QUESTIONS } from "@/lib/questions/data";
import type { AnswerValue, Question, StoredAnswer } from "@/lib/types";

type AnswerLookup = Record<string, AnswerValue> | StoredAnswer[] | Map<string, AnswerValue>;

function readAnswer(answers: AnswerLookup, questionId: string): AnswerValue | undefined {
  if (answers instanceof Map) return answers.get(questionId);
  if (Array.isArray(answers)) return answers.find((item) => item.questionId === questionId)?.value;
  return answers[questionId];
}

export function isQuestionVisible(question: Question, answers: AnswerLookup) {
  if (!question.visibleWhen) return true;
  const value = readAnswer(answers, question.visibleWhen.questionId);
  if (!value || value.kind !== "single") return false;
  return question.visibleWhen.optionIds.includes(value.optionId);
}

export function visibleQuestions(answers: AnswerLookup) {
  return QUESTIONS.filter((question) => isQuestionVisible(question, answers));
}

export function answersInScope(answers: StoredAnswer[]) {
  const visibleIds = new Set(visibleQuestions(answers).map((question) => question.id));
  return answers.filter((answer) => visibleIds.has(answer.questionId));
}
