#!/usr/bin/env node

import launchQuiklist from "@/index";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const quikList = launchQuiklist(version);

quikList.parse(process.argv);
