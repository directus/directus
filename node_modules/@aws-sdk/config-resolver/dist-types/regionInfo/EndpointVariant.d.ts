import { EndpointVariantTag } from "./EndpointVariantTag";
/**
 * Provides hostname information for specific host label.
 */
export declare type EndpointVariant = {
    hostname: string;
    tags: EndpointVariantTag[];
};
