import { SSOClient } from "@aws-sdk/client-sso";
import { SourceProfileInit } from "@aws-sdk/shared-ini-file-loader";
import { CredentialProvider } from "@aws-sdk/types";
export interface SsoCredentialsParameters {
    /**
     * The URL to the AWS SSO service.
     */
    ssoStartUrl: string;
    /**
     * The ID of the AWS account to use for temporary credentials.
     */
    ssoAccountId: string;
    /**
     * The AWS region to use for temporary credentials.
     */
    ssoRegion: string;
    /**
     * The name of the AWS role to assume.
     */
    ssoRoleName: string;
}
export interface FromSSOInit extends SourceProfileInit {
    ssoClient?: SSOClient;
}
/**
 * Creates a credential provider that will read from a credential_process specified
 * in ini files.
 */
export declare const fromSSO: (init?: FromSSOInit & Partial<SsoCredentialsParameters>) => CredentialProvider;
