import { DefaultCredentialProvider, RoleAssumer, RoleAssumerWithWebIdentity } from "./defaultStsRoleAssumers";
import { STSClientConfig } from "./STSClient";
/**
 * The default role assumer that used by credential providers when sts:AssumeRole API is needed.
 */
export declare const getDefaultRoleAssumer: (stsOptions?: Pick<STSClientConfig, "logger" | "region" | "requestHandler">) => RoleAssumer;
/**
 * The default role assumer that used by credential providers when sts:AssumeRoleWithWebIdentity API is needed.
 */
export declare const getDefaultRoleAssumerWithWebIdentity: (stsOptions?: Pick<STSClientConfig, "logger" | "region" | "requestHandler">) => RoleAssumerWithWebIdentity;
/**
 * The default credential providers depend STS client to assume role with desired API: sts:assumeRole,
 * sts:assumeRoleWithWebIdentity, etc. This function decorates the default credential provider with role assumers which
 * encapsulates the process of calling STS commands. This can only be imported by AWS client packages to avoid circular
 * dependencies.
 *
 * @internal
 */
export declare const decorateDefaultCredentialProvider: (provider: DefaultCredentialProvider) => DefaultCredentialProvider;
