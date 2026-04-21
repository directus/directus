import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, Accountability } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getSSOState } from '../auth/utils/get-sso-state.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import { clearLicenseFallbackCompliance } from '../license/cache-license-fallback-compliance.js';
import type { LicenseDeactivationApplyPayload } from '../license/types.js';
import { fetchAccessLookup } from '../utils/fetch-user-count/fetch-access-lookup.js';
import { fetchAccessRoles } from '../utils/fetch-user-count/fetch-access-roles.js';
import { LicenseDeactivationService } from './license-deactivation.js';
import { SettingsService } from './settings.js';
import { UsersService } from './users.js';

vi.mock('../utils/get-auth-providers.js', () => ({
	getAuthProviders: vi.fn().mockReturnValue([]),
}));

vi.mock('../utils/fetch-user-count/fetch-access-lookup.js', () => ({
	fetchAccessLookup: vi.fn(),
}));

vi.mock('../utils/fetch-user-count/fetch-access-roles.js', () => ({
	fetchAccessRoles: vi.fn(),
}));

vi.mock('../auth/utils/get-sso-state.js', () => ({
	getSSOState: vi.fn(),
}));

vi.mock('../license/cache-license-fallback-compliance.js', () => ({
	clearLicenseFallbackCompliance: vi.fn().mockResolvedValue(undefined),
}));

const mockedFetchAccessLookup = vi.mocked(fetchAccessLookup);
const mockedFetchAccessRoles = vi.mocked(fetchAccessRoles);
const mockedGetSSOState = vi.mocked(getSSOState);
const mockedClearLicenseFallbackCompliance = vi.mocked(clearLicenseFallbackCompliance);

describe('LicenseDeactivationService', () => {
	const accountability = {
		user: 'admin-user',
		admin: true,
		session: 'current-session-token',
	} as Accountability;

	beforeEach(() => {
		vi.clearAllMocks();
		mockedFetchAccessLookup.mockResolvedValue([]);
		mockedFetchAccessRoles.mockResolvedValue({ adminRoles: new Set(), appRoles: new Set() });
		mockedGetSSOState.mockResolvedValue({ disabled: false, transitional: false, allowAdminOnly: false });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns the stable no-op response when the project is already compliant', async () => {
		const transaction = vi.fn(async (callback: (trx: object) => Promise<unknown>) => await callback({}));

		const service = new LicenseDeactivationService({
			accountability,
			knex: { transaction } as any,
			schema: {} as any,
		});

		vi.spyOn(service as never, 'collectAssessmentContext').mockResolvedValue({
			assessment: {
				compliant: true,
				target_mode: 'fallback',
				target_entitlements: {
					collections: { limit: 50 },
					seats: { limit: 3 },
					sso_enabled: false,
				},
				sections: [],
			},
			collectionCandidates: [],
			seatCandidates: {
				admin_seats: [],
				user_seats: [],
			},
			externalAuthUsers: [],
			actingAdmin: {
				id: 'admin-user',
				email: 'admin@example.com',
				password: 'hashed-password',
				provider: DEFAULT_AUTH_PROVIDER,
				external_identifier: 'external-id',
				auth_data: null,
				role: 'admin-role',
				status: 'active',
				first_name: 'Admin',
				last_name: 'User',
				avatar: null,
			},
		} as never);

		await expect(service.apply({})).resolves.toEqual({
			applied: false,
			compliant: true,
			target_mode: 'fallback',
			target_entitlements: {
				collections: { limit: 50 },
				seats: { limit: 3 },
				sso_enabled: false,
			},
			sections: [],
		});

		expect(transaction).toHaveBeenCalledOnce();
		expect(mockedClearLicenseFallbackCompliance).not.toHaveBeenCalled();
	});

	test('rejects payload branches for remediation sections that are not currently required', async () => {
		const service = new LicenseDeactivationService({
			accountability,
			knex: {} as any,
			schema: {} as any,
		});

		expect(() =>
			(service as any).resolveApplyPayload(
				{
					collections: ['posts'],
				},
				{
					assessment: {
						compliant: false,
						sections: [
							{
								key: 'seats',
								required: true,
								target: 3,
								current: 5,
								needed_reduction: 2,
								blockers: [],
								candidates: {
									admin_seats: [],
									user_seats: [],
								},
							},
						],
					},
					collectionCandidates: [],
					seatCandidates: {
						admin_seats: [],
						user_seats: [],
					},
					externalAuthUsers: [],
					actingAdmin: {
						id: 'admin-user',
						email: 'admin@example.com',
						password: 'hashed-password',
						provider: DEFAULT_AUTH_PROVIDER,
						external_identifier: 'external-id',
						auth_data: null,
						role: 'admin-role',
						status: 'active',
						first_name: 'Admin',
						last_name: 'User',
						avatar: null,
					},
				},
			),
		).toThrow(InvalidPayloadError);
	});

	test('returns the full typed payload when remediation is successfully applied', async () => {
		const transaction = vi.fn(async (callback: (trx: object) => Promise<unknown>) => await callback({}));

		const service = new LicenseDeactivationService({
			accountability,
			knex: { transaction } as any,
			schema: {} as any,
		});

		const updateMany = vi.spyOn(UsersService.prototype, 'updateMany').mockResolvedValue(['user-seat-1']);

		vi.spyOn(service as never, 'collectAssessmentContext')
			.mockResolvedValueOnce({
				assessment: {
					compliant: false,
					target_mode: 'fallback',
					target_entitlements: {
						collections: { limit: 50 },
						seats: { limit: 3 },
						sso_enabled: false,
					},
					sections: [
						{
							key: 'seats',
							required: true,
							target: 3,
							current: 4,
							needed_reduction: 1,
							blockers: [],
							candidates: {
								admin_seats: [],
								user_seats: [
									{
										id: 'user-seat-1',
										email: 'user-1@example.com',
										first_name: 'User',
										last_name: 'One',
										avatar: null,
										last_access: null,
									},
								],
							},
						},
					],
				},
				collectionCandidates: [],
				seatCandidates: {
					admin_seats: [],
					user_seats: [],
				},
				externalAuthUsers: [],
				actingAdmin: {
					id: 'admin-user',
					email: 'admin@example.com',
					password: 'hashed-password',
					provider: DEFAULT_AUTH_PROVIDER,
					external_identifier: 'external-id',
					auth_data: null,
					role: 'admin-role',
					status: 'active',
					first_name: 'Admin',
					last_name: 'User',
					avatar: null,
				},
			} as never)
			.mockResolvedValueOnce({
				assessment: {
					compliant: true,
					target_mode: 'fallback',
					target_entitlements: {
						collections: { limit: 50 },
						seats: { limit: 3 },
						sso_enabled: false,
					},
					sections: [],
				},
				collectionCandidates: [],
				seatCandidates: {
					admin_seats: [],
					user_seats: [],
				},
				externalAuthUsers: [],
				actingAdmin: {
					id: 'admin-user',
					email: 'admin@example.com',
					password: 'hashed-password',
					provider: DEFAULT_AUTH_PROVIDER,
					external_identifier: 'external-id',
					auth_data: null,
					role: 'admin-role',
					status: 'active',
					first_name: 'Admin',
					last_name: 'User',
					avatar: null,
				},
			} as never);

		await expect(
			service.apply({
				seats: {
					admin_seats: [],
					user_seats: ['user-seat-1'],
				},
			}),
		).resolves.toEqual({
			applied: true,
			compliant: true,
			target_mode: 'fallback',
			target_entitlements: {
				collections: { limit: 50 },
				seats: { limit: 3 },
				sso_enabled: false,
			},
			sections: [],
		});

		expect(updateMany).toHaveBeenCalledWith(['user-seat-1'], { status: 'deactivated' });
		expect(mockedClearLicenseFallbackCompliance).toHaveBeenCalledOnce();
	});

	test('migrates SSO users to the default provider while clearing auth_data and preserving external identifiers', async () => {
		const directusSessionsDelete = vi.fn().mockImplementation(() => directusSessionsQuery);

		const directusSessionsQuery = {
			delete: directusSessionsDelete,
			where: vi.fn().mockReturnThis(),
			whereIn: vi.fn().mockReturnThis(),
			whereNot: vi.fn().mockReturnThis(),
			modify: vi.fn(function (
				this: typeof directusSessionsQuery,
				callback: (query: typeof directusSessionsQuery) => void,
			) {
				callback(this);
				return this;
			}),
		};

		const knex = vi.fn((table: string) => {
			if (table === 'directus_sessions') return directusSessionsQuery;
			throw new Error(`Unexpected table access: ${table}`);
		}) as unknown as AbstractServiceOptions['knex'];

		const service = new LicenseDeactivationService({
			accountability,
			knex: knex as any,
			schema: {} as any,
		});

		const updateOne = vi.spyOn(UsersService.prototype, 'updateOne').mockResolvedValue('admin-user');
		const updateMany = vi.spyOn(UsersService.prototype, 'updateMany').mockResolvedValue(['sso-user']);
		const upsertSingleton = vi.spyOn(SettingsService.prototype, 'upsertSingleton').mockResolvedValue(1 as never);

		await (service as any).applyExternalAuthShutdown(
			knex as any,
			{
				enabled: true,
				email: 'admin@example.com',
				password: 'new-password',
			} satisfies NonNullable<LicenseDeactivationApplyPayload['sso']>,
			{
				actingAdmin: {
					id: 'admin-user',
					email: null,
					password: null,
					provider: 'saml',
					external_identifier: 'admin-external-id',
					auth_data: { token: 'abc' },
					role: 'admin-role',
					status: 'active',
					first_name: 'Admin',
					last_name: 'User',
					avatar: null,
				},
				externalAuthUsers: [
					{
						id: 'admin-user',
						email: null,
						password: null,
						provider: 'saml',
						external_identifier: 'admin-external-id',
						auth_data: { token: 'abc' },
						role: 'admin-role',
						status: 'active',
						first_name: 'Admin',
						last_name: 'User',
						avatar: null,
					},
					{
						id: 'sso-user',
						email: 'sso@example.com',
						password: null,
						provider: 'openid',
						external_identifier: 'sso-external-id',
						auth_data: { token: 'def' },
						role: 'user-role',
						status: 'active',
						first_name: 'SSO',
						last_name: 'User',
						avatar: null,
					},
				],
			},
		);

		expect(updateOne).toHaveBeenCalledWith(
			'admin-user',
			expect.objectContaining({
				provider: DEFAULT_AUTH_PROVIDER,
				auth_data: null,
				email: 'admin@example.com',
				password: 'new-password',
			}),
		);

		expect(updateMany).toHaveBeenCalledWith(['sso-user'], {
			provider: DEFAULT_AUTH_PROVIDER,
			auth_data: null,
		});

		expect(upsertSingleton).toHaveBeenCalledWith({ sso_disabled: true });
		expect(directusSessionsDelete).toHaveBeenCalledTimes(2);
	});
});
