import { Credentials, Profile } from "@aws-sdk/types";
import { FromIniInit } from "./fromIni";
export interface WebIdentityProfile extends Profile {
    web_identity_token_file: string;
    role_arn: string;
    role_session_name?: string;
}
export declare const isWebIdentityProfile: (arg: any) => arg is WebIdentityProfile;
export declare const resolveWebIdentityCredentials: (profile: WebIdentityProfile, options: FromIniInit) => Promise<Credentials>;
