#!/usr/bin/env node

import launchQuiklist from "@/index";

const quikList = launchQuiklist();

quikList.parse(process.argv);
