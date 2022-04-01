import { getSkewCorrectedDate } from "./getSkewCorrectedDate";
export var isClockSkewed = function (clockTime, systemClockOffset) {
    return Math.abs(getSkewCorrectedDate(systemClockOffset).getTime() - clockTime) >= 300000;
};
