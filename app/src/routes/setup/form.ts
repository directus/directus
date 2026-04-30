import { KEY } from '@directus/license';
import { DeepPartial, Field, SetupForm } from '@directus/types';
import { FailedValidationErrorExtensions } from '@directus/validation';
import { computed, ComputedRef, MaybeRef, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import z from 'zod';
import { validateItem } from '@/utils/validate-item';

export const SetupValidator = z.object({
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	project_owner: z.email(),
	password: z.string().min(1),
	password_confirm: z.string().min(1),
});

export const FormValidator = z.object({
	first_name: z.string(),
	last_name: z.string(),
	project_owner: z.email(),
	password: z.string(),
	password_confirm: z.string(),
	license: z.literal(true),
	license_key: KEY.nullable(),
	product_updates: z.boolean().optional(),
});

export const defaultValues: SetupForm = {
	first_name: null,
	last_name: null,
	project_owner: null,
	password: null,
	password_confirm: null,
	license: false,
	license_key: null,
	product_updates: false,
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
