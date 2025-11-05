import z from 'zod';
import type { Item } from '../items.js';
import { WebSocketMessage, zodStringOrNumber } from './base.js';

export const COLLAB = 'collab';

const BaseCollabMessage = WebSocketMessage.extend({
	type: z.literal(COLLAB),
	room: z.string(),
});

const ZodItem = z.custom<Partial<Item>>();

// Incomming Messages
export const WebSocketCollabMessage = z.discriminatedUnion('action', [
	WebSocketMessage.extend({
		type: z.literal(COLLAB),
		action: z.literal('join'),
		collection: z.string(),
		item: zodStringOrNumber,
		version: z.string().nullable(),
		initialChanges: ZodItem.optional(),
	}),
	BaseCollabMessage.extend({
		action: z.literal('leave'),
	}),
	BaseCollabMessage.extend({
		action: z.literal('save'),
	}),
	BaseCollabMessage.extend({
		action: z.literal('update'),
		field: z.string(),
		changes: z.unknown().optional(),
	}),
	BaseCollabMessage.extend({
		action: z.literal('focus'),
		field: z.string().nullable(),
	}),
]);
export type WebSocketCollabMessage = z.infer<typeof WebSocketCollabMessage>;

// Outgoing Messages
export type ClientCollabMessage = {
	type: typeof COLLAB;
	room: string;
} & ClientBaseCollabMessage;

export type ClientBaseCollabMessage =
	| { action: 'init'; changes: Item; focuses: Record<string, string> }
	| {
			action: 'join';
			user: string;
	  }
	| {
			action: 'leave';
			user: string;
	  }
	| {
			action: 'save';
	  }
	| {
			action: 'update';
			field: string;
			changes?: unknown;
	  }
	| {
			action: 'focus';
			user: string;
			field: string | null;
	  };
