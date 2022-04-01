import { HashConstructor, StreamHasher } from "./crypto";
import { BodyLengthCalculator, Encoder } from "./util";
export interface GetAwsChunkedEncodingStreamOptions {
    base64Encoder?: Encoder;
    bodyLengthChecker: BodyLengthCalculator;
    checksumAlgorithmFn?: HashConstructor;
    checksumLocationName?: string;
    streamHasher?: StreamHasher;
}
/**
 * A function that returns Readable Stream which follows aws-chunked encoding stream.
 * It optionally adds checksum if options are provided.
 */
export interface GetAwsChunkedEncodingStream<StreamType = any> {
    (readableStream: StreamType, options: GetAwsChunkedEncodingStreamOptions): StreamType;
}
