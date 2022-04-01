import { Credentials } from "@aws-sdk/types";
export interface ImdsCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    Token: string;
    Expiration: string;
}
export declare const isImdsCredentials: (arg: any) => arg is ImdsCredentials;
export declare const fromImdsCredentials: (creds: ImdsCredentials) => Credentials;
