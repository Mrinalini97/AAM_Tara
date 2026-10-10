import { QUESTION_BY_ID } from "@/lib/questions/data";
import { IMPORTANCE_LABELS, type AnswerValue, type Question } from "@/lib/types";

function labelForOption(question: Question, optionId: string): string {
  const fromOptions = question.options?.find((o) => o.id === optionId)?.label;
  if (fromOptions) return fromOptions;
  const fromItems = question.items?.find((i) => i.id === optionId)?.label;
  return fromItems ?? optionId;
}

export function formatAnswerValue(questionId: string, value: AnswerValue | undefined): string {
  if (!value) return "—";
  const question = QUESTION_BY_ID[questionId];
  if (!question) return JSON.stringify(value);

  switch (value.kind) {
    case "single":
      return labelForOption(question, value.optionId);
    case "multi":
      return value.optionIds.map((id) => labelForOption(question, id)).join("; ");
    case "ranking":
      return value.orderedIds
        .map((id, i) => `${i + 1}. ${labelForOption(question, id)}`)
        .join(" · ");
    case "text":
      return value.text.trim() || "—";
    case "importance":
      return Object.entries(value.ratings)
        .map(([itemId, level]) => `${labelForOption(question, itemId)}: ${IMPORTANCE_LABELS[level]}`)
        .join("; ");
    default:
      return "—";
  }
}
