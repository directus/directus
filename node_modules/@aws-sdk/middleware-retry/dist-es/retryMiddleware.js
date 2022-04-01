import { __awaiter, __generator, __read, __spreadArray } from "tslib";
export var retryMiddleware = function (options) {
    return function (next, context) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var retryStrategy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, options.retryStrategy()];
                    case 1:
                        retryStrategy = _a.sent();
                        if (retryStrategy === null || retryStrategy === void 0 ? void 0 : retryStrategy.mode)
                            context.userAgent = __spreadArray(__spreadArray([], __read((context.userAgent || [])), false), [["cfg/retry-mode", retryStrategy.mode]], false);
                        return [2, retryStrategy.retry(next, args)];
                }
            });
        }); };
    };
};
export var retryMiddlewareOptions = {
    name: "retryMiddleware",
    tags: ["RETRY"],
    step: "finalizeRequest",
    priority: "high",
    override: true,
};
export var getRetryPlugin = function (options) { return ({
    applyToStack: function (clientStack) {
        clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
    },
}); };
