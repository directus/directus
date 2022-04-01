"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsProviderError = void 0;
const ProviderError_1 = require("./ProviderError");
class CredentialsProviderError extends ProviderError_1.ProviderError {
    constructor(message, tryNextLink = true) {
        super(message, tryNextLink);
        this.tryNextLink = tryNextLink;
        this.name = "CredentialsProviderError";
        Object.setPrototypeOf(this, CredentialsProviderError.prototype);
    }
}
exports.CredentialsProviderError = CredentialsProviderError;
