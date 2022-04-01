import { __assign } from "tslib";
import { Sha256 } from "@aws-crypto/sha256-js";
import { getRuntimeConfig as getBrowserRuntimeConfig } from "./runtimeConfig.browser";
export var getRuntimeConfig = function (config) {
    var _a;
    var browserDefaults = getBrowserRuntimeConfig(config);
    return __assign(__assign(__assign({}, browserDefaults), config), { runtime: "react-native", sha256: (_a = config === null || config === void 0 ? void 0 : config.sha256) !== null && _a !== void 0 ? _a : Sha256 });
};
