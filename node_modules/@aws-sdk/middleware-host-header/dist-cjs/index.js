"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostHeaderPlugin = exports.hostHeaderMiddlewareOptions = exports.hostHeaderMiddleware = exports.resolveHostHeaderConfig = void 0;
const protocol_http_1 = require("@aws-sdk/protocol-http");
function resolveHostHeaderConfig(input) {
    return input;
}
exports.resolveHostHeaderConfig = resolveHostHeaderConfig;
const hostHeaderMiddleware = (options) => (next) => async (args) => {
    if (!protocol_http_1.HttpRequest.isInstance(args.request))
        return next(args);
    const { request } = args;
    const { handlerProtocol = "" } = options.requestHandler.metadata || {};
    if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
        delete request.headers["host"];
        request.headers[":authority"] = "";
    }
    else if (!request.headers["host"]) {
        request.headers["host"] = request.hostname;
    }
    return next(args);
};
exports.hostHeaderMiddleware = hostHeaderMiddleware;
exports.hostHeaderMiddlewareOptions = {
    name: "hostHeaderMiddleware",
    step: "build",
    priority: "low",
    tags: ["HOST"],
    override: true,
};
const getHostHeaderPlugin = (options) => ({
    applyToStack: (clientStack) => {
        clientStack.add((0, exports.hostHeaderMiddleware)(options), exports.hostHeaderMiddlewareOptions);
    },
});
exports.getHostHeaderPlugin = getHostHeaderPlugin;
