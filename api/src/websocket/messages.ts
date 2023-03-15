import { Item, Query } from '@directus/shared/types';
import { z } from 'zod';

const zodPrimaryKey = z.union([z.string(), z.number()]);

export const WebSocketMessage = z
	.object({
		type: z.string(),
		uid: z.string().optional(),
	})
	.passthrough();
export type WebSocketMessage = z.infer<typeof WebSocketMessage>;

export const WebSocketResponse = z.discriminatedUnion('status', [
	WebSocketMessage.extend({
		status: z.literal('ok'),
	}),
	WebSocketMessage.extend({
		status: z.literal('error'),
		error: z
			.object({
				code: z.string(),
				message: z.string(),
			})
			.passthrough(),
	}),
]);
export type WebSocketResponse = z.infer<typeof WebSocketResponse>;

export const BasicAuthMessage = z.union([
	z.object({ email: z.string(), password: z.string() }),
	z.object({ access_token: z.string() }),
	z.object({ refresh_token: z.string() }),
]);
export type BasicAuthMessage = z.infer<typeof BasicAuthMessage>;

export const WebSocketAuthMessage = WebSocketMessage.extend({
	type: z.literal('auth'),
}).and(BasicAuthMessage);
export type WebSocketAuthMessage = z.infer<typeof WebSocketAuthMessage>;

export const WebSocketSubscribeMessage = z.discriminatedUnion('type', [
	WebSocketMessage.extend({
		type: z.literal('subscribe'),
		collection: z.string(),
		item: zodPrimaryKey.optional(),
		query: z.custom<Query>().optional(),
	}),
	WebSocketMessage.extend({
		type: z.literal('unsubscribe'),
	}),
]);
export type WebSocketSubscribeMessage = z.infer<typeof WebSocketSubscribeMessage>;

const ZodItem = z.custom<Partial<Item>>();
const PartialItemsMessage = z.object({
	uid: z.string().optional(),
	type: z.literal('items'),
	collection: z.string(),
});

export const WebSocketItemsMessage = z.union([
	PartialItemsMessage.extend({
		action: z.literal('create'),
		data: z.union([z.array(ZodItem), ZodItem]),
		query: z.custom<Query>().optional(),
	}),
	PartialItemsMessage.extend({
		action: z.literal('read'),
		ids: z.array(zodPrimaryKey).optional(),
		id: zodPrimaryKey.optional(),
		query: z.custom<Query>().optional(),
	}),
	PartialItemsMessage.extend({
		action: z.literal('update'),
		data: ZodItem,
		ids: z.array(zodPrimaryKey).optional(),
		id: zodPrimaryKey.optional(),
		query: z.custom<Query>().optional(),
	}),
	PartialItemsMessage.extend({
		action: z.literal('delete'),
		ids: z.array(zodPrimaryKey).optional(),
		id: zodPrimaryKey.optional(),
		query: z.custom<Query>().optional(),
	}),
]);
export type WebSocketItemsMessage = z.infer<typeof WebSocketItemsMessage>;

export const WebSocketEvent = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('create'),
		collection: z.string(),
		payload: z.record(z.any()).optional(),
		key: zodPrimaryKey,
	}),
	z.object({
		action: z.literal('update'),
		collection: z.string(),
		payload: z.record(z.any()).optional(),
		keys: z.array(zodPrimaryKey),
	}),
	z.object({
		action: z.literal('delete'),
		collection: z.string(),
		payload: z.record(z.any()).optional(),
		keys: z.array(zodPrimaryKey),
	}),
]);
export type WebSocketEvent = z.infer<typeof WebSocketEvent>;
