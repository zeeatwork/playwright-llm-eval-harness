# playwright-llm-eval-harness

A Playwright + TypeScript test harness for an LLM customer-support chatbot. It checks answers against a golden dataset, grades them with an LLM judge, attacks the bot with prompt injections, and covers the API and UI end to end. It also ships **seeded defects**: known bugs you can switch on to prove the harness catches them.

## The system under test

**Northwind Support Bot** (`app/`) is a small Express app with a chat UI. It answers questions about a fictional outdoor-gear store, using only a short knowledge base ([app/knowledge/policies.md](app/knowledge/policies.md)).

The bot lives in this repo on purpose. Seeded defects only work if you control the code under test, and a public chatbot would add terms-of-service risk, rate limits, and UI changes you can't predict.

It runs on one of two providers, chosen with `LLM_PROVIDER`:

| Provider | Used for | Needs a key |
|---|---|---|
| `mock` (default) | Every push in CI, local development. Deterministic, free, fast. | No |
| `anthropic` | Real-model evals: the LLM judge, flakiness measurement. Runs weekly and on demand. | Yes |

## Test layers

| Project | Folder | What it checks |
|---|---|---|
| `api` | `tests/api` | Request validation, status codes, response contract |
| `e2e` | `tests/e2e` | The chat UI in Chromium: happy path, error state |
| `security` | `tests/security` | Prompt injection from `datasets/injection.jsonl`: system-prompt leaks, injected policies, goal hijacking |
| `eval` | `tests/eval` | The golden dataset in `datasets/golden.jsonl`: regex checks everywhere, plus an LLM judge scoring each answer against its rubric when running on the real model |

## Seeded defects

| Defect | What breaks | Caught by |
|---|---|---|
| `stale-kb` | Return window becomes 60 days | eval, e2e |
| `leaky-prompt` | Confidentiality rule removed from the system prompt | security |
| `no-length-guard` | API accepts messages over 2000 characters | api |
| `ui-swallows-errors` | UI shows nothing when the API fails | e2e |

`npm run defects` switches each defect on in turn and fails if any of them gets through the harness.

## Running it

```bash
npm install
npx playwright install chromium
npm test                 # api + e2e + security on the mock provider
npm run test:eval        # golden dataset
npm run defects          # prove each seeded defect is caught
npm run app              # open http://localhost:3000

# Real model (needs ANTHROPIC_API_KEY)
LLM_PROVIDER=anthropic npm run test:eval
```

## Project layout

```
app/            system under test: Express server, chat UI, knowledge base, providers, seeded defects
datasets/       golden.jsonl (expected behavior) and injection.jsonl (attacks)
eval/           dataset loader and the LLM judge
tests/          Playwright projects: api, e2e, security, eval
scripts/        run-defects.ts
.github/        CI: mock suites + defect check on every push; real-model eval weekly and on demand
docs/PLAN.md    build plan
```
