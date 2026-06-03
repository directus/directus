import { getLicenseManager } from '../manager.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

/**
 * Keep SSO reachable for unentitled installs when the license is locked or in the v12 core grace
 * period, so admins can still sign in and resolve licensing.
 *
 * 'grace' only bypasses when also in the core grace period, so licensed expiry-grace doesn't qualify.
 */
export async function isSSOBypassAllowed(): Promise<boolean> {
	const licenseManager = getLicenseManager();
	const status = await licenseManager.getStatus();
	const source = licenseManager.getSource();

	if (status === 'locked') return true;
	if (status === 'grace' && source === null) return isInCoreGracePeriod();

	return false;
}
