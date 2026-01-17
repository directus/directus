import { type UUID } from 'crypto';
import z from 'zod';
import type { Item } from '../items.js';
import { TYPE } from './type.js';

export const COLLAB_BUS = 'collab';
export const COLORS = ['purple', 'pink', 'blue', 'green', 'yellow', 'orange', 'red'] as const;

export const ACTION = {
	CLIENT: {
		JOIN: 'join',
		LEAVE: 'leave',
		UPDATE: 'update',
		UPDATE_ALL: 'updateAll',
		FOCUS: 'focus',
	},
	SERVER: {
		INIT: 'init',
		JOIN: 'join',
		LEAVE: 'leave',
		SAVE: 'save',
		UPDATE: 'update',
		FOCUS: 'focus',
	},
} as const;

export type Color = (typeof COLORS)[number];

const BaseClientMessage = z.object({
	type: z.literal(TYPE.COLLAB),
	room: z.string(),
});

// Messages from client to server
export const ClientMessage = z.discriminatedUnion('action', [
	z.object({
		type: z.literal(TYPE.COLLAB),
		action: z.literal(ACTION.CLIENT.JOIN),
		collection: z.string(),
		item: z.string().nullable(),
		version: z.string().nullable(),
		initialChanges: z.record(z.string(), z.any()).optional(),
	}),
	BaseClientMessage.extend({
		action: z.literal(ACTION.CLIENT.LEAVE),
	}),
	BaseClientMessage.extend({
		action: z.literal(ACTION.CLIENT.UPDATE),
		field: z.string(),
		changes: z.unknown().optional(),
	}),
	BaseClientMessage.extend({
		action: z.literal(ACTION.CLIENT.UPDATE_ALL),
		changes: z.record(z.string(), z.any()).optional(),
	}),
	BaseClientMessage.extend({
		action: z.literal(ACTION.CLIENT.FOCUS),
		field: z.string().nullable(),
	}),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

// Broadcast Messages
export type BroadcastMessage =
	| {
			type: 'send';
			client: ClientID;
			message: ServerMessage;
	  }
	| {
			type: 'room';
			action: 'close';
			room: string;
	  }
	| {
			type: 'ping';
			instance: UUID;
	  }
	| {
			type: 'pong';
			instance: UUID;
	  };

// Messages from server to client
export type ServerMessage = {
	type: typeof TYPE.COLLAB;
	room: string;
	order: number;
} & BaseServerMessage;

export type UserID = string;
export type ClientID = string | number;

export type BaseServerMessage =
	| {
			action: typeof ACTION.SERVER.INIT;
			collection: string;
			item: string | null;
			version: string | null;
			changes: Item;
			connection: ClientID;
			focuses: Record<ClientID, string>;
			users: { user: UserID; connection: ClientID; color: Color }[];
	  }
	| {
			action: typeof ACTION.SERVER.JOIN;
			user: UserID;
			color: Color;
			connection: ClientID;
	  }
	| {
			action: typeof ACTION.SERVER.LEAVE;
			connection: ClientID;
	  }
	| {
			action: typeof ACTION.SERVER.SAVE;
	  }
	| {
			action: typeof ACTION.SERVER.UPDATE;
			field: string;
			changes?: unknown;
	  }
	| {
			action: typeof ACTION.SERVER.FOCUS;
			connection: ClientID;
			field: string | null;
	  };
