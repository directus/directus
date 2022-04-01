"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveStsAuthConfig = void 0;
const middleware_signing_1 = require("@aws-sdk/middleware-signing");
const resolveStsAuthConfig = (input, { stsClientCtor }) => (0, middleware_signing_1.resolveAwsAuthConfig)({
    ...input,
    stsClientCtor,
});
exports.resolveStsAuthConfig = resolveStsAuthConfig;
