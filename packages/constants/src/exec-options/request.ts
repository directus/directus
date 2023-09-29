import { z } from "zod";

export const EXEC_REQUEST = z.object({
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
	url: z.string(),
	headers: z.record(z.string()),
	body: z.any(),
})
