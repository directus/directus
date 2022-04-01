import { RemoteProviderInit } from "@aws-sdk/credential-provider-imds";
import { CredentialProvider } from "@aws-sdk/types";
export declare const ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
export declare const remoteProvider: (init: RemoteProviderInit) => CredentialProvider;
