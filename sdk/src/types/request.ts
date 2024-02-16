import type { RequestHooks } from "./hooks.js";

export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
	path: string;
	method?: HttpMethod;
	params?: Record<string, any>;
	headers?: Record<string, string>;
	body?: string | FormData;
} & Partial<RequestHooks>;

export type RequestConfig = {
	url: URL;
	headers: Record<string, string>;
} & Omit<RequestInit, 'headers'>;

