import { describe, expect, test } from 'vitest';
import { summarizeDcrRegistrationMetadata } from './registration-debug.js';

describe('summarizeDcrRegistrationMetadata', () => {
	test('summarizes useful DCR shape without logging arbitrary submitted values', () => {
		const summary = summarizeDcrRegistrationMetadata({
			client_name: 'sentinel-client-name',
			redirect_uris: ['https://user:pass@example.com/callback?secret=sentinel-query#sentinel-fragment'],
			grant_types: ['authorization_code', 'sentinel-grant'],
			response_types: ['code', 'sentinel-response'],
			token_endpoint_auth_method: 'sentinel-auth-method',
			client_uri: 'https://client-secret.example/path?secret=sentinel-client-uri-query',
			unknown_secret_field: 'sentinel-unknown-field-value',
			client_secret: 'sentinel-client-secret',
		});

		expect(summary).toMatchObject({
			body_type: 'object',
			unknown_fields: ['unknown_secret_field'],
			client_name: { type: 'string', present: true, length: 20 },
			redirect_uris: {
				type: 'array',
				count: 1,
				uris: [
					{
						scheme: 'https',
						hostname: 'example.com',
						has_query: true,
						has_fragment: true,
						has_userinfo: true,
					},
				],
			},
			grant_types: {
				type: 'array',
				count: 2,
				recognized_values: ['authorization_code'],
				unknown_value_count: 1,
			},
			response_types: {
				type: 'array',
				count: 2,
				recognized_values: ['code'],
				unknown_value_count: 1,
			},
			token_endpoint_auth_method: {
				type: 'string',
				unknown_value: true,
			},
			client_secret_present: true,
		});

		const serialized = JSON.stringify(summary);

		expect(serialized).not.toContain('sentinel-client-name');
		expect(serialized).not.toContain('sentinel-query');
		expect(serialized).not.toContain('sentinel-fragment');
		expect(serialized).not.toContain('sentinel-grant');
		expect(serialized).not.toContain('sentinel-response');
		expect(serialized).not.toContain('sentinel-auth-method');
		expect(serialized).not.toContain('sentinel-client-uri-query');
		expect(serialized).not.toContain('sentinel-unknown-field-value');
		expect(serialized).not.toContain('sentinel-client-secret');
		expect(serialized).not.toContain('user:pass');
	});
});
