import type { Accountability, Query } from '@directus/shared/types';
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type internal from 'stream';

export type AuthenticationState = {
	accountability: Accountability | null;
	expiresAt: number | null;
};

export type WebSocketClient = WebSocket & AuthenticationState & { uid: string };
export type UpgradeRequest = IncomingMessage & AuthenticationState;

export type Subscription = {
	uid?: string;
	query?: Query;
	item?: string | number;
	status?: boolean;
	collection: string;
	client: WebSocketClient;
};

export type UpgradeContext = {
	request: IncomingMessage;
	socket: internal.Duplex;
	head: Buffer;
};

export type ConnectionParams = {
	email?: string;
	password?: string;
	access_token?: string;
	refresh_token?: string;
};
