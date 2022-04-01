import { CredentialProvider } from "@aws-sdk/types";
export declare const ENV_KEY = "AWS_ACCESS_KEY_ID";
export declare const ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
export declare const ENV_SESSION = "AWS_SESSION_TOKEN";
export declare const ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
/**
 * Source AWS credentials from known environment variables. If either the
 * `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` environment variable is not
 * set in this process, the provider will return a rejected promise.
 */
export declare const fromEnv: () => CredentialProvider;
