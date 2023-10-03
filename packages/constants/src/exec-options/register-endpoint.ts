import { z } from "zod";

export const EXEC_REGISTER_ENDPOINT = z.tuple([
	z.literal('register-endpoint'),
	z.object({
		'method': z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
		'path': z.string(),
		'handler': z.function(z.tuple([z.record(z.string())]), z.string()),
	})
])
