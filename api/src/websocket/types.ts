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
	// events?: string | string[];
	status?: boolean;
	collection: string;
	client: WebSocketClient;
};

export type WebSocketMessage = { type: string; uid?: string } & Record<string, any>;

export type ResponseMessage =
	| {
			type: string;
			status: 'ok';
			uid?: string;
	  }
	| {
			type: string;
			status: 'error';
			error: {
				code: string;
				message: string;
			};
			uid?: string;
	  };

export type SubscribeMessage =
	| {
			type: 'SUBSCRIBE';
			collection: string;
			item?: string | number;
			status?: boolean;
			// events?: string | string[];
			query?: Query;
			uid?: string;
	  }
	| { type: 'UNSUBSCRIBE'; uid?: string };

export type AuthMessage =
	| { type: 'AUTH'; email: string; password: string; uid?: string }
	| { type: 'AUTH'; access_token: string; uid?: string }
	| { type: 'AUTH'; refresh_token: string; uid?: string };

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
