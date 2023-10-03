import { z } from "zod";

export const EXEC_REGISTER_OPERATION = z.tuple([
	z.literal('register-operation'),
	z.object({
		'id': z.string(),
		'handler': z.function(z.tuple([z.record(z.string())]), z.record(z.string()))
	})
])
