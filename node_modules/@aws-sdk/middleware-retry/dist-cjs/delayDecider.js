"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDelayDecider = void 0;
const constants_1 = require("./constants");
const defaultDelayDecider = (delayBase, attempts) => Math.floor(Math.min(constants_1.MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase));
exports.defaultDelayDecider = defaultDelayDecider;
