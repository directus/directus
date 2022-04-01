import { Hash, SourceData } from "@aws-sdk/types";
export declare class Sha256 implements Hash {
    private readonly hash;
    constructor(secret?: SourceData);
    update(data: SourceData, encoding?: "utf8" | "ascii" | "latin1"): void;
    digest(): Promise<Uint8Array>;
}
