/// <reference types="node" />
import { HttpRequest } from "@aws-sdk/types";
import { ClientRequest } from "http";
import { ClientHttp2Stream } from "http2";
export declare function writeRequestBody(httpRequest: ClientRequest | ClientHttp2Stream, request: HttpRequest): void;
