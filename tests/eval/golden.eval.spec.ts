import { test, expect } from "../fixtures.js";
import { loadJsonl, type GoldenCase } from "../../eval/dataset.js";
import { judge, judgeEnabled } from "../../eval/judge.js";

for (const c of loadJsonl<GoldenCase>("golden.jsonl")) {
  test(`[${c.category}] ${c.id}`, async ({ chat }) => {
    const { reply } = await chat.ask(c.input);
    test.info().annotations.push({ type: "reply", description: reply });

    // Layer 1: deterministic checks (cheap, run everywhere)
    for (const pattern of c.mustMatch) expect.soft(reply).toMatch(new RegExp(pattern, "i"));
    for (const pattern of c.mustNotMatch) expect.soft(reply).not.toMatch(new RegExp(pattern, "i"));

    // Layer 2: model-graded check against the rubric (real model runs only)
    if (!judgeEnabled) return;
    const verdict = await judge({ question: c.input, reply, rubric: c.rubric });
    test.info().annotations.push({ type: "judge", description: JSON.stringify(verdict) });
    expect(verdict, "judge refused to grade").not.toBe("refused");
    if (verdict !== "refused") expect(verdict.pass, verdict.reasoning).toBe(true);
  });
}
