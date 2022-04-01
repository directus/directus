import { HttpRequest, QueryParameterBag } from "@aws-sdk/types";
/**
 * @internal
 */
export declare const cloneRequest: ({ headers, query, ...rest }: HttpRequest) => HttpRequest;
export declare const cloneQuery: (query: QueryParameterBag) => QueryParameterBag;
