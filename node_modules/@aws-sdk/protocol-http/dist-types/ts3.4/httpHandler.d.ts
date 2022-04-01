import { HttpHandlerOptions, RequestHandler } from "@aws-sdk/types";
import { HttpRequest } from "./httpRequest";
import { HttpResponse } from "./httpResponse";
export declare type HttpHandler = RequestHandler<HttpRequest, HttpResponse, HttpHandlerOptions>;
