import type { Item, PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';

export const ItemValidateSchema = z.custom<Item>();
export const ItemInputSchema = z.record(z.string(), z.any());

export const PartialItemInputSchema = z.strictObject({
	collection: z.string(),
});

export const QueryValidateSchema = z.custom<Query>();

export const QueryInputSchema = z.object({
	fields: z.array(z.string()).optional(),
	sort: z.array(z.string()).optional(),
	filter: z.record(z.string(), z.any()).optional(),
	limit: z.number().optional(),
	offset: z.number().optional(),
	page: z.number().optional(),
	search: z.string().optional(),
	deep: z.record(z.string(), z.any()).optional(),
	alias: z.record(z.string(), z.string()).optional(),
	aggregate: z.object({
		count: z.array(z.string()).optional(),
		sum: z.array(z.string()).optional(),
		avg: z.array(z.string()).optional(),
		min: z.array(z.string()).optional(),
		max: z.array(z.string()).optional(),
	}).optional(),
	backlink: z.boolean().optional(),
});

export const PrimaryKeyValidateSchema = z.custom<PrimaryKey>();
export const PrimaryKeyInputSchema = z.union([z.number(), z.string()]);
