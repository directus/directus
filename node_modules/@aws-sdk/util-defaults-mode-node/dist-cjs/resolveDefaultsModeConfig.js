"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDefaultsModeConfig = void 0;
const config_resolver_1 = require("@aws-sdk/config-resolver");
const credential_provider_imds_1 = require("@aws-sdk/credential-provider-imds");
const node_config_provider_1 = require("@aws-sdk/node-config-provider");
const property_provider_1 = require("@aws-sdk/property-provider");
const constants_1 = require("./constants");
const defaultsModeConfig_1 = require("./defaultsModeConfig");
const resolveDefaultsModeConfig = ({ region = (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS), defaultsMode = (0, node_config_provider_1.loadConfig)(defaultsModeConfig_1.NODE_DEFAULTS_MODE_CONFIG_OPTIONS), } = {}) => (0, property_provider_1.memoize)(async () => {
    const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
    switch (mode === null || mode === void 0 ? void 0 : mode.toLowerCase()) {
        case "auto":
            return resolveNodeDefaultsModeAuto(region);
        case "in-region":
        case "cross-region":
        case "mobile":
        case "standard":
        case "legacy":
            return Promise.resolve(mode === null || mode === void 0 ? void 0 : mode.toLocaleLowerCase());
        case undefined:
            return Promise.resolve("legacy");
        default:
            throw new Error(`Invalid parameter for "defaultsMode", expect ${constants_1.DEFAULTS_MODE_OPTIONS.join(", ")}, got ${mode}`);
    }
});
exports.resolveDefaultsModeConfig = resolveDefaultsModeConfig;
const resolveNodeDefaultsModeAuto = async (clientRegion) => {
    if (clientRegion) {
        const resolvedRegion = typeof clientRegion === "function" ? await clientRegion() : clientRegion;
        const inferredRegion = await inferPhysicalRegion();
        if (!inferredRegion) {
            return "standard";
        }
        if (resolvedRegion === inferredRegion) {
            return "in-region";
        }
        else {
            return "cross-region";
        }
    }
    return "standard";
};
const inferPhysicalRegion = async () => {
    var _a;
    if (process.env[constants_1.AWS_EXECUTION_ENV] && (process.env[constants_1.AWS_REGION_ENV] || process.env[constants_1.AWS_DEFAULT_REGION_ENV])) {
        return (_a = process.env[constants_1.AWS_REGION_ENV]) !== null && _a !== void 0 ? _a : process.env[constants_1.AWS_DEFAULT_REGION_ENV];
    }
    if (!process.env[constants_1.ENV_IMDS_DISABLED]) {
        try {
            const endpoint = await (0, credential_provider_imds_1.getInstanceMetadataEndpoint)();
            return (await (0, credential_provider_imds_1.httpRequest)({ ...endpoint, path: constants_1.IMDS_REGION_PATH })).toString();
        }
        catch (e) {
        }
    }
};
