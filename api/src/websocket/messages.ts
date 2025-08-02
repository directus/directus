import type { Item, Query } from '@directus/types';
import { WebSocketMessage } from '@directus/types';
import { z } from 'zod';

const zodStringOrNumber = z.union([z.string(), z.number()]);

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

export const ConnectionParams = z.object({ access_token: z.string().optional() });
export type ConnectionParams = z.infer<typeof ConnectionParams>;

export const BasicAuthMessage = z.union([
	z.object({ email: z.string().email(), password: z.string() }),
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
		event: z.union([z.literal('create'), z.literal('update'), z.literal('delete')]).optional(),
		item: zodStringOrNumber.optional(),
		query: z.record(z.string(), z.any()).optional(),
	}),
	WebSocketMessage.extend({
		type: z.literal('unsubscribe'),
	}),
]);
export type WebSocketSubscribeMessage = z.infer<typeof WebSocketSubscribeMessage>;

export const WebSocketLogsMessage = z.union([
	z.object({
		type: z.literal('subscribe'),
		log_level: z.string(),
	}),
	WebSocketMessage.extend({
		type: z.literal('unsubscribe'),
	}),
]);
export type WebSocketLogsMessage = z.infer<typeof WebSocketLogsMessage>;

const ZodItem = z.custom<Partial<Item>>();

const PartialItemsMessage = z.object({
	uid: zodStringOrNumber.optional(),
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
		ids: z.array(zodStringOrNumber).optional(),
		id: zodStringOrNumber.optional(),
		query: z.custom<Query>().optional(),
	}),
	PartialItemsMessage.extend({
		action: z.literal('update'),
		data: ZodItem,
		ids: z.array(zodStringOrNumber).optional(),
		id: zodStringOrNumber.optional(),
		query: z.custom<Query>().optional(),
	}),
	PartialItemsMessage.extend({
		action: z.literal('delete'),
		ids: z.array(zodStringOrNumber).optional(),
		id: zodStringOrNumber.optional(),
		query: z.custom<Query>().optional(),
	}),
]);
export type WebSocketItemsMessage = z.infer<typeof WebSocketItemsMessage>;

export const WebSocketEvent = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('create'),
		collection: z.string(),
		payload: z.record(z.string(), z.any()).optional(),
		key: zodStringOrNumber,
	}),
	z.object({
		action: z.literal('update'),
		collection: z.string(),
		payload: z.record(z.string(), z.any()).optional(),
		keys: z.array(zodStringOrNumber),
	}),
	z.object({
		action: z.literal('delete'),
		collection: z.string(),
		payload: z.record(z.string(), z.any()).optional(),
		keys: z.array(zodStringOrNumber),
	}),
]);
export type WebSocketEvent = z.infer<typeof WebSocketEvent>;

export const AuthMode = z.union([z.literal('public'), z.literal('handshake'), z.literal('strict')]);
export type AuthMode = z.infer<typeof AuthMode>;
