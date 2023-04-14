import type { Request } from 'express';
import { describe, expect, vi, test } from 'vitest';
import { getCacheControlHeader } from './get-cache-headers.js';

let factoryEnv: { [k: string]: any } = {};

vi.mock('../../src/env', () => ({
	default: new Proxy(
		{},
		{
			get(_target, prop) {
				return factoryEnv[prop as string];
			},
		}
	),
	getEnv: vi.fn().mockImplementation(() => factoryEnv),
}));

const scenarios = [
	// Test the cache-control header
	{
		name: 'when cache-Control header includes no-store',
		input: {
			env: { CACHE_SKIP_ALLOWED: true },
			headers: { 'Cache-Control': 'no-store' },
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'no-store',
	},
	{
		name: 'when cache-Control header does not include no-store',
		input: {
			env: { CACHE_SKIP_ALLOWED: true },
			headers: { other: 'value' },
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'max-age=5679',
	},

	// Test the ttl value
	{
		name: 'when ttl is undefined',
		input: {
			env: {},
			headers: {},
			accountability: null,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'no-cache',
	},
	{
		name: 'when ttl is < 0',
		input: {
			env: {},
			headers: {},
			accountability: null,
			ttl: -1,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'no-cache',
	},
	{
		name: 'when ttl is 0',
		input: {
			env: {},
			headers: {},
			accountability: null,
			ttl: 0,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'max-age=0',
	},

	// Test CACHE_AUTO_PURGE env for no-cache
	{
		name: 'when CACHE_AUTO_PURGE is true and globalCacheSettings is true',
		input: {
			env: {
				CACHE_AUTO_PURGE: true,
			},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: true,
			personalized: false,
		},
		output: 'no-cache',
	},
	{
		name: 'when CACHE_AUTO_PURGE is true and globalCacheSettings is false',
		input: {
			env: {
				CACHE_AUTO_PURGE: true,
			},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: false,
		},
		output: 'max-age=5679',
	},
	{
		name: 'when CACHE_AUTO_PURGE is true and globalCacheSettings is true',
		input: {
			env: {
				CACHE_AUTO_PURGE: false,
			},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: true,
			personalized: false,
		},
		output: 'max-age=5679',
	},

	// Test personalized
	{
		name: 'when personalized is true and accountability is null',
		input: {
			env: {},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: true,
		},
		output: 'public, max-age=5679',
	},
	{
		name: 'when personalized is true and accountability is provided',
		input: {
			env: {},
			headers: {},
			accountability: {
				role: '7efc7413-7ffe-4e6f-a0ac-687bbf9f8076',
			},
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: true,
		},
		output: 'private, max-age=5679',
	},
	{
		name: 'when personalized is true and accountability with missing role is provided',
		input: {
			env: {},
			headers: {},
			accountability: {},
			ttl: 5678910,
			globalCacheSettings: false,
			personalized: true,
		},
		output: 'public, max-age=5679',
	},

	// Test CACHE_CONTROL_S_MAXAGE env for s-maxage flag
	{
		name: 'when globalCacheSettings is true and CACHE_CONTROL_S_MAXAGE is set',
		input: {
			env: {
				CACHE_CONTROL_S_MAXAGE: 123456,
			},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: true,
			personalized: false,
		},
		output: 'max-age=5679, s-maxage=123456',
	},
	{
		name: 'when globalCacheSettings is true and CACHE_CONTROL_S_MAXAGE is not set',
		input: {
			env: {},
			headers: {},
			accountability: null,
			ttl: 5678910,
			globalCacheSettings: true,
			personalized: false,
		},
		output: 'max-age=5679',
	},
];

describe('get cache headers', () => {
	for (const scenario of scenarios) {
		test(scenario.name, () => {
			const mockRequest = {
				headers: scenario.input.headers as any,
				accountability: scenario.input.accountability,
				get: vi.fn().mockImplementation((header) => {
					const matchingKey = Object.keys(scenario.input.headers as any).find((key) => key.toLowerCase() === header);
					return matchingKey ? (scenario.input.headers as any)?.[matchingKey] : undefined;
				}),
			} as Partial<Request>;

			factoryEnv = scenario.input.env;
			const { ttl, globalCacheSettings, personalized } = scenario.input;

			expect(getCacheControlHeader(mockRequest as Request, ttl, globalCacheSettings, personalized)).toEqual(
				scenario.output
			);
		});
	}
});
