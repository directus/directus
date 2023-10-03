import { z } from "zod";

export const EXEC_REGISTER_HOOK = z.union([
	z.tuple([
		z.literal('register-filter'),
		z.object({
			'event': z.string(),
			'handler': z.function(z.tuple([z.record(z.string())]), z.record(z.string()))
		})
	]),
	z.tuple([
		z.literal('register-action'),
		z.object({
			'event': z.string(),
			'handler': z.function(z.tuple([z.record(z.string())]), z.void())
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
