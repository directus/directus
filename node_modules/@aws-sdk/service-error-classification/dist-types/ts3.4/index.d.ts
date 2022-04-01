import { SdkError } from "@aws-sdk/types";
export declare const isRetryableByTrait: (error: SdkError) => boolean;
export declare const isClockSkewError: (error: SdkError) => boolean;
export declare const isThrottlingError: (error: SdkError) => boolean;
export declare const isTransientError: (error: SdkError) => boolean;
