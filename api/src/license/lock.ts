import type { Accountability } from '@directus/types';
import type { Request } from 'express';
import type { Knex } from 'knex';
import { ProjectLockedError } from './errors.js';
import { getLicenseStateSummary } from './summary.js';

const SUSPENSION_EXEMPT_ROUTES = new Set(['POST /auth/refresh', 'POST /auth/logout']);

export async function ensureSuspensionAllowsRequest(
	knex: Knex,
	accountability: Accountability | null | undefined,
	req?: Pick<Request, 'method' | 'baseUrl' | 'path'>,
): Promise<void> {
	if (accountability?.user == null || accountability.admin === true) {
		return;
	}

	if (req && SUSPENSION_EXEMPT_ROUTES.has(`${req.method.toUpperCase()} ${req.baseUrl || ''}${req.path || ''}`)) {
		return;
	}

	const licenseState = await getLicenseStateSummary(knex);

	if (licenseState.locked) {
		throw new ProjectLockedError();
	}
}

export async function ensureSuspensionAllowsAdminAccess(knex: Knex, adminAccess: boolean): Promise<void> {
	if (adminAccess) {
		return;
	}

	const licenseState = await getLicenseStateSummary(knex);

	if (licenseState.locked) {
		throw new ProjectLockedError();
	}
}
