"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultRetryQuota = void 0;
const constants_1 = require("./constants");
const getDefaultRetryQuota = (initialRetryTokens, options) => {
    var _a, _b, _c;
    const MAX_CAPACITY = initialRetryTokens;
    const noRetryIncrement = (_a = options === null || options === void 0 ? void 0 : options.noRetryIncrement) !== null && _a !== void 0 ? _a : constants_1.NO_RETRY_INCREMENT;
    const retryCost = (_b = options === null || options === void 0 ? void 0 : options.retryCost) !== null && _b !== void 0 ? _b : constants_1.RETRY_COST;
    const timeoutRetryCost = (_c = options === null || options === void 0 ? void 0 : options.timeoutRetryCost) !== null && _c !== void 0 ? _c : constants_1.TIMEOUT_RETRY_COST;
    let availableCapacity = initialRetryTokens;
    const getCapacityAmount = (error) => (error.name === "TimeoutError" ? timeoutRetryCost : retryCost);
    const hasRetryTokens = (error) => getCapacityAmount(error) <= availableCapacity;
    const retrieveRetryTokens = (error) => {
        if (!hasRetryTokens(error)) {
            throw new Error("No retry token available");
        }
        const capacityAmount = getCapacityAmount(error);
        availableCapacity -= capacityAmount;
        return capacityAmount;
    };
    const releaseRetryTokens = (capacityReleaseAmount) => {
        availableCapacity += capacityReleaseAmount !== null && capacityReleaseAmount !== void 0 ? capacityReleaseAmount : noRetryIncrement;
        availableCapacity = Math.min(availableCapacity, MAX_CAPACITY);
    };
    return Object.freeze({
        hasRetryTokens,
        retrieveRetryTokens,
        releaseRetryTokens,
    });
};
exports.getDefaultRetryQuota = getDefaultRetryQuota;
