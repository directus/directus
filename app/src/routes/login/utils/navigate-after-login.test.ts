import { beforeEach, describe, expect, test, vi } from 'vitest';
import { navigateAfterLogin } from './navigate-after-login';

vi.mock('@/utils/get-root-path', () => ({
	getRootPath: vi.fn(),
}));

import { getRootPath } from '@/utils/get-root-path';

const mockGetRootPath = vi.mocked(getRootPath);

function makeRouter() {
	return { push: vi.fn() };
}

describe('navigateAfterLogin', () => {
	let hrefSetter: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		hrefSetter = vi.fn();

		Object.defineProperty(window, 'location', {
			value: { href: '' },
			writable: true,
		});

		Object.defineProperty(window.location, 'href', {
			set: hrefSetter,
			get: () => '',
			configurable: true,
		});

		vi.clearAllMocks();
	});

	describe('regular paths', () => {
		test('calls router.push for /content', () => {
			const router = makeRouter();
			navigateAfterLogin(router as any, '/content');
			expect(router.push).toHaveBeenCalledWith('/content');
			expect(hrefSetter).not.toHaveBeenCalled();
		});

		test('calls router.push for /settings', () => {
			const router = makeRouter();
			navigateAfterLogin(router as any, '/settings');
			expect(router.push).toHaveBeenCalledWith('/settings');
			expect(hrefSetter).not.toHaveBeenCalled();
		});

		test('calls router.push for nested path', () => {
			const router = makeRouter();
			navigateAfterLogin(router as any, '/collections/articles');
			expect(router.push).toHaveBeenCalledWith('/collections/articles');
			expect(hrefSetter).not.toHaveBeenCalled();
		});

		test('does not call getRootPath for regular paths', () => {
			const router = makeRouter();
			navigateAfterLogin(router as any, '/content');
			expect(mockGetRootPath).not.toHaveBeenCalled();
		});
	});

	describe('/mcp-oauth/ paths', () => {
		test('sets window.location.href instead of calling router.push', () => {
			mockGetRootPath.mockReturnValue('/');
			const router = makeRouter();
			navigateAfterLogin(router as any, '/mcp-oauth/authorize');
			expect(router.push).not.toHaveBeenCalled();
			expect(hrefSetter).toHaveBeenCalled();
		});

		test('prepends getRootPath() result when root is /', () => {
			mockGetRootPath.mockReturnValue('/');
			const router = makeRouter();
			navigateAfterLogin(router as any, '/mcp-oauth/authorize?foo=bar');
			expect(hrefSetter).toHaveBeenCalledWith('/mcp-oauth/authorize?foo=bar');
		});

		test('prepends getRootPath() result when root is /subpath/', () => {
			mockGetRootPath.mockReturnValue('/subpath/');
			const router = makeRouter();
			navigateAfterLogin(router as any, '/mcp-oauth/authorize?foo=bar');
			expect(hrefSetter).toHaveBeenCalledWith('/subpath/mcp-oauth/authorize?foo=bar');
		});

		test('strips leading slash from target before prepending root path', () => {
			mockGetRootPath.mockReturnValue('/myapp/');
			const router = makeRouter();
			navigateAfterLogin(router as any, '/mcp-oauth/callback');
			// target.slice(1) removes the leading '/', root path already ends with '/'
			expect(hrefSetter).toHaveBeenCalledWith('/myapp/mcp-oauth/callback');
		});

		test('does not match paths that merely contain mcp-oauth', () => {
			const router = makeRouter();
			navigateAfterLogin(router as any, '/not-mcp-oauth/path');
			expect(router.push).toHaveBeenCalledWith('/not-mcp-oauth/path');
			expect(hrefSetter).not.toHaveBeenCalled();
		});
	});
});
