import type { DeepPartial, DeploymentProviderCapabilities, Field } from '@directus/types';
import { computed, type MaybeRef, toValue } from 'vue';
import { useI18n } from 'vue-i18n';

export interface ProviderConfig {
	credentialsFields: DeepPartial<Field>[];
	optionsFields: DeepPartial<Field>[];
	tokenUrl?: string;
	settingsWarning?: string;
	getDeploymentUrl?: (options: Record<string, any>, projectName: string, externalId: string) => string | null;
}

export const availableProviders = ['vercel', 'netlify', 'cloudflare-workers'];

const capabilitiesLoadingDefault: DeploymentProviderCapabilities = {
	eventsTransport: 'webhook',
	supportsPreviewDeploy: false,
	supportsDeployHookUrl: false,
	needsRunStatusPolling: false,
};

export function resolveDeploymentCapabilities(
	_provider: string,
	fromApi?: DeploymentProviderCapabilities | null,
): DeploymentProviderCapabilities {
	return fromApi ?? capabilitiesLoadingDefault;
}

export type DeployToolbarAction =
	| { id: 'deploy'; kind: 'default' }
	| { id: 'preview'; kind: 'preview' }
	| { id: string; kind: 'deploy_hook'; name: string; url: string }
	| { id: 'refresh'; kind: 'refresh' };

/**
 * Build deploy menu actions from provider capabilities and optional deploy-hook entries.
 */
export function buildDeployToolbarActions(
	capabilities: DeploymentProviderCapabilities,
	deployHooks: Array<{ name: string; url: string }>,
): DeployToolbarAction[] {
	const actions: DeployToolbarAction[] = [{ id: 'deploy', kind: 'default' }];

	if (capabilities.supportsPreviewDeploy) {
		actions.push({ id: 'preview', kind: 'preview' });
	}

	if (capabilities.supportsDeployHookUrl) {
		for (const hook of deployHooks) {
			actions.push({
				id: `hook:${hook.url}`,
				kind: 'deploy_hook',
				name: hook.name,
				url: hook.url,
			});
		}
	}

	actions.push({ id: 'refresh', kind: 'refresh' });

	return actions;
}

export function formatDeploymentTargetLabel(target: string, t: (key: string) => string): string {
	if (target === 'production') return t('deployment.target_value.production');
	if (target === 'preview') return t('deployment.target_value.preview');

	if (target.startsWith('hook:')) {
		const encoded = target.slice('hook:'.length);

		try {
			return decodeURIComponent(encoded);
		} catch {
			return encoded;
		}
	}

	return target;
}

export function useProviderConfigs(
	hasExistingCredentials: MaybeRef<boolean> = false,
	isEdit: MaybeRef<boolean> = false,
) {
	const { t } = useI18n();

	const providerConfigs = computed<Record<string, ProviderConfig>>(() => {
		const hasExisting = toValue(hasExistingCredentials);
		const edit = toValue(isEdit);

		const vercelBaseUrl = 'https://vercel.com';
		const vercelProvider = t('deployment.provider.vercel.name');
		const vercelTokenUrl = `${vercelBaseUrl}/account/settings/tokens`;

		const netlifyBaseUrl = 'https://app.netlify.com';
		const netlifyProvider = t('deployment.provider.netlify.name');
		const netlifyTokenUrl = `${netlifyBaseUrl}/user/applications`;

		const cloudflareBaseUrl = 'https://dash.cloudflare.com';
		const cloudflareProvider = t('deployment.provider.cloudflare-workers.name');
		const cloudflareTokenUrl = `${cloudflareBaseUrl}/profile/api-tokens`;

		return {
			vercel: {
				tokenUrl: vercelTokenUrl,
				settingsWarning: t('deployment.provider.vercel.settings_warning'),
				getDeploymentUrl: (options, projectName, externalId) => {
					const teamId = options['team_id'];
					const username = options['username'];
					const scope = teamId || username;
					if (!scope) return null;
					return `${vercelBaseUrl}/${scope}/${projectName}/${externalId}`;
				},
				credentialsFields: [
					{
						field: 'access_token',
						name: t('deployment.provider.token.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: !hasExisting,
							note: [
								edit &&
									`${t('deployment.provider.credentials.notice', { provider: vercelProvider })} [${t('deployment.provider.credentials.link', { provider: vercelProvider })}](${vercelTokenUrl}).`,
								t('deployment.provider.token.encrypted_notice'),
							]
								.filter(Boolean)
								.join(' '),
							options: {
								placeholder: hasExisting
									? t('interfaces.system-token.value_securely_saved')
									: t('deployment.provider.token.placeholder'),
							},
						},
					},
				],
				optionsFields: [
					{
						field: 'account_type',
						name: t('deployment.provider.vercel.account_type.label'),
						type: 'string',
						schema: {
							default_value: 'team',
						},
						meta: {
							interface: 'select-dropdown',
							width: 'full',
							required: false,
							note: t('deployment.provider.vercel.account_type.hint'),
							options: {
								choices: [
									{ text: t('deployment.provider.vercel.account_type.team'), value: 'team' },
									{ text: t('deployment.provider.vercel.account_type.personal'), value: 'personal' },
								],
								allowOther: false,
							},
						},
					},
					{
						field: 'team_id',
						name: t('deployment.provider.vercel.team_id.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: false,
							note: t('deployment.provider.vercel.team_id.hint'),
							options: {
								placeholder: t('deployment.provider.vercel.team_id.placeholder'),
							},
							conditions: [{ rule: { account_type: { _eq: 'personal' } }, hidden: true }],
						},
					},
					{
						field: 'username',
						name: t('deployment.provider.vercel.username.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: false,
							note: t('deployment.provider.vercel.username.hint'),
							options: {
								placeholder: t('deployment.provider.vercel.username.placeholder'),
							},
							conditions: [
								{
									rule: {
										_or: [{ account_type: { _null: true } }, { account_type: { _eq: 'team' } }],
									},
									hidden: true,
								},
							],
						},
					},
				],
			},
			netlify: {
				tokenUrl: netlifyTokenUrl,
				settingsWarning: t('deployment.provider.netlify.settings_warning'),
				getDeploymentUrl: (_options, projectName, externalId) => {
					return `${netlifyBaseUrl}/sites/${projectName}/deploys/${externalId}`;
				},
				credentialsFields: [
					{
						field: 'access_token',
						name: t('deployment.provider.token.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: !hasExisting,
							note: [
								edit &&
									`${t('deployment.provider.credentials.notice', { provider: netlifyProvider })} [${t('deployment.provider.credentials.link', { provider: netlifyProvider })}](${netlifyTokenUrl}).`,
								t('deployment.provider.token.encrypted_notice'),
							]
								.filter(Boolean)
								.join(' '),
							options: {
								placeholder: hasExisting
									? t('interfaces.system-token.value_securely_saved')
									: t('deployment.provider.token.placeholder'),
							},
						},
					},
				],
				optionsFields: [
					{
						field: 'account_slug',
						name: t('deployment.provider.netlify.account_slug.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: false,
							note: t('deployment.provider.netlify.account_slug.hint'),
							options: {
								placeholder: t('deployment.provider.netlify.account_slug.placeholder'),
							},
						},
					},
				],
			},
			'cloudflare-workers': {
				tokenUrl: cloudflareTokenUrl,
				settingsWarning: t('deployment.provider.cloudflare-workers.settings_warning'),
				getDeploymentUrl: (options, projectName, externalId) => {
					const accountId = options['account_id'];
					if (!accountId) return null;
					return `${cloudflareBaseUrl}/${accountId}/workers/services/view/${projectName}/production/builds/${externalId}`;
				},
				credentialsFields: [
					{
						field: 'api_token',
						name: t('deployment.provider.token.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: !hasExisting,
							note: [
								edit &&
									`${t('deployment.provider.credentials.notice', { provider: cloudflareProvider })} [${t('deployment.provider.credentials.link', { provider: cloudflareProvider })}](${cloudflareTokenUrl}).`,
								t('deployment.provider.cloudflare-workers.api_token.hint'),
								t('deployment.provider.token.encrypted_notice'),
							]
								.filter(Boolean)
								.join('\n\n'),
							options: {
								placeholder: hasExisting
									? t('interfaces.system-token.value_securely_saved')
									: t('deployment.provider.token.placeholder'),
							},
						},
					},
				],
				optionsFields: [
					{
						field: 'account_id',
						name: t('deployment.provider.cloudflare-workers.account_id.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: true,
							note: t('deployment.provider.cloudflare-workers.account_id.hint'),
							options: {
								placeholder: t('deployment.provider.cloudflare-workers.account_id.placeholder'),
							},
						},
					},
					{
						field: 'events_queue_id',
						name: t('deployment.provider.cloudflare-workers.events_queue_id.label'),
						type: 'string',
						meta: {
							interface: 'input',
							width: 'full',
							required: false,
							note: t('deployment.provider.cloudflare-workers.events_queue_id.hint'),
							options: {
								placeholder: t('deployment.provider.cloudflare-workers.events_queue_id.placeholder'),
							},
						},
					},
				],
			},
		};
	});

	return { providerConfigs, availableProviders };
}
