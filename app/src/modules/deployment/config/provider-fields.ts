import type { DeepPartial, Field } from '@directus/types';
import { computed, type MaybeRef, toValue } from 'vue';
import { useI18n } from 'vue-i18n';

export interface ProviderConfig {
	credentialsFields: DeepPartial<Field>[];
	optionsFields: DeepPartial<Field>[];
	tokenUrl?: string;
}

export const availableProviders = ['vercel'];

export function useProviderConfigs(
	hasExistingCredentials: MaybeRef<boolean> = false,
	isEdit: MaybeRef<boolean> = false,
) {
	const { t } = useI18n();

	const providerConfigs = computed<Record<string, ProviderConfig>>(() => {
		const hasExisting = toValue(hasExistingCredentials);
		const edit = toValue(isEdit);

		const vercelProvider = t('deployment.provider.vercel.name');
		const vercelTokenUrl = 'https://vercel.com/account/settings/tokens';

		return {
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
	});

	return { providerConfigs, availableProviders };
}
