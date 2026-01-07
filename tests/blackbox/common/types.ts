import type { Query } from '@directus/types';
import type { ClientOptions as ClientOptionsGql } from 'graphql-ws';
import type { ClientOptions } from 'ws';

/** @TODO Could also be big integer */
export type PrimaryKeyType = 'integer' | 'uuid' | 'string';

export type WebSocketAuthMethod = 'public' | 'handshake' | 'strict';
export type WebSocketUID = string | number;
export type WebSocketResponse = {
	type: string;
	status?: string;
	uid?: WebSocketUID;
	event?: string;
	[field: string]: any;
};
export type WebSocketDefaultOptions = {
	/**
	 * Authenticate once websocket connection is opened
	 */
	auth?: { email: string; password: string } | { access_token: string } | { refresh_token: string };

	/**
	 * Path of endpoint
	 */
	path?: string;

	/**
	 * Query string appended to URL
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
export type WebSocketOptions = WebSocketDefaultOptions & {
	/**
	 * Client options to be passed to ws
	 */
	client?: ClientOptions;
};
export type WebSocketOptionsGql = WebSocketDefaultOptions & {
	/**
	 * Client options to be passed to graphql-ws
	 */
	client?: ClientOptionsGql;
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

	/**
	 * Event to subscribe
	 */
	event?: 'create' | 'update' | 'delete';
};
export type WebSocketSubscriptionOptionsGql = {
	/**
	 * Collection to subscribe
	 */
	collection: string;

	/**
	 * GraphQL JSONQuery options
	 */
	jsonQuery: any;

	/**
	 * Unique ID
	 */
	uid?: WebSocketUID;

	/**
	 * Event to subscribe
	 */
	event?: 'create' | 'update' | 'delete';
};
