import { __assign, __awaiter, __generator } from "tslib";
import { normalizeProvider } from "@aws-sdk/util-middleware";
import { AdaptiveRetryStrategy } from "./AdaptiveRetryStrategy";
import { DEFAULT_MAX_ATTEMPTS, DEFAULT_RETRY_MODE, RETRY_MODES } from "./config";
import { StandardRetryStrategy } from "./StandardRetryStrategy";
export var ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
export var CONFIG_MAX_ATTEMPTS = "max_attempts";
export var NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) {
        var value = env[ENV_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        var maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error("Environment variable ".concat(ENV_MAX_ATTEMPTS, " mast be a number, got \"").concat(value, "\""));
        }
        return maxAttempt;
    },
    configFileSelector: function (profile) {
        var value = profile[CONFIG_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        var maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error("Shared config file entry ".concat(CONFIG_MAX_ATTEMPTS, " mast be a number, got \"").concat(value, "\""));
        }
        return maxAttempt;
    },
    default: DEFAULT_MAX_ATTEMPTS,
};
export var resolveRetryConfig = function (input) {
    var _a;
    var maxAttempts = normalizeProvider((_a = input.maxAttempts) !== null && _a !== void 0 ? _a : DEFAULT_MAX_ATTEMPTS);
    return __assign(__assign({}, input), { maxAttempts: maxAttempts, retryStrategy: function () { return __awaiter(void 0, void 0, void 0, function () {
            var retryMode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (input.retryStrategy) {
                            return [2, input.retryStrategy];
                        }
                        return [4, normalizeProvider(input.retryMode)()];
                    case 1:
                        retryMode = _a.sent();
                        if (retryMode === RETRY_MODES.ADAPTIVE) {
                            return [2, new AdaptiveRetryStrategy(maxAttempts)];
                        }
                        return [2, new StandardRetryStrategy(maxAttempts)];
                }
            });
        }); } });
};
export var ENV_RETRY_MODE = "AWS_RETRY_MODE";
export var CONFIG_RETRY_MODE = "retry_mode";
export var NODE_RETRY_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) { return env[ENV_RETRY_MODE]; },
    configFileSelector: function (profile) { return profile[CONFIG_RETRY_MODE]; },
    default: DEFAULT_RETRY_MODE,
};
