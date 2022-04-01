import { FinalizeHandler, FinalizeHandlerArguments, MetadataBearer, Provider } from "@aws-sdk/types";
import { StandardRetryStrategy, StandardRetryStrategyOptions } from "./StandardRetryStrategy";
import { RateLimiter } from "./types";
/**
 * Strategy options to be passed to AdaptiveRetryStrategy
 */
export interface AdaptiveRetryStrategyOptions extends StandardRetryStrategyOptions {
    rateLimiter?: RateLimiter;
}
export declare class AdaptiveRetryStrategy extends StandardRetryStrategy {
    private rateLimiter;
    constructor(maxAttemptsProvider: Provider<number>, options?: AdaptiveRetryStrategyOptions);
    retry<Input extends object, Ouput extends MetadataBearer>(next: FinalizeHandler<Input, Ouput>, args: FinalizeHandlerArguments<Input>): Promise<{
        response: unknown;
        output: Ouput;
    }>;
}
