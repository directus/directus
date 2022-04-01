import { Hash, SourceData } from "@aws-sdk/types";
export declare class Sha256 implements Hash {
    private operation;
    constructor(secret?: SourceData);
    update(toHash: SourceData): void;
    digest(): Promise<Uint8Array>;
}
