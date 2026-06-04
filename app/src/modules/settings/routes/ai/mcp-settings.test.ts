import { describe, expect, test } from 'vitest';
import { getMcpSettingsField } from './mcp-settings';
import type { Info } from '@/stores/server';

const info = (overrides: Partial<Info>): Info =>
	({
		mcp_enabled: true,
		ai_enabled: true,
		mcp_oauth_enabled: true,
		mcp_oauth_dcr_enabled: true,
		mcp_oauth_cimd_enabled: true,
		...overrides,
	}) as Info;

const field = (field: string, group = 'mcp_group') =>
	({
		field,
		meta: { group },
	}) as any;

describe('getMcpSettingsField', () => {
	test('replaces the OAuth parent field with a notice when OAuth is disabled by env', () => {
		const serverInfo = info({ mcp_oauth_enabled: false });

		expect(getMcpSettingsField(field('mcp_oauth_enabled'), serverInfo)).toMatchObject({
			field: 'mcp_oauth_enabled_notice',
			type: 'alias',
			meta: {
				interface: 'presentation-notice',
				options: {
					color: 'info',
					text: '$t:mcp_oauth_disabled_by_env',
				},
			},
		});

		expect(getMcpSettingsField(field('mcp_oauth_dcr_enabled'), serverInfo)).toBeNull();

		expect(getMcpSettingsField(field('mcp_prompts_collection'), serverInfo)).toMatchObject({
			field: 'mcp_prompts_collection',
		});
	});

	test('replaces DCR and CIMD fields with notices when their env flags are disabled', () => {
		const serverInfo = info({ mcp_oauth_dcr_enabled: false, mcp_oauth_cimd_enabled: false });

		expect(getMcpSettingsField(field('mcp_oauth_enabled'), serverInfo)).toMatchObject({
			field: 'mcp_oauth_enabled',
		});

		expect(getMcpSettingsField(field('mcp_oauth_dcr_enabled'), serverInfo)).toMatchObject({
			field: 'mcp_oauth_dcr_enabled_notice',
			type: 'alias',
			meta: {
				interface: 'presentation-notice',
				options: {
					color: 'info',
					text: '$t:mcp_oauth_dcr_disabled_by_env',
				},
			},
		});

		expect(getMcpSettingsField(field('mcp_oauth_cimd_enabled'), serverInfo)).toMatchObject({
			field: 'mcp_oauth_cimd_enabled_notice',
			type: 'alias',
			meta: {
				interface: 'presentation-notice',
				options: {
					color: 'info',
					text: '$t:mcp_oauth_cimd_disabled_by_env',
				},
			},
		});
	});
});
