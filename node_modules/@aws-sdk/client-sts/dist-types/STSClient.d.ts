import { EndpointsInputConfig, EndpointsResolvedConfig, RegionInputConfig, RegionResolvedConfig } from "@aws-sdk/config-resolver";
import { HostHeaderInputConfig, HostHeaderResolvedConfig } from "@aws-sdk/middleware-host-header";
import { RetryInputConfig, RetryResolvedConfig } from "@aws-sdk/middleware-retry";
import { StsAuthInputConfig, StsAuthResolvedConfig } from "@aws-sdk/middleware-sdk-sts";
import { UserAgentInputConfig, UserAgentResolvedConfig } from "@aws-sdk/middleware-user-agent";
import { HttpHandler as __HttpHandler } from "@aws-sdk/protocol-http";
import { Client as __Client, DefaultsMode, SmithyConfiguration as __SmithyConfiguration, SmithyResolvedConfiguration as __SmithyResolvedConfiguration } from "@aws-sdk/smithy-client";
import { BodyLengthCalculator as __BodyLengthCalculator, Credentials as __Credentials, Decoder as __Decoder, Encoder as __Encoder, HashConstructor as __HashConstructor, HttpHandlerOptions as __HttpHandlerOptions, Logger as __Logger, Provider as __Provider, Provider, RegionInfoProvider, StreamCollector as __StreamCollector, UrlParser as __UrlParser, UserAgent as __UserAgent } from "@aws-sdk/types";
import { AssumeRoleCommandInput, AssumeRoleCommandOutput } from "./commands/AssumeRoleCommand";
import { AssumeRoleWithSAMLCommandInput, AssumeRoleWithSAMLCommandOutput } from "./commands/AssumeRoleWithSAMLCommand";
import { AssumeRoleWithWebIdentityCommandInput, AssumeRoleWithWebIdentityCommandOutput } from "./commands/AssumeRoleWithWebIdentityCommand";
import { DecodeAuthorizationMessageCommandInput, DecodeAuthorizationMessageCommandOutput } from "./commands/DecodeAuthorizationMessageCommand";
import { GetAccessKeyInfoCommandInput, GetAccessKeyInfoCommandOutput } from "./commands/GetAccessKeyInfoCommand";
import { GetCallerIdentityCommandInput, GetCallerIdentityCommandOutput } from "./commands/GetCallerIdentityCommand";
import { GetFederationTokenCommandInput, GetFederationTokenCommandOutput } from "./commands/GetFederationTokenCommand";
import { GetSessionTokenCommandInput, GetSessionTokenCommandOutput } from "./commands/GetSessionTokenCommand";
export declare type ServiceInputTypes = AssumeRoleCommandInput | AssumeRoleWithSAMLCommandInput | AssumeRoleWithWebIdentityCommandInput | DecodeAuthorizationMessageCommandInput | GetAccessKeyInfoCommandInput | GetCallerIdentityCommandInput | GetFederationTokenCommandInput | GetSessionTokenCommandInput;
export declare type ServiceOutputTypes = AssumeRoleCommandOutput | AssumeRoleWithSAMLCommandOutput | AssumeRoleWithWebIdentityCommandOutput | DecodeAuthorizationMessageCommandOutput | GetAccessKeyInfoCommandOutput | GetCallerIdentityCommandOutput | GetFederationTokenCommandOutput | GetSessionTokenCommandOutput;
export interface ClientDefaults extends Partial<__SmithyResolvedConfiguration<__HttpHandlerOptions>> {
    /**
     * The HTTP handler to use. Fetch in browser and Https in Nodejs.
     */
    requestHandler?: __HttpHandler;
    /**
     * A constructor for a class implementing the {@link __Hash} interface
     * that computes the SHA-256 HMAC or checksum of a string or binary buffer.
     * @internal
     */
    sha256?: __HashConstructor;
    /**
     * The function that will be used to convert strings into HTTP endpoints.
     * @internal
     */
    urlParser?: __UrlParser;
    /**
     * A function that can calculate the length of a request body.
     * @internal
     */
    bodyLengthChecker?: __BodyLengthCalculator;
    /**
     * A function that converts a stream into an array of bytes.
     * @internal
     */
    streamCollector?: __StreamCollector;
    /**
     * The function that will be used to convert a base64-encoded string to a byte array.
     * @internal
     */
    base64Decoder?: __Decoder;
    /**
     * The function that will be used to convert binary data to a base64-encoded string.
     * @internal
     */
    base64Encoder?: __Encoder;
    /**
     * The function that will be used to convert a UTF8-encoded string to a byte array.
     * @internal
     */
    utf8Decoder?: __Decoder;
    /**
     * The function that will be used to convert binary data to a UTF-8 encoded string.
     * @internal
     */
    utf8Encoder?: __Encoder;
    /**
     * The runtime environment.
     * @internal
     */
    runtime?: string;
    /**
     * Disable dyanamically changing the endpoint of the client based on the hostPrefix
     * trait of an operation.
     */
    disableHostPrefix?: boolean;
    /**
     * Value for how many times a request will be made at most in case of retry.
     */
    maxAttempts?: number | __Provider<number>;
    /**
     * Specifies which retry algorithm to use.
     */
    retryMode?: string | __Provider<string>;
    /**
     * Optional logger for logging debug/info/warn/error.
     */
    logger?: __Logger;
    /**
     * Enables IPv6/IPv4 dualstack endpoint.
     */
    useDualstackEndpoint?: boolean | __Provider<boolean>;
    /**
     * Enables FIPS compatible endpoints.
     */
    useFipsEndpoint?: boolean | __Provider<boolean>;
    /**
     * Unique service identifier.
     * @internal
     */
    serviceId?: string;
    /**
     * The AWS region to which this client will send requests
     */
    region?: string | __Provider<string>;
    /**
     * Default credentials provider; Not available in browser runtime.
     * @internal
     */
    credentialDefaultProvider?: (input: any) => __Provider<__Credentials>;
    /**
     * Fetch related hostname, signing name or signing region with given region.
     * @internal
     */
    regionInfoProvider?: RegionInfoProvider;
    /**
     * The provider populating default tracking information to be sent with `user-agent`, `x-amz-user-agent` header
     * @internal
     */
    defaultUserAgentProvider?: Provider<__UserAgent>;
    /**
     * The {@link DefaultsMode} that will be used to determine how certain default configuration options are resolved in the SDK.
     */
    defaultsMode?: DefaultsMode | Provider<DefaultsMode>;
}
declare type STSClientConfigType = Partial<__SmithyConfiguration<__HttpHandlerOptions>> & ClientDefaults & RegionInputConfig & EndpointsInputConfig & RetryInputConfig & HostHeaderInputConfig & StsAuthInputConfig & UserAgentInputConfig;
/**
 * The configuration interface of STSClient class constructor that set the region, credentials and other options.
 */
export interface STSClientConfig extends STSClientConfigType {
}
declare type STSClientResolvedConfigType = __SmithyResolvedConfiguration<__HttpHandlerOptions> & Required<ClientDefaults> & RegionResolvedConfig & EndpointsResolvedConfig & RetryResolvedConfig & HostHeaderResolvedConfig & StsAuthResolvedConfig & UserAgentResolvedConfig;
/**
 * The resolved configuration interface of STSClient class. This is resolved and normalized from the {@link STSClientConfig | constructor configuration interface}.
 */
export interface STSClientResolvedConfig extends STSClientResolvedConfigType {
}
/**
 * <fullname>Security Token Service</fullname>
 *          <p>Security Token Service (STS) enables you to request temporary, limited-privilege
 *       credentials for Identity and Access Management (IAM) users or for users that you
 *       authenticate (federated users). This guide provides descriptions of the STS API. For
 *       more information about using this service, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html">Temporary Security Credentials</a>.</p>
 */
export declare class STSClient extends __Client<__HttpHandlerOptions, ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig> {
    /**
     * The resolved configuration of STSClient class. This is resolved and normalized from the {@link STSClientConfig | constructor configuration interface}.
     */
    readonly config: STSClientResolvedConfig;
    constructor(configuration: STSClientConfig);
    /**
     * Destroy underlying resources, like sockets. It's usually not necessary to do this.
     * However in Node.js, it's best to explicitly shut down the client's agent when it is no longer needed.
     * Otherwise, sockets might stay open for quite a long time before the server terminates them.
     */
    destroy(): void;
}
export {};
