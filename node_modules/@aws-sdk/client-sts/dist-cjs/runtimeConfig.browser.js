"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const tslib_1 = require("tslib");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
const sha256_browser_1 = require("@aws-crypto/sha256-browser");
const config_resolver_1 = require("@aws-sdk/config-resolver");
const fetch_http_handler_1 = require("@aws-sdk/fetch-http-handler");
const invalid_dependency_1 = require("@aws-sdk/invalid-dependency");
const middleware_retry_1 = require("@aws-sdk/middleware-retry");
const util_base64_browser_1 = require("@aws-sdk/util-base64-browser");
const util_body_length_browser_1 = require("@aws-sdk/util-body-length-browser");
const util_user_agent_browser_1 = require("@aws-sdk/util-user-agent-browser");
const util_utf8_browser_1 = require("@aws-sdk/util-utf8-browser");
const runtimeConfig_shared_1 = require("./runtimeConfig.shared");
const smithy_client_1 = require("@aws-sdk/smithy-client");
const util_defaults_mode_browser_1 = require("@aws-sdk/util-defaults-mode-browser");
const getRuntimeConfig = (config) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const defaultsMode = (0, util_defaults_mode_browser_1.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
    const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
    return {
        ...clientSharedValues,
        ...config,
        runtime: "browser",
        defaultsMode,
        base64Decoder: (_a = config === null || config === void 0 ? void 0 : config.base64Decoder) !== null && _a !== void 0 ? _a : util_base64_browser_1.fromBase64,
        base64Encoder: (_b = config === null || config === void 0 ? void 0 : config.base64Encoder) !== null && _b !== void 0 ? _b : util_base64_browser_1.toBase64,
        bodyLengthChecker: (_c = config === null || config === void 0 ? void 0 : config.bodyLengthChecker) !== null && _c !== void 0 ? _c : util_body_length_browser_1.calculateBodyLength,
        credentialDefaultProvider: (_d = config === null || config === void 0 ? void 0 : config.credentialDefaultProvider) !== null && _d !== void 0 ? _d : ((_) => () => Promise.reject(new Error("Credential is missing"))),
        defaultUserAgentProvider: (_e = config === null || config === void 0 ? void 0 : config.defaultUserAgentProvider) !== null && _e !== void 0 ? _e : (0, util_user_agent_browser_1.defaultUserAgent)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        maxAttempts: (_f = config === null || config === void 0 ? void 0 : config.maxAttempts) !== null && _f !== void 0 ? _f : middleware_retry_1.DEFAULT_MAX_ATTEMPTS,
        region: (_g = config === null || config === void 0 ? void 0 : config.region) !== null && _g !== void 0 ? _g : (0, invalid_dependency_1.invalidProvider)("Region is missing"),
        requestHandler: (_h = config === null || config === void 0 ? void 0 : config.requestHandler) !== null && _h !== void 0 ? _h : new fetch_http_handler_1.FetchHttpHandler(defaultConfigProvider),
        retryMode: (_j = config === null || config === void 0 ? void 0 : config.retryMode) !== null && _j !== void 0 ? _j : (async () => (await defaultConfigProvider()).retryMode || middleware_retry_1.DEFAULT_RETRY_MODE),
        sha256: (_k = config === null || config === void 0 ? void 0 : config.sha256) !== null && _k !== void 0 ? _k : sha256_browser_1.Sha256,
        streamCollector: (_l = config === null || config === void 0 ? void 0 : config.streamCollector) !== null && _l !== void 0 ? _l : fetch_http_handler_1.streamCollector,
        useDualstackEndpoint: (_m = config === null || config === void 0 ? void 0 : config.useDualstackEndpoint) !== null && _m !== void 0 ? _m : (() => Promise.resolve(config_resolver_1.DEFAULT_USE_DUALSTACK_ENDPOINT)),
        useFipsEndpoint: (_o = config === null || config === void 0 ? void 0 : config.useFipsEndpoint) !== null && _o !== void 0 ? _o : (() => Promise.resolve(config_resolver_1.DEFAULT_USE_FIPS_ENDPOINT)),
        utf8Decoder: (_p = config === null || config === void 0 ? void 0 : config.utf8Decoder) !== null && _p !== void 0 ? _p : util_utf8_browser_1.fromUtf8,
        utf8Encoder: (_q = config === null || config === void 0 ? void 0 : config.utf8Encoder) !== null && _q !== void 0 ? _q : util_utf8_browser_1.toUtf8,
    };
};
exports.getRuntimeConfig = getRuntimeConfig;
