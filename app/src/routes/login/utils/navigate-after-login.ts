import type { Router } from 'vue-router';
import { getRootPath } from '@/utils/get-root-path';

/**
 * Navigate to the appropriate page after login.
 * API routes (e.g., /mcp-oauth/authorize) need full page navigation
 * since they're not SPA routes.
 */
export function navigateAfterLogin(router: Router, target: string): void {
	// Reject non-relative paths to prevent open redirect
	if (!target.startsWith('/') || target.startsWith('//')) {
		router.push('/');
		return;
	}

	if (target.startsWith('/mcp-oauth/')) {
		window.location.href = getRootPath() + target.slice(1);
	} else {
		router.push(target);
	}
}
