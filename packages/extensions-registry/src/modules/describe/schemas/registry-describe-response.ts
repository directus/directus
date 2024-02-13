import { EXTENSION_TYPES } from '@directus/extensions';
import { z } from 'zod';

export const RegistryDescribeResponse = z.object({
	data: z.object({
		id: z.string(),
		name: z.string(),
		description: z.union([z.null(), z.string()]),
		total_downloads: z.number(),
		downloads: z.union([
			z.null(),
			z.array(
				z.object({
					date: z.string(),
					count: z.number(),
				}),
			),
		]),
		verified: z.boolean(),
		readme: z.union([z.null(), z.string()]),
		type: z.enum(EXTENSION_TYPES),
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
					id: z.string(),
					username: z.string(),
					verified: z.boolean(),
					github_name: z.string().nullable(),
					github_avatar_url: z.string().nullable(),
				}),
			}),
		),
	}),
});

export type RegistryDescribeResponse = z.infer<typeof RegistryDescribeResponse>;
