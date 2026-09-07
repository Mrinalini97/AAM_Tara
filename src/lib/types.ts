export type Dimension =
  | "core_values"
  | "life_priorities"
  | "relationship_expectations"
  | "family_marriage"
  | "money"
  | "career_lifestyle"
  | "children_parenting"
  | "communication_conflict"
  | "non_negotiables";

export type QuestionType =
  | "single_select"
  | "multi_select"
  | "ranking"
  | "tradeoff"
  | "scenario"
  | "importance_scale"
  | "reflection";

export type ImportanceLevel =
  | "non_negotiable"
  | "important_flexible"
  | "not_particularly_important";

export interface QuestionOption {
  id: string;
  label: string;
  tags: string[];
}

export interface ImportanceItem {
  id: string;
  label: string;
  tags: Record<ImportanceLevel, string[]>;
}

export interface Question {
  id: string;
  dimension: Dimension;
  sectionTitle: string;
  question: string;
  helper?: string;
  type: QuestionType;
  options?: QuestionOption[];
  items?: ImportanceItem[];
  maxSelect?: number;
  minSelect?: number;
  rankCount?: number;
  required?: boolean;
}

export type AnswerValue =
  | { kind: "single"; optionId: string }
  | { kind: "multi"; optionIds: string[] }
  | { kind: "ranking"; orderedIds: string[] }
  | { kind: "text"; text: string }
  | { kind: "importance"; ratings: Record<string, ImportanceLevel> };

export interface StoredAnswer {
  questionId: string;
  value: AnswerValue;
  tags: string[];
}

export interface ThemeCard {
  id: string;
  title: string;
  description: string;
}

export interface ExpectationSummary {
  area: string;
  summary: string;
}

export interface NonNegotiableItem {
  label: string;
  note?: string;
}

export interface SelfReport {
  orientation: string;
  themes: ThemeCard[];
  expectations: ExpectationSummary[];
  strengths: string[];
  reflections: string[];
  nonNegotiables: NonNegotiableItem[];
  selfQuestions: string[];
}

export interface ComparisonInsight {
  dimension: string;
  title: string;
  text: string;
}

export interface ComparisonContent {
  alignments: ComparisonInsight[];
  differences: ComparisonInsight[];
  explore: ComparisonInsight[];
}

export type ConversationStatus = "discussed" | "need_to_discuss" | "not_relevant";

export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  non_negotiable: "Non-negotiable",
  important_flexible: "Important but flexible",
  not_particularly_important: "Not particularly important",
};
