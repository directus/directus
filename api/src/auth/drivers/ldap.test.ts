import {
	InvalidCredentialsError,
	InvalidProviderConfigError,
	InvalidProviderError,
	ServiceUnavailableError,
	RecordNotUniqueError,
} from '@directus/errors';
import {
	Client,
	InappropriateAuthError,
	InvalidCredentialsError as LdapInvalidCredentialsError,
	InsufficientAccessError,
} from 'ldapts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies before importing the LDAP driver

const mockAuthenticationService = {
	login: vi.fn(),
};

// Mock the authentication service to prevent cascade imports
vi.mock('../../services/authentication.js', () => ({
	AuthenticationService: vi.fn(() => mockAuthenticationService),
}));

// Mock the middleware to prevent cascade imports
vi.mock('../../middleware/respond.js', () => ({
	respond: vi.fn((req, res) => res.json(res.locals['payload'])),
}));

// Mock the async handler
vi.mock('../../utils/async-handler.js', () => ({
	default: vi.fn((fn) => fn),
}));

// Mock getIPFromReq
vi.mock('../../utils/get-ip-from-req.js', () => ({
	getIPFromReq: vi.fn().mockReturnValue('127.0.0.1'),
}));

// Mock createDefaultAccountability
vi.mock('../../permissions/utils/create-default-accountability.js', () => ({
	createDefaultAccountability: vi.fn().mockReturnValue({ ip: '127.0.0.1' }),
}));

// Mock constants
vi.mock('../../constants.js', () => ({
	REFRESH_COOKIE_OPTIONS: {},
	SESSION_COOKIE_OPTIONS: {},
}));

vi.mock('ldapts', () => {
	const Client = vi.fn();
	Client.prototype.bind = vi.fn();
	Client.prototype.unbind = vi.fn();
	Client.prototype.search = vi.fn();

	return {
		Client,
		InappropriateAuthError: class InappropriateAuthError extends Error {
			constructor() {
				super('Inappropriate authentication');
				this.name = 'InappropriateAuthError';
			}
		},
		InvalidCredentialsError: class InvalidCredentialsError extends Error {
			constructor() {
				super('Invalid credentials');
				this.name = 'InvalidCredentialsError';
			}
		},
		InsufficientAccessError: class InsufficientAccessError extends Error {
			constructor() {
				super('Insufficient access');
				this.name = 'InsufficientAccessError';
			}
		},
	};
});

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',
		SESSION_COOKIE_NAME: 'directus_session_token',
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	}),
}));

vi.mock('../../database/index.js', () => ({
	default: vi.fn(),
}));

vi.mock('../../emitter.js', () => ({
	default: {
		emitFilter: vi.fn((_, payload) => Promise.resolve(payload)),
	},
}));

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

// Create mock functions for UsersService
const mockCreateOne = vi.fn().mockResolvedValue('new-user-id');
const mockUpdateOne = vi.fn().mockResolvedValue(undefined);

// Mock the services that would cause import issues
vi.mock('../../services/users.js', () => {
	return {
		UsersService: vi.fn(() => ({
			createOne: mockCreateOne,
			updateOne: mockUpdateOne,
		})),
	};
});

// Now import the LDAP driver
import { LDAPAuthDriver, createLDAPAuthRouter } from './ldap.js';
import emitter from '../../emitter.js';

// Create a simple mock for knex
const createMockKnex = () => {
	const selectMock = vi.fn().mockReturnThis();
	const fromMock = vi.fn().mockReturnThis();
	const whereMock = vi.fn().mockReturnThis();
	const orWhereRawMock = vi.fn().mockReturnThis();
	const whereRawMock = vi.fn().mockReturnThis();
	const firstMock = vi.fn();
	const insertMock = vi.fn().mockReturnThis();
	const updateMock = vi.fn().mockReturnThis();

	const mockKnex = vi.fn(() => ({
		select: selectMock,
		from: fromMock,
		where: whereMock,
		orWhereRaw: orWhereRawMock,
		whereRaw: whereRawMock,
		first: firstMock,
		insert: insertMock,
		update: updateMock,
	}));

	(mockKnex as any).select = selectMock;
	(mockKnex as any).from = fromMock;
	(mockKnex as any).where = whereMock;
	(mockKnex as any).orWhereRaw = orWhereRawMock;
	(mockKnex as any).whereRaw = whereRawMock;
	(mockKnex as any).first = firstMock;
	(mockKnex as any).insert = insertMock;
	(mockKnex as any).update = updateMock;

	return {
		mockKnex,
		firstMock,
		selectMock,
		fromMock,
		orWhereRawMock,
	};
};

describe('LDAP Auth Driver', () => {
	const validConfig = {
		bindDn: 'cn=admin,dc=example,dc=com',
		bindPassword: 'admin-password',
		userDn: 'ou=users,dc=example,dc=com',
		provider: 'ldap',
		clientUrl: 'ldap://localhost:389',
	};

	let mockKnexInstance: ReturnType<typeof createMockKnex>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockKnexInstance = createMockKnex();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should throw InvalidProviderConfigError when bindDn is missing', () => {
			const config = { ...validConfig, bindDn: undefined };

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).toThrow(
				InvalidProviderConfigError,
			);
		});

		it('should throw InvalidProviderConfigError when bindPassword is missing', () => {
			const config = { ...validConfig, bindPassword: undefined };

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).toThrow(
				InvalidProviderConfigError,
			);
		});

		it('should throw InvalidProviderConfigError when userDn is missing', () => {
			const config = { ...validConfig, userDn: undefined };

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).toThrow(
				InvalidProviderConfigError,
			);
		});

		it('should throw InvalidProviderConfigError when provider is missing', () => {
			const config = { ...validConfig, provider: undefined };

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).toThrow(
				InvalidProviderConfigError,
			);
		});

		it('should throw InvalidProviderConfigError when clientUrl is missing and no socketPath', () => {
			const config = { ...validConfig, clientUrl: undefined };

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).toThrow(
				InvalidProviderConfigError,
			);
		});

		it('should create driver with socketPath instead of clientUrl', () => {
			const config = {
				...validConfig,
				clientUrl: undefined,
				client: { socketPath: '/var/run/ldap.sock' },
			};

			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config)).not.toThrow();
		});

		it('should create driver with valid config', () => {
			expect(() => new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig)).not.toThrow();
		});

		it('should create LDAP client with correct URL', () => {
			new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			expect(Client).toHaveBeenCalledWith(
				expect.objectContaining({
					url: validConfig.clientUrl,
				}),
			);
		});

		it('should pass client config options to LDAP client', () => {
			const config = {
				...validConfig,
				client: {
					tlsOptions: { rejectUnauthorized: false },
					timeout: 5000,
				},
			};

			new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, config);

			expect(Client).toHaveBeenCalledWith(
				expect.objectContaining({
					url: validConfig.clientUrl,
					tlsOptions: { rejectUnauthorized: false },
					timeout: 5000,
				}),
			);
		});
	});

	describe('getUserID', () => {
		it('should throw InvalidCredentialsError when identifier is missing', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			await expect(driver.getUserID({})).rejects.toThrow(InvalidCredentialsError);
		});

		it('should throw InvalidCredentialsError when user is not found in LDAP', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			// First search finds bind user, second search finds no user
			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [],
					searchReferences: [],
				});

			await expect(driver.getUserID({ identifier: 'nonexistent' })).rejects.toThrow(InvalidCredentialsError);
		});
	});

	describe('verify', () => {
		it('should throw InvalidCredentialsError when external_identifier is missing', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			await expect(driver.verify({ external_identifier: null } as any, 'password')).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw InvalidCredentialsError when password is missing', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			await expect(driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any)).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should successfully verify valid credentials', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			await expect(
				driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any, 'password'),
			).resolves.toBeUndefined();
		});

		it('should throw InvalidCredentialsError when bind fails with invalid credentials', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new LdapInvalidCredentialsError());
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			await expect(driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any, 'wrong')).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw InvalidCredentialsError when bind fails with inappropriate auth', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new InappropriateAuthError());
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			await expect(driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any, 'wrong')).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw InvalidCredentialsError when bind fails with insufficient access', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new InsufficientAccessError());
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			await expect(driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any, 'wrong')).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw ServiceUnavailableError for other LDAP errors', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new Error('Connection refused'));
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			await expect(
				driver.verify({ external_identifier: 'cn=user,dc=example,dc=com' } as any, 'password'),
			).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('login', () => {
		it('should call verify with password from payload', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);
			vi.mocked(Client.prototype.unbind).mockResolvedValue(undefined);

			const verifySpy = vi.spyOn(driver, 'verify');

			const user = { external_identifier: 'cn=user,dc=example,dc=com' } as any;

			await driver.login(user, { password: 'test-password' });

			expect(verifySpy).toHaveBeenCalledWith(user, 'test-password');
		});
	});

	describe('refresh', () => {
		it('should validate bind client and fetch user info', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=user,dc=example,dc=com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			await expect(
				driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any),
			).resolves.toBeUndefined();
		});

		it('should throw InvalidCredentialsError when account is disabled', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=user,dc=example,dc=com',
							// ACCOUNTDISABLE flag (0x2)
							userAccountControl: '2',
						},
					],
					searchReferences: [],
				});

			await expect(driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any)).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw InvalidCredentialsError when account is locked', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=user,dc=example,dc=com',
							// LOCKOUT flag (0x10)
							userAccountControl: '16',
						},
					],
					searchReferences: [],
				});

			await expect(driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any)).rejects.toThrow(
				InvalidCredentialsError,
			);
		});

		it('should throw InvalidCredentialsError when password is expired', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=user,dc=example,dc=com',
							// PASSWORD_EXPIRED flag (0x800000)
							userAccountControl: '8388608',
						},
					],
					searchReferences: [],
				});

			await expect(driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any)).rejects.toThrow(
				InvalidCredentialsError,
			);
		});
	});

	describe('LDAP filter escaping', () => {
		it('should properly escape special characters in filter values', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [],
					searchReferences: [],
				});

			// Try to inject via the identifier - should be escaped
			const maliciousIdentifier = 'user)(|(cn=*))';

			await expect(driver.getUserID({ identifier: maliciousIdentifier })).rejects.toThrow(InvalidCredentialsError);

			// Verify the search was called with escaped filter
			expect(Client.prototype.search).toHaveBeenCalledWith(
				validConfig.userDn,
				expect.objectContaining({
					filter: expect.stringContaining('\\28'),
				}),
			);
		});
	});

	describe('getUserID - existing user update', () => {
		it('should update existing user when found in database', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: 'testuser',
							givenName: 'Test',
							sn: 'User',
							mail: 'test@example.com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			// Mock that user exists in database
			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			const result = await driver.getUserID({ identifier: 'testuser' });

			expect(result).toBe('existing-user-id');
			expect(mockUpdateOne).toHaveBeenCalledWith('existing-user-id', expect.any(Object));
		});

		it('should update user with syncUserInfo when enabled', async () => {
			const configWithSync = { ...validConfig, syncUserInfo: true };
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithSync);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: 'testuser',
							givenName: 'Updated',
							sn: 'Name',
							mail: 'updated@example.com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			await driver.getUserID({ identifier: 'testuser' });

			expect(emitter.emitFilter).toHaveBeenCalledWith(
				'auth.update',
				expect.objectContaining({
					first_name: 'Updated',
					last_name: 'Name',
					email: 'updated@example.com',
				}),
				expect.any(Object),
				expect.any(Object),
			);
		});

		it('should update user role when groupDn is configured and user belongs to a group', async () => {
			const configWithGroups = {
				...validConfig,
				groupDn: 'ou=groups,dc=example,dc=com',
				groupAttribute: 'member',
			};

			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithGroups);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: 'testuser',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					// Group search
					searchEntries: [{ dn: 'cn=admins,ou=groups,dc=example,dc=com', cn: 'admins' }],
					searchReferences: [],
				});

			// User exists
			mockKnexInstance.firstMock
				.mockResolvedValueOnce({ id: 'role-id-123' }) // Role lookup
				.mockResolvedValueOnce({ id: 'existing-user-id' }); // User lookup

			await driver.getUserID({ identifier: 'testuser' });

			expect(emitter.emitFilter).toHaveBeenCalledWith(
				'auth.update',
				expect.objectContaining({
					role: 'role-id-123',
				}),
				expect.any(Object),
				expect.any(Object),
			);
		});

		it('should use memberuid for group lookup when groupAttribute is memberuid', async () => {
			const configWithMemberUid = {
				...validConfig,
				groupDn: 'ou=groups,dc=example,dc=com',
				groupAttribute: 'memberuid',
			};

			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithMemberUid);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: 'testuser',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [{ cn: ['developers', 'testers'] }], // Array of groups
					searchReferences: [],
				});

			mockKnexInstance.firstMock
				.mockResolvedValueOnce({ id: 'dev-role-id' })
				.mockResolvedValueOnce({ id: 'existing-user-id' });

			await driver.getUserID({ identifier: 'testuser' });

			// Verify memberuid was used in filter
			expect(Client.prototype.search).toHaveBeenCalledWith(
				'ou=groups,dc=example,dc=com',
				expect.objectContaining({
					filter: expect.stringContaining('memberuid'),
				}),
			);
		});
	});

	describe('getUserID - new user creation', () => {
		it('should create new user when not found in database', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=newuser,ou=users,dc=example,dc=com',
							uid: 'newuser',
							givenName: 'New',
							sn: 'User',
							mail: 'new@example.com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			// User doesn't exist, then after creation it does
			mockKnexInstance.firstMock
				.mockResolvedValueOnce(undefined) // First lookup - not found
				.mockResolvedValueOnce({ id: 'new-user-id' }); // After creation

			const result = await driver.getUserID({ identifier: 'newuser' });

			expect(result).toBe('new-user-id');

			expect(mockCreateOne).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: 'ldap',
					first_name: 'New',
					last_name: 'User',
					email: 'new@example.com',
					external_identifier: 'cn=newuser,ou=users,dc=example,dc=com',
				}),
			);
		});

		it('should create user with defaultRoleId when no group matches', async () => {
			const configWithDefaultRole = {
				...validConfig,
				defaultRoleId: 'default-role-123',
			};

			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithDefaultRole);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=newuser,ou=users,dc=example,dc=com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: 'new-user-id' });

			await driver.getUserID({ identifier: 'newuser' });

			expect(mockCreateOne).toHaveBeenCalledWith(
				expect.objectContaining({
					role: 'default-role-123',
				}),
			);
		});

		it('should throw InvalidProviderError when user creation fails with RecordNotUnique', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=newuser,ou=users,dc=example,dc=com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce(undefined);

			const recordNotUniqueError = new RecordNotUniqueError({ collection: 'directus_users', field: 'email' });

			mockCreateOne.mockRejectedValueOnce(recordNotUniqueError);

			await expect(driver.getUserID({ identifier: 'newuser' })).rejects.toThrow(InvalidProviderError);
		});

		it('should rethrow non-RecordNotUnique errors during user creation', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=newuser,ou=users,dc=example,dc=com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce(undefined);

			const genericError = new Error('Database connection failed');

			mockCreateOne.mockRejectedValueOnce(genericError);

			await expect(driver.getUserID({ identifier: 'newuser' })).rejects.toThrow('Database connection failed');
		});
	});

	describe('validateBindClient error handling', () => {
		it('should throw InvalidProviderConfigError when bind fails with invalid credentials', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new LdapInvalidCredentialsError());

			await expect(driver.getUserID({ identifier: 'test' })).rejects.toThrow(InvalidProviderConfigError);
		});

		it('should throw ServiceUnavailableError when bind user cannot be found', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search).mockResolvedValueOnce({
				searchEntries: [], // Empty result for bind user
				searchReferences: [],
			});

			// UnexpectedResponseError gets wrapped in ServiceUnavailableError by handleError
			await expect(driver.getUserID({ identifier: 'test' })).rejects.toThrow(ServiceUnavailableError);
		});

		it('should throw ServiceUnavailableError for connection errors during bind', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue(new Error('ECONNREFUSED'));

			await expect(driver.getUserID({ identifier: 'test' })).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('handleError edge cases', () => {
		it('should handle non-Error throws', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockRejectedValue('string error');

			await expect(driver.getUserID({ identifier: 'test' })).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('getEntryValue handling', () => {
		it('should handle Buffer values from LDAP entries', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: Buffer.from('testuser'),
							givenName: Buffer.from('Test'),
							sn: Buffer.from('User'),
							mail: Buffer.from('test@example.com'),
							userAccountControl: Buffer.from('0'),
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			const result = await driver.getUserID({ identifier: 'testuser' });

			expect(result).toBe('existing-user-id');
		});

		it('should handle array values from LDAP entries', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: ['testuser', 'testuser2'],
							givenName: ['Test'],
							sn: ['User'],
							mail: ['test@example.com'],
							userAccountControl: ['0'],
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			const result = await driver.getUserID({ identifier: 'testuser' });

			expect(result).toBe('existing-user-id');
		});

		it('should handle Buffer array values from LDAP entries', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							uid: [Buffer.from('testuser')],
							givenName: [Buffer.from('Test')],
							sn: [Buffer.from('User')],
							mail: [Buffer.from('test@example.com')],
							userAccountControl: [Buffer.from('0')],
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			const result = await driver.getUserID({ identifier: 'testuser' });

			expect(result).toBe('existing-user-id');
		});
	});

	describe('fetchUserInfo with custom attributes', () => {
		it('should use custom attribute names when configured', async () => {
			const configWithCustomAttrs = {
				...validConfig,
				firstNameAttribute: 'cn',
				lastNameAttribute: 'surname',
				mailAttribute: 'emailAddress',
			};

			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithCustomAttrs);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							cn: 'TestFirst',
							surname: 'TestLast',
							emailAddress: 'custom@example.com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				});

			mockKnexInstance.firstMock.mockResolvedValueOnce({ id: 'existing-user-id' });

			await driver.getUserID({ identifier: 'testuser' });

			expect(Client.prototype.search).toHaveBeenCalledWith(
				validConfig.userDn,
				expect.objectContaining({
					attributes: expect.arrayContaining(['uid', 'cn', 'surname', 'emailAddress', 'userAccountControl']),
				}),
			);
		});
	});

	describe('createLDAPAuthRouter', () => {
		it('should create a router with POST endpoint', () => {
			const router = createLDAPAuthRouter('ldap');

			expect(router).toBeDefined();
			expect(router.stack).toBeDefined();
			expect(router.stack.length).toBeGreaterThan(0);
		});

		it('should handle login request with valid payload', async () => {
			const router = createLDAPAuthRouter('ldap');

			// Find the POST handler
			const postLayer = router.stack.find((layer: any) => layer.route?.methods?.post);

			expect(postLayer).toBeDefined();

			const handler = postLayer.route.stack[0].handle;

			const mockReq = {
				body: {
					identifier: 'testuser',
					password: 'testpass',
					mode: 'json',
				},
				schema: {},
				get: vi.fn((header: string) => {
					if (header === 'user-agent') return 'test-agent';
					if (header === 'origin') return 'http://localhost';

					return undefined;
				}),
			};

			const mockRes = {
				cookie: vi.fn(),
				json: vi.fn(),
				locals: {},
			};

			const mockNext = vi.fn();

			mockAuthenticationService.login.mockResolvedValueOnce({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				expires: 900000,
			});

			await handler(mockReq, mockRes, mockNext);

			expect(mockAuthenticationService.login).toHaveBeenCalledWith('ldap', mockReq.body, expect.any(Object));

			expect(mockRes.locals['payload']).toEqual({
				data: {
					access_token: 'test-access-token',
					expires: 900000,
					refresh_token: 'test-refresh-token',
				},
			});

			expect(mockNext).toHaveBeenCalled();
		});

		it('should set cookie in cookie mode', async () => {
			const router = createLDAPAuthRouter('ldap');

			const postLayer = router.stack.find((layer: any) => layer.route?.methods?.post);
			const handler = postLayer.route.stack[0].handle;

			const mockReq = {
				body: {
					identifier: 'testuser',
					password: 'testpass',
					mode: 'cookie',
				},
				schema: {},
				get: vi.fn(),
			};

			const mockRes = {
				cookie: vi.fn(),
				json: vi.fn(),
				locals: {},
			};

			const mockNext = vi.fn();

			mockAuthenticationService.login.mockResolvedValueOnce({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				expires: 900000,
			});

			await handler(mockReq, mockRes, mockNext);

			expect(mockRes.cookie).toHaveBeenCalledWith('directus_refresh_token', 'test-refresh-token', expect.any(Object));
		});

		it('should set session cookie in session mode', async () => {
			const router = createLDAPAuthRouter('ldap');

			const postLayer = router.stack.find((layer: any) => layer.route?.methods?.post);
			const handler = postLayer.route.stack[0].handle;

			const mockReq = {
				body: {
					identifier: 'testuser',
					password: 'testpass',
					mode: 'session',
				},
				schema: {},
				get: vi.fn(),
			};

			const mockRes = {
				cookie: vi.fn(),
				json: vi.fn(),
				locals: {},
			};

			const mockNext = vi.fn();

			mockAuthenticationService.login.mockResolvedValueOnce({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				expires: 900000,
			});

			await handler(mockReq, mockRes, mockNext);

			expect(mockRes.cookie).toHaveBeenCalledWith('directus_session_token', 'test-access-token', expect.any(Object));
		});

		it('should throw InvalidPayloadError for invalid request body', async () => {
			const { InvalidPayloadError } = await import('@directus/errors');
			const router = createLDAPAuthRouter('ldap');

			const postLayer = router.stack.find((layer: any) => layer.route?.methods?.post);
			const handler = postLayer.route.stack[0].handle;

			const mockReq = {
				body: {
					// Missing required fields
				},
				schema: {},
				get: vi.fn(),
			};

			const mockRes = {
				cookie: vi.fn(),
				json: vi.fn(),
				locals: {},
			};

			const mockNext = vi.fn();

			await expect(handler(mockReq, mockRes, mockNext)).rejects.toThrow(InvalidPayloadError);
		});

		it('should default to json mode when mode is not specified', async () => {
			const router = createLDAPAuthRouter('ldap');

			const postLayer = router.stack.find((layer: any) => layer.route?.methods?.post);
			const handler = postLayer.route.stack[0].handle;

			const mockReq = {
				body: {
					identifier: 'testuser',
					password: 'testpass',
					// No mode specified
				},
				schema: {},
				get: vi.fn(),
			};

			const mockRes = {
				cookie: vi.fn(),
				json: vi.fn(),
				locals: {},
			};

			const mockNext = vi.fn();

			mockAuthenticationService.login.mockResolvedValueOnce({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
				expires: 900000,
			});

			await handler(mockReq, mockRes, mockNext);

			// In json mode, refresh_token should be in payload
			expect(mockRes.locals['payload'].data.refresh_token).toBe('test-refresh-token');
			// And no cookies should be set
			expect(mockRes.cookie).not.toHaveBeenCalled();
		});
	});

	describe('refresh without userAccountControl', () => {
		it('should pass when userAccountControl is not present', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=user,dc=example,dc=com',
							// No userAccountControl
						},
					],
					searchReferences: [],
				});

			await expect(
				driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any),
			).resolves.toBeUndefined();
		});

		it('should pass when user is not found during refresh', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [],
					searchReferences: [],
				});

			// Should not throw when user is not found - just passes through
			await expect(
				driver.refresh({ external_identifier: 'cn=user,dc=example,dc=com' } as any),
			).resolves.toBeUndefined();
		});
	});

	describe('fetchUserGroups error handling', () => {
		it('should throw ServiceUnavailableError when group search fails', async () => {
			const configWithGroups = {
				...validConfig,
				groupDn: 'ou=groups,dc=example,dc=com',
			};

			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, configWithGroups);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockResolvedValueOnce({
					searchEntries: [
						{
							dn: 'cn=testuser,ou=users,dc=example,dc=com',
							userAccountControl: '0',
						},
					],
					searchReferences: [],
				})
				.mockRejectedValueOnce(new Error('Group search failed'));

			await expect(driver.getUserID({ identifier: 'testuser' })).rejects.toThrow(ServiceUnavailableError);
		});
	});

	describe('fetchUserInfo error handling', () => {
		it('should throw ServiceUnavailableError when user search fails', async () => {
			const driver = new LDAPAuthDriver({ knex: mockKnexInstance.mockKnex as any }, validConfig);

			vi.mocked(Client.prototype.bind).mockResolvedValue(undefined);

			vi.mocked(Client.prototype.search)
				.mockResolvedValueOnce({
					searchEntries: [{ dn: validConfig.bindDn }],
					searchReferences: [],
				})
				.mockRejectedValueOnce(new Error('User search failed'));

			await expect(driver.getUserID({ identifier: 'testuser' })).rejects.toThrow(ServiceUnavailableError);
		});
	});
});
