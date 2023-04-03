import { Query } from '@directus/shared/types';
import { ClientOptions } from 'ws';

export type PrimaryKeyType = 'integer' | 'uuid' | 'string';
export type WebSocketAuthMethod = 'public' | 'handshake' | 'strict';
export type WebSocketUID = string | number;
export type WebSocketResponse = {
	type: string;
	status?: string;
	uid?: WebSocketUID;
	[field: string]: any;
};
export type WebSocketOptions = {
	/**
	 * Client options to be passed to ws
	 */
	client?: ClientOptions;

	/**
	 * Authenticate once websocket connection is opened
	 */
	auth?: { email: string; password: string } | { access_token: string } | { refresh_token: string };

	/**
	 * Path for the REST websocket
	 */
	path?: string;

	/**
	 * Query string for the REST websocket
	 */
	queryString?: string;

	/**
	 * To disable response to pings
	 */
	respondToPing?: boolean;

	/**
	 * Timeout before erroring
	 */
	waitTimeout?: number;
};
export type WebSocketSubscriptionOptions = {
	/**
	 * Collection to subscribe
	 */
	collection: string;

	/**
	 * Primary key of item
	 */
	item?: string | number;

	/**
	 * Query options
	 */
	query?: Query;

	/**
	 * Unique ID
	 */
	uid?: WebSocketUID;
};
