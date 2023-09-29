import { z } from "zod";
import { Reference } from "isolated-vm";

export const EXEC_CREATE_OPERATION = z.object({
	'id': z.string(),
	'handler': z.custom<Reference>((value) => {
		if (!(value instanceof Reference)) {
			throw new Error('Invalid reference');
		}

		return value;
	}),
})
