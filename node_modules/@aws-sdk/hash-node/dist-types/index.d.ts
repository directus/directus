import { Hash as IHash, SourceData } from "@aws-sdk/types";
export declare class Hash implements IHash {
    private readonly hash;
    constructor(algorithmIdentifier: string, secret?: SourceData);
    update(toHash: SourceData, encoding?: "utf8" | "ascii" | "latin1"): void;
    digest(): Promise<Uint8Array>;
}
