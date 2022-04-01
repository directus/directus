import { CredentialProvider } from "@aws-sdk/types";
import { FromWebTokenInit } from "./fromWebToken";
export interface FromTokenFileInit extends Partial<Omit<FromWebTokenInit, "webIdentityToken">> {
    /**
     * File location of where the `OIDC` token is stored.
     */
    webIdentityTokenFile?: string;
}
/**
 * Represents OIDC credentials from a file on disk.
 */
export declare const fromTokenFile: (init?: FromTokenFileInit) => CredentialProvider;
