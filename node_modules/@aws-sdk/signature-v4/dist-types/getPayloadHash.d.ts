import { HashConstructor, HttpRequest } from "@aws-sdk/types";
/**
 * @private
 */
export declare const getPayloadHash: ({ headers, body }: HttpRequest, hashConstructor: HashConstructor) => Promise<string>;
