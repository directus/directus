import type { Item, PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';

export const ItemValidateSchema = z.custom<Item>();
export const ItemInputSchema = z.record(z.string(), z.any());

export const PartialItemInputSchema = z.object({
	collection: z.string(),
});

export const QueryValidateSchema = z.custom<Query>();
export const QueryInputSchema = z.object({
	fields: z.union([z.array(z.string()), z.null()]).optional(),
	sort: z.union([z.array(z.string()), z.null()]).optional(),
	filter: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	limit: z.union([z.number(), z.null()]).optional(),
	offset: z.union([z.number(), z.null()]).optional(),
	page: z.union([z.number(), z.null()]).optional(),
	search: z.union([z.string(), z.null()]).optional(),
	version: z.union([z.string(), z.null()]).optional(),
	versionRaw: z.union([z.boolean(), z.null()]).optional(),
	group: z.union([z.array(z.string()), z.null()]).optional(),
	aggregate: z
		.union([
			z.object({
				avg: z.array(z.string()).optional(),
				avgDistinct: z.array(z.string()).optional(),
				count: z.array(z.string()).optional(),
				countDistinct: z.array(z.string()).optional(),
				sum: z.array(z.string()).optional(),
				sumDistinct: z.array(z.string()).optional(),
				min: z.array(z.string()).optional(),
				max: z.array(z.string()).optional(),
				countAll: z.array(z.string()).optional(),
			}),
			z.null(),
		])
		.optional(),
	deep: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	alias: z.union([z.record(z.string(), z.string()), z.null()]).optional(),
	backlink: z.boolean().optional().optional(),
});

export const PrimaryKeyValidateSchema = z.custom<PrimaryKey>();
export const PrimaryKeyInputSchema = z.union([z.number(), z.string()]);
