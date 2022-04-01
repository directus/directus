import { Credentials, Profile } from "@aws-sdk/types";
export interface StaticCredsProfile extends Profile {
    aws_access_key_id: string;
    aws_secret_access_key: string;
    aws_session_token?: string;
}
export declare const isStaticCredsProfile: (arg: any) => arg is StaticCredsProfile;
export declare const resolveStaticCredentials: (profile: StaticCredsProfile) => Promise<Credentials>;
