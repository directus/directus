import { z } from 'zod';

import type { Theme } from './themes.js';
import type {
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	BUNDLE_EXTENSION_TYPES,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	NESTED_EXTENSION_TYPES,
} from '@directus/constants';
import type { EndpointConfig } from './endpoints.js';
import type { HookConfig } from './hooks.js';
import type { DisplayConfig } from './displays.js';
import type { InterfaceConfig } from './interfaces.js';
import type { LayoutConfig } from './layouts.js';
import type { ModuleConfig } from './modules.js';
import type { OperationApiConfig, OperationAppConfig } from './operations.js';
import type { PanelConfig } from './panels.js';

export type AppExtensionConfigs = {
	interfaces: InterfaceConfig[];
	displays: DisplayConfig[];
	layouts: LayoutConfig[];
	modules: ModuleConfig[];
	panels: PanelConfig[];
	themes: Theme[];
	operations: OperationAppConfig[];
};

export const SplitEntrypoint = z.object({
	app: z.string(),
	api: z.string(),
});

export type SplitEntrypoint = z.infer<typeof SplitEntrypoint>;

export const ExtensionSandboxRequestedScopes = z.object({
	request: z.optional(
		z.object({
			urls: z.array(z.string()),
			methods: z.array(
				z.union([z.literal('GET'), z.literal('POST'), z.literal('PATCH'), z.literal('PUT'), z.literal('DELETE')]),
			),
		}),
	),
	log: z.optional(z.object({})),
	sleep: z.optional(z.object({})),
});

export type ExtensionSandboxRequestedScopes = z.infer<typeof ExtensionSandboxRequestedScopes>;

export const ExtensionSandboxOptions = z.optional(
	z.object({
		enabled: z.boolean(),
		requestedScopes: ExtensionSandboxRequestedScopes,
	}),
);

export type ExtensionSandboxOptions = z.infer<typeof ExtensionSandboxOptions>;

export interface ExtensionSettings {
	id: string;
	source: 'module' | 'registry' | 'local';
	enabled: boolean;
	bundle: string | null;
	folder: string;
	// options: Record<string, unknown> | null;
	// permissions: Record<string, unknown> | null;
}

/**
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ApiOutput {
	id: string;
	bundle: string | null;
	schema: Partial<Extension> | BundleExtensionEntry | null;
	meta: ExtensionSettings;
}

export type BundleConfig = {
	endpoints: { name: string; config: EndpointConfig }[];
	hooks: { name: string; config: HookConfig }[];
	operations: { name: string; config: OperationApiConfig }[];
};

export type AppExtensionType = (typeof APP_EXTENSION_TYPES)[number];
export type ApiExtensionType = (typeof API_EXTENSION_TYPES)[number];
export type HybridExtensionType = (typeof HYBRID_EXTENSION_TYPES)[number];
export type BundleExtensionType = (typeof BUNDLE_EXTENSION_TYPES)[number];
export type NestedExtensionType = (typeof NESTED_EXTENSION_TYPES)[number];
export type ExtensionType = (typeof EXTENSION_TYPES)[number];

type ExtensionBase = {
	path: string;
	name: string;
	local: boolean;
	version?: string;
	host?: string;
};

export type AppExtension = ExtensionBase & {
	type: AppExtensionType;
	entrypoint: string;
};

export type ApiExtension = ExtensionBase & {
	type: ApiExtensionType;
	entrypoint: string;
	sandbox?: ExtensionSandboxOptions;
};

export type HybridExtension = ExtensionBase & {
	type: HybridExtensionType;
	entrypoint: SplitEntrypoint;
	sandbox?: ExtensionSandboxOptions;
};

export interface BundleExtensionEntry {
	name: string;
	type: AppExtensionType | ApiExtensionType | HybridExtensionType;
}

export type BundleExtension = ExtensionBase & {
	type: BundleExtensionType;
	partial: boolean | undefined;
	entrypoint: SplitEntrypoint;
	entries: BundleExtensionEntry[];
};

export type Extension = AppExtension | ApiExtension | HybridExtension | BundleExtension;
