import { Logger } from "@aws-sdk/types";
export declare const DEFAULT_TIMEOUT = 1000;
export declare const DEFAULT_MAX_RETRIES = 0;
export interface RemoteProviderConfig {
    /**
     * The connection timeout (in milliseconds)
     */
    timeout: number;
    /**
     * The maximum number of times the HTTP connection should be retried
     */
    maxRetries: number;
}
export interface RemoteProviderInit extends Partial<RemoteProviderConfig> {
    logger?: Logger;
}
export declare const providerConfigFromInit: ({ maxRetries, timeout, }: RemoteProviderInit) => RemoteProviderConfig;
