import { Field, SetupForm } from '@directus/types';
import { computed, ComputedRef, MaybeRef, ModelRef, Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export const initialValues = {
	first_name: null,
	last_name: null,
	email: null,
	password: null,
	password_confirm: null,
	usage: null,
	org_name: null,
	license: false,
	email_news: false,
};

export function useFormFields(
	register: MaybeRef<boolean>,
	value: Ref<SetupForm> | ModelRef<SetupForm | undefined>,
): ComputedRef<Field[]> {
	const { t } = useI18n();

	return computed(
		() =>
			(
				[
					register
						? {
								field: 'first_name',
								name: t('first_name'),
								meta: {
									required: true,
									interface: 'input',
									options: {
										placeholder: t('first_name'),
									},
									width: 'half',
								},
							}
						: null,
					register
						? {
								field: 'last_name',
								name: t('last_name'),
								meta: {
									required: true,
									interface: 'input',
									options: {
										placeholder: t('last_name'),
									},
									width: 'half',
								},
							}
						: null,
					{
						field: 'email',
						name: t(register ? 'admin_email' : 'owner_email'),
						meta: {
							required: true,
							interface: 'input',
							options: {
								placeholder: t('email_address'),
							},
							width: 'full',
						},
					},
					register
						? {
								field: 'password',
								name: t('password'),
								meta: {
									required: true,
									interface: 'system-input-password',
									width: 'half',
								},
							}
						: null,
					register
						? {
								field: 'password_confirm',
								name: t('confirm_password'),
								meta: {
									required: true,
									interface: 'system-input-password',
									options: {},
									width: 'half',
								},
							}
						: null,
					{
						field: 'usage',
						name: t('how_do_you_use_directus'),
						meta: {
							required: false,
							interface: 'select-dropdown',
							options: {
								items: [
									{ icon: 'account_circle', value: 'personal', text: t('personal') },
									{ icon: 'domain', value: 'commercial', text: t('commercial') },
									{ icon: 'groups', value: 'community', text: t('community') },
								],
							},
							width: 'full',
						},
					},
					value.value?.usage === 'commercial'
						? {
								field: 'org_name',
								name: t('organization_name'),
								meta: {
									required: true,
									interface: 'input',
									options: {
										label: t('organization_name_optional'),
									},
									width: 'full',
								},
							}
						: null,
				] as (Field | null)[]
			).filter(Boolean) as unknown as Field[],
	);
}
