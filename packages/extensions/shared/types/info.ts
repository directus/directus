import type { ApiExtension, AppExtension, BundleExtension, HybridExtension } from './extension-types.js';

export type NormalizedAppExtension = Omit<AppExtension, 'entrypoint' | 'path'> & {
	settings: Omit<ExtensionSettings, 'name'>;
};

export type NormalizedApiExtension = Omit<ApiExtension, 'entrypoint' | 'path'> & {
	settings: Omit<ExtensionSettings, 'name'>;
};

export type NormalizedHybridExtension = Omit<HybridExtension, 'entrypoint' | 'path'> & {
	settings: Omit<ExtensionSettings, 'name'>;
};

export type NormalizedBundleExtension = Omit<BundleExtension, 'entrypoint' | 'path'> & {
	entries: (BundleExtension['entries'][number] & { settings: Omit<ExtensionSettings, 'name'> })[];
};

export type ExtensionInfo =
	| NormalizedApiExtension
	| NormalizedAppExtension
	| NormalizedBundleExtension
	| NormalizedHybridExtension;

export interface ExtensionSettings {
	name: string;
	enabled: boolean;
	// options: Record<string, unknown> | null;
	// permissions: Record<string, unknown> | null;
}
