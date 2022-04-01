import { Credentials } from "@aws-sdk/types";
import { FromSSOInit, SsoCredentialsParameters } from "./fromSSO";
export declare const resolveSSOCredentials: ({ ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, }: FromSSOInit & SsoCredentialsParameters) => Promise<Credentials>;
