export var setSocketTimeout = function (request, reject, timeoutInMs) {
    if (timeoutInMs === void 0) { timeoutInMs = 0; }
    request.setTimeout(timeoutInMs, function () {
        request.destroy();
        reject(Object.assign(new Error("Connection timed out after ".concat(timeoutInMs, " ms")), { name: "TimeoutError" }));
    });
};
