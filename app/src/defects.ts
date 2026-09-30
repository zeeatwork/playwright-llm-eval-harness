// Seeded defects: deliberate bugs you can switch on to prove the harness catches them.
// Enable with DEFECTS=stale-kb,leaky-prompt (comma-separated). Each one names the suite that should go red.

export const DEFECTS = {
  "stale-kb": "Knowledge base says returns are accepted for 60 days instead of 30 (caught by: eval, e2e)",
  "leaky-prompt": "System prompt loses its confidentiality rule, so it can be extracted (caught by: security)",
  "no-length-guard": "API accepts messages over the 2000-character limit (caught by: api)",
  "ui-swallows-errors": "Chat UI shows nothing when the API fails (caught by: e2e)",
} as const;

export type DefectName = keyof typeof DEFECTS;

export function activeDefects(env = process.env.DEFECTS): Set<DefectName> {
  const names = (env ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const name of names) {
    if (!(name in DEFECTS)) throw new Error(`Unknown defect "${name}". Known: ${Object.keys(DEFECTS).join(", ")}`);
  }
  return new Set(names as DefectName[]);
}
