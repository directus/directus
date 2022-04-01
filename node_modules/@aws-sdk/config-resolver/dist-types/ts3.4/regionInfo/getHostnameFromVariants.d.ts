import { EndpointVariant } from "./EndpointVariant";
export interface GetHostnameFromVariantsOptions {
    useFipsEndpoint: boolean;
    useDualstackEndpoint: boolean;
}
export declare const getHostnameFromVariants: (variants: EndpointVariant[] | undefined, { useFipsEndpoint, useDualstackEndpoint }: GetHostnameFromVariantsOptions) => string | undefined;
