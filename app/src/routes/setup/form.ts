import { Field } from '@directus/types';
import { computed, ComputedRef, MaybeRef, ModelRef, Ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';

export type Form = {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	password_confirm: string | null;
	usage: 'personal' | 'commercial' | 'community' | null;
	org_name: string | null;
	license: boolean;
	marketing: boolean;
};

export const initialValues = {
	first_name: null,
	last_name: null,
	email: null,
	password: null,
	password_confirm: null,
	usage: null,
	org_name: null,
	license: false,
	marketing: false,
};

export function useFormFields(
	register: MaybeRef<boolean>,
	value: Ref<Form> | ModelRef<Form | undefined>,
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
							interface: 'system-fancy-select',
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
