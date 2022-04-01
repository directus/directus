import { Hash, SourceData } from "@aws-sdk/types";
export declare class Sha256 implements Hash {
    private readonly key;
    private toHash;
    constructor(secret?: SourceData);
    update(data: SourceData): void;
    digest(): Promise<Uint8Array>;
}
