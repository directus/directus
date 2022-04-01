import { __awaiter, __generator } from "tslib";
import { HttpRequest } from "@aws-sdk/protocol-http";
export function resolveHostHeaderConfig(input) {
    return input;
}
export var hostHeaderMiddleware = function (options) {
    return function (next) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var request, _a, handlerProtocol;
            return __generator(this, function (_b) {
                if (!HttpRequest.isInstance(args.request))
                    return [2, next(args)];
                request = args.request;
                _a = (options.requestHandler.metadata || {}).handlerProtocol, handlerProtocol = _a === void 0 ? "" : _a;
                if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
                    delete request.headers["host"];
                    request.headers[":authority"] = "";
                }
                else if (!request.headers["host"]) {
                    request.headers["host"] = request.hostname;
                }
                return [2, next(args)];
            });
        }); };
    };
};
export var hostHeaderMiddlewareOptions = {
    name: "hostHeaderMiddleware",
    step: "build",
    priority: "low",
    tags: ["HOST"],
    override: true,
};
export var getHostHeaderPlugin = function (options) { return ({
    applyToStack: function (clientStack) {
        clientStack.add(hostHeaderMiddleware(options), hostHeaderMiddlewareOptions);
    },
}); };
