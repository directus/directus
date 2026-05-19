import { LICENSE_KEY } from '@directus/license';
import { DeepPartial, Field, SetupForm } from '@directus/types';
import { FailedValidationErrorExtensions } from '@directus/validation';
import { computed, ComputedRef, MaybeRef, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import z from 'zod';
import { validateItem } from '@/utils/validate-item';

export const SetupValidator = z
	.object({
		admin: z.object({
			email: z.email(),
			password: z.string().min(1),
			first_name: z.string().min(1),
			last_name: z.string().min(1),
		}),
		password_confirm: z.string().min(1),
		license: z.literal(true),
	})
	.refine((data) => data.admin.password === data.password_confirm, {
		path: ['password_confirm'],
	});

export const FormValidator = z.object({
	admin: z.object({
		email: z.email(),
		password: z.string(),
		first_name: z.string(),
		last_name: z.string(),
	}),
	password_confirm: z.string(),
	license: z.literal(true),
	license_key: LICENSE_KEY.nullable(),
	owner: z.object({
		project_owner: z.string().nullable(),
		project_usage: z.enum(['personal', 'commercial', 'community']).nullable(),
		org_name: z.string().nullable(),
		product_updates: z.boolean(),
	}),
});

export const defaultValues: SetupForm = {
	admin: {
		email: null,
		password: null,
		first_name: null,
		last_name: null,
	},
	password_confirm: null,
	license: false,
	license_key: null,
	owner: {
		project_owner: null,
		project_usage: null,
		org_name: null,
		product_updates: false,
	},
};

export type ValidationError = Omit<FailedValidationErrorExtensions, 'type'> & { type: string };

export function validate(value: Record<string, any>, fields: MaybeRef<Field[]>, register = false) {
	const errors: ValidationError[] = validateItem(value, unref(fields), true);

	if (!z.email().safeParse(value.project_owner).success) {
		errors.push({
			field: 'project_owner',
			path: [],
			type: 'email',
		});
	}

	if (register && value.password !== value.password_confirm) {
		errors.push({
			field: 'password_confirm',
			path: [],
			type: 'confirm_password',
		});
	}

	return errors;
}

export function useSetupFields(register: MaybeRef<boolean>): ComputedRef<Field[]> {
	const { t } = useI18n();

	return computed(() => {
		const fields: DeepPartial<Field>[] = [];

		if (unref(register)) {
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
			field: 'project_owner',
			name: t(unref(register) ? 'admin_email' : 'owner_email'),
			meta: {
				required: true,
				interface: 'input',
				options: {
					placeholder: t('email_address'),
				},
				width: 'full',
			},
		});

		if (unref(register)) {
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

		return fields as Field[];
	});
}

export function useKycFields(): ComputedRef<Field[]> {
	const { t } = useI18n();

	return computed(
		() =>
			[
				{
					field: 'project_usage',
					name: t('project_usage'),
					meta: {
						interface: 'select-dropdown',
						width: 'full',
						options: {
							choices: [
								{ text: t('project_usage_personal'), value: 'personal' },
								{ text: t('project_usage_commercial'), value: 'commercial' },
								{ text: t('project_usage_community'), value: 'community' },
							],
						},
					},
				},
				{
					field: 'org_name',
					name: t('org_name'),
					meta: {
						interface: 'input',
						width: 'full',
						options: {
							placeholder: t('org_name_placeholder'),
						},
					},
				},
			] as unknown as Field[],
	);
}

export function buildSetupPayload(form: Partial<SetupForm>, showAdminStep: boolean) {
	const adminEmail = form.admin?.email ?? null;

	return {
		...(showAdminStep &&
			form.admin && {
				admin: {
					email: form.admin.email!,
					password: form.admin.password!,
					...(form.admin.first_name && { first_name: form.admin.first_name }),
					...(form.admin.last_name && { last_name: form.admin.last_name }),
				},
			}),
		...(form.license_key && { license_key: form.license_key }),
		owner: {
			project_owner: form.owner?.project_owner ?? adminEmail,
			project_usage: form.owner?.project_usage ?? null,
			org_name: form.owner?.org_name ?? null,
			product_updates: form.owner?.product_updates ?? false,
		},
	};
}

export function useLicenseFields(): ComputedRef<Field[]> {
	const { t } = useI18n();

	return computed(() => {
		return [
			{
				field: 'license_key',
				name: t('license_key'),
				meta: {
					interface: 'system-license-key',
					width: 'full',
				},
			},
		] as unknown as Field[];
	});
}
