import { cpSync, mkdirSync, readdirSync } from "node:fs";

const source = new URL("../demos/usc-map/", import.meta.url);
const output = new URL("../web/public/campus/", import.meta.url);
mkdirSync(output, { recursive: true });
for (const entry of readdirSync(source, { withFileTypes: true })) {
  if (
    entry.name === "assets" ||
    (entry.isFile() &&
      /\.(html|css|js|json)$/.test(entry.name) &&
      entry.name !== "package.json")
  )
    cpSync(new URL(entry.name, source), new URL(entry.name, output), {
      recursive: true,
    });
}
console.log("Campus map and assets copied to web/public/campus.");
