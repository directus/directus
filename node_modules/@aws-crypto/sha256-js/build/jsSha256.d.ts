import { Hash, SourceData } from "@aws-sdk/types";
export declare class Sha256 implements Hash {
    private readonly hash;
    private readonly outer?;
    private error;
    constructor(secret?: SourceData);
    update(toHash: SourceData): void;
    digestSync(): Uint8Array;
    digest(): Promise<Uint8Array>;
}
