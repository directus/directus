import type { Router } from 'vue-router';
import { getRootPath } from '@/utils/get-root-path';

/**
 * Navigate to the appropriate page after login. Resolves once the navigation settled.
 * API routes (e.g., /mcp-oauth/authorize) need full page navigation
 * since they're not SPA routes.
 */
export function navigateAfterLogin(router: Router, target: string): Promise<unknown> {
	// Reject non-relative paths to prevent open redirect
	if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
		return router.push('/');
	}

	if (target.startsWith('/mcp-oauth/')) {
		window.location.href = getRootPath() + target.slice(1);
		return Promise.resolve();
	}

	return router.push(target);
}
