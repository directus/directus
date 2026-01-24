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

	const vercelProvider = t('deployment_provider_vercel');
	const vercelTokenUrl = 'https://vercel.com/account/settings/tokens';

	const providerConfigs: Record<string, ProviderConfig> = {
		vercel: {
			tokenUrl: vercelTokenUrl,
			credentialsFields: [
				{
					field: 'access_token',
					name: t('deployment_provider_token_label'),
					type: 'string',
					meta: {
						interface: 'input',
						width: 'full',
						required: !hasExistingCredentials,
						note: [
							isEdit && `${t('deployment_provider_credentials_notice', { provider: vercelProvider })} [${t('deployment_provider_credentials_link', { provider: vercelProvider })}](${vercelTokenUrl}).`,
							t('deployment_provider_token_encrypted_notice'),
						].filter(Boolean).join(' '),
						options: {
							placeholder: hasExistingCredentials
								? t('interfaces.system-token.value_securely_saved')
								: t('deployment_provider_token_placeholder'),
						},
					},
				},
			],
			optionsFields: [
				{
					field: 'team_id',
					name: t('deployment_provider_vercel_team_id_label'),
					type: 'string',
					meta: {
						interface: 'input',
						width: 'full',
						required: false,
						note: t('deployment_provider_vercel_team_id_hint'),
						options: {
							placeholder: t('deployment_provider_vercel_team_id_placeholder'),
						},
					},
				},
			],
		}
	};

	return { providerConfigs, availableProviders };
}
