import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudflareDriver, NetlifyDriver, VercelDriver } from './deployment/drivers/index.js';
import {
	buildDriverFromConfig,
	getDeploymentDriver,
	getSupportedProviderTypes,
	readDeploymentConfig,
	registerDeploymentDrivers,
} from './deployment.js';
import { createMockKnex, resetKnexMocks } from './test-utils/knex.js';

vi.mock('./database/index.js', async () => {
	const { mockDatabase } = await import('./test-utils/database.js');
	return mockDatabase();
});

describe('Deployment Driver Registry', () => {
	beforeEach(() => {
		registerDeploymentDrivers();
	});

	describe('getDeploymentDriver', () => {
		it('should return VercelDriver instance with credentials and options', () => {
			const credentials = { access_token: 'my-token' };
			const options = { team_id: 'team-123' };

			const driver = getDeploymentDriver('vercel', credentials, options);

			expect(driver).toBeInstanceOf(VercelDriver);
			expect(driver.credentials).toEqual(credentials);
			expect(driver.options).toEqual(options);
		});

		it('should return NetlifyDriver instance with credentials and options', () => {
			const credentials = { access_token: 'my-token' };
			const options = { account_slug: 'account-123' };

			const driver = getDeploymentDriver('netlify', credentials, options);

			expect(driver).toBeInstanceOf(NetlifyDriver);
			expect(driver.credentials).toEqual(credentials);
			expect(driver.options).toEqual(options);
		});

		it('should throw ForbiddenError for unsupported provider', () => {
			expect(() => getDeploymentDriver('unsupported' as any, {})).toThrow(
				'Deployment driver "unsupported" is not supported',
			);

			try {
				getDeploymentDriver('unsupported' as any, {});
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenError);
			}
		});

		it('should return CloudflareDriver instance with credentials and options', () => {
			const credentials = { api_token: 'my-token' };
			const options = { account_id: 'account-123' };

			const driver = getDeploymentDriver('cloudflare-workers', credentials, options);

			expect(driver).toBeInstanceOf(CloudflareDriver);
			expect(driver.credentials).toEqual(credentials);
			expect(driver.options).toEqual(options);
		});
	});

	describe('getSupportedProviderTypes', () => {
		it('should return array containing vercel, netlify, and cloudflare-workers', () => {
			const types = getSupportedProviderTypes();

			expect(Array.isArray(types)).toBe(true);
			expect(types).toContain('vercel');
			expect(types).toContain('netlify');
			expect(types).toContain('cloudflare-workers');
			expect(types.length).toBe(3);
		});
	});

	describe('buildDriverFromConfig', () => {
		it('should parse credentials/options JSON and construct the matching driver', () => {
			const driver = buildDriverFromConfig({
				id: 'deploy-1',
				provider: 'cloudflare-workers',
				credentials: JSON.stringify({ api_token: 'token' }),
				options: JSON.stringify({ account_id: 'account-123' }),
			} as any);

			expect(driver).toBeInstanceOf(CloudflareDriver);
			expect(driver.credentials).toEqual({ api_token: 'token' });
			expect(driver.options).toEqual({ account_id: 'account-123' });
		});
	});

	describe('readDeploymentConfig', () => {
		const { db, tracker, mockSchemaBuilder } = createMockKnex();

		const schema = new SchemaBuilder()
			.collection('directus_deployments', (c) => {
				c.field('id').uuid().primary();
				c.field('provider').string();
				c.field('credentials').text();
				c.field('options').text();
			})
			.build();

		afterEach(() => {
			resetKnexMocks(tracker, mockSchemaBuilder);
		});

		it('should return the config row for the given provider', async () => {
			const config = { id: 'deploy-1', provider: 'vercel', credentials: '{}', options: null };
			tracker.on.select('directus_deployments').response([config]);

			const result = await readDeploymentConfig(db, schema, 'vercel');

			expect(result).toEqual(config);
		});

		it('should throw ForbiddenError when no config exists for the provider', async () => {
			tracker.on.select('directus_deployments').response([]);

			await expect(readDeploymentConfig(db, schema, 'vercel')).rejects.toThrow(
				'Deployment config for "vercel" not found',
			);

			try {
				await readDeploymentConfig(db, schema, 'vercel');
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenError);
			}
		});
	});
});
