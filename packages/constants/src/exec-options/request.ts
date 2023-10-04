import { z } from "zod";

export const EXEC_REQUEST = z.tuple([
	z.literal("request"),
	z.string(),
	z.object({
		method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
		headers: z.record(z.string()).optional(),
		body: z.string().optional(),
		output: z.enum(["json", "text"]).optional(),
	}).optional(),
])
