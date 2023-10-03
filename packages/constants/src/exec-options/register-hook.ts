import { z } from "zod";
import type { Reference } from "isolated-vm";

const callback = z.custom<Reference>((value) => {
	// TODO: Check if this is a valid reference

	return value;
});

export const EXEC_REGISTER_HOOK = z.union([
	z.tuple([
		z.literal('register-filter'),
		z.object({
			'event': z.string(),
			'callback': callback,
		})
	]),
	z.tuple([
		z.literal('register-action'),
		z.object({
			'event': z.string(),
			'callback': callback,
		})
	]),
	// z.tuple([
	// 	z.literal('register-init'),
	// 	z.object({
	// 		'event': z.string(),
	// 		'callback': callback,
	// 	}),
	// ]),
	// z.tuple([
	// 	z.literal('register-schedule'),
	// 	z.object({
	// 		'cron': z.string(),
	// 		'callback': callback,
	// 	}),
	// ]),
	// z.tuple([
	// 	z.literal('register-embed'),
	// 	z.object({
	// 		'position': z.enum(['head', 'body']),
	// 		'code': z.string()
	// 	})
	// ]),
])
