"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialSource = void 0;
const credential_provider_env_1 = require("@aws-sdk/credential-provider-env");
const credential_provider_imds_1 = require("@aws-sdk/credential-provider-imds");
const property_provider_1 = require("@aws-sdk/property-provider");
const resolveCredentialSource = (credentialSource, profileName) => {
    const sourceProvidersMap = {
        EcsContainer: credential_provider_imds_1.fromContainerMetadata,
        Ec2InstanceMetadata: credential_provider_imds_1.fromInstanceMetadata,
        Environment: credential_provider_env_1.fromEnv,
    };
    if (credentialSource in sourceProvidersMap) {
        return sourceProvidersMap[credentialSource]();
    }
    else {
        throw new property_provider_1.CredentialsProviderError(`Unsupported credential source in profile ${profileName}. Got ${credentialSource}, ` +
            `expected EcsContainer or Ec2InstanceMetadata or Environment.`);
    }
};
exports.resolveCredentialSource = resolveCredentialSource;
