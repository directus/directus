import { ExtensionOptions } from '@directus/extensions';
import { z } from 'zod';

export const RegistryDescribeResponse = z.object({
	name: z.string(),
	description: z.string(),
	keywords: z.array(z.string()),
	readme: z.string(),
	license: z.string().optional(),
	maintainers: z.array(
		z.object({
			name: z.string(),
		}),
	),
	bugs: z
		.object({
			url: z.string().optional(),
		})
		.optional(),
	homepage: z.string().optional(),
	repository: z
		.object({
			type: z.string(),
			url: z.string(),
		})
		.optional(),
	versions: z.record(
		z.string(),
		z.object({
			dist: z.object({
				fileCount: z.number(),
				unpackedSize: z.number(),
				tarball: z.string(),
			}),
			_npmUser: z.object({
				name: z.string(),
			}),
			'directus:extension': ExtensionOptions.optional(),
		}),
	),
	'dist-tags': z.object({
		latest: z.string(),
	}),
});

export type RegistryDescribeResponse = z.infer<typeof RegistryDescribeResponse>;
