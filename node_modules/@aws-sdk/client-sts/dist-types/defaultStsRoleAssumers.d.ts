import { Credentials, Provider } from "@aws-sdk/types";
import { AssumeRoleCommandInput } from "./commands/AssumeRoleCommand";
import { AssumeRoleWithWebIdentityCommandInput } from "./commands/AssumeRoleWithWebIdentityCommand";
import type { STSClient, STSClientConfig } from "./STSClient";
/**
 * @internal
 */
export declare type RoleAssumer = (sourceCreds: Credentials, params: AssumeRoleCommandInput) => Promise<Credentials>;
/**
 * The default role assumer that used by credential providers when sts:AssumeRole API is needed.
 * @internal
 */
export declare const getDefaultRoleAssumer: (stsOptions: Pick<STSClientConfig, "logger" | "region" | "requestHandler">, stsClientCtor: new (options: STSClientConfig) => STSClient) => RoleAssumer;
/**
 * @internal
 */
export declare type RoleAssumerWithWebIdentity = (params: AssumeRoleWithWebIdentityCommandInput) => Promise<Credentials>;
/**
 * The default role assumer that used by credential providers when sts:AssumeRoleWithWebIdentity API is needed.
 * @internal
 */
export declare const getDefaultRoleAssumerWithWebIdentity: (stsOptions: Pick<STSClientConfig, "logger" | "region" | "requestHandler">, stsClientCtor: new (options: STSClientConfig) => STSClient) => RoleAssumerWithWebIdentity;
/**
 * @internal
 */
export declare type DefaultCredentialProvider = (input: any) => Provider<Credentials>;
/**
 * The default credential providers depend STS client to assume role with desired API: sts:assumeRole,
 * sts:assumeRoleWithWebIdentity, etc. This function decorates the default credential provider with role assumers which
 * encapsulates the process of calling STS commands. This can only be imported by AWS client packages to avoid circular
 * dependencies.
 *
 * @internal
 */
export declare const decorateDefaultCredentialProvider: (provider: DefaultCredentialProvider) => DefaultCredentialProvider;
