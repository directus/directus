import { ServiceException as __ServiceException, ServiceExceptionOptions as __ServiceExceptionOptions } from "@aws-sdk/smithy-client";
/**
 * Base exception class for all service exceptions from STS service.
 */
export declare class STSServiceException extends __ServiceException {
    /**
     * @internal
     */
    constructor(options: __ServiceExceptionOptions);
}
