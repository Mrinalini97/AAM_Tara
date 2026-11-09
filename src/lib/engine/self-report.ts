import type { AnswerValue, Dimension, DimensionSummary, Question, ReflectionPoint, SelfReport, StoredAnswer } from "@/lib/types";
import { TAGS as T } from "@/lib/engine/tags";
import { QUESTION_BY_ID, QUESTIONS } from "@/lib/questions/data";
import { isQuestionVisible } from "@/lib/questions/visibility";

export const SECTION_TITLES: Record<Dimension, string> = {
  core_values: "Core values",
  life_priorities: "Life priorities",
  relationship_expectations: "Relationship expectations",
  family_marriage: "Family & marriage",
  money: "Money",
  career_lifestyle: "Career & lifestyle",
  children_parenting: "Children & parenting",
  communication_conflict: "Communication & conflict",
  personal_history: "Personal history",
  non_negotiables: "Non-negotiables",
};

const SECTION_ORDER = Object.keys(SECTION_TITLES) as Dimension[];

const WORD_CAP = 700;

/** Option labels that read as unsettled even if a tag was missed. */
const UNCERTAIN_WORDING =
  /have not thought|not sure|have not settled|not settled|it depends|would depend|still settling|prefer not to say|not certain|not fully named|have not fully/i;

const UNCERTAINTY_PRIORITY = [
  "children_desire",
  "childcare_split",
  "career_goals",
  "relocation_career",
  "disagreement",
  "conflict_decision",
  "spark",
  "inlaws",
  "tradition_tradeoff",
  "where_live",
  "festivals",
  "joint_money",
  "financial_goal",
  "saving_spending",
  "contribution",
  "risk",
  "intellectual_need",
  "lifestyle_flexibility",
  "attachment",
  "loyalty",
  "dual_career",
  "substances",
  "past_relationships",
  "non_negotiables",
];

export interface UncertainAnswer {
  questionId: string;
  dimension: Dimension;
  topic: string;
  observation: string;
  question: string;
  anchors: string[];
}

interface Side {
  dimension: Dimension;
  phrase: string;
  short: string;
}

function optionIdsOf(value: AnswerValue) {
  if (value.kind === "single") return value.optionId ? [value.optionId] : [];
  if (value.kind === "multi") return value.optionIds;
  if (value.kind === "ranking") return value.orderedIds;
  return [];
}

function visibleAnswer(answers: StoredAnswer[], questionId: string) {
  const question = QUESTION_BY_ID[questionId];
  const found = answers.find((item) => item.questionId === questionId);
  if (!question || !found || !isQuestionVisible(question, answers)) return null;
  return found;
}

function isUncertainOption(question: Question, optionId: string) {
  const option = question.options?.find((item) => item.id === optionId);
  if (!option) return false;
  if (option.tags.includes(T.uncertainty_present) || option.tags.includes(T.children_uncertain)) return true;
  return UNCERTAIN_WORDING.test(option.label);
}

function settledIds(question: Question, ids: string[]) {
  return ids.filter((id) => !isUncertainOption(question, id));
}

function settledSingle(answers: StoredAnswer[], questionId: string) {
  const found = visibleAnswer(answers, questionId);
  if (!found || found.value.kind !== "single") return null;
  const question = QUESTION_BY_ID[questionId];
  if (!question || isUncertainOption(question, found.value.optionId)) return null;
  return found.value.optionId;
}

function hasSettledOption(answers: StoredAnswer[], questionId: string, optionId: string) {
  const found = visibleAnswer(answers, questionId);
  if (!found) return false;
  const question = QUESTION_BY_ID[questionId];
  if (!question) return false;
  return settledIds(question, optionIdsOf(found.value)).includes(optionId);
}

function rankFirst(answers: StoredAnswer[], questionId: string) {
  const found = visibleAnswer(answers, questionId);
  if (!found || found.value.kind !== "ranking" || found.value.orderedIds.length === 0) return null;
  const question = QUESTION_BY_ID[questionId];
  if (!question) return null;
  if (question.rankCount && found.value.orderedIds.length < question.rankCount) return null;
  const first = found.value.orderedIds[0];
  return isUncertainOption(question, first) ? null : first;
}

function joinAnd(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) {
    const joiner = parts.some((part) => part.length > 40) ? ", and " : " and ";
    return `${parts[0]}${joiner}${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function ensureSentence(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function sentenceFromClauses(clauses: string[]) {
  const clean = clauses.map((clause) => clause.trim().replace(/[.]+$/, "")).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return ensureSentence(clean[0]);
  const complex = clean.length > 2 || clean.some((clause) => /[,;]/.test(clause));
  if (complex) {
    const [first, ...rest] = clean;
    return ensureSentence([first, ...rest.map(lowerFirst)].join("; "));
  }
  return ensureSentence(`${clean[0]}, and ${lowerFirst(clean[1])}`);
}

function chunk<T>(items: T[], groups: number): T[][] {
  if (items.length === 0 || groups <= 0) return [];
  const size = Math.ceil(items.length / groups);
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentencesOf(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function visibleWordCount(report: SelfReport) {
  const parts = [
    ...(report.dimensionSummaries ?? []).map((item) => item.summary),
    ...(report.reflectionPoints ?? []).flatMap((point) => [point.observation, point.question]),
  ];
  return words(parts.join(" "));
}

function shortenSummary(summary: string) {
  const parts = sentencesOf(summary);
  if (parts.length <= 1) return summary;
  const openIndex = parts.findIndex((part) => /^still open\b/i.test(part));
  let removeAt = -1;
  let longest = -1;
  parts.forEach((part, index) => {
    if (index === openIndex) return;
    const count = words(part);
    if (count >= longest) {
      longest = count;
      removeAt = index;
    }
  });
  if (removeAt < 0) removeAt = parts.length - 1;
  parts.splice(removeAt, 1);
  return parts.join(" ");
}

/** Shorten dimension paragraphs until the draft is within 700 words. Reflection points stay. */
export function enforceWordCap(report: SelfReport): SelfReport {
  const dimensionSummaries = (report.dimensionSummaries ?? []).map((item) => ({ ...item }));
  let guard = 0;
  while (visibleWordCount({ ...report, dimensionSummaries }) > WORD_CAP && guard < 40) {
    guard += 1;
    const candidate = dimensionSummaries
      .map((item, index) => ({ index, count: sentencesOf(item.summary).length, size: words(item.summary) }))
      .filter((item) => item.count > 1)
      .sort((a, b) => b.size - a.size)[0];
    if (!candidate) break;
    dimensionSummaries[candidate.index].summary = shortenSummary(dimensionSummaries[candidate.index].summary);
  }
  const reflectionPoints = report.reflectionPoints ?? [];
  return {
    ...report,
    dimensionSummaries,
    reflectionPoints,
    reflections: reflectionPoints.map((point) => `${point.observation} ${point.question}`),
  };
}

const LIFE_PICTURE: Record<string, string> = {
  social: "other people still in the week",
  family: "time shaped by children or extended family",
  independent: "two fairly separate lives under one roof",
  rooted: "familiar people and a predictable home",
  becoming: "new skills and new places",
  close: "being deeply known by one person",
  thinking: "regular conversation with someone to think with",
  building: "work that still shows progress",
  open: "room to travel and change direction",
};

const FOUNDATION: Record<string, string> = {
  trust: "being able to believe each other",
  affection: "warmth and feeling loved",
  practical: "running a life together",
  family: "staying connected to family",
  direction: "wanting the same kind of future",
  self: "room for each person to remain themselves",
  friendship: "liking each other on ordinary days",
};

const TOGETHER: Record<string, string> = {
  talk: "long conversations",
  ideas: "talking through ideas and what you are learning",
  home: "quiet time at home",
  out: "going out or travelling",
  hobbies: "a shared project or hobby",
  parallel: "sharing a room while each of you does your own thing",
  family: "time that includes family",
};

const HARD_LINES: Record<string, string> = {
  dishonesty: "repeated lying",
  infidelity: "infidelity or a breach of trust",
  disrespect: "humiliation or disrespect",
  controlling: "being controlled or losing personal freedom",
  family_interference: "heavy interference from either family",
  career_restriction: "a lack of support for work or personal aims",
  financial_irresponsibility: "money handled carelessly, again and again",
  substance_misuse: "alcohol or other substances becoming a problem",
  communication: "a partner who will not talk through problems",
};

function moveFragment(optionId: string) {
  if (optionId === "prioritize") return "You would move for a partner's strong job in another city";
  if (optionId === "both") return "A move for one career would have to work for both people's work";
  if (optionId === "stay") return "You would rather not move for a partner's job in another city";
  return null;
}

function settledFragment(questionId: string, ids: string[]): string | null {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return null;
  const settled = settledIds(question, ids);
  if (settled.length === 0 && question.type !== "ranking") return null;

  switch (questionId) {
    case "life_at_60": {
      const pictures = settled.map((id) => LIFE_PICTURE[id]).filter(Boolean);
      return pictures.length ? `The later life you picture includes ${joinAnd(pictures)}` : null;
    }
    case "marriage_foundations": {
      if (question.rankCount && ids.length < question.rankCount) return null;
      const ordered = settled.map((id) => FOUNDATION[id]).filter(Boolean);
      if (ordered.length === 0) return null;
      const [first, ...rest] = ordered;
      return rest.length ? `In a marriage you put ${first} first, then ${joinAnd(rest)}` : `In a marriage you put ${first} first`;
    }
    case "tradition_tradeoff":
      if (settled[0] === "keep") return "When a family custom and a newer way pull apart, you protect continuity";
      if (settled[0] === "adapt") return "When a family custom and a newer way pull apart, you would reshape the custom so it still means something";
      if (settled[0] === "choose") return "When a family custom and a newer way pull apart, you side with the couple";
      return null;
    case "career_goals":
    case "relocation_career":
      return settled[0] ? moveFragment(settled[0]) : null;
    case "children_desire":
      if (settled[0] === "yes") return "Children are part of the next decade you want";
      if (settled[0] === "no") return "You do not want children";
      return null;
    case "where_live":
      if (settled[0] === "family_home") return "The home you want, at least for a time, is one shared with parents or a joint family";
      if (settled[0] === "nearby") return "You want your own home, close enough that family is part of ordinary weeks";
      if (settled[0] === "own") return "You want a separate home, with family visiting rather than sharing the ordinary day";
      return null;
    case "hard_times":
      if (settled[0] === "present") return "In illness, grief, or heavy work stress, you want someone who stays close even if they cannot fix it";
      if (settled[0] === "practical") return "In a hard season you want practical help more than a long conversation";
      if (settled[0] === "space_then") return "When life is hard you want space first, and a conversation only once you are ready";
      if (settled[0] === "both_ways") return "In a hard season you want support, and you want to be the one who carries things when it is your turn";
      return null;
    case "attachment":
      if (settled[0] === "both") return "Closeness and time apart both feel workable to you";
      if (settled[0] === "reassurance") return "You settle when contact and reassurance are regular";
      if (settled[0] === "retreat") return "You settle when you can step back and have room";
      return null;
    case "shared_time": {
      const ways = settled.map((id) => TOGETHER[id]).filter(Boolean);
      return ways.length ? `On an ordinary week, the time you want together is ${joinAnd(ways)}` : null;
    }
    case "expression":
      if (settled[0] === "open") return "You want feelings spoken, and silence is harder for you than a difficult talk";
      if (settled[0] === "measured") return "You want honesty, and you want the tone to stay calm";
      if (settled[0] === "private") return "You keep a lot to yourself, and you want a partner who does not press for constant processing";
      return null;
    case "spark":
      if (settled[0] === "talk") return "If stress thins the connection, you want to talk until both of you understand what is happening";
      if (settled[0] === "routines") return "If stress thins the connection, you would change ordinary routines such as time together, rest, or something you used to enjoy";
      if (settled[0] === "space") return "If stress thins the connection, you would take space and come back less flooded";
      if (settled[0] === "outside") return "If stress thins the connection, you would look outside the couple for steady support";
      return null;
    case "intellectual_need":
      if (settled[0] === "essential") return "Being able to think with a partner is something you would feel the loss of";
      if (settled[0] === "welcome") return "Thinking together is welcome to you, and it is not what makes the partnership work";
      if (settled[0] === "optional") return "Kindness, reliability, and daily life matter more to you than talk about ideas";
      return null;
    case "festivals":
      if (settled[0] === "full") return "You would keep festivals and family ceremonies even when they are inconvenient";
      if (settled[0] === "choose") return "You would keep the ceremonies that feel meaningful and let others be shorter or skipped";
      if (settled[0] === "minimal") return "You want a lighter calendar, with fewer family obligations";
      return null;
    case "inlaws":
      if (settled[0] === "include") return "If parents wanted a real say in home, festivals, or children, you would try to accommodate them";
      if (settled[0] === "respect_bound") return "You would hear parents out, and the two of you would still decide";
      if (settled[0] === "protect") return "You would protect the couple's independence even if that is uncomfortable for parents";
      return null;
    case "loyalty":
      if (settled[0] === "friendship") return "Over many years, you trust attention and friendship to hold faithfulness";
      if (settled[0] === "habits") return "You think faithfulness takes deliberate habits and boundaries, not only good intentions";
      return null;
    case "joint_money":
      if (settled[0] === "joint") return "You want most money shared, and visible to both of you";
      if (settled[0] === "hybrid") return "You want shared costs and goals, and some money that stays yours alone";
      if (settled[0] === "separate") return "You want to split shared costs and keep the rest of your money separate";
      return null;
    case "financial_goal":
      if (settled[0] === "cushion") return "What you want money to do first is build a cushion against being exposed";
      if (settled[0] === "experiences") return "What you want money to do first is pay for experiences, travel, and time that feels lived";
      if (settled[0] === "family") return "What you want money to do first is support family, including people beyond the two of you";
      if (settled[0] === "independence") return "What you want money to do first is protect each person's independence";
      if (settled[0] === "building") return "What you want money to do first is fund a long build, such as a home, a venture, or a project";
      return null;
    case "saving_spending":
      if (settled[0] === "save") return "In practice you save first and treat spending as something you decide on purpose";
      if (settled[0] === "balanced") return "You want a cushion, and you also want to use what you earn";
      if (settled[0] === "enjoy") return "You are more at ease spending money on living than holding it back";
      return null;
    case "contribution":
      if (settled[0] === "equal_cash") return "If earnings differ, you want the same cash amount from each person so income does not set rank";
      if (settled[0] === "proportional") return "If earnings differ, you want the higher earner to cover more of the shared costs";
      if (settled[0] === "pool") return "If earnings differ, you still want one pool, without a split between mine and yours";
      if (settled[0] === "care") return "You count unpaid care as a contribution, not only salary";
      return null;
    case "risk":
      if (settled[0] === "take") return "Faced with a financial risk that has a real upside, you would take it if it has been thought through";
      if (settled[0] === "protect") return "You would protect stability and want a strong safety net before any financial leap";
      if (settled[0] === "discuss") return "You would take a financial risk only if you both agree, even if that means missing it";
      return null;
    case "dual_career":
      if (settled[0] === "both_full") return "You want both careers taken seriously, with neither person becoming the one who always adjusts";
      if (settled[0] === "seasons") return "You are willing for careers to take turns, in seasons where one person's work leads";
      if (settled[0] === "one_centre") return "You are more at ease if one career is what the household organizes around";
      return null;
    case "substances":
      if (settled[0] === "none") return "Alcohol and smoking are not part of the social life you want";
      if (settled[0] === "occasional") return "Alcohol can be occasional for you, and it is not the point of the evening";
      if (settled[0] === "often") return "Alcohol or smoking is often part of how you relax with other people";
      if (settled[0] === "differ") return "You can live with a partner whose drinking or smoking differs from yours";
      return null;
    case "lifestyle_type":
      if (settled[0] === "quiet") return "The pace you return to is quiet and based at home";
      if (settled[0] === "mixed") return "You want a mix of time at home and going out";
      if (settled[0] === "social") return "You want a socially full life";
      if (settled[0] === "move") return "You want to be often travelling, making plans, and seeing new places";
      return null;
    case "lifestyle_flexibility":
      if (settled[0] === "similar") return "A partner whose daily rhythm is far from yours would wear on you";
      if (settled[0] === "bend") return "You can bend a long way toward a partner's rhythm if the relationship feels right";
      if (settled[0] === "own") return "You need your own daily rhythm even if a partner lives differently";
      return null;
    case "childcare_split":
      if (settled[0] === "equal") return "If a child arrived while both jobs were heavy, you would want both jobs reshaped so the care is shared";
      if (settled[0] === "one_steps") return "If a child arrived while both jobs were heavy, you would want one person to step back for a period, by agreement";
      if (settled[0] === "family_help") return "If a child arrived, you would want parents or family to take a substantial share of the care";
      if (settled[0] === "paid") return "If a child arrived, you would use paid care so both people can keep working, if you can afford it";
      if (settled[0] === "na") return "Childcare arrangements sit outside the life you want";
      return null;
    case "past_relationships":
      if (settled[0] === "never") return "You have not been in a romantic relationship";
      if (settled[0] === "serious") return "You have been in a serious relationship";
      if (settled[0] === "casual") return "You have been in a casual relationship";
      if (settled[0] === "both") return "You have had both serious and casual relationships";
      return null;
    case "childhood":
      if (settled[0] === "warm") return "The childhood you remember was mostly warm and steady";
      if (settled[0] === "mixed") return "The childhood you remember had both closeness and strain";
      if (settled[0] === "difficult") return "The childhood you remember was difficult in ways you still notice";
      if (settled[0] === "complicated") return "The childhood you remember does not fit a simple account";
      return null;
    case "healing":
      if (settled[0] === "understand") return "You have spent time making sense of that experience in your own way";
      if (settled[0] === "leave") return "You mostly leave that experience in the past and do not revisit it";
      if (settled[0] === "middle") return "You are still making sense of that experience";
      if (settled[0] === "history") return "That experience is part of your history, and you do not treat it as a project";
      return null;
    case "disagreement":
      if (settled[0] === "name") return "When you disagree about something that will not fade, your instinct is to name it even if the talk is uncomfortable";
      if (settled[0] === "soften") return "Your instinct in a lasting disagreement is to come in carefully, so you do not cause needless hurt";
      if (settled[0] === "pause") return "Your instinct in a lasting disagreement is to take space, then return";
      if (settled[0] === "delay") return "Your instinct in a lasting disagreement is to put it off and hope it settles";
      return null;
    case "conflict_decision":
      if (settled[0] === "wait") return "If a decision cannot wait and you are still in conflict, you would pause until the heat drops, even if that slows things";
      if (settled[0] === "push") return "You would stay in a conflicted conversation until there is a resolution, because leaving it unfinished is worse for you";
      if (settled[0] === "one_calls") return "If you are stuck in conflict, you want someone to decide by an agreed rule rather than a contest of wills";
      return null;
    case "difference_after":
      if (settled[0] === "talk") return "If you later find a serious difference that is not a deal-breaker, you would name it early and look for a compromise you can live with";
      if (settled[0] === "adapt") return "You can adapt a great deal on a later difference if you feel respected";
      if (settled[0] === "firm") return "If a later difference touches what you treat as core, you would rather leave than stay and resent it";
      return null;
    case "non_negotiables": {
      const lines = settled.map((id) => HARD_LINES[id]).filter(Boolean);
      return lines.length ? `The lines you would find hardest to cross are ${joinAnd(lines)}` : null;
    }
    default:
      return null;
  }
}

interface UncertainCopy {
  topic: string;
  observation: string;
  question: string;
  anchors: string[];
}

function uncertainCopy(questionId: string, optionIds: string[]): UncertainCopy {
  const move = {
    topic: "whether relocating for a partner's job in another city is for you",
    anchors: ["another city"],
  };
  if (questionId === "career_goals" || questionId === "relocation_career") {
    if (optionIds.includes("depends")) {
      return {
        ...move,
        observation: "A move for a partner's job in another city is still open. It depends on circumstances that are not named yet.",
        question: "What would you need to know about those circumstances before the choice felt clearer?",
      };
    }
    return {
      ...move,
      observation: "A move for a partner's job in another city is still open. It is something you have not thought about.",
      question: "What would make that choice clearer?",
    };
  }
  if (questionId === "children_desire") {
    if (optionIds.includes("later")) {
      return {
        topic: "when children would fit, if they do",
        observation: "Whether you want children later, and when, is still open.",
        question: "What would make the timing clearer?",
        anchors: ["children"],
      };
    }
    return {
      topic: "whether to have children",
      observation: "Whether you want children is still open.",
      question: "What would make a yes or a no clearer?",
      anchors: ["children"],
    };
  }
  const byQuestion: Record<string, UncertainCopy> = {
    attachment: optionIds.includes("depends")
      ? {
          topic: "what helps you feel settled with a partner",
          observation: "What helps you feel settled with a partner is still open. You have left it depending on the person.",
          question: "What would you need to notice before that felt clearer?",
          anchors: ["settled"],
        }
      : {
          topic: "what helps you feel settled with a partner",
          observation: "What helps you feel settled with a partner is still open. You move between wanting closeness and wanting distance.",
          question: "What would make that clearer?",
          anchors: ["settled"],
        },
    spark: {
      topic: "what you would do if stress thinned the connection between you",
      observation: "What you would do if stress thinned the connection between you is still open.",
      question: "What would make that clearer?",
      anchors: ["connection"],
    },
    intellectual_need: {
      topic: "how much you need a partner you can think with",
      observation: "How much you need a partner you can think with is still open.",
      question: "What would make that clearer?",
      anchors: ["think with"],
    },
    tradition_tradeoff: {
      topic: "which side you would take when a family custom and a newer way pull apart",
      observation: "When a family custom and a newer way of doing things pull apart, which side you would take is still open.",
      question: "What would make that choice clearer?",
      anchors: ["family custom"],
    },
    inlaws: {
      topic: "how much say parents should have in how you live",
      observation: "How much say parents should have in your home, festivals, or children is still open. You have left it depending on trust, and on whether both families are treated the same.",
      question: "What would make that line clearer?",
      anchors: ["parents"],
    },
    loyalty: {
      topic: "what you believe holds faithfulness across many years",
      observation: "What you believe holds faithfulness across many years is still open, apart from wanting the two of you to be able to say if it feels fragile.",
      question: "What would make that belief clearer?",
      anchors: ["faithful"],
    },
    lifestyle_flexibility: {
      topic: "how far you would bend toward a partner's daily rhythm",
      observation: "How far you would bend if a partner's daily rhythm differed from yours is still open.",
      question: "What would make that clearer?",
      anchors: ["rhythm"],
    },
    past_relationships: {
      topic: "whether you have been in a romantic relationship before",
      observation: "Whether you have been in a romantic relationship before is still open here. You would rather not say.",
      question: "What would make it clearer to include this, or to keep it to yourself?",
      anchors: ["romantic relationship"],
    },
    non_negotiables: {
      topic: "one line you would find hardest to cross",
      observation: "One of the lines you would find hardest to cross is still unnamed.",
      question: "What would make that line clearer?",
      anchors: ["unnamed"],
    },
  };
  return (
    byQuestion[questionId] ?? {
      topic: "this",
      observation: "This is still open.",
      question: "What would make it clearer?",
      anchors: [questionId.replace(/_/g, " ")],
    }
  );
}

function rankingUnresolved(question: Question, value: AnswerValue) {
  if (value.kind !== "ranking" || question.type !== "ranking") return false;
  const expected = question.rankCount ?? question.options?.length ?? 0;
  return expected > 0 && value.orderedIds.length < expected;
}

function importanceUnmarked(question: Question, value: AnswerValue) {
  if (value.kind !== "importance") return false;
  const items = question.items ?? [];
  if (items.length === 0) return Object.keys(value.ratings).length === 0;
  return items.some((item) => !value.ratings[item.id]);
}

export function listUncertainAnswers(answers: StoredAnswer[]): UncertainAnswer[] {
  const found: (UncertainAnswer & { rank: number })[] = [];
  for (const question of QUESTIONS) {
    if (question.id === "childhood") continue;
    const answer = visibleAnswer(answers, question.id);
    if (!answer) continue;

    const selected = optionIdsOf(answer.value);
    const uncertainIds = selected.filter((id) => isUncertainOption(question, id));
    const unresolvedRanking = rankingUnresolved(question, answer.value);
    const unmarkedImportance = importanceUnmarked(question, answer.value);
    if (uncertainIds.length === 0 && !unresolvedRanking && !unmarkedImportance) continue;

    let copy: UncertainCopy;
    if (unmarkedImportance && uncertainIds.length === 0) {
      copy = {
        topic: "how important this is to you",
        observation: "Something you were asked to mark for importance was left unmarked, so that weight is still open.",
        question: "What would make that importance clearer?",
        anchors: ["importance"],
      };
    } else if (unresolvedRanking && uncertainIds.length === 0) {
      copy = {
        topic: "an order you have not finished",
        observation: "An order you started in this part of your answers does not settle the tradeoff, so that priority is still open.",
        question: "What would make that order clearer?",
        anchors: ["order"],
      };
    } else {
      copy = uncertainCopy(question.id, uncertainIds);
    }

    const rank = UNCERTAINTY_PRIORITY.indexOf(question.id);
    found.push({
      questionId: question.id,
      dimension: question.dimension,
      topic: copy.topic,
      observation: copy.observation,
      question: copy.question,
      anchors: copy.anchors.map((anchor) => anchor.toLowerCase()),
      rank: rank === -1 ? UNCERTAINTY_PRIORITY.length : rank,
    });
  }

  return found
    .sort((a, b) => a.rank - b.rank || a.questionId.localeCompare(b.questionId))
    .map((item) => ({
      questionId: item.questionId,
      dimension: item.dimension,
      topic: item.topic,
      observation: item.observation,
      question: item.question,
      anchors: item.anchors,
    }));
}

function dimensionSummary(dimension: Dimension, answers: StoredAnswer[]): DimensionSummary | null {
  const questions = QUESTIONS.filter((question) => question.dimension === dimension);
  const fragments: string[] = [];
  const seen = new Set<string>();
  for (const question of questions) {
    const answer = visibleAnswer(answers, question.id);
    if (!answer) continue;
    const fragment = settledFragment(question.id, optionIdsOf(answer.value));
    if (!fragment || seen.has(fragment)) continue;
    seen.add(fragment);
    fragments.push(fragment);
  }

  const topics: string[] = [];
  const seenTopics = new Set<string>();
  for (const item of listUncertainAnswers(answers)) {
    if (item.dimension !== dimension || seenTopics.has(item.topic)) continue;
    seenTopics.add(item.topic);
    topics.push(item.topic);
  }

  if (fragments.length === 0 && topics.length === 0) return null;

  const openSentence = topics.length ? `Still open: ${joinAnd(topics)}.` : null;
  const maxSettled = openSentence ? 2 : 3;
  const settledSentences =
    fragments.length <= maxSettled
      ? fragments.map((fragment) => ensureSentence(fragment))
      : chunk(fragments, maxSettled).map((group) => sentenceFromClauses(group));
  const summary = [...settledSentences, openSentence].filter(Boolean).slice(0, 3).join(" ");
  if (!summary) return null;
  return { dimension, sectionTitle: SECTION_TITLES[dimension], summary };
}

function point(observation: string, question: string, questionIds?: string[]): ReflectionPoint {
  return { observation: ensureSentence(observation).replace(/\?\.$/, "?"), question: ensureSentence(question), questionIds };
}

function uncertaintyPoints(answers: StoredAnswer[]): ReflectionPoint[] {
  return listUncertainAnswers(answers).map((item) => point(item.observation, item.question, [item.questionId]));
}

function pickIndependence(answers: StoredAnswer[]): Side | null {
  if (hasSettledOption(answers, "life_at_60", "independent")) {
    return { dimension: "core_values", phrase: "a later life of two fairly separate lives under one roof", short: "that separateness" };
  }
  if (rankFirst(answers, "marriage_foundations") === "self") {
    return { dimension: "core_values", phrase: "room to remain yourself as the first foundation of a marriage", short: "that room to remain yourself" };
  }
  if (settledSingle(answers, "attachment") === "retreat") {
    return { dimension: "relationship_expectations", phrase: "to settle by stepping back from a partner", short: "that room to step back" };
  }
  if (settledSingle(answers, "expression") === "private") {
    return { dimension: "relationship_expectations", phrase: "to keep a lot unsaid, without being pressed to process everything", short: "that privacy" };
  }
  if (settledSingle(answers, "lifestyle_flexibility") === "own") {
    return { dimension: "career_lifestyle", phrase: "to keep your own daily rhythm even if a partner lives differently", short: "that separate rhythm" };
  }
  if (settledSingle(answers, "joint_money") === "separate") {
    return { dimension: "money", phrase: "to keep money mostly separate", short: "that financial separation" };
  }
  if (settledSingle(answers, "inlaws") === "protect") {
    return { dimension: "family_marriage", phrase: "to protect the couple's independence when parents want a say", short: "that independence from parents" };
  }
  return null;
}

function pickInvolvement(answers: StoredAnswer[]): Side | null {
  const staysClose = settledSingle(answers, "hard_times") === "present";
  const speaks = settledSingle(answers, "expression") === "open";
  if (staysClose && speaks) {
    return {
      dimension: "relationship_expectations",
      phrase: "a partner who stays close through illness, stress, or grief, with feelings spoken",
      short: "that closeness",
    };
  }
  if (staysClose) {
    return { dimension: "relationship_expectations", phrase: "a partner who stays close through illness, stress, or grief", short: "that closeness" };
  }
  if (speaks) {
    return { dimension: "relationship_expectations", phrase: "feelings spoken in the day to day, even when the talk is difficult", short: "feelings being spoken" };
  }
  if (hasSettledOption(answers, "shared_time", "talk")) {
    return { dimension: "relationship_expectations", phrase: "long conversations as a normal part of an ordinary week", short: "those conversations" };
  }
  if (settledSingle(answers, "attachment") === "reassurance") {
    return { dimension: "relationship_expectations", phrase: "regular reassurance in order to feel settled", short: "that reassurance" };
  }
  if (settledSingle(answers, "inlaws") === "include") {
    return { dimension: "family_marriage", phrase: "to accommodate parents when they want a say in how you live", short: "that family involvement" };
  }
  if (hasSettledOption(answers, "shared_time", "family")) {
    return { dimension: "relationship_expectations", phrase: "ordinary time that includes family", short: "that time with family" };
  }
  return null;
}

function conflictPoints(answers: StoredAnswer[]): ReflectionPoint[] {
  const points: ReflectionPoint[] = [];
  const independence = pickIndependence(answers);
  const involvement = pickInvolvement(answers);
  if (independence && involvement && independence.dimension !== involvement.dimension) {
    points.push(
      point(
        `You want ${independence.phrase}, and you also want ${involvement.phrase}.`,
        `How do you want ${independence.short} and ${involvement.short} to sit together?`,
      ),
    );
  }

  const quiet = settledSingle(answers, "lifestyle_type") === "quiet";
  const socialLater = hasSettledOption(answers, "life_at_60", "social");
  if (quiet && socialLater && points.length < 2) {
    points.push(
      point(
        "The pace you return to is quiet and based at home, and the later life you picture still has other people in the week as a normal thing.",
        "How do you want that quiet pace and that socially alive week to sit together?",
      ),
    );
  }

  return points;
}

function gapPoints(answers: StoredAnswer[]): ReflectionPoint[] {
  const points: ReflectionPoint[] = [];
  const add = (observation: string, question: string) => {
    points.push(point(observation, question));
  };

  const goal = settledSingle(answers, "financial_goal");
  const habit = settledSingle(answers, "saving_spending");
  if (goal === "experiences" && habit === "save") {
    add(
      "You want money to pay for experiences, travel, and time that feels lived. You also save first, and treat spending as something you decide on purpose.",
      "If only one of those could hold, which would you protect?",
    );
  } else if (goal === "cushion" && habit === "enjoy") {
    add(
      "You want money to build a cushion against being exposed. You are also more at ease spending on living than holding money back.",
      "If only one of those could hold, which would you protect?",
    );
  }

  const home = settledSingle(answers, "where_live");
  if (home === "own" && settledSingle(answers, "festivals") === "full") {
    add(
      "You want a separate home, with family visiting rather than sharing the ordinary day. You would also keep festivals and family ceremonies even when they are inconvenient.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (home === "own" && settledSingle(answers, "inlaws") === "include") {
    add(
      "You want a separate home, with family visiting rather than sharing the ordinary day. You would also try to accommodate parents who wanted a real say in that home.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (home === "family_home" && settledSingle(answers, "inlaws") === "protect") {
    add(
      "You want a home shared with parents or a joint family. You would also protect the couple's independence if parents wanted a say in how you live.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (home === "family_home" && rankFirst(answers, "marriage_foundations") === "self") {
    add(
      "You put room to remain yourself first in a marriage, and the home you want is one shared with parents or a joint family.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (home === "own" && rankFirst(answers, "marriage_foundations") === "family") {
    add(
      "You put staying connected to family first in a marriage, and the home you want is a separate one, with family visiting rather than sharing the ordinary day.",
      "If only one of those could hold, which would you protect?",
    );
  }

  const children = settledSingle(answers, "children_desire");
  if (children === "no" && hasSettledOption(answers, "life_at_60", "family")) {
    add(
      "The later life you picture has children or extended family shaping the week, and you do not want children in the next decade.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (children === "yes" && visibleAnswer(answers, "life_at_60")) {
    const familyShaped = ["family", "close", "rooted"].some((id) => hasSettledOption(answers, "life_at_60", id));
    if (!familyShaped) {
      add(
        "You want children in the next decade, and the later life you pictured leaves out a week shaped by children or by being deeply known at home.",
        "If only one of those could hold, which would you protect?",
      );
    }
  }

  const stays = settledSingle(answers, "career_goals") === "stay" || settledSingle(answers, "relocation_career") === "stay";
  const moves = settledSingle(answers, "career_goals") === "prioritize" || settledSingle(answers, "relocation_career") === "prioritize";
  if (stays && settledSingle(answers, "dual_career") === "both_full") {
    add(
      "You want both careers taken seriously. You would also rather not move if one of those careers required another city.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (moves && home === "family_home") {
    add(
      "You would move for a partner's strong job in another city, and you want a home shared with parents or a joint family.",
      "If only one of those could hold, which would you protect?",
    );
  }
  if (stays && settledSingle(answers, "lifestyle_type") === "move") {
    add(
      "You want ordinary life to include travel and new places, and you would rather not move for a partner's job in another city.",
      "If only one of those could hold, which would you protect?",
    );
  }

  return points;
}

const MAX_POINTS = 7;

function reflectionPointsFor(answers: StoredAnswer[]): ReflectionPoint[] {
  const uncertainty = uncertaintyPoints(answers);
  const room = Math.max(0, MAX_POINTS - uncertainty.length);
  const rest = [...conflictPoints(answers), ...gapPoints(answers)].slice(0, room);
  return [...uncertainty, ...rest];
}

function emptyReport(reflectionPoints: ReflectionPoint[], dimensionSummaries: DimensionSummary[]): SelfReport {
  return {
    orientation: "",
    themes: [],
    expectations: [],
    strengths: [],
    reflections: reflectionPoints.map((point) => `${point.observation} ${point.question}`),
    nonNegotiables: [],
    selfQuestions: [],
    dimensionSummaries,
    reflectionPoints,
    generatedBy: "rules",
  };
}

export function generateSelfReport(answers: StoredAnswer[]): SelfReport {
  const dimensionSummaries = SECTION_ORDER.map((dimension) => dimensionSummary(dimension, answers)).filter(
    (item): item is DimensionSummary => Boolean(item),
  );
  return enforceWordCap(emptyReport(reflectionPointsFor(answers), dimensionSummaries));
}
