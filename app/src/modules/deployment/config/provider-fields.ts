import type { DeepPartial, Field } from '@directus/types';
import { useI18n } from 'vue-i18n';

export interface ProviderConfig {
	credentialsFields: DeepPartial<Field>[];
	optionsFields: DeepPartial<Field>[];
	tokenUrl?: string;
}

export const availableProviders = ['vercel'];

export function useProviderConfigs(hasExistingCredentials = false, isEdit = false) {
	const { t } = useI18n();

	const vercelProvider = t('deployment.provider.vercel.name');
	const vercelTokenUrl = 'https://vercel.com/account/settings/tokens';

	const providerConfigs: Record<string, ProviderConfig> = {
		vercel: {
			tokenUrl: vercelTokenUrl,
			credentialsFields: [
				{
					field: 'access_token',
					name: t('deployment.provider.token.label'),
					type: 'string',
					meta: {
						interface: 'input',
						width: 'full',
						required: !hasExistingCredentials,
						note: [
							isEdit &&
								`${t('deployment.provider.credentials.notice', { provider: vercelProvider })} [${t('deployment.provider.credentials.link', { provider: vercelProvider })}](${vercelTokenUrl}).`,
							t('deployment.provider.token.encrypted_notice'),
						]
							.filter(Boolean)
							.join(' '),
						options: {
							placeholder: hasExistingCredentials
								? t('interfaces.system-token.value_securely_saved')
								: t('deployment.provider.token.placeholder'),
						},
					},
				},
			],
			optionsFields: [
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
					},
				},
			],
		},
	};

	return { providerConfigs, availableProviders };
}
