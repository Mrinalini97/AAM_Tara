import { QUESTIONS, QUESTION_BY_ID } from "@/lib/questions/data";
import type { AnswerValue, ImportanceLevel, StoredAnswer } from "@/lib/types";

export function extractTags(questionId: string, value: AnswerValue): string[] {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return [];
  const tags: string[] = [];

  if (value.kind === "single") {
    const option = question.options?.find((o) => o.id === value.optionId);
    if (option) tags.push(...option.tags);
  }
  if (value.kind === "multi") {
    for (const id of value.optionIds) {
      const option = question.options?.find((o) => o.id === id);
      if (option) tags.push(...option.tags);
    }
  }
  if (value.kind === "ranking") {
    value.orderedIds.forEach((id, index) => {
      const option = question.options?.find((o) => o.id === id);
      if (!option) return;
      const weight = Math.max(question.rankCount ?? 3, 1) - index;
      for (let i = 0; i < weight; i += 1) tags.push(...option.tags);
    });
  }
  if (value.kind === "importance" && question.items) {
    for (const item of question.items) {
      const level = value.ratings[item.id] as ImportanceLevel | undefined;
      if (!level) continue;
      tags.push(...item.tags[level]);
      if (level === "non_negotiable") tags.push(`nn_item:${item.id}`);
    }
  }
  return tags;
}

export function countTags(answers: StoredAnswer[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const answer of answers) {
    for (const tag of answer.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export function has(counts: Record<string, number>, tag: string, min = 1) {
  return (counts[tag] ?? 0) >= min;
}

export function isAnswerComplete(questionId: string, value: AnswerValue | undefined) {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return false;
  if (!question.required && (!value || (value.kind === "text" && !value.text.trim()))) return true;
  if (!value) return false;
  if (value.kind === "single") return Boolean(value.optionId);
  if (value.kind === "multi") {
    const min = question.minSelect ?? 1;
    const max = question.maxSelect ?? value.optionIds.length;
    return value.optionIds.length >= min && value.optionIds.length <= max;
  }
  if (value.kind === "ranking") {
    const need = question.rankCount ?? question.options?.length ?? 0;
    return value.orderedIds.length >= need;
  }
  if (value.kind === "importance") {
    return Boolean(question.items?.every((item) => value.ratings[item.id]));
  }
  if (value.kind === "text") return !question.required || value.text.trim().length > 0;
  return false;
}

export { QUESTIONS };
