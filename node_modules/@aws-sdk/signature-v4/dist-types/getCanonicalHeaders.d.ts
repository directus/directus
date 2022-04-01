import { HeaderBag, HttpRequest } from "@aws-sdk/types";
/**
 * @private
 */
export declare const getCanonicalHeaders: ({ headers }: HttpRequest, unsignableHeaders?: Set<string> | undefined, signableHeaders?: Set<string> | undefined) => HeaderBag;
