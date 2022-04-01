import { WaiterConfiguration as WaiterConfiguration__ } from "@aws-sdk/types";
export interface WaiterConfiguration<T> extends WaiterConfiguration__<T> {
}
/**
 * @private
 */
export declare const waiterServiceDefaults: {
    minDelay: number;
    maxDelay: number;
};
/**
 * @private
 */
export declare type WaiterOptions<Client> = WaiterConfiguration<Client> & Required<Pick<WaiterConfiguration<Client>, "minDelay" | "maxDelay">>;
export declare enum WaiterState {
    ABORTED = "ABORTED",
    FAILURE = "FAILURE",
    SUCCESS = "SUCCESS",
    RETRY = "RETRY",
    TIMEOUT = "TIMEOUT"
}
export declare type WaiterResult = {
    state: WaiterState;
    /**
     * (optional) Indicates a reason for why a waiter has reached its state.
     */
    reason?: any;
};
/**
 * Handles and throws exceptions resulting from the waiterResult
 * @param result WaiterResult
 */
export declare const checkExceptions: (result: WaiterResult) => WaiterResult;
