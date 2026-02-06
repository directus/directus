import { z } from 'zod';

export type RegistryAccountResponse = {
	data: {
		id: string;
		username: string;
		verified: boolean;
		github_username: string | null;
		github_avatar_url: string | null;
		github_name: string | null;
		github_company: string | null;
		github_blog: string | null;
		github_location: string | null;
		github_bio: string | null;
	};
};

export const RegistryAccountResponse: z.ZodType<RegistryAccountResponse> = z.object({
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
