import { z } from 'zod';

export const APP_SHARED_DEPS = ['@directus/extensions-sdk', 'vue', 'vue-router', 'vue-i18n', 'pinia'];
export const API_SHARED_DEPS = ['directus'];

export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel'] as const;
export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;
export const HYBRID_EXTENSION_TYPES = ['operation'] as const;
export const BUNDLE_EXTENSION_TYPES = ['bundle'] as const;
export const EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;
export const NESTED_EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
] as const;
export const APP_OR_HYBRID_EXTENSION_TYPES = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;
export const APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES = [
	...APP_OR_HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;

export const EXTENSION_LANGUAGES = ['javascript', 'typescript'] as const;

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-)(.+)$/;

export const EXTENSION_PKG_KEY = 'directus:extension';

export const SplitEntrypoint = z.object({
	app: z.string(),
	api: z.string(),
});

export const ExtensionOptionsBundleEntry = z.union([
	z.object({
		type: z.union([z.enum(APP_EXTENSION_TYPES), z.enum(API_EXTENSION_TYPES)]),
		name: z.string(),
		source: z.string(),
	}),
	z.object({
		type: z.enum(HYBRID_EXTENSION_TYPES),
		name: z.string(),
		source: SplitEntrypoint,
	}),
]);

export const ExtensionOptionsBase = z.object({
	host: z.string(),
	hidden: z.boolean().optional(),
});

export const ExtensionOptionsAppOrApi = z.object({
	type: z.union([z.enum(APP_EXTENSION_TYPES), z.enum(API_EXTENSION_TYPES)]),
	path: z.string(),
	source: z.string(),
});

export const ExtensionOptionsHybrid = z.object({
	type: z.enum(HYBRID_EXTENSION_TYPES),
	path: SplitEntrypoint,
	source: SplitEntrypoint,
});

export const ExtensionOptionsBundle = z.object({
	type: z.literal('bundle'),
	path: SplitEntrypoint,
	entries: z.array(ExtensionOptionsBundleEntry),
});

export const ExtensionOptionsBundleEntries = z.array(ExtensionOptionsBundleEntry);

export const ExtensionOptions = ExtensionOptionsBase.and(
	z.union([ExtensionOptionsAppOrApi, ExtensionOptionsHybrid, ExtensionOptionsBundle])
);

export const ExtensionManifest = z.object({
	name: z.string(),
	version: z.string(),
	type: z.union([z.literal('module'), z.literal('commonjs')]).optional(),
	dependencies: z.record(z.string()).optional(),
	[EXTENSION_PKG_KEY]: ExtensionOptions,
});
