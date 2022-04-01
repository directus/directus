import { Credentials, EventSigner, EventSigningArguments, FormattedEvent, HashConstructor, HttpRequest, Provider, RequestPresigner, RequestPresigningArguments, RequestSigner, RequestSigningArguments, SigningArguments, StringSigner } from "@aws-sdk/types";
export interface SignatureV4Init {
    /**
     * The service signing name.
     */
    service: string;
    /**
     * The region name or a function that returns a promise that will be
     * resolved with the region name.
     */
    region: string | Provider<string>;
    /**
     * The credentials with which the request should be signed or a function
     * that returns a promise that will be resolved with credentials.
     */
    credentials: Credentials | Provider<Credentials>;
    /**
     * A constructor function for a hash object that will calculate SHA-256 HMAC
     * checksums.
     */
    sha256?: HashConstructor;
    /**
     * Whether to uri-escape the request URI path as part of computing the
     * canonical request string. This is required for every AWS service, except
     * Amazon S3, as of late 2017.
     *
     * @default [true]
     */
    uriEscapePath?: boolean;
    /**
     * Whether to calculate a checksum of the request body and include it as
     * either a request header (when signing) or as a query string parameter
     * (when presigning). This is required for AWS Glacier and Amazon S3 and optional for
     * every other AWS service as of late 2017.
     *
     * @default [true]
     */
    applyChecksum?: boolean;
}
export interface SignatureV4CryptoInit {
    sha256: HashConstructor;
}
export declare class SignatureV4 implements RequestPresigner, RequestSigner, StringSigner, EventSigner {
    private readonly service;
    private readonly regionProvider;
    private readonly credentialProvider;
    private readonly sha256;
    private readonly uriEscapePath;
    private readonly applyChecksum;
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath, }: SignatureV4Init & SignatureV4CryptoInit);
    presign(originalRequest: HttpRequest, options?: RequestPresigningArguments): Promise<HttpRequest>;
    sign(stringToSign: string, options?: SigningArguments): Promise<string>;
    sign(event: FormattedEvent, options: EventSigningArguments): Promise<string>;
    sign(requestToSign: HttpRequest, options?: RequestSigningArguments): Promise<HttpRequest>;
    private signEvent;
    private signString;
    private signRequest;
    private createCanonicalRequest;
    private createStringToSign;
    private getCanonicalPath;
    private getSignature;
    private getSigningKey;
}
