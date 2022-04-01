import { BodyLengthCalculator, BuildHandlerOptions, BuildMiddleware, Pluggable } from "@aws-sdk/types";
export declare function contentLengthMiddleware(bodyLengthChecker: BodyLengthCalculator): BuildMiddleware<any, any>;
export declare const contentLengthMiddlewareOptions: BuildHandlerOptions;
export declare const getContentLengthPlugin: (options: {
    bodyLengthChecker: BodyLengthCalculator;
}) => Pluggable<any, any>;
