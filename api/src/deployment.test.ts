import { beforeEach, describe, expect, it } from 'vitest';
import { NetlifyDriver, VercelDriver } from './deployment/drivers/index.js';
import { getDeploymentDriver, getSupportedProviderTypes, registerDeploymentDrivers } from './deployment.js';

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

		it('should throw for unsupported provider', () => {
			expect(() => getDeploymentDriver('unsupported' as any, {})).toThrow(
				'Deployment driver "unsupported" is not supported',
			);
		});
	});

	describe('getSupportedProviderTypes', () => {
		it('should return array containing vercel and netlify', () => {
			const types = getSupportedProviderTypes();

			expect(Array.isArray(types)).toBe(true);
			expect(types).toContain('vercel');
			expect(types).toContain('netlify');
			expect(types.length).toBe(2);
		});
	});
});
