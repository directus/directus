import type { EndpointConfig, HookConfig, OperationApiConfig } from '@directus/extensions';

export type BundleConfig = {
	endpoints: { name: string; config: EndpointConfig }[];
	hooks: { name: string; config: HookConfig }[];
	operations: { name: string; config: OperationApiConfig }[];
};

export type AppExtensions = string | null;

export type ApiExtensions = { path: string }[];

export interface Options {
	schedule: boolean;
	watch: boolean;
}
