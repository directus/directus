import z from 'zod';

export const ResolveInput = z.object({
	collections: z.array(z.string()).optional(),
	seats: z.array(z.string()).optional(),
	sso: z
		.union([
			z.object({
				admin: z.object({
					email: z.string().optional(),
					password: z.string().optional(),
				}),
			}),
			z.boolean(),
		])
		.optional(),
});

export type ResolveInput = z.infer<typeof ResolveInput>;
