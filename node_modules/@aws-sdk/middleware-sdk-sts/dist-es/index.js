import { __assign } from "tslib";
import { resolveAwsAuthConfig } from "@aws-sdk/middleware-signing";
export var resolveStsAuthConfig = function (input, _a) {
    var stsClientCtor = _a.stsClientCtor;
    return resolveAwsAuthConfig(__assign(__assign({}, input), { stsClientCtor: stsClientCtor }));
};
