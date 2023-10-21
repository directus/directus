import type {
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	BUNDLE_EXTENSION_TYPES,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	NESTED_EXTENSION_TYPES,
} from '../constants/index.js';
import type { SplitEntrypoint, ExtensionSandboxOptions } from '../schemas/index.js';

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
	entrypoint: SplitEntrypoint;
	entries: BundleExtensionEntry[];
};

export type Extension = AppExtension | ApiExtension | HybridExtension | BundleExtension;
