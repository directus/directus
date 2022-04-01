import { AbortHandler, AbortSignal as IAbortSignal } from "@aws-sdk/types";
export declare class AbortSignal implements IAbortSignal {
    onabort: AbortHandler | null;
    private _aborted;
    constructor();
    /**
     * Whether the associated operation has already been cancelled.
     */
    get aborted(): boolean;
    /**
     * @internal
     */
    abort(): void;
}
