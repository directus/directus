import type { Item, WebSocketClient, WebSocketCollabMessage } from '@directus/types';

export type CollabRoom = {
	uid: string;
	collection: string;
	item: string | number;
	version: string | undefined;
	changes: Item;
	clients: WebSocketClient[];
};

export type JoinMessage = Extract<WebSocketCollabMessage, { action: 'join' }>;
export type LeaveMessage = Extract<WebSocketCollabMessage, { action: 'leave' }>;
export type SaveMessage = Extract<WebSocketCollabMessage, { action: 'save' }>;
export type UpdateMessage = Extract<WebSocketCollabMessage, { action: 'update' }>;
export type FocusMessage = Extract<WebSocketCollabMessage, { action: 'focus' }>;
