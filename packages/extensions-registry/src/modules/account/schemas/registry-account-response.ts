import { z } from 'zod';

export const RegistryAccountResponse = z.object({
	data: z.object({
		id: z.string(),
		username: z.string(),
		verified: z.boolean(),
		github_username: z.string().nullable(),
		github_avatar_url: z.string().nullable(),
		github_name: z.string().nullable(),
		github_company: z.string().nullable(),
		github_blog: z.string().nullable(),
		github_location: z.string().nullable(),
		github_bio: z.string().nullable(),
	}),
});

export type RegistryAccountResponse = z.infer<typeof RegistryAccountResponse>;
