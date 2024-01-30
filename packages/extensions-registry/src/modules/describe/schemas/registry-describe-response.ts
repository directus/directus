import { EXTENSION_TYPES } from '@directus/extensions';
import { z } from 'zod';

export const RegistryDescribeResponse = z.object({
	id: z.string(),
	name: z.string(),
	description: z.union([z.null(), z.string()]),
	downloads: z.number(),
	verified: z.boolean(),
	readme: z.union([z.null(), z.string()]),
	versions: z.array(
		z.object({
			id: z.string(),
			version: z.string(),
			verified: z.boolean(),
			type: z.enum(EXTENSION_TYPES),
			host_version: z.string(),
			publish_date: z.string(),
			unpacked_size: z.number(),
			file_count: z.number(),
			url_bugs: z.union([z.null(), z.string()]),
			url_homepage: z.union([z.null(), z.string()]),
			url_repository: z.union([z.null(), z.string()]),
			publisher: z.object({
				username: z.string(),
				verified: z.boolean(),
			}),
		}),
	),
});
