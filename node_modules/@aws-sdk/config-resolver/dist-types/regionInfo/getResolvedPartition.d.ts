import { PartitionHash } from "./PartitionHash";
export interface GetResolvedPartitionOptions {
    partitionHash: PartitionHash;
}
export declare const getResolvedPartition: (region: string, { partitionHash }: GetResolvedPartitionOptions) => string;
