import { Provider, RegionInfoProvider, UrlParser } from "@aws-sdk/types";
interface GetEndpointFromRegionOptions {
    region: Provider<string>;
    tls?: boolean;
    regionInfoProvider: RegionInfoProvider;
    urlParser: UrlParser;
    useDualstackEndpoint: Provider<boolean>;
    useFipsEndpoint: Provider<boolean>;
}
export declare const getEndpointFromRegion: (input: GetEndpointFromRegionOptions) => Promise<import("@aws-sdk/types").Endpoint>;
export {};
