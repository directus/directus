import type { SchemaOverview } from '@directus/types';
import { DEFAULT_AUTH_PROVIDER } from '../../constants.js';
import { UsersService } from '../../services/users.js';
import { getActiveSeats } from '../entitlements/lib/seats.js';
import { getEntitlementManager } from '../index.js';
import { getLicenseManager } from '../manager.js';

/**
 * Whether SSO should remain reachable despite the `sso_enabled` entitlement being off.
 *
 * Acts as a lockout escape hatch: if the license is locked and at least one active admin
 * authenticates via a non-default provider, hiding SSO would brick the instance (no admin
 * could sign in to resolve the lockdown). In that single case we keep SSO open until
 * recovery, regardless of the entitlement.
 */
export async function isSsoEscapeHatchActive(schema: SchemaOverview): Promise<boolean> {
	if (getEntitlementManager().isEntitled('sso_enabled')) return true;
	if (!(await getLicenseManager().isLocked())) return false;

	// LICENSE-TODO: cache the SSO-admin lookup so middleware hits don't repeat the query.
	const activeSeats = await getActiveSeats();
	const adminSeats = activeSeats.filter((seat) => seat.admin).map((seat) => seat.id);

	if (adminSeats.length === 0) return false;

	const usersService = new UsersService({ schema });

	const ssoAdmins = await usersService.readByQuery({
		filter: {
			id: { _in: adminSeats },
			provider: { _neq: DEFAULT_AUTH_PROVIDER },
		},
		limit: 1,
	});

	return ssoAdmins.length > 0;
}
