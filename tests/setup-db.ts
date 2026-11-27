import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/** Legt eine frische, separate SQLite-Test-DB an (prisma/test.db); die Entwicklungs-DB bleibt unberührt. */
export default function setup() {
  for (const f of ["test.db", "test.db-journal"]) rmSync(path.join("prisma", f), { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
