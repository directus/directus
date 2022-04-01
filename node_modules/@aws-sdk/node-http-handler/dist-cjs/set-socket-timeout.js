"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketTimeout = void 0;
const setSocketTimeout = (request, reject, timeoutInMs = 0) => {
    request.setTimeout(timeoutInMs, () => {
        request.destroy();
        reject(Object.assign(new Error(`Connection timed out after ${timeoutInMs} ms`), { name: "TimeoutError" }));
    });
};
exports.setSocketTimeout = setSocketTimeout;
