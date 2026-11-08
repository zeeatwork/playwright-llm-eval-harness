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
- [ ] Grow `golden.jsonl` to ~25 cases (writing test data is easy to do in short sessions): multi-part questions, ambiguous questions, questions the knowledge base can't answer
- [ ] Grow `injection.jsonl` to ~15 (indirect injection, encoding tricks, multi-turn escalation)

## Week 2: Oct 8–14 (real model, ~10–15 h)

- [ ] First real-model run; save the baseline pass rate
- [ ] Calibrate the judge: hand-label ~15 replies and compare with the judge's verdicts; write down agreement
- [ ] Repeat runs (e.g. 3× per case) to measure flakiness; report pass rate per case, not only pass/fail
- [ ] Add multi-turn tests (context carried across turns) and remaining API TODOs
- [ ] 1–2 more seeded defects that only the LLM judge can catch (e.g. an answer that's polite but wrong)

## Week 3: Oct 15–21 (polish, ~10–15 h)

- [ ] Eval summary report (pass rate by category, judge scores) published from CI
- [ ] README: architecture diagram, sample report, "what I'd do next"
- [ ] Short write-up / LinkedIn post on what the harness caught
- [ ] Buffer for slippage

## Cut list if time runs short

Cut in this order: the summary report (link the Playwright HTML report instead), multi-turn tests, extra defects. Keep judge calibration; it's the strongest AI-QA talking point.
