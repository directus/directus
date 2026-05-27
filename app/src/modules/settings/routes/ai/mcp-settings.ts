import type { Info } from '@/stores/server';

type SettingsField = {
	field: string;
	type?: string;
	meta?: {
		group?: string | null;
		interface?: string | null;
		options?: Record<string, unknown> | null;
		special?: string[] | null;
	} | null;
};

const oauthEnvNotices = {
	mcp_oauth_enabled: '$t:mcp_oauth_disabled_by_env',
	mcp_oauth_dcr_enabled: '$t:mcp_oauth_dcr_disabled_by_env',
	mcp_oauth_cimd_enabled: '$t:mcp_oauth_cimd_disabled_by_env',
} as const;

export function getMcpSettingsField(field: SettingsField, serverInfo: Info): SettingsField | null {
	if (field.meta?.group !== 'mcp_group' && field.field !== 'mcp_group') return null;

	if (field.field === 'mcp_oauth_enabled' && !serverInfo.mcp_oauth_enabled) {
		return createEnvNoticeField(field, oauthEnvNotices.mcp_oauth_enabled);
	}

	if (field.field.startsWith('mcp_oauth') && !serverInfo.mcp_oauth_enabled) return null;

	if (field.field === 'mcp_oauth_dcr_enabled' && !serverInfo.mcp_oauth_dcr_enabled) {
		return createEnvNoticeField(field, oauthEnvNotices.mcp_oauth_dcr_enabled);
	}

	if (field.field === 'mcp_oauth_cimd_enabled' && !serverInfo.mcp_oauth_cimd_enabled) {
		return createEnvNoticeField(field, oauthEnvNotices.mcp_oauth_cimd_enabled);
	}

	return field;
}

function createEnvNoticeField(field: SettingsField, text: string): SettingsField {
	return {
		...field,
		field: `${field.field}_notice`,
		type: 'alias',
		meta: {
			...field.meta,
			interface: 'presentation-notice',
			options: {
				color: 'info',
				icon: 'info',
				text,
			},
			special: ['alias', 'no-data'],
		},
	};
}
