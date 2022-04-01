"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_RETRY_MODE_CONFIG_OPTIONS = exports.CONFIG_RETRY_MODE = exports.ENV_RETRY_MODE = exports.resolveRetryConfig = exports.NODE_MAX_ATTEMPT_CONFIG_OPTIONS = exports.CONFIG_MAX_ATTEMPTS = exports.ENV_MAX_ATTEMPTS = void 0;
const util_middleware_1 = require("@aws-sdk/util-middleware");
const AdaptiveRetryStrategy_1 = require("./AdaptiveRetryStrategy");
const config_1 = require("./config");
const StandardRetryStrategy_1 = require("./StandardRetryStrategy");
exports.ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
exports.CONFIG_MAX_ATTEMPTS = "max_attempts";
exports.NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => {
        const value = env[exports.ENV_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Environment variable ${exports.ENV_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    configFileSelector: (profile) => {
        const value = profile[exports.CONFIG_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Shared config file entry ${exports.CONFIG_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    default: config_1.DEFAULT_MAX_ATTEMPTS,
};
const resolveRetryConfig = (input) => {
    var _a;
    const maxAttempts = (0, util_middleware_1.normalizeProvider)((_a = input.maxAttempts) !== null && _a !== void 0 ? _a : config_1.DEFAULT_MAX_ATTEMPTS);
    return {
        ...input,
        maxAttempts,
        retryStrategy: async () => {
            if (input.retryStrategy) {
                return input.retryStrategy;
            }
            const retryMode = await (0, util_middleware_1.normalizeProvider)(input.retryMode)();
            if (retryMode === config_1.RETRY_MODES.ADAPTIVE) {
                return new AdaptiveRetryStrategy_1.AdaptiveRetryStrategy(maxAttempts);
            }
            return new StandardRetryStrategy_1.StandardRetryStrategy(maxAttempts);
        },
    };
};
exports.resolveRetryConfig = resolveRetryConfig;
exports.ENV_RETRY_MODE = "AWS_RETRY_MODE";
exports.CONFIG_RETRY_MODE = "retry_mode";
exports.NODE_RETRY_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[exports.ENV_RETRY_MODE],
    configFileSelector: (profile) => profile[exports.CONFIG_RETRY_MODE],
    default: config_1.DEFAULT_RETRY_MODE,
};
