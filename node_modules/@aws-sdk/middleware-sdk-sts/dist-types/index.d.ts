import { AwsAuthInputConfig, AwsAuthResolvedConfig } from "@aws-sdk/middleware-signing";
import { Client, Credentials, HashConstructor, Provider, RegionInfoProvider } from "@aws-sdk/types";
export interface StsAuthInputConfig extends AwsAuthInputConfig {
}
interface PreviouslyResolved {
    credentialDefaultProvider: (input: any) => Provider<Credentials>;
    region: string | Provider<string>;
    regionInfoProvider: RegionInfoProvider;
    signingName?: string;
    serviceId: string;
    sha256: HashConstructor;
    useFipsEndpoint: Provider<boolean>;
    useDualstackEndpoint: Provider<boolean>;
}
export interface StsAuthResolvedConfig extends AwsAuthResolvedConfig {
    /**
     * Reference to STSClient class constructor.
     * @internal
     */
    stsClientCtor: new (clientConfig: any) => Client<any, any, any>;
}
export interface StsAuthConfigOptions {
    /**
     * Reference to STSClient class constructor.
     */
    stsClientCtor: new (clientConfig: any) => Client<any, any, any>;
}
/**
 * Set STS client constructor to `stsClientCtor` config parameter. It is used
 * for role assumers for STS client internally. See `clients/client-sts/defaultStsRoleAssumers.ts`
 * and `clients/client-sts/STSClient.ts`.
 */
export declare const resolveStsAuthConfig: <T>(input: T & PreviouslyResolved & StsAuthInputConfig, { stsClientCtor }: StsAuthConfigOptions) => T & StsAuthResolvedConfig;
export {};
