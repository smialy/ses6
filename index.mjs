#!/usr/bin/env node

require = require("@std/esm")(module)
module.exports = require("./libs/main.mjs").default
// import './libs/main';
