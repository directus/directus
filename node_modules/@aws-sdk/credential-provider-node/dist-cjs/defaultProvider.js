"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProvider = void 0;
const credential_provider_env_1 = require("@aws-sdk/credential-provider-env");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const credential_provider_process_1 = require("@aws-sdk/credential-provider-process");
const credential_provider_sso_1 = require("@aws-sdk/credential-provider-sso");
const credential_provider_web_identity_1 = require("@aws-sdk/credential-provider-web-identity");
const property_provider_1 = require("@aws-sdk/property-provider");
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
const remoteProvider_1 = require("./remoteProvider");
const defaultProvider = (init = {}) => (0, property_provider_1.memoize)((0, property_provider_1.chain)(...(init.profile || process.env[shared_ini_file_loader_1.ENV_PROFILE] ? [] : [(0, credential_provider_env_1.fromEnv)()]), (0, credential_provider_sso_1.fromSSO)(init), (0, credential_provider_ini_1.fromIni)(init), (0, credential_provider_process_1.fromProcess)(init), (0, credential_provider_web_identity_1.fromTokenFile)(init), (0, remoteProvider_1.remoteProvider)(init), async () => {
    throw new property_provider_1.CredentialsProviderError("Could not load credentials from any providers", false);
}), (credentials) => credentials.expiration !== undefined && credentials.expiration.getTime() - Date.now() < 300000, (credentials) => credentials.expiration !== undefined);
exports.defaultProvider = defaultProvider;
