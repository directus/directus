import { SsoProfile } from "@aws-sdk/credential-provider-sso";
export { isSsoProfile } from "@aws-sdk/credential-provider-sso";
export declare const resolveSsoCredentials: (data: Partial<SsoProfile>) => Promise<import("@aws-sdk/types").Credentials>;
