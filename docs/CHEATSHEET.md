# Cheat sheet: playwright-llm-eval-harness

## What I'm building

A Playwright + TypeScript test harness for an LLM customer-support chatbot (Northwind Support Bot, a small Express app in `app/`).

- **4 test layers:** `api` (validation, error contract), `e2e` (chat UI in Chromium), `security` (15 prompt-injection attacks), `eval` (26 golden cases, regex checks + LLM judge)
- **Seeded defects:** 4 known bugs I can switch on; `npm run defects` proves the harness catches each one
- **Two providers:** `mock` (free, deterministic, runs in CI on every push) and `anthropic` (real model, on demand)
- **Reporting:** Markdown summary of pass rate by category and flaky cases, posted to the CI run page

## Plans

- First real-model run and a saved baseline pass rate
- Judge calibration: hand-label ~15 replies, compare with the judge, write down agreement
- Flakiness: run each case 3 times, report pass rate per case
- 1–2 seeded defects only the judge can catch (e.g. polite but wrong)
- Langfuse (open source) to track token usage and cost per run
- Phase 2: multiple scorers, regression tracking between runs, evals on every PR, MCP tool-call evals

## Challenges

- **No API key yet**, so the real-model path, judge and flakiness tooling are built but untested
- **Real model ≠ mock:** checks that pass on the mock can fail on the real model (and the reverse)
- **Over-strict checks:** a case-insensitive regex failed a correct refusal; a "365 days" check failed a reply that was correcting it. Checks must test meaning, not just words
- **Leak canaries:** the mock leaked a `</knowledge_base>` tag, which tripped the leak test
- **Judge trust:** an LLM grading an LLM needs calibration before its scores mean anything
- **Cost:** real-model runs (especially repeats) use tokens; run them on purpose, not on every push

## Most used git commands

| Command | What it does |
|---|---|
| `git status` | What changed; run before every commit |
| `git pull` | Get the latest from GitHub |
| `git switch -c my-branch` | Make a new branch and move to it |
| `git switch main` | Go back to main |
| `git add file.ts` | Stage one file (safer than `git add .`) |
| `git diff --staged` | Check exactly what you're about to commit |
| `git commit -m "message"` | Save staged changes |
| `git push -u origin my-branch` | First push of a new branch |
| `git push` | Push later commits |
| `git log --oneline -10` | Last 10 commits, short |
| `git restore file.ts` | Throw away unstaged changes to a file |
| `git restore --staged file.ts` | Unstage a file (keeps your changes) |
| `git stash` / `git stash pop` | Set work aside / bring it back |
| `git branch -d my-branch` | Delete a merged branch |

**Safety:** never commit `.env` (it's in `.gitignore`; keep it there). Check `git diff --staged` for keys before every commit.
