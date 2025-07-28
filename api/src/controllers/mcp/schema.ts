import type { Item, PrimaryKey, Query } from '@directus/types';
import { z } from 'zod';

export const ItemSchema = z.custom<Partial<Item>>();

export const PartialItemInput = z.object({
	collection: z.string(),
});

export const QuerySchema = z.custom<Query>();
export const PrimaryKeySchema = z.custom<PrimaryKey>();
