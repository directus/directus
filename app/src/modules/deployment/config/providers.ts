import type { DeepPartial, Field } from '@directus/types';
import { computed, type MaybeRef, toValue } from 'vue';
import { useI18n } from 'vue-i18n';

export interface ProviderConfig {
	credentialsFields: DeepPartial<Field>[];
	optionsFields: DeepPartial<Field>[];
	tokenUrl?: string;
	settingsWarning?: string;
}

export const availableProviders = ['vercel', 'netlify'];

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

		const netlifyProvider = t('deployment.provider.netlify.name');
		const netlifyTokenUrl = 'https://app.netlify.com/user/applications';

		return {
			vercel: {
				tokenUrl: vercelTokenUrl,
				settingsWarning: t('deployment.provider.vercel.settings_warning'),
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
			netlify: {
				tokenUrl: netlifyTokenUrl,
				settingsWarning: t('deployment.provider.netlify.settings_warning'),
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
									`${t('deployment.provider.credentials.notice', { provider: netlifyProvider })} [${t('deployment.provider.credentials.link', { provider: netlifyProvider })}](${'https://app.netlify.com/user/applications'}).`,
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
		};
	});

	return { providerConfigs, availableProviders };
}
