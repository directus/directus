import { AssumeRoleWithWebIdentityParams } from "@aws-sdk/credential-provider-web-identity";
import { SourceProfileInit } from "@aws-sdk/shared-ini-file-loader";
import { CredentialProvider, Credentials } from "@aws-sdk/types";
import { AssumeRoleParams } from "./resolveAssumeRoleCredentials";
export interface FromIniInit extends SourceProfileInit {
    /**
     * A function that returns a promise fulfilled with an MFA token code for
     * the provided MFA Serial code. If a profile requires an MFA code and
     * `mfaCodeProvider` is not a valid function, the credential provider
     * promise will be rejected.
     *
     * @param mfaSerial The serial code of the MFA device specified.
     */
    mfaCodeProvider?: (mfaSerial: string) => Promise<string>;
    /**
     * A function that assumes a role and returns a promise fulfilled with
     * credentials for the assumed role.
     *
     * @param sourceCreds The credentials with which to assume a role.
     * @param params
     */
    roleAssumer?: (sourceCreds: Credentials, params: AssumeRoleParams) => Promise<Credentials>;
    /**
     * A function that assumes a role with web identity and returns a promise fulfilled with
     * credentials for the assumed role.
     *
     * @param sourceCreds The credentials with which to assume a role.
     * @param params
     */
    roleAssumerWithWebIdentity?: (params: AssumeRoleWithWebIdentityParams) => Promise<Credentials>;
}
/**
 * Creates a credential provider that will read from ini files and supports
 * role assumption and multi-factor authentication.
 */
export declare const fromIni: (init?: FromIniInit) => CredentialProvider;
