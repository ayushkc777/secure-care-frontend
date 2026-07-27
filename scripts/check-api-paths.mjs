import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const roots = ["src", "dist"];
const forbidden = "/api/v1/api/v1";

function files(root) {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

for (const root of roots) {
  for (const file of files(root)) {
    if (readFileSync(file).includes(forbidden)) {
      throw new Error(`Duplicated API prefix found in ${file}`);
    }
  }
}

const rawPrefixMatches = execFileSync(
  "rg",
  [
    "-n",
    "/api/v1",
    "src",
    "--glob",
    "*.ts",
    "--glob",
    "*.tsx",
    "--glob",
    "!*.test.ts",
    "--glob",
    "!*.test.tsx",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter((line) => !line.startsWith("src/app/env.ts:"));

if (rawPrefixMatches.length > 0) {
  throw new Error(`Feature code owns the API prefix:\n${rawPrefixMatches.join("\n")}`);
}

process.stdout.write("API path ownership check passed.\n");
