import { __assign } from "tslib";
import { normalizeProvider } from "@aws-sdk/util-middleware";
export var resolveCustomEndpointsConfig = function (input) {
    var _a;
    var endpoint = input.endpoint, urlParser = input.urlParser;
    return __assign(__assign({}, input), { tls: (_a = input.tls) !== null && _a !== void 0 ? _a : true, endpoint: normalizeProvider(typeof endpoint === "string" ? urlParser(endpoint) : endpoint), isCustomEndpoint: true, useDualstackEndpoint: normalizeProvider(input.useDualstackEndpoint) });
};
