import { z } from 'zod';

export const EXEC_CRUD = z.union([
	z.tuple([
		z.literal('create-items'),
		z.string(),
		z.object({
			data: z.array(z.record(z.unknown())),
		}),
	]),
	z.tuple([
		z.literal('read-items'),
		z.string(),
		z.object({
			query: z.record(z.unknown()).optional(),
		}),
	]),
	z.tuple([
		z.literal('update-items'),
		z.string(),
		z.object({
			query: z.record(z.unknown()).optional(),
			data: z.record(z.unknown()),
		}),
	]),
	z.tuple([
		z.literal('delete-items'),
		z.string(),
		z.object({
			query: z.record(z.unknown()).optional(),
		}),
	]),
]);
