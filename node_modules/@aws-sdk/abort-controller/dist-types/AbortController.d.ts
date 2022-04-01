import { AbortController as IAbortController } from "@aws-sdk/types";
import { AbortSignal } from "./AbortSignal";
export declare class AbortController implements IAbortController {
    readonly signal: AbortSignal;
    abort(): void;
}
