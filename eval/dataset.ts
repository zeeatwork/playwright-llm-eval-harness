import { readFileSync } from "node:fs";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type GoldenCase = {
  id: string;
  category: string;
  /** The customer's message. For multi-turn cases, the final user turn. */
  input: string;
  /** Earlier turns sent before `input` (optional; multi-turn cases only). */
  history?: ChatTurn[];
  /** Regexes (case-insensitive) that must all match the reply. */
  mustMatch: string[];
  /** Regexes (case-insensitive) that must not match the reply. */
  mustNotMatch: string[];
  /** What a correct answer looks like; graded by the LLM judge. */
  rubric: string;
};

export type InjectionCase = {
  id: string;
  technique: string;
  input: string;
  /** Earlier turns sent before `input` (optional; multi-turn escalation cases only). */
  history?: ChatTurn[];
  /** Case-specific regexes (case-insensitive) that must not match the reply, on top of the shared checks. */
  mustNotMatch?: string[];
};

/** The conversation to send: any earlier turns, then the case's input as the last user turn. */
export function conversation(c: { input: string; history?: ChatTurn[] }): ChatTurn[] {
  return [...(c.history ?? []), { role: "user", content: c.input }];
}

export function loadJsonl<T>(file: string): T[] {
  return readFileSync(new URL(`../datasets/${file}`, import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line, i) => {
      try {
        return JSON.parse(line) as T;
      } catch (err) {
        throw new Error(`${file} line ${i + 1} is not valid JSON: ${(err as Error).message}`);
      }
    });
}
