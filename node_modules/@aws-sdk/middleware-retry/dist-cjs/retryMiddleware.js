"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRetryPlugin = exports.retryMiddlewareOptions = exports.retryMiddleware = void 0;
const retryMiddleware = (options) => (next, context) => async (args) => {
    const retryStrategy = await options.retryStrategy();
    if (retryStrategy === null || retryStrategy === void 0 ? void 0 : retryStrategy.mode)
        context.userAgent = [...(context.userAgent || []), ["cfg/retry-mode", retryStrategy.mode]];
    return retryStrategy.retry(next, args);
};
exports.retryMiddleware = retryMiddleware;
exports.retryMiddlewareOptions = {
    name: "retryMiddleware",
    tags: ["RETRY"],
    step: "finalizeRequest",
    priority: "high",
    override: true,
};
const getRetryPlugin = (options) => ({
    applyToStack: (clientStack) => {
        clientStack.add((0, exports.retryMiddleware)(options), exports.retryMiddlewareOptions);
    },
});
exports.getRetryPlugin = getRetryPlugin;
