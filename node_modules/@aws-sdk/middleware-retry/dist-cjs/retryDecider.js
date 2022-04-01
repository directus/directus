"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRetryDecider = void 0;
const service_error_classification_1 = require("@aws-sdk/service-error-classification");
const defaultRetryDecider = (error) => {
    if (!error) {
        return false;
    }
    return (0, service_error_classification_1.isRetryableByTrait)(error) || (0, service_error_classification_1.isClockSkewError)(error) || (0, service_error_classification_1.isThrottlingError)(error) || (0, service_error_classification_1.isTransientError)(error);
};
exports.defaultRetryDecider = defaultRetryDecider;
