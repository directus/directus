import { FinalizeRequestMiddleware, Pluggable, RelativeMiddlewareOptions } from "@aws-sdk/types";
import { AwsAuthResolvedConfig } from "./configurations";
export declare const awsAuthMiddleware: <Input extends object, Output extends object>(options: AwsAuthResolvedConfig) => FinalizeRequestMiddleware<Input, Output>;
export declare const awsAuthMiddlewareOptions: RelativeMiddlewareOptions;
export declare const getAwsAuthPlugin: (options: AwsAuthResolvedConfig) => Pluggable<any, any>;
export declare const getSigV4AuthPlugin: (options: AwsAuthResolvedConfig) => Pluggable<any, any>;
