export function requestTimeout(timeoutInMs) {
    if (timeoutInMs === void 0) { timeoutInMs = 0; }
    return new Promise(function (resolve, reject) {
        if (timeoutInMs) {
            setTimeout(function () {
                var timeoutError = new Error("Request did not complete within ".concat(timeoutInMs, " ms"));
                timeoutError.name = "TimeoutError";
                reject(timeoutError);
            }, timeoutInMs);
        }
    });
}
