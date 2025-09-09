// patch-package-json-path.mjs
import fs from "fs";
import path from "path";

const qlBinFile = path.resolve("dist/bin/quiklist.js");
const qlGlobBinFile = path.resolve("dist/bin/quiklist-global.js");
const originalLine = `require("../package.json")`;
const replacementLine = `require("../../package.json")`;

let localBincontent = fs.readFileSync(qlBinFile, "utf-8");
let globBincontent = fs.readFileSync(qlGlobBinFile, "utf-8");

if (localBincontent.includes(originalLine)) {
  localBincontent = localBincontent.replace(originalLine, replacementLine);
  fs.writeFileSync(qlBinFile, localBincontent);
  console.log("✅ Patched package.json path in dist/bin/quiklist.js");
} else {
  console.warn("⚠️ Could not find package.json require line to patch.");
  process.exit(1);
}
if (globBincontent.includes(originalLine)) {
  globBincontent = globBincontent.replace(originalLine, replacementLine);
  fs.writeFileSync(qlGlobBinFile, globBincontent);
  console.log("✅ Patched package.json path in dist/bin/quiklist-global.js");
} else {
  console.warn("⚠️ Could not find package.json require line to patch.");
  process.exit(1);
}
