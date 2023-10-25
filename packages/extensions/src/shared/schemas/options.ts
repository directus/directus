import { z } from 'zod';
import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '../constants/index.js';

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
				z.union([z.literal('GET'), z.literal('POST'), z.literal('PATCH'), z.literal('PUT'), z.literal('DELETE')])
			),
		})
	),
	log: z.optional(z.object({})),
	sleep: z.optional(z.object({})),
});

export const ExtensionSandboxOptions = z.optional(
	z.object({
		enabled: z.boolean(),
		requestedScopes: ExtensionSandboxRequestedScopes,
	})
);

export type ExtensionSandboxOptions = z.infer<typeof ExtensionSandboxOptions>;
export type ExtensionSandboxRequestedScopes = z.infer<typeof ExtensionSandboxRequestedScopes>;

export const ExtensionOptionsBundleEntry = z.union([
	z.object({
		type: z.enum(API_EXTENSION_TYPES),
		name: z.string(),
		source: z.string(),
	}),
	z.object({
		type: z.enum(APP_EXTENSION_TYPES),
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

export const ExtensionOptionsApp = z.object({
	type: z.enum(APP_EXTENSION_TYPES),
	path: z.string(),
	source: z.string(),
});

export const ExtensionOptionsApi = z.object({
	type: z.enum(API_EXTENSION_TYPES),
	path: z.string(),
	source: z.string(),
	sandbox: ExtensionSandboxOptions,
});

export const ExtensionOptionsHybrid = z.object({
	type: z.enum(HYBRID_EXTENSION_TYPES),
	path: SplitEntrypoint,
	source: SplitEntrypoint,
	sandbox: ExtensionSandboxOptions,
});

export const ExtensionOptionsBundle = z.object({
	type: z.literal('bundle'),
	path: SplitEntrypoint,
	entries: z.array(ExtensionOptionsBundleEntry),
});

export const ExtensionOptionsBundleEntries = z.array(ExtensionOptionsBundleEntry);

export type ExtensionOptionsBundleEntries = z.infer<typeof ExtensionOptionsBundleEntries>;

export const ExtensionOptions = ExtensionOptionsBase.and(
	z.union([ExtensionOptionsApp, ExtensionOptionsApi, ExtensionOptionsHybrid, ExtensionOptionsBundle])
);

export type ExtensionOptions = z.infer<typeof ExtensionOptions>;
