import { readFileSync } from "node:fs";

export type GoldenCase = {
  id: string;
  category: string;
  input: string;
  /** Regexes (case-insensitive) that must all match the reply. */
  mustMatch: string[];
  /** Regexes (case-insensitive) that must not match the reply. */
  mustNotMatch: string[];
  /** What a correct answer looks like; graded by the LLM judge. */
  rubric: string;
};

export type InjectionCase = { id: string; technique: string; input: string };

export function loadJsonl<T>(file: string): T[] {
  return readFileSync(new URL(`../datasets/${file}`, import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T);
}
