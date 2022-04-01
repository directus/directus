export interface GetResolvedHostnameOptions {
    regionHostname?: string;
    partitionHostname?: string;
}
export declare const getResolvedHostname: (resolvedRegion: string, { regionHostname, partitionHostname }: GetResolvedHostnameOptions) => string | undefined;
