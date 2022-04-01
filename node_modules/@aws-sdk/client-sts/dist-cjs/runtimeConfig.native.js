"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const sha256_js_1 = require("@aws-crypto/sha256-js");
const runtimeConfig_browser_1 = require("./runtimeConfig.browser");
const getRuntimeConfig = (config) => {
    var _a;
    const browserDefaults = (0, runtimeConfig_browser_1.getRuntimeConfig)(config);
    return {
        ...browserDefaults,
        ...config,
        runtime: "react-native",
        sha256: (_a = config === null || config === void 0 ? void 0 : config.sha256) !== null && _a !== void 0 ? _a : sha256_js_1.Sha256,
    };
};
exports.getRuntimeConfig = getRuntimeConfig;
