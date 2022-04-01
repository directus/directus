"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClockSkewed = void 0;
const getSkewCorrectedDate_1 = require("./getSkewCorrectedDate");
const isClockSkewed = (clockTime, systemClockOffset) => Math.abs((0, getSkewCorrectedDate_1.getSkewCorrectedDate)(systemClockOffset).getTime() - clockTime) >= 300000;
exports.isClockSkewed = isClockSkewed;
