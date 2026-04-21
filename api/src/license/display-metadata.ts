import { decodeJwt } from 'jose';
import type { Knex } from 'knex';
import { getLicenseToken } from './storage.js';
import type {
	LicenseDisplayMetadata,
	LicensePayloadStatus,
	LicenseTokenMetadata,
	LicenseTokenPayload,
} from './types.js';

const PAYLOAD_STATUSES = new Set<LicensePayloadStatus>(['active', 'past_due', 'canceled', 'expired']);

export function getPayloadDisplayMetadata(
	payload: LicenseTokenPayload | null | undefined,
): LicenseDisplayMetadata | null {
	return toDisplayMetadata(payload?.metadata);
}

export async function getStoredLicenseDisplayMetadata(knex?: Knex): Promise<LicenseDisplayMetadata | null> {
	const token = await getLicenseToken(knex);

	if (!token) {
		return null;
	}

	try {
		const decoded = decodeJwt(token) as { metadata?: unknown };
		return toDisplayMetadata(decoded.metadata);
	} catch {
		return null;
	}
}

function toDisplayMetadata(metadata: unknown): LicenseDisplayMetadata | null {
	if (!metadata || typeof metadata !== 'object') {
		return null;
	}

	const value = metadata as Partial<LicenseTokenMetadata>;

	const status =
		typeof value.status === 'string' && PAYLOAD_STATUSES.has(value.status as LicensePayloadStatus)
			? value.status
			: null;

	const plan = typeof value.plan === 'string' && value.plan !== '' ? value.plan : null;
	const projectId = typeof value.project_id === 'string' && value.project_id !== '' ? value.project_id : null;
	const publicUrl = typeof value.public_url === 'string' && value.public_url !== '' ? value.public_url : null;
	const isOig = typeof value.is_oig === 'boolean' ? value.is_oig : null;
	const refreshInterval = Number.isInteger(value.refresh_interval) ? value.refresh_interval : null;
	const gracePeriod = Number.isInteger(value.grace_period) ? value.grace_period : null;
	const expiresAt = Number.isInteger(value.expires_at) ? value.expires_at : null;
	const renewsAt = Number.isInteger(value.renews_at) ? value.renews_at : null;

	const addons = Array.isArray(value.addons)
		? value.addons.filter((addon): addon is string => typeof addon === 'string')
		: [];

	if (
		status === null &&
		plan === null &&
		projectId === null &&
		publicUrl === null &&
		isOig === null &&
		refreshInterval === null &&
		gracePeriod === null &&
		expiresAt === null &&
		renewsAt === null &&
		addons.length === 0
	) {
		return null;
	}

	return {
		status,
		plan,
		project_id: projectId,
		public_url: publicUrl,
		is_oig: isOig,
		refresh_interval: refreshInterval ?? null,
		grace_period: gracePeriod ?? null,
		expires_at: expiresAt ?? null,
		renews_at: renewsAt ?? null,
		addons,
	};
}
