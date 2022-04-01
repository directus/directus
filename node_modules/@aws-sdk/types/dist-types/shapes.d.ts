import { HttpResponse } from "./http";
import { MetadataBearer } from "./response";
/**
 * A document type represents an untyped JSON-like value.
 *
 * Not all protocols support document types, and the serialization format of a
 * document type is protocol specific. All JSON protocols SHOULD support
 * document types and they SHOULD serialize document types inline as normal
 * JSON values.
 */
export declare type DocumentType = null | boolean | number | string | DocumentType[] | {
    [prop: string]: DocumentType;
};
/**
 * A structure shape with the error trait.
 * https://awslabs.github.io/smithy/spec/core.html#retryable-trait
 */
export interface RetryableTrait {
    /**
     * Indicates that the error is a retryable throttling error.
     */
    readonly throttling?: boolean;
}
/**
 * Type that is implemented by all Smithy shapes marked with the
 * error trait.
 * @deprecated
 */
export interface SmithyException {
    /**
     * The shape ID name of the exception.
     */
    readonly name: string;
    /**
     * Whether the client or server are at fault.
     */
    readonly $fault: "client" | "server";
    /**
     * The service that encountered the exception.
     */
    readonly $service?: string;
    /**
     * Indicates that an error MAY be retried by the client.
     */
    readonly $retryable?: RetryableTrait;
    /**
     * Reference to low-level HTTP response object.
     */
    readonly $response?: HttpResponse;
}
/**
 * @deprecated
 */
export declare type SdkError = Error & Partial<SmithyException> & Partial<MetadataBearer>;
