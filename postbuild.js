// patch-package-json-path.mjs
import fs from "fs";
import path from "path";

const targetFile = path.resolve("dist/bin/quiklist.js");
const originalLine = `require("../package.json")`;
const replacementLine = `require("../../package.json")`;

let content = fs.readFileSync(targetFile, "utf-8");

if (content.includes(originalLine)) {
  content = content.replace(originalLine, replacementLine);
  fs.writeFileSync(targetFile, content);
  console.log("✅ Patched package.json path in dist/bin/app.js");
} else {
  console.warn("⚠️ Could not find package.json require line to patch.");
}
