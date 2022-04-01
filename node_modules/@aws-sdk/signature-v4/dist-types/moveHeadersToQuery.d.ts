import { HttpRequest, QueryParameterBag } from "@aws-sdk/types";
/**
 * @private
 */
export declare const moveHeadersToQuery: (request: HttpRequest, options?: {
    unhoistableHeaders?: Set<string>;
}) => HttpRequest & {
    query: QueryParameterBag;
};
