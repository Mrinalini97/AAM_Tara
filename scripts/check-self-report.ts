import { generateSelfReport, listUncertainAnswers, visibleWordCount } from "../src/lib/engine/self-report";
import { rewriteSelfReportFromModel } from "../src/lib/slm/self-report";
import type { StoredAnswer } from "../src/lib/types";

function single(questionId: string, optionId: string): StoredAnswer {
  return { questionId, value: { kind: "single", optionId }, tags: [] };
}

function multi(questionId: string, optionIds: string[]): StoredAnswer {
  return { questionId, value: { kind: "multi", optionIds }, tags: [] };
}

function ranking(questionId: string, orderedIds: string[]): StoredAnswer {
  return { questionId, value: { kind: "ranking", orderedIds }, tags: [] };
}

const answers: StoredAnswer[] = [
  multi("life_at_60", ["independent", "thinking"]),
  ranking("marriage_foundations", ["self", "friendship", "trust", "practical"]),
  single("tradition_tradeoff", "adapt"),
  single("career_goals", "unthought"),
  single("relocation_career", "depends"),
  single("children_desire", "open"),
  single("where_live", "own"),
  single("hard_times", "present"),
  single("attachment", "both"),
  multi("shared_time", ["talk", "home"]),
  single("expression", "open"),
  single("spark", "routines"),
  single("intellectual_need", "welcome"),
  single("festivals", "full"),
  single("inlaws", "respect_bound"),
  single("loyalty", "friendship"),
  single("joint_money", "hybrid"),
  single("financial_goal", "experiences"),
  single("saving_spending", "save"),
  single("contribution", "proportional"),
  single("risk", "discuss"),
  single("dual_career", "both_full"),
  single("substances", "occasional"),
  single("lifestyle_type", "mixed"),
  single("lifestyle_flexibility", "bend"),
  single("past_relationships", "serious"),
  single("childhood", "warm"),
  single("disagreement", "name"),
  single("conflict_decision", "wait"),
  single("difference_after", "talk"),
  multi("non_negotiables", ["dishonesty", "controlling", "communication"]),
  single("childcare_split", "equal"),
];

const failures: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const report = generateSelfReport(answers);
const prose = [
  ...(report.dimensionSummaries ?? []).map((item) => `${item.sectionTitle}\n${item.summary}`),
  ...(report.reflectionPoints ?? []).map((point) => `${point.observation}\n${point.question}`),
].join("\n\n");

const priorities = report.dimensionSummaries?.find((item) => item.dimension === "life_priorities")?.summary ?? "";
const settledPriorities = priorities.split(/still open:/i)[0] ?? priorities;
const points = report.reflectionPoints ?? [];

check("generatedBy rules", report.generatedBy === "rules");
check("orientation empty", report.orientation === "");
check("word cap", visibleWordCount(report) <= 700, String(visibleWordCount(report)));
check("no em dash", !prose.includes("—") && !prose.includes("–"));
check("children not settled in priorities", !/\byou want children\b|do not want children|children are part/i.test(settledPriorities), priorities);
check("move not settled in priorities", !/you would move for|rather not move|both people's work/i.test(settledPriorities), priorities);
check("priorities names open", /still open/i.test(priorities), priorities);
check("no quoted unthought label", !prose.includes("I have not thought about this yet"));
check("no quoted children label", !prose.includes("I am open to children, but I am not certain yet"));
check("no quoted depends label", !prose.includes("It depends heavily on the circumstances."));
check(
  "banned phrases",
  !/you said|incompatible|thoughtful mix|appears to matter|shows up as important|worth treating with clarity|part of how you imagine|hold space|lean in|authentic self|\bjourney\b/i.test(prose),
);

const uncertainIds = new Set(listUncertainAnswers(answers).map((item) => item.questionId));
check("fixture uncertainties", ["career_goals", "relocation_career", "children_desire"].every((id) => uncertainIds.has(id)), [...uncertainIds].join(", "));

for (const id of ["career_goals", "relocation_career", "children_desire"]) {
  const point = points.find((item) => item.questionIds?.includes(id));
  check(`point for ${id}`, Boolean(point?.observation && point.question?.endsWith("?")));
}

const thought = points.find((item) => item.questionIds?.includes("career_goals"));
check("unthought named as open, not a flaw", /still open/i.test(thought?.observation ?? "") && /thought about/i.test(thought?.observation ?? "") && !/flaw|readiness|delay/i.test(thought?.observation ?? ""), thought?.observation);

const depends = points.find((item) => item.questionIds?.includes("relocation_career"));
check("depends is open, not flexibility-as-strength", /depends on circumstances/i.test(depends?.observation ?? "") && !/flexib|strength/i.test(`${depends?.observation} ${depends?.question}`), depends?.observation);

const children = points.find((item) => item.questionIds?.includes("children_desire"));
check("children question asks what would make it clearer", /clearer/i.test(children?.question ?? ""), children?.question);

const conflictAt = points.findIndex((item) => /sit together/i.test(item.question));
const gapAt = points.findIndex((item) => /which would you protect/i.test(item.question));
check("conflict present", conflictAt >= 0);
check("conflict states both sides", conflictAt >= 0 && /separat/i.test(points[conflictAt].observation) && /close|spoken/i.test(points[conflictAt].observation), points[conflictAt]?.observation);
check("conflict not declared incompatible", conflictAt >= 0 && !/incompatible|drop|give up/i.test(`${points[conflictAt].observation} ${points[conflictAt].question}`));
check("gap present", gapAt >= 0 && /experiences/i.test(points[gapAt].observation) && /save/i.test(points[gapAt].observation), points.map((item) => item.observation).join(" || "));
check("order uncertainty then conflict then gap", conflictAt > 2 && gapAt > conflictAt, points.map((item) => item.question).join(" | "));

for (const summary of report.dimensionSummaries ?? []) {
  const count = summary.summary.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  check(`${summary.dimension} at most 3 sentences`, count <= 3, summary.summary);
}

const omitted = rewriteSelfReportFromModel(
  report,
  answers,
  JSON.stringify({
    dimensions: [{ dimension: "core_values", sectionTitle: "Core values", summary: "You picture two fairly separate lives under one roof." }],
    reflectionPoints: [
      {
        observation: "You want a later life of two fairly separate lives, and you also want a partner who stays close.",
        question: "How do you want those two to sit together?",
      },
    ],
  }),
);
check("hybrid when model returns prose", omitted.generatedBy === "hybrid");
check("rules dimension kept when model omits it", Boolean(omitted.dimensionSummaries?.some((item) => item.dimension === "money")));
check(
  "omitted children point appended",
  (omitted.reflectionPoints ?? []).some((item) => item.questionIds?.includes("children_desire")),
);
check(
  "omitted move points appended",
  ["career_goals", "relocation_career"].every((id) => (omitted.reflectionPoints ?? []).some((item) => item.questionIds?.includes(id))),
);
check("appended uncertainty stays within cap", visibleWordCount(omitted) <= 700, String(visibleWordCount(omitted)));

const echoed = rewriteSelfReportFromModel(report, answers, JSON.stringify({ dimensions: report.dimensionSummaries, reflectionPoints: report.reflectionPoints }));
const childrenPoints = (echoed.reflectionPoints ?? []).filter((item) => item.questionIds?.includes("children_desire"));
check("no duplicate when model covers uncertainty", childrenPoints.length === 1, String(childrenPoints.length));
check("null model keeps rules", rewriteSelfReportFromModel(report, answers, null).generatedBy === "rules");

console.log(`words ${visibleWordCount(report)} points ${points.length}`);
console.log(prose);
if (failures.length) {
  console.error("\nFAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("\nOK");
