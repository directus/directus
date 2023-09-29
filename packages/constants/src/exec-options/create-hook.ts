import { z } from "zod";
import type { Reference } from "isolated-vm";

const callback = z.custom<Reference>((value) => {
	// TODO: Check if this is a valid reference

	return value;
});

export const EXEC_CREATE_HOOK = z.union([
	z.object({
		'type': z.enum(['filter', 'action']),
		'event': z.string(),
		'callback': callback,
	}),
	z.object({
		'type': z.enum(['init']),
		'event': z.string(),
		'callback': callback,
	}),
	z.object({
		'type': z.enum(['schedule']),
		'cron': z.string(),
		'callback': callback,
	}),
	z.object({
		'type': z.enum(['embed']),
		'position': z.enum(['head', 'body']),
		'code': z.union([z.string(), callback]),
	})
])
