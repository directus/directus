/**
 * Functions to communicate with the Directus API internals
 */

declare module 'directus:api' {
	///////////////////////////////////////////////////////////////////////////////////////////
	// Endpoints

	export interface SandboxEndpointRequest {
		url: string;
		headers: Record<string, string>;
		body: any;
	}

	export interface SandboxEndpointResponse {
		status: number;
		body: string | Record<string, unknown>;
	}

	export type SandboxEndpointRouteHandlerFn = (
		request: SandboxEndpointRequest,
	) => Promise<SandboxEndpointResponse> | SandboxEndpointResponse;

	export type SandboxEndpointRegisterFn = (path: string, handler: SandboxEndpointRouteHandlerFn) => void;

	export interface SandboxEndpointRouter {
		get: SandboxEndpointRegisterFn;
		patch: SandboxEndpointRegisterFn;
		put: SandboxEndpointRegisterFn;
		post: SandboxEndpointRegisterFn;
		delete: SandboxEndpointRegisterFn;
	}

	///////////////////////////////////////////////////////////////////////////////////////////
	// Hooks

	export type SandboxHookHandlerFn = (payload: unknown) => any;

	export type SandboxHookRegisterFn = (event: string, handler: SandboxHookHandlerFn) => void;

	export interface SandboxHookRegisterContext {
		action: SandboxHookRegisterFn;
		filter: SandboxHookRegisterFn;
	}

	///////////////////////////////////////////////////////////////////////////////////////////
	// Operations

	export type SandboxOperationHandlerFn = (data: Record<string, any>) => any;

	export interface SandboxOperationConfig {
		id: string;
		handler: SandboxOperationHandlerFn;
	}

	///////////////////////////////////////////////////////////////////////////////////////////
	// API functions

	export interface SandboxRequestResponse {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		data: string | Record<string, unknown>;
	}

	export type SandboxRequestFn = (
		url: string,
		options: {
			method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
			body?: Record<string, any> | string;
			headers?: Record<string, string>;
		},
	) => Promise<SandboxRequestResponse>;

	export type SandboxSleepFn = (milliseconds: number) => Promise<void>;

	export type SandboxLogFn = (message: string) => void;

	///////////////////////////////////////////////////////////////////////////////////////////
	// Module Exports

	export const request: SandboxRequestFn;
	export const sleep: SandboxSleepFn;
	export const log: SandboxLogFn;
}
