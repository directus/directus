import { Item, Query } from '@directus/shared/types';
import { z } from 'zod';

export const WebSocketMessage = z
	.object({
		type: z.string(),
		uid: z.string().optional(),
	})
	.passthrough();
export type WebSocketMessage = z.infer<typeof WebSocketMessage> & Record<string, any>; // { type: string; uid?: string } & Record<string, any>;

export const WebSocketResponse = z.union([
	WebSocketMessage.extend({
		status: z.literal('ok'),
	}).passthrough(),
	WebSocketMessage.extend({
		status: z.literal('error'),
		error: z
			.object({
				code: z.string(),
				message: z.string(),
			})
			.passthrough(),
	}).passthrough(),
]);
export type WebSocketResponse = z.infer<typeof WebSocketResponse>;

export const WebSocketAuthMessage = WebSocketMessage.extend({
	type: z.literal('AUTH'),
}).and(
	z.union([
		z.object({ email: z.string(), password: z.string() }),
		z.object({ access_token: z.string() }),
		z.object({ refresh_token: z.string() }),
	])
);
export type WebSocketAuthMessage = z.infer<typeof WebSocketAuthMessage>;

export const WebSocketSubscribeMessage = z.union([
	WebSocketMessage.extend({
		type: z.literal('SUBSCRIBE'),
		collection: z.string(),
		item: z.union([z.string(), z.number()]).optional(),
		query: z.custom<Query>().optional(),
	}),
	WebSocketMessage.extend({
		type: z.literal('UNSUBSCRIBE'),
	}),
]);
export type WebSocketSubscribeMessage = z.infer<typeof WebSocketSubscribeMessage>;

const ZodItem = z.custom<Partial<Item>>();
export const WebSocketItemsMessage = WebSocketMessage.extend({
	type: z.literal('ITEMS'),
	collection: z.string(),
}).and(
	z.union([
		z.object({
			action: z.literal('create'),
			data: z.union([z.array(ZodItem), ZodItem]),
			query: z.custom<Query>().optional(),
		}),
		z.object({
			action: z.literal('read'),
			query: z.custom<Query>(),
		}),
		z.union([
			z.object({
				action: z.literal('update'),
				data: z.array(ZodItem),
				ids: z.array(z.union([z.string(), z.number()])),
				query: z.custom<Query>().optional(),
			}),
			z.object({
				action: z.literal('update'),
				data: ZodItem,
				id: z.union([z.string(), z.number()]),
				query: z.custom<Query>().optional(),
			}),
		]),
		z.union([
			z.object({
				action: z.literal('delete'),
				ids: z.array(z.union([z.string(), z.number()])),
			}),
			z.object({
				action: z.literal('delete'),
				id: z.union([z.string(), z.number()]),
			}),
			z.object({
				action: z.literal('delete'),
				query: z.custom<Query>(),
			}),
		]),
	])
);
export type WebSocketItemsMessage = z.infer<typeof WebSocketItemsMessage>;
