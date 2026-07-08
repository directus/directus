import { SchemaBuilder } from '@directus/schema-builder';
import type { DeploymentWebhookEvent } from '@directus/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { DeploymentRunsService } from './deployment-runs.js';
import { ItemsService } from './items.js';

const { mockEmitAction } = vi.hoisted(() => ({
	mockEmitAction: vi.fn(),
}));

vi.mock('../emitter.js', () => ({
	default: { emitAction: mockEmitAction },
}));

const schema = new SchemaBuilder()
	.collection('directus_deployment_runs', (c) => {
		c.field('id').uuid().primary();
		c.field('project').uuid();
		c.field('external_id').string();
		c.field('target').string();
		c.field('status').string();
		c.field('url').string();
		c.field('started_at').timestamp();
		c.field('completed_at').timestamp();
	})
	.build();

function makeEvent(overrides: Partial<DeploymentWebhookEvent> = {}): DeploymentWebhookEvent {
	return {
		type: 'deployment.created',
		provider: 'cloudflare-workers',
		project_external_id: 'my-worker',
		deployment_external_id: 'build-123',
		status: 'building',
		timestamp: new Date('2026-01-01T00:00:00.000Z'),
		...overrides,
	};
}

describe('DeploymentRunsService', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();
	let service: DeploymentRunsService;

	beforeEach(() => {
		service = new DeploymentRunsService({ knex: db, schema, accountability: null });
	});

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
		vi.clearAllMocks();
	});

	describe('processWebhookEvent', () => {
		it('should create a new run and set started_at for a deployment.created event', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]);
			const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('run-1');

			const runId = await service.processWebhookEvent('project-1', makeEvent());

			expect(createOneSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					project: 'project-1',
					external_id: 'build-123',
					status: 'building',
					started_at: '2026-01-01T00:00:00.000Z',
				}),
			);

			expect(runId).toBe('run-1');
		});

		it('should update an existing run and set completed_at on a terminal event', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([
				{ id: 'run-1', started_at: '2026-01-01T00:00:00.000Z' },
			]);

			const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('run-1');

			const runId = await service.processWebhookEvent(
				'project-1',
				makeEvent({ type: 'deployment.succeeded', status: 'ready', url: 'https://example.com' }),
			);

			expect(updateOneSpy).toHaveBeenCalledWith(
				'run-1',
				expect.objectContaining({
					status: 'ready',
					url: 'https://example.com',
					completed_at: '2026-01-01T00:00:00.000Z',
				}),
			);

			expect(runId).toBe('run-1');
		});

		it('should emit deployment.webhook and the type-specific event with the right payload', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]);
			vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('run-1');

			const event = makeEvent();
			await service.processWebhookEvent('project-1', event);

			expect(mockEmitAction).toHaveBeenCalledWith(
				['deployment.webhook', 'deployment.webhook.deployment.created'],
				{
					provider: 'cloudflare-workers',
					project_id: 'project-1',
					run_id: 'run-1',
					external_id: 'build-123',
					status: 'building',
					url: undefined,
					target: undefined,
					timestamp: event.timestamp,
				},
				null,
			);
		});
	});
});
