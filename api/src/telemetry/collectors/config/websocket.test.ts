import { describe, expect, test } from 'vitest';
import { collectWebsocket } from './websocket.js';

describe('collectWebsocket', () => {
	test('returns all false by default', () => {
		expect(collectWebsocket({})).toEqual({
			enabled: false,
			rest: false,
			graphql: false,
			logs: false,
		});
	});

	test('returns configured values', () => {
		expect(collectWebsocket({
			WEBSOCKETS_ENABLED: true,
			WEBSOCKETS_REST_ENABLED: true,
			WEBSOCKETS_GRAPHQL_ENABLED: false,
			WEBSOCKETS_LOGS_ENABLED: true,
		})).toEqual({
			enabled: true,
			rest: true,
			graphql: false,
			logs: true,
		});
	});
});
