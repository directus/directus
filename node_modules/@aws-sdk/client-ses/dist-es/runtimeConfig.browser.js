import { __assign, __awaiter, __generator } from "tslib";
import packageInfo from "../package.json";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { DEFAULT_USE_DUALSTACK_ENDPOINT, DEFAULT_USE_FIPS_ENDPOINT } from "@aws-sdk/config-resolver";
import { FetchHttpHandler as RequestHandler, streamCollector } from "@aws-sdk/fetch-http-handler";
import { invalidProvider } from "@aws-sdk/invalid-dependency";
import { DEFAULT_MAX_ATTEMPTS, DEFAULT_RETRY_MODE } from "@aws-sdk/middleware-retry";
import { fromBase64, toBase64 } from "@aws-sdk/util-base64-browser";
import { calculateBodyLength } from "@aws-sdk/util-body-length-browser";
import { defaultUserAgent } from "@aws-sdk/util-user-agent-browser";
import { fromUtf8, toUtf8 } from "@aws-sdk/util-utf8-browser";
import { getRuntimeConfig as getSharedRuntimeConfig } from "./runtimeConfig.shared";
import { loadConfigsForDefaultMode } from "@aws-sdk/smithy-client";
import { resolveDefaultsModeConfig } from "@aws-sdk/util-defaults-mode-browser";
export var getRuntimeConfig = function (config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    var defaultsMode = resolveDefaultsModeConfig(config);
    var defaultConfigProvider = function () { return defaultsMode().then(loadConfigsForDefaultMode); };
    var clientSharedValues = getSharedRuntimeConfig(config);
    return __assign(__assign(__assign({}, clientSharedValues), config), { runtime: "browser", defaultsMode: defaultsMode, base64Decoder: (_a = config === null || config === void 0 ? void 0 : config.base64Decoder) !== null && _a !== void 0 ? _a : fromBase64, base64Encoder: (_b = config === null || config === void 0 ? void 0 : config.base64Encoder) !== null && _b !== void 0 ? _b : toBase64, bodyLengthChecker: (_c = config === null || config === void 0 ? void 0 : config.bodyLengthChecker) !== null && _c !== void 0 ? _c : calculateBodyLength, credentialDefaultProvider: (_d = config === null || config === void 0 ? void 0 : config.credentialDefaultProvider) !== null && _d !== void 0 ? _d : (function (_) { return function () { return Promise.reject(new Error("Credential is missing")); }; }), defaultUserAgentProvider: (_e = config === null || config === void 0 ? void 0 : config.defaultUserAgentProvider) !== null && _e !== void 0 ? _e : defaultUserAgent({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }), maxAttempts: (_f = config === null || config === void 0 ? void 0 : config.maxAttempts) !== null && _f !== void 0 ? _f : DEFAULT_MAX_ATTEMPTS, region: (_g = config === null || config === void 0 ? void 0 : config.region) !== null && _g !== void 0 ? _g : invalidProvider("Region is missing"), requestHandler: (_h = config === null || config === void 0 ? void 0 : config.requestHandler) !== null && _h !== void 0 ? _h : new RequestHandler(defaultConfigProvider), retryMode: (_j = config === null || config === void 0 ? void 0 : config.retryMode) !== null && _j !== void 0 ? _j : (function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, defaultConfigProvider()];
                case 1: return [2, (_a.sent()).retryMode || DEFAULT_RETRY_MODE];
            }
        }); }); }), sha256: (_k = config === null || config === void 0 ? void 0 : config.sha256) !== null && _k !== void 0 ? _k : Sha256, streamCollector: (_l = config === null || config === void 0 ? void 0 : config.streamCollector) !== null && _l !== void 0 ? _l : streamCollector, useDualstackEndpoint: (_m = config === null || config === void 0 ? void 0 : config.useDualstackEndpoint) !== null && _m !== void 0 ? _m : (function () { return Promise.resolve(DEFAULT_USE_DUALSTACK_ENDPOINT); }), useFipsEndpoint: (_o = config === null || config === void 0 ? void 0 : config.useFipsEndpoint) !== null && _o !== void 0 ? _o : (function () { return Promise.resolve(DEFAULT_USE_FIPS_ENDPOINT); }), utf8Decoder: (_p = config === null || config === void 0 ? void 0 : config.utf8Decoder) !== null && _p !== void 0 ? _p : fromUtf8, utf8Encoder: (_q = config === null || config === void 0 ? void 0 : config.utf8Encoder) !== null && _q !== void 0 ? _q : toUtf8 });
};
