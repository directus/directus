import { HeaderBag, HttpMessage, HttpResponse as IHttpResponse } from "@aws-sdk/types";
declare type HttpResponseOptions = Partial<HttpMessage> & {
    statusCode: number;
};
export interface HttpResponse extends IHttpResponse {
}
export declare class HttpResponse {
    statusCode: number;
    headers: HeaderBag;
    body?: any;
    constructor(options: HttpResponseOptions);
    static isInstance(response: unknown): response is HttpResponse;
}
export {};
