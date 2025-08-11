import { EXTENSION_TYPES } from '@directus/constants';
import { z } from 'zod';

export const RegistryListResponse = z.strictObject({
	meta: z.strictObject({
		filter_count: z.number(),
	}),
	data: z.array(
		z.strictObject({
			id: z.string(),
			name: z.string(),
			description: z.union([z.null(), z.string()]),
			total_downloads: z.number(),
			verified: z.boolean(),
			type: z.enum(EXTENSION_TYPES),
			last_updated: z.string(),
			host_version: z.string(),
			sandbox: z.boolean(),
			license: z.string().nullable(),
			publisher: z.strictObject({
				username: z.string(),
				verified: z.boolean(),
				github_name: z.string().nullable(),
			}),
		}),
	),
});

export type RegistryListResponse = z.infer<typeof RegistryListResponse>;
