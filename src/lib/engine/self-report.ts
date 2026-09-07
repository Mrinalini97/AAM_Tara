import type { SelfReport, StoredAnswer } from "@/lib/types";
import { countTags, has } from "@/lib/engine/tags-from-answers";
import { TAGS as T } from "@/lib/engine/tags";
import { QUESTION_BY_ID } from "@/lib/questions/data";
import { IMPORTANCE_LABELS, type ImportanceLevel } from "@/lib/types";

interface Rule {
  id: string;
  all?: string[];
  any?: string[];
  none?: string[];
  min?: [string, number];
  text: string;
}

function matches(counts: Record<string, number>, rule: Rule) {
  if (rule.all && !rule.all.every((tag) => has(counts, tag))) return false;
  if (rule.any && !rule.any.some((tag) => has(counts, tag))) return false;
  if (rule.none && rule.none.some((tag) => has(counts, tag))) return false;
  if (rule.min && !has(counts, rule.min[0], rule.min[1])) return false;
  return true;
}

function pick(counts: Record<string, number>, rules: Rule[], limit: number) {
  const out: string[] = [];
  for (const rule of rules) {
    if (matches(counts, rule)) out.push(rule.text);
    if (out.length >= limit) break;
  }
  return out;
}

const ORIENTATION_RULES: Rule[] = [
  {
    id: "mind_and_heart",
    all: [T.intellectual_high, T.emotional_connection_high],
    text: "You appear to want a partnership that is both emotionally close and intellectually alive — someone to feel with and to think with. Companionship, for you, may include conversation that actually goes somewhere.",
  },
  {
    id: "close_and_free",
    all: [T.emotional_connection_high, T.independence_high],
    text: "You appear to value emotional closeness while also placing considerable importance on maintaining individual independence. A partnership that feels intimate without becoming fused may fit you better than one that asks you to dissolve into a single unit.",
  },
  {
    id: "family_and_couple",
    all: [T.family_central, T.couple_autonomy_high],
    text: "You seem to hold two loyalties at once: a genuine sense of family belonging, and a wish for the two of you to be a distinct couple. The work of a long-term relationship, for you, may be learning how those loyalties can coexist rather than compete.",
  },
  {
    id: "ambition_balance",
    all: [T.career_high, T.work_life_balance_high],
    text: "You take work seriously and also care about a liveable pace. You may be looking for a partner who respects ambition without treating exhaustion as a proof of love.",
  },
  {
    id: "ideas_first",
    min: [T.intellectual_high, 2],
    text: "Curiosity and being able to think together show up as a through-line. You may feel most met in a relationship where ideas, questions, and honest disagreement have a regular place — not only logistics and affection.",
  },
  {
    id: "family_first",
    min: [T.family_central, 2],
    none: [T.independence_high],
    text: "Family seems to sit near the centre of how you imagine a shared life. Belonging, continuity, and showing up for relatives are not extras in your picture of partnership — they are part of what partnership is for.",
  },
  {
    id: "autonomy_first",
    min: [T.independence_high, 2],
    none: [T.family_central],
    text: "Independence shows up as a through-line in your answers. You may be most at ease in a relationship that treats both people as whole adults with their own inner lives, friendships, and decisions.",
  },
  {
    id: "connection_first",
    min: [T.emotional_connection_high, 2],
    text: "Emotional connection appears to be a primary language of relationship for you. Being known — and being able to know someone in return — may matter as much as the practical architecture of a shared life.",
  },
  {
    id: "still_forming",
    min: [T.uncertainty_present, 2],
    text: "Several of your answers suggest you are still forming a picture of what you want. That is not a gap to hide. It is a reason to treat this process as reflection rather than a final verdict on yourself.",
  },
  {
    id: "fallback",
    any: [T.companionship_high, T.flexibility_high, T.family_balanced],
    text: "Your answers suggest a preference for a considered, adult partnership — one that can hold both practical life and inner life, without rushing to a single slogan about who you are.",
  },
];

const THEME_RULES: { id: string; title: string; any?: string[]; all?: string[]; min?: [string, number]; description: string }[] = [
  {
    id: "intellectual",
    title: "Intellectual companionship",
    any: [T.intellectual_high, T.curiosity_shared],
    description: "Being able to think together — curiosity, conversation, and mental engagement — appears to matter in how you feel close to someone.",
  },
  {
    id: "emotional_safety",
    title: "Emotional connection",
    any: [T.emotional_connection_high, T.intimacy_high],
    description: "Feeling emotionally close, and being able to speak about what is going on inside, appears to matter to you.",
  },
  {
    id: "career_growth",
    title: "Career and growth",
    any: [T.career_high, T.achievement_high, T.growth_high],
    description: "Work and personal development show up as important parts of a life you would want to share.",
  },
  {
    id: "independence",
    title: "Personal independence",
    any: [T.independence_high, T.personal_space_high, T.couple_autonomy_high],
    description: "You appear to want a partnership that leaves room for a self that is still yours.",
  },
  {
    id: "family",
    title: "Family",
    any: [T.family_central, T.parents_involved, T.living_with_family, T.living_nearby_family],
    description: "Family relationships are part of how you think about marriage, not a separate track running beside it.",
  },
  {
    id: "stability",
    title: "Stability and security",
    any: [T.stability_high, T.financial_security_high, T.saving_oriented],
    description: "A sense of steadiness — financial, practical, or emotional — appears to be something you would want a shared life to offer.",
  },
  {
    id: "balance",
    title: "A liveable pace",
    any: [T.work_life_balance_high, T.lifestyle_quiet],
    description: "You seem to care about whether a life together is sustainable, not only whether it looks successful from the outside.",
  },
  {
    id: "children",
    title: "Children",
    any: [T.children_desired, T.parenting_involved, T.parenting_shared],
    description: "Children, or the possibility of them, are part of how you imagine the future — and worth treating with clarity rather than assumption.",
  },
  {
    id: "open_talk",
    title: "Direct conversation",
    any: [T.conflict_direct, T.communication_open, T.repair_important],
    description: "You appear more willing to name tension than to let it sit unnamed.",
  },
];

const EXPECTATION_BUILDERS: { area: string; lines: Rule[] }[] = [
  {
    area: "Marriage",
    lines: [
      { id: "m1", any: [T.couple_autonomy_high], text: "You may want marriage to create a distinct household with its own decisions, even if family remains close." },
      { id: "m2", any: [T.family_central, T.parents_involved], text: "You may see marriage as joining families, not only two individuals." },
      { id: "m3", any: [T.tradition_flexible], text: "You appear open to shaping rituals and roles rather than inheriting them unchanged." },
    ],
  },
  {
    area: "Career",
    lines: [
      { id: "c1", any: [T.dual_career_supportive], text: "You appear to want a relationship in which both people’s work can be taken seriously." },
      { id: "c2", any: [T.dual_career_one_primary], text: "You may be more comfortable if one career is the primary organising fact of the household, at least in some seasons." },
      { id: "c3", any: [T.relocation_reluctant], text: "Relocation for work looks like a sensitive point — worth treating as a conversation, not a surprise." },
      { id: "c4", any: [T.work_hours_intense], text: "Intense work periods may be part of what you are asking a partner to live with." },
    ],
  },
  {
    area: "Family",
    lines: [
      { id: "f1", any: [T.parents_consulted, T.inlaws_bounded], text: "Respect for elders with a clear final say for the couple seems to be your preferred pattern." },
      { id: "f2", any: [T.living_with_family], text: "Living with family, at least for a time, is part of your picture of a workable life." },
      { id: "f3", any: [T.living_independent], text: "You appear to prefer a home that is yours, with family as visitors rather than a daily organising presence." },
    ],
  },
  {
    area: "Lifestyle",
    lines: [
      { id: "l1", any: [T.lifestyle_active, T.travel_high, T.social_life_high], text: "An active, outward-facing life — people, movement, plans — shows up in what you want to share." },
      { id: "l2", any: [T.lifestyle_quiet], text: "Quieter rhythms and a less crowded calendar appear to matter to you." },
    ],
  },
  {
    area: "Intellectual life",
    lines: [
      { id: "i1", any: [T.intellectual_high], text: "You appear to want a partner you can think with — conversation, curiosity, and mental engagement are part of closeness, not a side hobby." },
      { id: "i2", any: [T.intellectual_moderate], none: [T.intellectual_high], text: "Ideas and conversation matter, and you also seem to want room for ease that is not always analytical." },
      { id: "i3", any: [T.intellectual_low], none: [T.intellectual_high], text: "Daily kindness and shared life may matter more to you than how often you go deep on ideas." },
      { id: "i4", any: [T.debate_comfortable], text: "You seem relatively comfortable with honest disagreement about ideas, as long as it stays respectful." },
    ],
  },
  {
    area: "Money",
    lines: [
      { id: "n1", any: [T.finances_joint], text: "You may prefer a high degree of financial togetherness and visibility." },
      { id: "n2", any: [T.finances_independent, T.financial_independence], text: "You appear to value financial independence inside a partnership, not only as a couple pooling everything." },
      { id: "n3", any: [T.finances_hybrid], text: "A hybrid — shared goals plus personal money — seems closest to how you want things to work." },
      { id: "n4", any: [T.saving_oriented], text: "Saving and a cushion appear to be part of how you feel safe." },
    ],
  },
  {
    area: "Children",
    lines: [
      { id: "k1", any: [T.children_desired], none: [T.children_not_desired], text: "You have indicated that children are part of the future you are considering." },
      { id: "k2", any: [T.children_not_desired], text: "You have indicated that you do not want children, or do not see parenting as a defining project." },
      { id: "k3", any: [T.children_uncertain], text: "You are not fully decided about children. That uncertainty is itself information worth sharing early." },
      { id: "k4", any: [T.parenting_shared], text: "If there are children, you appear to want care to be genuinely shared." },
    ],
  },
];

const STRENGTH_RULES: Rule[] = [
  { id: "s1", any: [T.conflict_direct, T.communication_open], text: "You appear more willing to discuss differences than to avoid them. That can make difficult topics speakable rather than delayed." },
  { id: "s2", any: [T.repair_important], text: "You treat repair — apology, changed behaviour, a return to kindness — as part of conflict, not as optional decoration after it." },
  { id: "s3", any: [T.dual_career_supportive], text: "You seem prepared to take a partner’s work as seriously as your own." },
  { id: "s4", any: [T.intellectual_high, T.curiosity_shared], text: "You appear ready to stay curious with a partner — a resource when life gets more complicated than small talk." },
  { id: "s5", any: [T.flexibility_high], text: "You show a willingness to adapt when circumstances change, rather than needing every answer in advance." },
  { id: "s6", any: [T.support_present], text: "You appear to value showing up in difficult periods, which is often where a partnership is actually tested." },
  { id: "s7", any: [T.decisions_shared], text: "Shared decision-making shows up as a preference — a sign you want a partner, not a spectator, in the life you build." },
];

const REFLECT_RULES: Rule[] = [
  { id: "r1", all: [T.independence_high], text: "You place a high value on independence. It may be useful to reflect on how much shared decision-making you would ideally want in a marriage." },
  { id: "r2", any: [T.intellectual_high], text: "You place real weight on intellectual companionship. It may help to notice whether you mean shared curiosity, similar education, similar politics, or simply someone who enjoys a serious conversation — those are different requests." },
  { id: "r3", any: [T.family_central, T.parents_involved], text: "You want family closeness. It may help to picture a specific decision — a move, a child, a festival — and notice which loyalty you would protect first if they collided." },
  { id: "r4", any: [T.conflict_avoidant, T.conflict_indirect], text: "You may prefer not to push conflict into the open. It could be worth asking what would help you raise something important before it turns into distance." },
  { id: "r5", any: [T.uncertainty_present], text: "Some of your answers are still open. The risk is only if openness is mistaken for agreement — especially on children, location, family involvement, or intellectual life." },
  { id: "r6", any: [T.work_hours_intense, T.career_high], text: "Work takes up real space in your life. It may be worth imagining a season when a partner needed more from you." },
  { id: "r7", any: [T.children_uncertain], text: "You are not fully decided about children. Reflecting on what would need to be true for a yes, a no, or a wait can prevent two people from assuming they mean the same thing by “we’ll see.”" },
];

const SELF_QUESTIONS: Rule[] = [
  { id: "q1", any: [T.intellectual_high, T.intellectual_moderate, T.intellectual_low], text: "What does “being able to think together” actually look like in an ordinary week — and what would its absence feel like after a few years?" },
  { id: "q2", any: [T.career_high, T.relocation_flexible, T.relocation_reluctant], text: "How would your expectations change if your partner’s career became significantly more demanding, or required a move?" },
  { id: "q3", any: [T.family_central, T.parents_involved, T.inlaws_close, T.inlaws_bounded], text: "If both families wanted more involvement than you currently picture, what would you protect, and what could you soften?" },
  { id: "q4", any: [T.children_desired, T.children_uncertain, T.children_not_desired], text: "What would you need to know — about timing, care, and support — before you could feel honest about children with a partner?" },
  { id: "q5", any: [T.finances_joint, T.finances_independent, T.finances_hybrid], text: "If one of you earned much more, or paused paid work, how would you want contribution and say over money to work?" },
  { id: "q6", any: [T.conflict_direct, T.conflict_avoidant, T.conflict_space], text: "When you have been hurt in the past, what actually helped you re-enter the relationship — and what left you more alone?" },
];

function nonNegotiablesFromAnswers(answers: StoredAnswer[]) {
  const importance = answers.find((a) => a.questionId === "importance_map");
  const items: SelfReport["nonNegotiables"] = [];
  if (importance?.value.kind === "importance") {
    const question = QUESTION_BY_ID.importance_map;
    for (const item of question.items ?? []) {
      const level = importance.value.ratings[item.id] as ImportanceLevel | undefined;
      if (level === "non_negotiable") {
        items.push({ label: item.label, note: IMPORTANCE_LABELS[level] });
      }
    }
  }
  return items;
}

export function generateSelfReport(answers: StoredAnswer[]): SelfReport {
  const counts = countTags(answers);
  const orientation =
    pick(counts, ORIENTATION_RULES, 1)[0] ??
    "Your answers suggest a thoughtful mix of needs. Use the themes below as a mirror, not as a diagnosis.";

  const themes = THEME_RULES.filter((theme) => {
    if (theme.all && !theme.all.every((tag) => has(counts, tag))) return false;
    if (theme.any && !theme.any.some((tag) => has(counts, tag))) return false;
    if (theme.min && !has(counts, theme.min[0], theme.min[1])) return false;
    return true;
  })
    .slice(0, 6)
    .map(({ id, title, description }) => ({ id, title, description }));

  if (themes.length === 0) {
    themes.push({
      id: "open",
      title: "An unfolding picture",
      description: "Your responses do not collapse into a single theme. That can be a sign you are still sorting what matters most.",
    });
  }

  const expectations = EXPECTATION_BUILDERS.map((block) => {
    const summary =
      pick(counts, block.lines, 2).join(" ") ||
      "Your answers in this area are mixed or still forming — a useful place for personal reflection.";
    return { area: block.area, summary };
  });

  const strengths = pick(counts, STRENGTH_RULES, 4);
  if (strengths.length === 0) {
    strengths.push("You completed a careful reflection. Willingness to look at your own preferences is already a form of partnership readiness.");
  }

  const reflections = pick(counts, REFLECT_RULES, 4);
  const selfQuestions = pick(counts, SELF_QUESTIONS, 5);
  if (selfQuestions.length < 3) {
    selfQuestions.push("Which of your preferences are about the life you want, and which are about the life you think you are supposed to want?");
  }

  return {
    orientation,
    themes,
    expectations,
    strengths,
    reflections:
      reflections.length > 0
        ? reflections
        : ["It may be useful to notice where you answered quickly from family expectation, and where you answered from your own felt sense."],
    nonNegotiables: nonNegotiablesFromAnswers(answers),
    selfQuestions: selfQuestions.slice(0, 5),
  };
}

export { countTags };
