import { z } from "zod";
import type { Reference } from "isolated-vm";

export const EXEC_CREATE_ENDPOINT = z.object({
	'method': z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
	'path': z.string(),
	'callback': z.custom<Reference>((value) => {
		// TODO: Check if this is a valid reference
		return value;
	}),
})
