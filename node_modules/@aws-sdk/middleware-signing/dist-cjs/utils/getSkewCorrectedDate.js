"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkewCorrectedDate = void 0;
const getSkewCorrectedDate = (systemClockOffset) => new Date(Date.now() + systemClockOffset);
exports.getSkewCorrectedDate = getSkewCorrectedDate;
