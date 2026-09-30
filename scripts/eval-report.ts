// Summarize a Playwright JSON report (eval-results/results.json) as Markdown:
// pass rate per project, per eval category, per security technique, and per case across repeats,
// plus the LLM judge's average score when the judge ran. Flaky cases (some runs pass, some fail) are called out.
//
//   npx playwright test --project=eval --repeat-each=3   # CI writes eval-results/results.json
//   npm run report                                     # prints the summary; in GitHub Actions it also
//                                                      # lands on the run's summary page
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Annotation = { type: string; description?: string };
type Result = { status: string; duration: number; annotations?: Annotation[] };
type TestEntry = { projectName: string; annotations?: Annotation[]; results: Result[] };
type Spec = { title: string; tests: TestEntry[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[] };

type CaseStats = { project: string; group: string; id: string; runs: number; passes: number; scores: number[]; ms: number[] };

const input = process.argv[2] ?? "eval-results/results.json";
if (!existsSync(input)) {
  console.error(`No report at ${input}. Run the suites in CI mode first (CI=1 npx playwright test ...).`);
  process.exit(1);
}
const report = JSON.parse(readFileSync(input, "utf8")) as Report;

function* specs(suites: Suite[]): Generator<Spec> {
  for (const s of suites) {
    yield* s.specs ?? [];
    yield* specs(s.suites ?? []);
  }
}

// Titles look like "[policy] returns-window" (eval) or "policy-injection: fake-policy" (security).
function parseTitle(title: string): { group: string; id: string } {
  const evalTitle = /^\[(.+?)\] (.+)$/.exec(title);
  if (evalTitle) return { group: evalTitle[1]!, id: evalTitle[2]! };
  const secTitle = /^([\w-]+): (.+)$/.exec(title);
  if (secTitle) return { group: secTitle[1]!, id: secTitle[2]! };
  return { group: "general", id: title };
}

const cases = new Map<string, CaseStats>();
for (const spec of specs(report.suites)) {
  for (const t of spec.tests) {
    const { group, id } = parseTitle(spec.title);
    const key = `${t.projectName}/${spec.title}`;
    const stats = cases.get(key) ?? { project: t.projectName, group, id, runs: 0, passes: 0, scores: [], ms: [] };
    for (const r of t.results) {
      if (r.status === "skipped") continue;
      stats.runs++;
      if (r.status === "passed") stats.passes++;
      stats.ms.push(r.duration);
      for (const a of [...(r.annotations ?? []), ...(t.annotations ?? [])]) {
        if (a.type !== "judge" || !a.description) continue;
        try {
          const verdict = JSON.parse(a.description) as { score?: number };
          if (typeof verdict.score === "number") stats.scores.push(verdict.score);
        } catch {
          // "refused" or a malformed annotation: no score to record
        }
      }
    }
    cases.set(key, stats);
  }
}

const all = [...cases.values()].filter((c) => c.runs > 0);
const pct = (passes: number, runs: number) => (runs ? `${Math.round((100 * passes) / runs)}%` : "–");
const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "–");

function rollup(rows: CaseStats[], by: (c: CaseStats) => string) {
  const groups = new Map<string, CaseStats[]>();
  for (const c of rows) groups.set(by(c), [...(groups.get(by(c)) ?? []), c]);
  return [...groups.entries()]
    .map(([name, cs]) => {
      const runs = cs.reduce((n, c) => n + c.runs, 0);
      const passes = cs.reduce((n, c) => n + c.passes, 0);
      return { name, cases: cs.length, runs, passes, scores: cs.flatMap((c) => c.scores) };
    })
    .sort((a, b) => a.passes / a.runs - b.passes / b.runs || a.name.localeCompare(b.name));
}

const lines: string[] = ["## Eval summary", ""];
const totalRuns = all.reduce((n, c) => n + c.runs, 0);
const totalPasses = all.reduce((n, c) => n + c.passes, 0);
const maxRepeats = Math.max(0, ...all.map((c) => c.runs));
lines.push(`**${pct(totalPasses, totalRuns)} of ${totalRuns} runs passed** across ${all.length} cases` + (maxRepeats > 1 ? ` (up to ${maxRepeats} runs per case).` : "."), "");

lines.push("| Project | Cases | Runs | Pass rate |", "| --- | ---: | ---: | ---: |");
for (const g of rollup(all, (c) => c.project)) lines.push(`| ${g.name} | ${g.cases} | ${g.runs} | ${pct(g.passes, g.runs)} |`);
lines.push("");

const evalCases = all.filter((c) => c.project === "eval");
if (evalCases.length) {
  const judged = evalCases.some((c) => c.scores.length);
  lines.push("### Golden dataset by category", "");
  lines.push(judged ? "| Category | Cases | Pass rate | Avg judge score (1–5) |" : "| Category | Cases | Pass rate |");
  lines.push(judged ? "| --- | ---: | ---: | ---: |" : "| --- | ---: | ---: |");
  for (const g of rollup(evalCases, (c) => c.group)) {
    lines.push(`| ${g.name} | ${g.cases} | ${pct(g.passes, g.runs)} |` + (judged ? ` ${avg(g.scores)} |` : ""));
  }
  lines.push("");
}

const securityCases = all.filter((c) => c.project === "security");
if (securityCases.length) {
  lines.push("### Prompt injection by technique", "", "| Technique | Cases | Held (pass rate) |", "| --- | ---: | ---: |");
  for (const g of rollup(securityCases, (c) => c.group)) lines.push(`| ${g.name} | ${g.cases} | ${pct(g.passes, g.runs)} |`);
  lines.push("");
}

const flaky = all.filter((c) => c.passes > 0 && c.passes < c.runs);
const failing = all.filter((c) => c.passes === 0);
if (flaky.length) {
  lines.push("### Flaky cases (passed on some runs, failed on others)", "", "| Case | Project | Passed |", "| --- | --- | ---: |");
  for (const c of flaky.sort((a, b) => a.passes / a.runs - b.passes / b.runs)) lines.push(`| ${c.id} | ${c.project} | ${c.passes}/${c.runs} |`);
  lines.push("");
}
if (failing.length) {
  lines.push("### Failing on every run", "", ...failing.map((c) => `- \`${c.project}\` ${c.id}`), "");
}
if (!flaky.length && !failing.length) lines.push("No flaky or failing cases.", "");

const markdown = lines.join("\n");
console.log(markdown);
mkdirSync("eval-results", { recursive: true });
writeFileSync("eval-results/summary.md", markdown);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
