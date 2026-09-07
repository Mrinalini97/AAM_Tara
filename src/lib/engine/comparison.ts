import type { ComparisonContent } from "@/lib/types";
import { has } from "@/lib/engine/tags-from-answers";
import { TAGS as T } from "@/lib/engine/tags";

type Counts = Record<string, number>;

function both(a: Counts, b: Counts, tag: string) {
  return has(a, tag) && has(b, tag);
}
function split(a: Counts, b: Counts, left: string, right: string) {
  return (has(a, left) && has(b, right)) || (has(a, right) && has(b, left));
}

export interface ConversationPromptDraft {
  category: string;
  title: string;
  question: string;
  sortOrder: number;
}

export function generateComparison(a: Counts, b: Counts): ComparisonContent {
  const alignments: ComparisonContent["alignments"] = [];
  const differences: ComparisonContent["differences"] = [];
  const explore: ComparisonContent["explore"] = [];

  if (both(a, b, T.intellectual_high) || both(a, b, T.curiosity_shared)) {
    alignments.push({
      dimension: "intellectual",
      title: "Intellectual companionship",
      text: "You both appear to value being able to think together — curiosity, conversation, and mental engagement as part of closeness, not only as a pastime.",
    });
  }
  if (both(a, b, T.intellectual_moderate) && !has(a, T.intellectual_high) && !has(b, T.intellectual_high)) {
    alignments.push({
      dimension: "intellectual",
      title: "A mixed intellectual life",
      text: "Neither of you treats ideas as the whole of a partnership, and both of you still seem to want some substance in conversation. That can be a comfortable middle — if you say so out loud.",
    });
  }
  if (both(a, b, T.career_high) || both(a, b, T.dual_career_supportive)) {
    alignments.push({
      dimension: "career",
      title: "Career and ambition",
      text: "Both of you place real importance on work and appear prepared to take a partner’s professional life seriously.",
    });
  }
  if (both(a, b, T.emotional_connection_high) || both(a, b, T.intimacy_high)) {
    alignments.push({
      dimension: "connection",
      title: "Emotional closeness",
      text: "You both appear to value emotional closeness as part of a long-term relationship, not as an optional extra.",
    });
  }
  if (both(a, b, T.communication_open) || both(a, b, T.conflict_direct)) {
    alignments.push({
      dimension: "communication",
      title: "Willingness to talk",
      text: "Both of you show a preference for naming things rather than leaving them implied.",
    });
  }
  if (both(a, b, T.lifestyle_active) || both(a, b, T.travel_high)) {
    alignments.push({
      dimension: "lifestyle",
      title: "Lifestyle",
      text: "You both appear to value an outward-facing life — movement, people, or travel — as part of ordinary time together.",
    });
  }
  if (both(a, b, T.lifestyle_quiet)) {
    alignments.push({
      dimension: "lifestyle",
      title: "Pace of life",
      text: "You both seem to want quieter rhythms. A shared life may feel more like a refuge than a performance.",
    });
  }
  if (both(a, b, T.family_central) || both(a, b, T.parents_involved)) {
    alignments.push({
      dimension: "family",
      title: "Family as part of the picture",
      text: "Family involvement is meaningful to both of you. You may still need to talk about whose family, how often, and who decides.",
    });
  }
  if (both(a, b, T.children_desired)) {
    alignments.push({
      dimension: "children",
      title: "Children",
      text: "Both of you have indicated that children are part of the future you are considering. The remaining questions are about timing, care, and the kind of parents you hope to be.",
    });
  }
  if (both(a, b, T.children_not_desired)) {
    alignments.push({
      dimension: "children",
      title: "A life without children",
      text: "Both of you have indicated that you do not want children, or do not see parenting as a defining project. That is still worth confirming in conversation so it is not assumed.",
    });
  }

  if (split(a, b, T.intellectual_high, T.intellectual_low)) {
    differences.push({
      dimension: "intellectual",
      title: "Intellectual compatibility",
      text: "One of you appears to need a partner to think with; the other places less weight on ideas as a form of closeness. Neither stance is a failing. It is a difference in what daily intimacy is for.",
    });
    explore.push({
      dimension: "intellectual",
      title: "How you spend the mind of the relationship",
      text: "This does not necessarily indicate incompatibility. It may simply be an important conversation: how much analysis, debate, or shared learning you each want in an ordinary week.",
    });
  }
  if (split(a, b, T.debate_comfortable, T.debate_gentle) || split(a, b, T.debate_comfortable, T.conflict_avoidant)) {
    differences.push({
      dimension: "intellectual",
      title: "Disagreement about ideas",
      text: "You may not want the same temperature of debate. One of you can treat argument as respect; the other may experience it as strain.",
    });
  }
  if (split(a, b, T.family_central, T.couple_autonomy_high) || split(a, b, T.parents_involved, T.parents_separate)) {
    differences.push({
      dimension: "family",
      title: "Family involvement",
      text: "One of you appears to prefer relatively independent decision-making as a couple, while the other places greater importance on family involvement. Neither stance is a verdict.",
    });
  }
  if (split(a, b, T.living_with_family, T.living_independent) || split(a, b, T.living_nearby_family, T.living_independent)) {
    differences.push({
      dimension: "living",
      title: "Living arrangements",
      text: "You have different expectations around living independently versus living with or close to family.",
    });
    explore.push({
      dimension: "living",
      title: "Living arrangements",
      text: "This does not necessarily indicate incompatibility. It may simply be an important conversation to have — including for how long, with which family, and what privacy would need to look like.",
    });
  }
  if (split(a, b, T.relocation_flexible, T.relocation_reluctant)) {
    differences.push({
      dimension: "location",
      title: "Relocation",
      text: "You differ on how readily you would move for work or opportunity. This often stays abstract until a real offer appears.",
    });
  }
  if (split(a, b, T.children_desired, T.children_not_desired)) {
    differences.push({
      dimension: "children",
      title: "Children",
      text: "Your answers point in different directions about whether children are part of the life you want. This is a difference to treat with care and honesty.",
    });
    explore.push({
      dimension: "children",
      title: "Children",
      text: "A clear, unhurried conversation matters more than finding a clever middle too quickly.",
    });
  } else if (has(a, T.children_uncertain) || has(b, T.children_uncertain)) {
    explore.push({
      dimension: "children",
      title: "Uncertainty about children",
      text: "At least one of you is still undecided about children. Uncertainty can be honest; it becomes difficult when the other person hears it as a quiet yes or a quiet no.",
    });
  }
  if (split(a, b, T.finances_joint, T.finances_independent)) {
    differences.push({
      dimension: "money",
      title: "Money",
      text: "You appear to differ on how jointly money should be held. Both can be responsible — they are different pictures of trust and autonomy.",
    });
  }
  if (split(a, b, T.conflict_direct, T.conflict_avoidant) || split(a, b, T.conflict_direct, T.conflict_indirect)) {
    differences.push({
      dimension: "conflict",
      title: "How you handle disagreement",
      text: "You may not reach for the same move in conflict: one of you is more likely to name it directly, the other to soften, delay, or take space.",
    });
  }
  if (has(a, T.uncertainty_present) || has(b, T.uncertainty_present)) {
    explore.push({
      dimension: "openness",
      title: "Answers that are still forming",
      text: "Some responses suggest that at least one of you is still thinking. That is a reason to keep talking, rather than treating this report as a finished map.",
    });
  }

  if (alignments.length === 0) {
    alignments.push({
      dimension: "general",
      title: "A shared willingness to look",
      text: "Your profiles do not collapse into one obvious shared theme. What you do share is that both of you completed this reflection — a starting point for conversation rather than a conclusion.",
    });
  }
  if (differences.length === 0) {
    differences.push({
      dimension: "general",
      title: "Fewer sharp contrasts",
      text: "On the dimensions this reflection covers, you did not land in strongly opposite places. Similarity can still hide assumptions that need words.",
    });
  }
  if (explore.length === 0) {
    explore.push({
      dimension: "conversation",
      title: "What this does not settle",
      text: "Even close alignment on a questionnaire is not a substitute for talking about money, family, children, ideas, and conflict in the specific lives you actually lead.",
    });
  }

  return { alignments, differences, explore };
}

export function generateConversationPrompts(a: Counts, b: Counts): ConversationPromptDraft[] {
  const prompts: ConversationPromptDraft[] = [
    { category: "Family", title: "Family", question: "How involved would you ideally want both families to be in major decisions?", sortOrder: 1 },
    { category: "Career", title: "Career", question: "If one person’s career requires relocation, how would you approach the decision?", sortOrder: 2 },
    { category: "Money", title: "Money", question: "How do you envision handling shared expenses, savings, and financial independence?", sortOrder: 3 },
    { category: "Children", title: "Children", question: "What responsibilities would you expect each partner to take on if you have children — or how would you want to honour a shared decision not to?", sortOrder: 4 },
    { category: "Conflict", title: "Conflict", question: "When you disagree strongly, what does a healthy resolution look like to you?", sortOrder: 5 },
    { category: "Intellectual life", title: "Intellectual compatibility", question: "What does it mean to you to be able to think together? How much conversation, curiosity, or debate do you want in an ordinary week?", sortOrder: 6 },
  ];

  if (split(a, b, T.living_with_family, T.living_independent) || split(a, b, T.living_nearby_family, T.living_independent)) {
    prompts.push({
      category: "Home",
      title: "Home",
      question: "In the first years of a life together, where would you want to live, and what would make that feel respectful to both of you?",
      sortOrder: 7,
    });
  }
  if (has(a, T.tradition_high) || has(b, T.tradition_high) || has(a, T.tradition_flexible) || has(b, T.tradition_flexible)) {
    prompts.push({
      category: "Tradition",
      title: "Tradition",
      question: "Which rituals, festivals, or family customs would you want to keep, adapt, or set down — and how would you handle disappointment from relatives?",
      sortOrder: 8,
    });
  }
  return prompts;
}
