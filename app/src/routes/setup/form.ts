import { DeepPartial, Field, SetupForm } from '@directus/types';
import { computed, ComputedRef, MaybeRef, ModelRef, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import z from 'zod';

export const FormValidator = z.object({
	first_name: z.string(),
	last_name: z.string(),
	email: z.email(),
	password: z.string(),
	password_confirm: z.string(),
	project_usage: z.enum(['personal', 'commercial', 'community']).nullable().optional(),
	org_name: z.string().nullable().optional(),
	license: z.boolean(),
	product_updates: z.boolean().optional(),
});

export const initialValues: SetupForm = {
	first_name: null,
	last_name: null,
	email: null,
	password: null,
	password_confirm: null,
	project_usage: null,
	org_name: null,
	license: false,
	product_updates: false,
};

export function useFormFields(
	register: MaybeRef<boolean>,
	value: Ref<SetupForm> | ModelRef<SetupForm | undefined>,
): ComputedRef<Field[]> {
	const { t } = useI18n();

	return computed(() => {
		const fields: DeepPartial<Field>[] = [];

		if (register) {
			fields.push({
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
			});

			fields.push({
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
			});
		}

		fields.push({
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
		});

		if (register) {
			fields.push({
				field: 'password',
				name: t('password'),
				meta: {
					required: true,
					interface: 'system-input-password',
					width: 'half',
				},
			});

			fields.push({
				field: 'password_confirm',
				name: t('confirm_password'),
				meta: {
					required: true,
					interface: 'system-input-password',
					options: {},
					width: 'half',
				},
			});
		}

		fields.push({
			field: 'project_usage',
			name: t('how_do_you_use_directus'),
			meta: {
				required: false,
				interface: 'select-dropdown',
				options: {
					items: [
						{ icon: 'account_circle', value: 'personal', text: t('usage_personal') },
						{ icon: 'domain', value: 'commercial', text: t('usage_commercial') },
						{ icon: 'groups', value: 'community', text: t('usage_community') },
					],
				},
				width: 'full',
			},
		});

		if (value.value?.project_usage === 'commercial')
			fields.push({
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
			});

		return fields as Field[];
	});
}
