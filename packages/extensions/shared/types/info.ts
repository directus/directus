import type { ApiExtension, AppExtension, BundleExtension, HybridExtension } from './extension-types.js';

export type ExtensionInfo =
	| Omit<AppExtension, 'entrypoint' | 'path'>
	| Omit<ApiExtension, 'entrypoint' | 'path'>
	| Omit<HybridExtension, 'entrypoint' | 'path'>
	| Omit<BundleExtension, 'entrypoint' | 'path'>;
