import { RegionInfo } from "@aws-sdk/types";
import { PartitionHash } from "./PartitionHash";
import { RegionHash } from "./RegionHash";
export interface GetRegionInfoOptions {
    useFipsEndpoint?: boolean;
    useDualstackEndpoint?: boolean;
    signingService: string;
    regionHash: RegionHash;
    partitionHash: PartitionHash;
}
export declare const getRegionInfo: (region: string, { useFipsEndpoint, useDualstackEndpoint, signingService, regionHash, partitionHash, }: GetRegionInfoOptions) => RegionInfo;
