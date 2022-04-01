import { fromEnv } from "@aws-sdk/credential-provider-env";
import { fromContainerMetadata, fromInstanceMetadata } from "@aws-sdk/credential-provider-imds";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var resolveCredentialSource = function (credentialSource, profileName) {
    var sourceProvidersMap = {
        EcsContainer: fromContainerMetadata,
        Ec2InstanceMetadata: fromInstanceMetadata,
        Environment: fromEnv,
    };
    if (credentialSource in sourceProvidersMap) {
        return sourceProvidersMap[credentialSource]();
    }
    else {
        throw new CredentialsProviderError("Unsupported credential source in profile ".concat(profileName, ". Got ").concat(credentialSource, ", ") +
            "expected EcsContainer or Ec2InstanceMetadata or Environment.");
    }
};
