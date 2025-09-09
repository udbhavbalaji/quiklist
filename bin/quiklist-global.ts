#!/usr/bin/env node

import { createRequire } from "module";
import { launchGlobalQuiklist } from "@v2/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const quiklist = launchGlobalQuiklist(version);

quiklist.parse(process.argv);
