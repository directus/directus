import { expect, test, vi } from 'vitest';
import { useKycFields, useSetupFields, validate } from './form';

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
	const result = useSetupFields(true);

	expect(result.value.map((field) => field.field)).toEqual([
		'first_name',
		'last_name',
		'project_owner',
		'password',
		'password_confirm',
	]);
});

test('useFormFields for modal/edit', () => {
	const result = useSetupFields(false);

	expect(result.value.map((field) => field.field)).toEqual(['project_owner']);
});

test('validate on invalid setup form', () => {
	const fields = useSetupFields(false);
	const result = validate({}, fields);

	expect(result.length).toBeGreaterThan(0);
});

test('validate on valid setup form', () => {
	const fields = useSetupFields(true);

	const result = validate(
		{
			first_name: 'Admin',
			last_name: 'User',
			project_owner: 'admin@example.com',
			password: 'pw',
			password_confirm: 'pw',
			license: true,
			product_updates: false,
		},
		fields,
		true,
	);

	expect(result).toEqual([]);
});

test('validate with unequal password', () => {
	const fields = useSetupFields(true);

	const result = validate(
		{
			first_name: 'Admin',
			last_name: 'User',
			project_owner: 'admin@example.com',
			password: 'pw',
			password_confirm: 'invalid',
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

test('useKycFields returns usage and org_name fields', () => {
	const result = useKycFields();
	expect(result.value.map((f) => f.field)).toEqual(['project_usage', 'org_name']);
});
