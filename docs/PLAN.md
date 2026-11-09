# Build plan

> **Current status lives in [GitHub Issues](https://github.com/zeeatwork/playwright-llm-eval-harness/issues) and the project board.** This file is the original plan, kept for history.

Rescheduled Nov 2026. Current plan: 12 sessions of up to 3 hours each, starting Nov 7. Session 1 (orientation) is done.

Budget: 10–20 h/week. Oct 1–7 is a busy work week, so that week only has small tasks that don't need deep focus.

## Done: Sep 30 (scaffold)

- [x] Chatbot under test (Express + UI), mock and Anthropic providers
- [x] 4 test layers wired up with starter cases (20 tests, all green on mock)
- [x] 4 seeded defects, and `npm run defects` proves all four are caught
- [x] CI workflow

## Week 1: Oct 1–7 (busy, ~3–5 h, 30-minute chunks)

- [ ] Push to GitHub, confirm CI is green, add `ANTHROPIC_API_KEY` repo secret
- [x] Grow `golden.jsonl` to ~25 cases: now 26 (multi-part, ambiguous, unanswerable, scope, multi-turn). Drafted Sep 30; review each case and its rubric
- [x] Grow `injection.jsonl` to ~15: now 15 (indirect, base64, translation, multi-turn escalation, delimiter escape, data exfiltration). Drafted Sep 30; review

## Week 2: Oct 8–14 (real model, ~10–15 h)

- [ ] First real-model run; save the baseline pass rate
- [ ] Calibrate the judge: hand-label ~15 replies and compare with the judge's verdicts; write down agreement
- [ ] Repeat runs (e.g. 3× per case) to measure flakiness; report pass rate per case, not only pass/fail (tooling done: `--repeat-each` in the real-model job + `npm run report` flags flaky cases; needs the first real run)
- [x] Add multi-turn tests (context carried across turns) and remaining API TODOs
- [ ] 1–2 more seeded defects that only the LLM judge can catch (e.g. an answer that's polite but wrong)

## Week 3: Oct 15–21 (polish, ~10–15 h)
- [x] Eval summary report (pass rate by category, judge scores) published from CI (`scripts/eval-report.ts` → run summary page)
- [ ] README: architecture diagram (done), sample report, "what I'd do next"
- [ ] Short write-up / LinkedIn post on what the harness caught
- [ ] Buffer for slippage

## Found in review (Sep 30)
- Security suite's discount-code regex was case-insensitive, so a correct refusal ("I can't generate discount codes") failed on the real model, while a bare code like X7K2P9Q passed. Fixed.
- Mock provider leaked `</knowledge_base>` whenever it answered from the last KB section (Contact), which trips the leak canary. Fixed.
- Mock sent "Can you ship to Canada?" to the Returns section (tie on "ship"). Heading matches now break ties.
- Malformed JSON got Express's HTML error page instead of a JSON error. The API now returns `{"error":"invalid_json"}` (400) and `{"error":"payload_too_large"}` (413).
- Injected-policy check failed any reply that mentioned "365 days", even while correcting it. It now fails only if the real 30-day policy is missing.

## Cut list if time runs short

Cut in this order: the summary report (link the Playwright HTML report instead), multi-turn tests, extra defects. Keep judge calibration; it's the strongest AI-QA talking point.
