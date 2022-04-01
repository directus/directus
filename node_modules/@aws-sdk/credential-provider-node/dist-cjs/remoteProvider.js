"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteProvider = exports.ENV_IMDS_DISABLED = void 0;
const credential_provider_imds_1 = require("@aws-sdk/credential-provider-imds");
const property_provider_1 = require("@aws-sdk/property-provider");
exports.ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
const remoteProvider = (init) => {
    if (process.env[credential_provider_imds_1.ENV_CMDS_RELATIVE_URI] || process.env[credential_provider_imds_1.ENV_CMDS_FULL_URI]) {
        return (0, credential_provider_imds_1.fromContainerMetadata)(init);
    }
    if (process.env[exports.ENV_IMDS_DISABLED]) {
        return async () => {
            throw new property_provider_1.CredentialsProviderError("EC2 Instance Metadata Service access disabled");
        };
    }
    return (0, credential_provider_imds_1.fromInstanceMetadata)(init);
};
exports.remoteProvider = remoteProvider;
