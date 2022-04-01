export interface GetResolvedSigningRegionOptions {
    regionRegex: string;
    signingRegion?: string;
    useFipsEndpoint: boolean;
}
export declare const getResolvedSigningRegion: (hostname: string, { signingRegion, regionRegex, useFipsEndpoint }: GetResolvedSigningRegionOptions) => string | undefined;
