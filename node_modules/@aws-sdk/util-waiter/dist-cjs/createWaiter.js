"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWaiter = void 0;
const poller_1 = require("./poller");
const utils_1 = require("./utils");
const waiter_1 = require("./waiter");
const abortTimeout = async (abortSignal) => {
    return new Promise((resolve) => {
        abortSignal.onabort = () => resolve({ state: waiter_1.WaiterState.ABORTED });
    });
};
const createWaiter = async (options, input, acceptorChecks) => {
    const params = {
        ...waiter_1.waiterServiceDefaults,
        ...options,
    };
    (0, utils_1.validateWaiterOptions)(params);
    const exitConditions = [(0, poller_1.runPolling)(params, input, acceptorChecks)];
    if (options.abortController) {
        exitConditions.push(abortTimeout(options.abortController.signal));
    }
    if (options.abortSignal) {
        exitConditions.push(abortTimeout(options.abortSignal));
    }
    return Promise.race(exitConditions);
};
exports.createWaiter = createWaiter;
