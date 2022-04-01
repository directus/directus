import { ServiceException as __ServiceException, ServiceExceptionOptions as __ServiceExceptionOptions } from "@aws-sdk/smithy-client";
/**
 * Base exception class for all service exceptions from SSO service.
 */
export declare class SSOServiceException extends __ServiceException {
    /**
     * @internal
     */
    constructor(options: __ServiceExceptionOptions);
}
