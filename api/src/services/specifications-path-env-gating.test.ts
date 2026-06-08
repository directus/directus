import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEnv, resetEnvMock } from '../test-utils/env.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv();
});

vi.mock('@directus/specs', () => ({
	spec: {
		openapi: '3.0.1',
		info: { title: 'Test', version: '1' },
		tags: [{ name: 'Authentication' }, { name: 'Metrics', 'x-enabled-env': 'METRICS_ENABLED' }],
		paths: {
			'/auth/login': {
				post: {
					tags: ['Authentication'],
					operationId: 'login',
					responses: { '200': { description: 'Successful login' } },
				},
			},
			'/metrics': {
				get: {
					tags: ['Metrics'],
					operationId: 'getMetrics',
					responses: { '200': { description: 'Metrics output' } },
				},
			},
		},
		components: { schemas: {}, responses: {} },
	},
}));

class Client_PG extends MockClient {}

describe('Services / Specifications / x-enabled-env gating', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	const schema = new SchemaBuilder().build();

	beforeAll(async () => {
		db = vi.mocked(knex.default({ client: Client_PG }));
		tracker = createTracker(db);
	});

	beforeEach(() => {
		resetEnvMock();
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('tag-level', () => {
		it('excludes a tag and its paths when the env var is not set', async () => {
			const { useEnv } = await import('@directus/env');
			vi.mocked(useEnv).mockReturnValue(mockEnv().useEnv() as any);

			const { SpecificationService } = await import('./index.js');

			const service = new SpecificationService({
				knex: db,
				schema,
				accountability: { role: 'admin', admin: true } as Accountability,
			});

			const spec = await service.oas.generate();

			expect(spec.paths).toHaveProperty('/auth/login');
			expect(spec.paths).not.toHaveProperty('/metrics');
		});

		it('includes a tag and its paths when the env var is set', async () => {
			const { useEnv } = await import('@directus/env');
			vi.mocked(useEnv).mockReturnValue(mockEnv({ METRICS_ENABLED: true }).useEnv() as any);

			const { SpecificationService } = await import('./index.js');

			const service = new SpecificationService({
				knex: db,
				schema,
				accountability: { role: 'admin', admin: true } as Accountability,
			});

			const spec = await service.oas.generate();

			expect(spec.paths).toHaveProperty('/auth/login');
			expect(spec.paths).toHaveProperty('/metrics');
		});
	});
});
