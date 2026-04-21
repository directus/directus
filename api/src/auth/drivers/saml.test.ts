import { ForbiddenError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAuthProvider } from '../../auth.js';
import { getSSOState } from '../utils/get-sso-state.js';
import { resolveBlockedSSORedirect } from '../utils/resolve-blocked-sso-redirect.js';
import { createSAMLAuthRouter } from './saml.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		SESSION_COOKIE_NAME: 'session',
		REFRESH_TOKEN_COOKIE_NAME: 'refresh_token',
	})),
}));

vi.mock('@authenio/samlify-node-xmllint', () => ({}));

vi.mock('samlify', () => ({
	setSchemaValidator: vi.fn(),
	ServiceProvider: vi.fn(),
	IdentityProvider: vi.fn(),
}));

vi.mock('../../auth.js', () => ({
	getAuthProvider: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	})),
}));

vi.mock('../../middleware/respond.js', () => ({
	respond: vi.fn(),
}));

vi.mock('../../services/authentication.js', () => ({
	AuthenticationService: vi.fn(),
}));

vi.mock('../../utils/async-handler.js', () => ({
	default: (fn: any) => fn,
}));

vi.mock('../utils/get-sso-state.js', () => ({
	getSSOState: vi.fn().mockResolvedValue({
		enabled: true,
		disabled: false,
		transitional: false,
	}),
}));

vi.mock('../utils/resolve-blocked-sso-redirect.js', () => ({
	resolveBlockedSSORedirect: vi.fn(),
}));

vi.mock('./local.js', () => ({
	LocalAuthDriver: class {},
}));

describe('createSAMLAuthRouter', () => {
	beforeEach(() => {
		vi.mocked(getAuthProvider).mockReturnValue({
			sp: {
				getMetadata: vi.fn(() => '<xml />'),
				createLoginRequest: vi.fn(() => ({ context: 'https://idp.test/login' })),
			},
			idp: {},
		} as any);

		vi.mocked(getSSOState).mockResolvedValue({
			enabled: true,
			disabled: false,
			transitional: false,
		});

		vi.mocked(resolveBlockedSSORedirect).mockReturnValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('keeps metadata public even when sso is disabled', async () => {
		vi.mocked(getSSOState).mockResolvedValue({
			enabled: false,
			disabled: true,
			transitional: false,
		});

		const router = createSAMLAuthRouter('sso') as any;
		const metadataRoute = router.stack.find((layer: any) => layer.route?.path === '/metadata');
		const handler = metadataRoute.route.stack[0].handle;

		const header = vi.fn().mockReturnThis();
		const send = vi.fn();
		const res = { header, send } as any;

		await handler({}, res);

		expect(header).toHaveBeenCalledWith('Content-Type', 'text/xml');
		expect(send).toHaveBeenCalledWith('<xml />');
	});

	test('redirects disabled entry route when a valid blocked-path redirect exists', async () => {
		vi.mocked(getSSOState).mockResolvedValue({
			enabled: false,
			disabled: true,
			transitional: false,
		});

		vi.mocked(resolveBlockedSSORedirect).mockReturnValue('/admin/login');

		const router = createSAMLAuthRouter('sso') as any;
		const loginRoute = router.stack.find((layer: any) => layer.route?.path === '/');
		const handler = loginRoute.route.stack[0].handle;
		const redirect = vi.fn();

		await handler({ query: { redirect: '/admin/login' } }, { redirect } as any);

		expect(redirect).toHaveBeenCalledWith('/admin/login?reason=SSO_DISABLED');
	});

	test('returns forbidden for disabled acs route without a valid redirect target', async () => {
		vi.mocked(getSSOState).mockResolvedValue({
			enabled: false,
			disabled: true,
			transitional: false,
		});

		vi.mocked(resolveBlockedSSORedirect).mockReturnValue(undefined);

		const router = createSAMLAuthRouter('sso') as any;
		const acsRoute = router.stack.find((layer: any) => layer.route?.path === '/acs');
		const handler = acsRoute.route.stack[1].handle;

		await expect(handler({ body: {} }, {} as any, vi.fn())).rejects.toBeInstanceOf(ForbiddenError);
	});
});
