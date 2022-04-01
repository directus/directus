import { __assign, __awaiter, __generator } from "tslib";
import { NODE_REGION_CONFIG_OPTIONS } from "@aws-sdk/config-resolver";
import { getInstanceMetadataEndpoint, httpRequest } from "@aws-sdk/credential-provider-imds";
import { loadConfig } from "@aws-sdk/node-config-provider";
import { memoize } from "@aws-sdk/property-provider";
import { AWS_DEFAULT_REGION_ENV, AWS_EXECUTION_ENV, AWS_REGION_ENV, DEFAULTS_MODE_OPTIONS, ENV_IMDS_DISABLED, IMDS_REGION_PATH, } from "./constants";
import { NODE_DEFAULTS_MODE_CONFIG_OPTIONS } from "./defaultsModeConfig";
export var resolveDefaultsModeConfig = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.region, region = _c === void 0 ? loadConfig(NODE_REGION_CONFIG_OPTIONS) : _c, _d = _b.defaultsMode, defaultsMode = _d === void 0 ? loadConfig(NODE_DEFAULTS_MODE_CONFIG_OPTIONS) : _d;
    return memoize(function () { return __awaiter(void 0, void 0, void 0, function () {
        var mode, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(typeof defaultsMode === "function")) return [3, 2];
                    return [4, defaultsMode()];
                case 1:
                    _a = _b.sent();
                    return [3, 3];
                case 2:
                    _a = defaultsMode;
                    _b.label = 3;
                case 3:
                    mode = _a;
                    switch (mode === null || mode === void 0 ? void 0 : mode.toLowerCase()) {
                        case "auto":
                            return [2, resolveNodeDefaultsModeAuto(region)];
                        case "in-region":
                        case "cross-region":
                        case "mobile":
                        case "standard":
                        case "legacy":
                            return [2, Promise.resolve(mode === null || mode === void 0 ? void 0 : mode.toLocaleLowerCase())];
                        case undefined:
                            return [2, Promise.resolve("legacy")];
                        default:
                            throw new Error("Invalid parameter for \"defaultsMode\", expect ".concat(DEFAULTS_MODE_OPTIONS.join(", "), ", got ").concat(mode));
                    }
                    return [2];
            }
        });
    }); });
};
var resolveNodeDefaultsModeAuto = function (clientRegion) { return __awaiter(void 0, void 0, void 0, function () {
    var resolvedRegion, _a, inferredRegion;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!clientRegion) return [3, 5];
                if (!(typeof clientRegion === "function")) return [3, 2];
                return [4, clientRegion()];
            case 1:
                _a = _b.sent();
                return [3, 3];
            case 2:
                _a = clientRegion;
                _b.label = 3;
            case 3:
                resolvedRegion = _a;
                return [4, inferPhysicalRegion()];
            case 4:
                inferredRegion = _b.sent();
                if (!inferredRegion) {
                    return [2, "standard"];
                }
                if (resolvedRegion === inferredRegion) {
                    return [2, "in-region"];
                }
                else {
                    return [2, "cross-region"];
                }
                _b.label = 5;
            case 5: return [2, "standard"];
        }
    });
}); };
var inferPhysicalRegion = function () { return __awaiter(void 0, void 0, void 0, function () {
    var endpoint, e_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (process.env[AWS_EXECUTION_ENV] && (process.env[AWS_REGION_ENV] || process.env[AWS_DEFAULT_REGION_ENV])) {
                    return [2, (_a = process.env[AWS_REGION_ENV]) !== null && _a !== void 0 ? _a : process.env[AWS_DEFAULT_REGION_ENV]];
                }
                if (!!process.env[ENV_IMDS_DISABLED]) return [3, 5];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4, getInstanceMetadataEndpoint()];
            case 2:
                endpoint = _b.sent();
                return [4, httpRequest(__assign(__assign({}, endpoint), { path: IMDS_REGION_PATH }))];
            case 3: return [2, (_b.sent()).toString()];
            case 4:
                e_1 = _b.sent();
                return [3, 5];
            case 5: return [2];
        }
    });
}); };
