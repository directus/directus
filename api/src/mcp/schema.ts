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
	aggregate: z
		.object({
			count: z.array(z.string()).optional(),
			sum: z.array(z.string()).optional(),
			avg: z.array(z.string()).optional(),
			min: z.array(z.string()).optional(),
			max: z.array(z.string()).optional(),
		})
		.optional(),
	backlink: z.boolean().optional(),
});

export const PrimaryKeyValidateSchema = z.custom<PrimaryKey>();
export const PrimaryKeyInputSchema = z.union([z.number(), z.string()]);

export const FolderItemSchema = z.strictObject({
	id: PrimaryKeyInputSchema.optional(),
	name: z.string(),
	parent: z.string().optional(),
});

export const FileItemSchema = z.strictObject({
	id: z.string(),
	storage: z.string(),
	filename_disk: z.string(),
	filename_download: z.string(),
	title: z.union([z.string(), z.null()]),
	type: z.union([z.string(), z.null()]),
	folder: z.union([z.string(), z.null()]),
	created_on: z.string(),
	uploaded_by: z.union([z.string(), z.null()]),
	uploaded_on: z.union([z.string(), z.null()]),
	modified_by: z.union([z.string(), z.null()]),
	modified_on: z.string(),
	charset: z.union([z.string(), z.null()]),
	filesize: z.number(),
	width: z.union([z.number(), z.null()]),
	height: z.union([z.number(), z.null()]),
	duration: z.union([z.number(), z.null()]),
	embed: z.union([z.string(), z.null()]),
	description: z.union([z.string(), z.null()]),
	location: z.union([z.string(), z.null()]),
	tags: z.union([z.string(), z.null()]),
	metadata: z.union([z.record(z.string(), z.any()), z.null()]),
	focal_point_x: z.union([z.number(), z.null()]),
	focal_point_y: z.union([z.number(), z.null()]),
	tus_id: z.union([z.string(), z.null()]),
	tus_data: z.union([z.record(z.string(), z.any()), z.null()]),
});

export const FieldItemSchema = z.strictObject({
	collection: z.string(),
	field: z.string(),
	type: z.string(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]),
	meta: z.union([z.record(z.string(), z.any()), z.null()]),
	name: z.string(),
	children: z.union([z.array(z.record(z.string(), z.any())), z.null()]),
});

export const CollectionItemSchema = z.strictObject({
	collection: z.string(),
	fields: z.array(FieldItemSchema).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

export const OperationItemSchema = z
	.strictObject({
		id: z.string(),
		name: z.union([z.string(), z.null()]),
		key: z.string(),
		type: z.string(),
		position_x: z.number(),
		position_y: z.number(),
		options: z.record(z.string(), z.any()),
		resolve: z.union([z.string(), z.null()]),
		reject: z.union([z.string(), z.null()]),
		flow: z.string(),
		date_created: z.string(),
		user_created: z.string(),
	})
	.partial();

export const RelationItemSchema = z.strictObject({
	collection: z.string(),
	field: z.string(),
	related_collection: z.union([z.string(), z.null()]),
	schema: z.union([z.record(z.string(), z.any()), z.null()]),
	meta: z.union([z.record(z.string(), z.any()), z.null()]),
});
