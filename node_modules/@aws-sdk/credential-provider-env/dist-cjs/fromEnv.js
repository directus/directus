"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEnv = exports.ENV_EXPIRATION = exports.ENV_SESSION = exports.ENV_SECRET = exports.ENV_KEY = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
exports.ENV_KEY = "AWS_ACCESS_KEY_ID";
exports.ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
exports.ENV_SESSION = "AWS_SESSION_TOKEN";
exports.ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
const fromEnv = () => async () => {
    const accessKeyId = process.env[exports.ENV_KEY];
    const secretAccessKey = process.env[exports.ENV_SECRET];
    const sessionToken = process.env[exports.ENV_SESSION];
    const expiry = process.env[exports.ENV_EXPIRATION];
    if (accessKeyId && secretAccessKey) {
        return {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken && { sessionToken }),
            ...(expiry && { expiration: new Date(expiry) }),
        };
    }
    throw new property_provider_1.CredentialsProviderError("Unable to find environment variable credentials.");
};
exports.fromEnv = fromEnv;
