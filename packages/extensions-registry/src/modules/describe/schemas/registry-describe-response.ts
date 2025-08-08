import { EXTENSION_TYPES } from '@directus/constants';
import { z } from 'zod';

export const RegistryDescribeResponse = z.strictObject({
	data: z.strictObject({
		id: z.string(),
		name: z.string(),
		description: z.union([z.null(), z.string()]),
		total_downloads: z.number(),
		downloads: z.union([
			z.null(),
			z.array(
				z.strictObject({
					date: z.string(),
					count: z.number(),
				}),
			),
		]),
		verified: z.boolean(),
		readme: z.union([z.null(), z.string()]),
		type: z.enum(EXTENSION_TYPES),
		license: z.string().nullable(),
		versions: z.array(
			z.strictObject({
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
				license: z.string().nullable(),
				publisher: z.strictObject({
					id: z.string(),
					username: z.string(),
					verified: z.boolean(),
					github_name: z.string().nullable(),
					github_avatar_url: z.string().nullable(),
				}),
				bundled: z.array(
					z.strictObject({
						name: z.string(),
						type: z.string(),
					}),
				),
				maintainers: z
					.array(
						z.strictObject({
							accounts_id: z.strictObject({
								id: z.string(),
								username: z.string(),
								verified: z.boolean(),
								github_name: z.string().nullable(),
								github_avatar_url: z.string().nullable(),
							}),
						}),
					)
					.nullable(),
			}),
		),
	}),
});

export type RegistryDescribeResponse = z.infer<typeof RegistryDescribeResponse>;
