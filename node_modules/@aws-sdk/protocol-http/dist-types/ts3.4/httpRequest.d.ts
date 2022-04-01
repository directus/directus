import { Endpoint, HeaderBag, HttpMessage, HttpRequest as IHttpRequest, QueryParameterBag } from "@aws-sdk/types";
declare type HttpRequestOptions = Partial<HttpMessage> & Partial<Endpoint> & {
    method?: string;
};
export interface HttpRequest extends IHttpRequest {
}
export declare class HttpRequest implements HttpMessage, Endpoint {
    method: string;
    protocol: string;
    hostname: string;
    port?: number;
    path: string;
    query: QueryParameterBag;
    headers: HeaderBag;
    body?: any;
    constructor(options: HttpRequestOptions);
    static isInstance(request: unknown): request is HttpRequest;
    clone(): HttpRequest;
}
export {};
