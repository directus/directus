import type { RequestConfig } from "./request.js";

export type RequestTransformer = (request: RequestConfig) => RequestConfig | Promise<RequestConfig>;

export type ResponseTransformer<Output = any> = (data: unknown, request: RequestConfig) => Output | Promise<Output>;

export type ErrorHandler<Error = any> = (error: Error, request: RequestConfig) => void | Promise<void>;

export type RequestHooks = {
	onRequest: RequestTransformer;
	onResponse: ResponseTransformer;
	onError: ErrorHandler;
};

export type RequestHooksList = {
	onRequest: RequestTransformer[];
	onResponse: ResponseTransformer[];
	onError: ErrorHandler[];
};
