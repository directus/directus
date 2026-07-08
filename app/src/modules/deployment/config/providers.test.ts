import type { DeploymentProviderCapabilities } from '@directus/types';
import { describe, expect, it, vi } from 'vitest';
import {
	buildDeployToolbarActions,
	defaultNotDeployableHintKey,
	formatDeploymentTargetLabel,
	getDeploymentRangeOptions,
	resolveDeploymentCapabilities,
	useProviderConfigs,
} from './providers';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

const pollingCapabilities: DeploymentProviderCapabilities = {
	eventsTransport: 'poll',
	supportsPreviewDeploy: false,
	supportsDeployHookUrl: true,
	needsRunStatusPolling: true,
};

const webhookCapabilities: DeploymentProviderCapabilities = {
	eventsTransport: 'webhook',
	supportsPreviewDeploy: true,
	supportsDeployHookUrl: false,
	needsRunStatusPolling: false,
};

describe('resolveDeploymentCapabilities', () => {
	it('should return fromApi capabilities when provided', () => {
		const result = resolveDeploymentCapabilities('cloudflare-workers', pollingCapabilities);
		expect(result).toBe(pollingCapabilities);
	});

	it('should return loading defaults when fromApi is null', () => {
		const result = resolveDeploymentCapabilities('vercel', null);
		expect(result.eventsTransport).toBe('webhook');
		expect(result.supportsPreviewDeploy).toBe(false);
		expect(result.needsRunStatusPolling).toBe(false);
	});

	it('should return loading defaults when fromApi is undefined', () => {
		const result = resolveDeploymentCapabilities('vercel');
		expect(result.eventsTransport).toBe('webhook');
	});
});

describe('buildDeployToolbarActions', () => {
	it('should always include deploy and refresh', () => {
		const actions = buildDeployToolbarActions(webhookCapabilities, []);
		const kinds = actions.map((a) => a.kind);
		expect(kinds).toContain('default');
		expect(kinds).toContain('refresh');
	});

	it('should include preview when supportsPreviewDeploy is true', () => {
		const actions = buildDeployToolbarActions(webhookCapabilities, []);
		expect(actions.some((a) => a.kind === 'preview')).toBe(true);
	});

	it('should omit preview when supportsPreviewDeploy is false', () => {
		const actions = buildDeployToolbarActions(pollingCapabilities, []);
		expect(actions.some((a) => a.kind === 'preview')).toBe(false);
	});

	it('should include deploy_hook entries when supportsDeployHookUrl is true', () => {
		const hooks = [
			{ name: 'Staging', url: 'https://example.com/hook1' },
			{ name: 'Production', url: 'https://example.com/hook2' },
		];

		const actions = buildDeployToolbarActions(pollingCapabilities, hooks);
		const hookActions = actions.filter((a) => a.kind === 'deploy_hook');
		expect(hookActions).toHaveLength(2);
		expect(hookActions[0]).toMatchObject({ name: 'Staging', url: hooks[0]!.url });
	});

	it('should omit deploy_hook entries when supportsDeployHookUrl is false', () => {
		const hooks = [{ name: 'Staging', url: 'https://example.com/hook' }];
		const actions = buildDeployToolbarActions(webhookCapabilities, hooks);
		expect(actions.some((a) => a.kind === 'deploy_hook')).toBe(false);
	});

	it('should set hook id as hook:<url>', () => {
		const url = 'https://example.com/hook';
		const actions = buildDeployToolbarActions(pollingCapabilities, [{ name: 'Test', url }]);
		const hookAction = actions.find((a) => a.kind === 'deploy_hook');
		expect(hookAction?.id).toBe(`hook:${url}`);
	});
});

describe('formatDeploymentTargetLabel', () => {
	const t = (key: string) => key;

	it('should translate production target', () => {
		expect(formatDeploymentTargetLabel('production', t)).toBe('deployment.target_value.production');
	});

	it('should translate preview target', () => {
		expect(formatDeploymentTargetLabel('preview', t)).toBe('deployment.target_value.preview');
	});

	it('should decode encoded hook label', () => {
		const label = 'My Deploy Hook';
		const target = `hook:${encodeURIComponent(label)}`;
		expect(formatDeploymentTargetLabel(target, t)).toBe(label);
	});

	it('should return raw encoded string when decodeURIComponent throws', () => {
		// % followed by invalid hex is an invalid URI sequence
		const target = 'hook:%GG';
		const result = formatDeploymentTargetLabel(target, t);
		expect(result).toBe('%GG');
	});

	it('should return target unchanged when not a recognized value', () => {
		expect(formatDeploymentTargetLabel('main', t)).toBe('main');
	});
});

describe('getDeploymentRangeOptions', () => {
	const t = (key: string) => key;

	it('should return the 1d/7d/30d range options', () => {
		expect(getDeploymentRangeOptions(t)).toEqual([
			{ text: 'deployment.range.1d', value: '1d' },
			{ text: 'deployment.range.7d', value: '7d' },
			{ text: 'deployment.range.30d', value: '30d' },
		]);
	});
});

describe('useProviderConfigs', () => {
	it('should include cloudflare-workers in the returned config', () => {
		const { providerConfigs } = useProviderConfigs();
		expect(providerConfigs.value['cloudflare-workers']).toBeDefined();
	});

	it('should include credentialsFields and optionsFields for cloudflare-workers', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		expect(config.credentialsFields.length).toBeGreaterThan(0);
		expect(config.optionsFields.length).toBeGreaterThan(0);
	});

	it('should have api_token credential field for cloudflare-workers', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		expect(config.credentialsFields[0]?.field).toBe('api_token');
	});

	it('should have account_id and events_queue_id options fields for cloudflare-workers', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		const fieldNames = config.optionsFields.map((f) => f.field);
		expect(fieldNames).toContain('account_id');
		expect(fieldNames).toContain('events_queue_id');
	});

	it('getDeploymentUrl should return null when account_id is missing', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		expect(config.getDeploymentUrl?.({}, 'my-worker', 'build-123')).toBeNull();
	});

	it('getDeploymentUrl should return a URL when account_id is present', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		const url = config.getDeploymentUrl?.({ account_id: 'acc-1' }, 'my-worker', 'build-123');
		expect(url).toContain('acc-1');
		expect(url).toContain('my-worker');
		expect(url).toContain('build-123');
	});

	it('api_token field should be required when no existing credentials', () => {
		const { providerConfigs } = useProviderConfigs(false);
		const field = providerConfigs.value['cloudflare-workers']!.credentialsFields[0]!;
		expect(field.meta?.required).toBe(true);
	});

	it('api_token field should not be required when credentials already exist', () => {
		const { providerConfigs } = useProviderConfigs(true);
		const field = providerConfigs.value['cloudflare-workers']!.credentialsFields[0]!;
		expect(field.meta?.required).toBe(false);
	});

	it('should have Cloudflare-specific not-deployable copy keys for cloudflare-workers', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;
		expect(config.notDeployableHintKey).toBe('deployment.provider.project.not_deployable_cloudflare');
		expect(config.notDeployableStatusKey).toBe('deployment.provider.project.missing_build_trigger');
	});

	it('should have deploy-hooks i18n keys for cloudflare-workers', () => {
		const { providerConfigs } = useProviderConfigs();
		const config = providerConfigs.value['cloudflare-workers']!;

		expect(config.deployHooks).toEqual({
			setupNoticeKey: 'deployment.provider.cloudflare-workers.setup_requirements',
			titleKey: 'deployment.provider.cloudflare-workers.deploy_hooks.title',
			hintKey: 'deployment.provider.cloudflare-workers.deploy_hooks.hint',
			namePlaceholderKey: 'deployment.provider.cloudflare-workers.deploy_hooks.name_placeholder',
			urlPlaceholderKey: 'deployment.provider.cloudflare-workers.deploy_hooks.url_placeholder',
			addLabelKey: 'deployment.provider.cloudflare-workers.deploy_hooks.add',
			deployViaKey: 'deployment.provider.cloudflare-workers.deploy_hooks.deploy_via',
		});
	});

	it('should not have deploy-hooks keys for vercel/netlify (no deploy-hook support)', () => {
		const { providerConfigs } = useProviderConfigs();
		expect(providerConfigs.value['vercel']!.deployHooks).toBeUndefined();
		expect(providerConfigs.value['netlify']!.deployHooks).toBeUndefined();
	});

	it('should not have not-deployable status copy keys for vercel/netlify (no per-worker trigger concept)', () => {
		const { providerConfigs } = useProviderConfigs();
		expect(providerConfigs.value['vercel']!.notDeployableStatusKey).toBeUndefined();
		expect(providerConfigs.value['netlify']!.notDeployableStatusKey).toBeUndefined();
	});

	it('vercel/netlify should fall back to the generic not-deployable hint', () => {
		const { providerConfigs } = useProviderConfigs();
		const vercelHint = providerConfigs.value['vercel']!.notDeployableHintKey ?? defaultNotDeployableHintKey;
		const netlifyHint = providerConfigs.value['netlify']!.notDeployableHintKey ?? defaultNotDeployableHintKey;
		expect(vercelHint).toBe(defaultNotDeployableHintKey);
		expect(netlifyHint).toBe(defaultNotDeployableHintKey);
	});
});
