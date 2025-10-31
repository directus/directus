import { expect, test, vi } from 'vitest';
import { initialValues, useFormFields, validate } from './form';
import { ref } from 'vue';

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationsForField: () => [],
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: () => '',
	}),
	createI18n: () => undefined,
}));

test('useFormFields for setup', () => {
	const result = useFormFields(true, ref(initialValues));

	expect(result.value.map((field) => field.field)).toEqual([
		'first_name',
		'last_name',
		'email',
		'password',
		'password_confirm',
		'project_usage',
	]);
});

test('useFormFields for modal/edit', () => {
	const result = useFormFields(false, ref(initialValues));

	expect(result.value.map((field) => field.field)).toEqual(['email', 'project_usage']);
});

test('useFormFields with project_usage = commercial', () => {
	const result = useFormFields(false, ref({ ...initialValues, project_usage: 'commercial' }));

	expect(result.value.map((field) => field.field)).toEqual(['email', 'project_usage', 'org_name']);
});

test('validate on invalid setup form', () => {
	const fields = useFormFields(false, ref(initialValues));
	const result = validate({}, fields);

	expect(result.length).toBeGreaterThan(0);
});

test('validate on valid setup form', () => {
	const fields = useFormFields(true, ref(initialValues));

	const result = validate(
		{
			first_name: 'Admin',
			last_name: 'User',
			email: 'admin@example.com',
			password: 'pw',
			password_confirm: 'pw',
			project_usage: null,
			license: true,
			product_updates: false,
		},
		fields,
		true,
	);

	expect(result).toEqual([]);
});

test('validate with unequal password', () => {
	const fields = useFormFields(true, ref(initialValues));

	const result = validate(
		{
			first_name: 'Admin',
			last_name: 'User',
			email: 'admin@example.com',
			password: 'pw',
			password_confirm: 'invalid',
			project_usage: null,
			license: false,
			product_updates: false,
		},
		fields,
		true,
	);

	expect(result).toMatchObject([
		{
			field: 'password_confirm',
			type: 'confirm_password',
		},
	]);
});
