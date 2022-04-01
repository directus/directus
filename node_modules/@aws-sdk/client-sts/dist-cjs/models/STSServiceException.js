"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STSServiceException = void 0;
const smithy_client_1 = require("@aws-sdk/smithy-client");
class STSServiceException extends smithy_client_1.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, STSServiceException.prototype);
    }
}
exports.STSServiceException = STSServiceException;
