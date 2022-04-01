import { SourceProfileInit } from "@aws-sdk/shared-ini-file-loader";
import { CredentialProvider } from "@aws-sdk/types";
export interface FromProcessInit extends SourceProfileInit {
}
/**
 * Creates a credential provider that will read from a credential_process specified
 * in ini files.
 */
export declare const fromProcess: (init?: FromProcessInit) => CredentialProvider;
