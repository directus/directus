"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdatedSystemClockOffset = void 0;
const isClockSkewed_1 = require("./isClockSkewed");
const getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset) => {
    const clockTimeInMs = Date.parse(clockTime);
    if ((0, isClockSkewed_1.isClockSkewed)(clockTimeInMs, currentSystemClockOffset)) {
        return clockTimeInMs - Date.now();
    }
    return currentSystemClockOffset;
};
exports.getUpdatedSystemClockOffset = getUpdatedSystemClockOffset;
