import { __assign, __awaiter, __generator, __read, __spreadArray } from "tslib";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SPACE, UA_ESCAPE_REGEX, USER_AGENT, X_AMZ_USER_AGENT } from "./constants";
export var userAgentMiddleware = function (options) {
    return function (next, context) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var request, headers, userAgent, defaultUserAgent, customUserAgent, sdkUserAgentValue, normalUAValue;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        request = args.request;
                        if (!HttpRequest.isInstance(request))
                            return [2, next(args)];
                        headers = request.headers;
                        userAgent = ((_a = context === null || context === void 0 ? void 0 : context.userAgent) === null || _a === void 0 ? void 0 : _a.map(escapeUserAgent)) || [];
                        return [4, options.defaultUserAgentProvider()];
                    case 1:
                        defaultUserAgent = (_c.sent()).map(escapeUserAgent);
                        customUserAgent = ((_b = options === null || options === void 0 ? void 0 : options.customUserAgent) === null || _b === void 0 ? void 0 : _b.map(escapeUserAgent)) || [];
                        sdkUserAgentValue = __spreadArray(__spreadArray(__spreadArray([], __read(defaultUserAgent), false), __read(userAgent), false), __read(customUserAgent), false).join(SPACE);
                        normalUAValue = __spreadArray(__spreadArray([], __read(defaultUserAgent.filter(function (section) { return section.startsWith("aws-sdk-"); })), false), __read(customUserAgent), false).join(SPACE);
                        if (options.runtime !== "browser") {
                            if (normalUAValue) {
                                headers[X_AMZ_USER_AGENT] = headers[X_AMZ_USER_AGENT]
                                    ? "".concat(headers[USER_AGENT], " ").concat(normalUAValue)
                                    : normalUAValue;
                            }
                            headers[USER_AGENT] = sdkUserAgentValue;
                        }
                        else {
                            headers[X_AMZ_USER_AGENT] = sdkUserAgentValue;
                        }
                        return [2, next(__assign(__assign({}, args), { request: request }))];
                }
            });
        }); };
    };
};
var escapeUserAgent = function (_a) {
    var _b = __read(_a, 2), name = _b[0], version = _b[1];
    var prefixSeparatorIndex = name.indexOf("/");
    var prefix = name.substring(0, prefixSeparatorIndex);
    var uaName = name.substring(prefixSeparatorIndex + 1);
    if (prefix === "api") {
        uaName = uaName.toLowerCase();
    }
    return [prefix, uaName, version]
        .filter(function (item) { return item && item.length > 0; })
        .map(function (item) { return item === null || item === void 0 ? void 0 : item.replace(UA_ESCAPE_REGEX, "_"); })
        .join("/");
};
export var getUserAgentMiddlewareOptions = {
    name: "getUserAgentMiddleware",
    step: "build",
    priority: "low",
    tags: ["SET_USER_AGENT", "USER_AGENT"],
    override: true,
};
export var getUserAgentPlugin = function (config) { return ({
    applyToStack: function (clientStack) {
        clientStack.add(userAgentMiddleware(config), getUserAgentMiddlewareOptions);
    },
}); };
