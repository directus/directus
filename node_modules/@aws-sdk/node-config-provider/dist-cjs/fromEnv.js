"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEnv = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const fromEnv = (envVarSelector) => async () => {
    try {
        const config = envVarSelector(process.env);
        if (config === undefined) {
            throw new Error();
        }
        return config;
    }
    catch (e) {
        throw new property_provider_1.CredentialsProviderError(e.message || `Cannot load config from environment variables with getter: ${envVarSelector}`);
    }
};
exports.fromEnv = fromEnv;
