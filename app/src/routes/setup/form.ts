import { DeepPartial, Field, SetupForm } from '@directus/types';
import { FailedValidationErrorExtensions } from '@directus/validation';
import { computed, ComputedRef, MaybeRef, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import z from 'zod';
import { validateItem } from '@/utils/validate-item';

export const FormValidator = z.object({
	first_name: z.string(),
	last_name: z.string(),
	project_owner: z.email(),
	password: z.string(),
	password_confirm: z.string(),
	license: z.literal(true),
	product_updates: z.boolean().optional(),
});

export const defaultValues: SetupForm = {
	first_name: null,
	last_name: null,
	project_owner: null,
	password: null,
	password_confirm: null,
	license: false,
	product_updates: false,
};

export type ValidationError = Omit<FailedValidationErrorExtensions, 'type'> & { type: string };

export function validate(value: Record<string, any>, fields: MaybeRef<Field[]>, register = false) {
	let errors: ValidationError[] = validateItem(value, unref(fields), true);

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

	errors = errors.map((error) => {
		if (error.field === 'org_name' && (error.type === 'nnull' || error.type === 'required')) {
			error.type = 'org_name';
		}

		return error;
	});

	return errors;
}

export function useFormFields(register: MaybeRef<boolean>): ComputedRef<Field[]> {
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
			field: 'project_owner',
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

		return fields as Field[];
	});
}
