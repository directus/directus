export var DEFAULT_TIMEOUT = 1000;
export var DEFAULT_MAX_RETRIES = 0;
export var providerConfigFromInit = function (_a) {
    var _b = _a.maxRetries, maxRetries = _b === void 0 ? DEFAULT_MAX_RETRIES : _b, _c = _a.timeout, timeout = _c === void 0 ? DEFAULT_TIMEOUT : _c;
    return ({ maxRetries: maxRetries, timeout: timeout });
};
