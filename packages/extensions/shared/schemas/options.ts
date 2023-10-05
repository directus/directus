import { z } from 'zod';
import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '../constants/index.js';

export const SplitEntrypoint = z.object({
	app: z.string(),
	api: z.string(),
});

export type SplitEntrypoint = z.infer<typeof SplitEntrypoint>;

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

export type ExtensionOptionsBundleEntry = z.infer<typeof ExtensionOptionsBundleEntry>;

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

export type ExtensionOptionsBundleEntries = z.infer<typeof ExtensionOptionsBundleEntries>;

export const ExtensionOptions = ExtensionOptionsBase.and(
	z.union([ExtensionOptionsAppOrApi, ExtensionOptionsHybrid, ExtensionOptionsBundle])
);

export type ExtensionOptions = z.infer<typeof ExtensionOptions>;
