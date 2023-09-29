import { z } from "zod";
import type { Reference } from "isolated-vm";

export const EXEC_CREATE_OPERATION = z.object({
	'id': z.string(),
	'handler': z.custom<Reference>((value) => {
		// TODO: Check if this is a valid reference

		return value;
	}),
})
