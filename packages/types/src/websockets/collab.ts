import z from 'zod';
import type { Item } from '../items.js';
import { WebSocketMessage } from './base.js';

export const COLLAB = 'collab';
export const COLLAB_COLORS = ['purple', 'pink', 'blue', 'green', 'yellow', 'orange', 'red'] as const;

export type CollabColor = (typeof COLLAB_COLORS)[number];

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
		item: z.string().nullable(),
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

// Broadcast Messages
export type BroadcastMessage =
	| {
			type: 'send';
			client: ClientID;
			message: ClientCollabMessage;
	  }
	| {
			type: 'room';
			action: 'close';
			room: string;
	  };

// Outgoing Messages
export type ClientCollabMessage = {
	type: typeof COLLAB;
	room: string;
} & ClientBaseCollabMessage;

export type UserID = string;
export type ClientID = string | number;

export type ClientBaseCollabMessage =
	| {
			action: 'init';
			collection: string;
			item: string | null;
			version: string | null;
			changes: Item;
			connection: ClientID;
			focuses: Record<ClientID, string>;
			users: { user: UserID; connection: ClientID; color: CollabColor }[];
	  }
	| {
			action: 'join';
			user: UserID;
			color: CollabColor;
			connection: ClientID;
	  }
	| {
			action: 'leave';
			connection: ClientID;
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
			connection: ClientID;
			field: string | null;
	  };
