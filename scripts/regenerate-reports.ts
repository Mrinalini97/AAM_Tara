import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }

  const { regenerateCompletedReflections } = await import("../src/lib/admin/regenerate-reports");
  const result = await regenerateCompletedReflections();
  console.log(JSON.stringify(result, null, 2));
  if (result.failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
