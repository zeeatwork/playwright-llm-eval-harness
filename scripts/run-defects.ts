// Mutation-style check for the harness itself: switch on each seeded defect and
// assert that at least one suite fails. A defect that stays green means a coverage gap.
import { spawnSync } from "node:child_process";
import { DEFECTS, type DefectName } from "../app/src/defects.js";

const projects = ["api", "security", "e2e", "eval"];
let gaps = 0;

for (const [i, name] of (Object.keys(DEFECTS) as DefectName[]).entries()) {
  const port = String(3100 + i);
  const run = spawnSync("npx", ["playwright", "test", ...projects.flatMap((p) => ["--project", p]), "--reporter=dot"], {
    env: { ...process.env, DEFECTS: name, PORT: port },
    encoding: "utf8",
  });
  const caught = run.status !== 0;
  if (!caught) gaps++;
  console.log(`${caught ? "CAUGHT " : "MISSED "} ${name.padEnd(20)} ${DEFECTS[name]}`);
}

console.log(gaps ? `\n${gaps} seeded defect(s) escaped the harness.` : "\nAll seeded defects were caught.");
process.exit(gaps ? 1 : 0);
