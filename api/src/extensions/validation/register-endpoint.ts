import { z } from 'zod';

export const EXEC_REGISTER_ENDPOINT_RESPONSE = z.object({
	status: z.number(),
	body: z.union([z.string(), z.record(z.string())]),
});

export const EXEC_REGISTER_ENDPOINT = z.tuple([
	z.literal('register-endpoint'),
	z.object({
		method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
		path: z.string(),
		handler: z.function(
			z.tuple([
				z.object({
					url: z.string(),
					headers: z.record(z.string()),
					body: z.union([z.string(), z.record(z.any())]),
					baseUrl: z.string(),
				}),
			]),
			EXEC_REGISTER_ENDPOINT_RESPONSE.promise()
		),
	}),
]);
