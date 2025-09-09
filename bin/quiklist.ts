#!/usr/bin/env node

import { createRequire } from "module";

// import launchQuiklist from "@v1/index";
import { launchQuiklist } from "@v2/index";

const require = createRequire(import.meta.url);

const { version } = require("../package.json");

const quikList = launchQuiklist(version);

quikList.parse(process.argv);
