export var setConnectionTimeout = function (request, reject, timeoutInMs) {
    if (timeoutInMs === void 0) { timeoutInMs = 0; }
    if (!timeoutInMs) {
        return;
    }
    request.on("socket", function (socket) {
        if (socket.connecting) {
            var timeoutId_1 = setTimeout(function () {
                request.destroy();
                reject(Object.assign(new Error("Socket timed out without establishing a connection within ".concat(timeoutInMs, " ms")), {
                    name: "TimeoutError",
                }));
            }, timeoutInMs);
            socket.on("connect", function () {
                clearTimeout(timeoutId_1);
            });
        }
    });
};
