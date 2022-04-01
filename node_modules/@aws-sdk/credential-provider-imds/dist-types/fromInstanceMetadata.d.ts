import { Provider } from "@aws-sdk/types";
import { RemoteProviderInit } from "./remoteProvider/RemoteProviderInit";
import { InstanceMetadataCredentials } from "./types";
/**
 * Creates a credential provider that will source credentials from the EC2
 * Instance Metadata Service
 */
export declare const fromInstanceMetadata: (init?: RemoteProviderInit) => Provider<InstanceMetadataCredentials>;
