"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerConfigFromInit = exports.DEFAULT_MAX_RETRIES = exports.DEFAULT_TIMEOUT = void 0;
exports.DEFAULT_TIMEOUT = 1000;
exports.DEFAULT_MAX_RETRIES = 0;
const providerConfigFromInit = ({ maxRetries = exports.DEFAULT_MAX_RETRIES, timeout = exports.DEFAULT_TIMEOUT, }) => ({ maxRetries, timeout });
exports.providerConfigFromInit = providerConfigFromInit;
