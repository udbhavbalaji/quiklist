#!/usr/bin/env node

import launchQuiklist from "../src/index";

const quikList = launchQuiklist();

quikList.parse(process.argv);
