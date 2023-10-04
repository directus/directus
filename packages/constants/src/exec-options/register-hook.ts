import { z } from "zod";

export const EXEC_REGISTER_FILTER_RESPONSE = z.record(z.string())

export const EXEC_REGISTER_HOOK = z.union([
	z.tuple([
		z.literal('register-filter'),
		z.object({
			'event': z.string(),
			'handler': z.function(z.tuple([z.record(z.string())]), EXEC_REGISTER_FILTER_RESPONSE.promise())
		})
	]),
	z.tuple([
		z.literal('register-action'),
		z.object({
			'event': z.string(),
			'handler': z.function(z.tuple([z.record(z.string())]), z.void().promise())
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
