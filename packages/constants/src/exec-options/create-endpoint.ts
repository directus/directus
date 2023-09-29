import { z } from "zod";
import { Reference } from "isolated-vm";

export const EXEC_CREATE_ENDPOINT = z.object({
	'method': z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
	'path': z.string(),
	'callback': z.custom<Reference>((value) => {
		if (!(value instanceof Reference)) {
			throw new Error('Invalid reference');
		}

		return value;
	}),
})
