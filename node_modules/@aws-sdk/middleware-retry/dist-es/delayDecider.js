import { MAXIMUM_RETRY_DELAY } from "./constants";
export var defaultDelayDecider = function (delayBase, attempts) {
    return Math.floor(Math.min(MAXIMUM_RETRY_DELAY, Math.random() * Math.pow(2, attempts) * delayBase));
};
