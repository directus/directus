import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';
import { DashboardsService } from './dashboards.js';
import { FlowsService } from './flows.js';
import { ItemsService } from './items.js';
import { PanelsService } from './panels.js';
import { PoliciesService } from './policies.js';
import { PresetsService } from './presets.js';
import { RolesService } from './roles.js';

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../flows.js', () => ({ getFlowManager: () => ({ reload: vi.fn() }) }));

vi.mock('../license/entitlements/manager.js', () => ({
	getEntitlementManager: () => ({ assert: vi.fn(), clearCache: vi.fn() }),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));

vi.mock('../permissions/cache.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../permissions/cache.js')>()),
	clearCache: vi.fn(),
}));

const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

const services: [string, new (options: AbstractServiceOptions) => ItemsService][] = [
	['directus_presets', PresetsService],
	['directus_dashboards', DashboardsService],
	['directus_panels', PanelsService],
	['directus_flows', FlowsService],
	['directus_roles', RolesService],
	['directus_policies', PoliciesService],
];

describe.each(services)('%s icon', (_, Service) => {
	const { db } = createMockKnex();
	const service = () => new Service({ knex: db, schema });

	test.each(['lorem_ipsum', 'lorem ipsum', '<details open ontoggle=alert(1)>'])(
		'createOne rejects the unknown icon %j',
		async (icon) => {
			await expect(service().createOne({ icon })).rejects.toBeInstanceOf(InvalidPayloadError);
			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		},
	);

	test.each(['lorem_ipsum', 'lorem ipsum', '<details open ontoggle=alert(1)>'])(
		'updateMany rejects the unknown icon %j',
		async (icon) => {
			await expect(service().updateMany([1], { icon })).rejects.toBeInstanceOf(InvalidPayloadError);
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		},
	);

	test.each(['bookmark', 'logo_openai', '', null])('accepts the icon %j', async (icon) => {
		await service().createOne({ icon });
		await service().updateMany([1], { icon });

		expect(ItemsService.prototype.createOne).toHaveBeenCalled();
		expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
	});

	test('accepts a payload without an icon', async () => {
		await service().updateMany([1], { name: 'renamed' });

		expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
	});
});
