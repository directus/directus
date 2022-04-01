"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOServiceException = void 0;
const smithy_client_1 = require("@aws-sdk/smithy-client");
class SSOServiceException extends smithy_client_1.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SSOServiceException.prototype);
    }
}
exports.SSOServiceException = SSOServiceException;
