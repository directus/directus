import type { IncomingMessage } from 'http';
import type internal from 'stream';
import type { Accountability, Query } from '@directus/types';
import type { WebSocket } from 'ws';
import type { AuthMode } from './messages.js';

export type AuthenticationState = {
	accountability: Accountability | null;
	expires_at: number | null;
	refresh_token?: string;
};

export type WebSocketClient = WebSocket &
	AuthenticationState & { uid: string | number; auth_timer: NodeJS.Timeout | null };
export type UpgradeRequest = IncomingMessage & AuthenticationState;
export type WebSocketAuthentication = {
	mode: AuthMode;
	timeout: number;
};

export type SubscriptionEvent = 'create' | 'update' | 'delete';

export type Subscription = {
	uid?: string | number;
	query?: Query;
	item?: string | number;
	event?: SubscriptionEvent;
	collection: string;
	client: WebSocketClient;
};

export type UpgradeContext = {
	request: IncomingMessage;
	socket: internal.Duplex;
	head: Buffer;
	accountabilityOverrides: Pick<Accountability, 'ip' | 'userAgent' | 'origin'>;
};

export type GraphQLSocket = {
	client: WebSocketClient;
};

export type LogsSubscription = Record<string, Set<WebSocketClient>>;
