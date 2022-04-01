import { isClockSkewed } from "./isClockSkewed";
export var getUpdatedSystemClockOffset = function (clockTime, currentSystemClockOffset) {
    var clockTimeInMs = Date.parse(clockTime);
    if (isClockSkewed(clockTimeInMs, currentSystemClockOffset)) {
        return clockTimeInMs - Date.now();
    }
    return currentSystemClockOffset;
};
