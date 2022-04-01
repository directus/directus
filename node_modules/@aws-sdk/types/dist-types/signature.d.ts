import { HttpRequest } from "./http";
/**
 * A {Date} object, a unix (epoch) timestamp in seconds, or a string that can be
 * understood by the JavaScript {Date} constructor.
 */
export declare type DateInput = number | string | Date;
export interface SigningArguments {
    /**
     * The date and time to be used as signature metadata. This value should be
     * a Date object, a unix (epoch) timestamp, or a string that can be
     * understood by the JavaScript `Date` constructor.If not supplied, the
     * value returned by `new Date()` will be used.
     */
    signingDate?: DateInput;
    /**
     * The service signing name. It will override the service name of the signer
     * in current invocation
     */
    signingService?: string;
    /**
     * The region name to sign the request. It will override the signing region of the
     * signer in current invocation
     */
    signingRegion?: string;
}
export interface RequestSigningArguments extends SigningArguments {
    /**
     * A set of strings whose members represents headers that cannot be signed.
     * All headers in the provided request will have their names converted to
     * lower case and then checked for existence in the unsignableHeaders set.
     */
    unsignableHeaders?: Set<string>;
    /**
     * A set of strings whose members represents headers that should be signed.
     * Any values passed here will override those provided via unsignableHeaders,
     * allowing them to be signed.
     *
     * All headers in the provided request will have their names converted to
     * lower case before signing.
     */
    signableHeaders?: Set<string>;
}
export interface RequestPresigningArguments extends RequestSigningArguments {
    /**
     * The number of seconds before the presigned URL expires
     */
    expiresIn?: number;
    /**
     * A set of strings whose representing headers that should not be hoisted
     * to presigned request's query string. If not supplied, the presigner
     * moves all the AWS-specific headers (starting with `x-amz-`) to the request
     * query string. If supplied, these headers remain in the presigned request's
     * header.
     * All headers in the provided request will have their names converted to
     * lower case and then checked for existence in the unhoistableHeaders set.
     */
    unhoistableHeaders?: Set<string>;
}
export interface EventSigningArguments extends SigningArguments {
    priorSignature: string;
}
export interface RequestPresigner {
    /**
     * Signs a request for future use.
     *
     * The request will be valid until either the provided `expiration` time has
     * passed or the underlying credentials have expired.
     *
     * @param requestToSign The request that should be signed.
     * @param options       Additional signing options.
     */
    presign(requestToSign: HttpRequest, options?: RequestPresigningArguments): Promise<HttpRequest>;
}
/**
 * An object that signs request objects with AWS credentials using one of the
 * AWS authentication protocols.
 */
export interface RequestSigner {
    /**
     * Sign the provided request for immediate dispatch.
     */
    sign(requestToSign: HttpRequest, options?: RequestSigningArguments): Promise<HttpRequest>;
}
export interface StringSigner {
    /**
     * Sign the provided `stringToSign` for use outside of the context of
     * request signing. Typical uses include signed policy generation.
     */
    sign(stringToSign: string, options?: SigningArguments): Promise<string>;
}
export interface FormattedEvent {
    headers: Uint8Array;
    payload: Uint8Array;
}
export interface EventSigner {
    /**
     * Sign the individual event of the event stream.
     */
    sign(event: FormattedEvent, options: EventSigningArguments): Promise<string>;
}
