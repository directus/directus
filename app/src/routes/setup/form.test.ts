import { describe, expect, test, vi } from 'vitest';
import { buildSetupPayload, defaultValues, useKycFields, useSetupFields, validate } from './form';

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

test('useKycFields project_usage choices match API enum (personal, commercial, community)', () => {
	const result = useKycFields();
	const usageField = result.value.find((f) => f.field === 'project_usage');
	const choiceValues = usageField?.meta?.options?.choices?.map((c: any) => c.value);
	expect(choiceValues).toEqual(['personal', 'commercial', 'community']);
});

describe('buildSetupPayload', () => {
	test('nests admin fields under admin key when showAdminStep is true', () => {
		const form = {
			...defaultValues,
			admin: {
				email: 'alice@example.com',
				password: 'secret',
				first_name: 'Alice',
				last_name: 'Smith',
			},
			password_confirm: 'secret',
		};

		const result = buildSetupPayload(form, true);

		expect(result.admin).toEqual({
			email: 'alice@example.com',
			password: 'secret',
			first_name: 'Alice',
			last_name: 'Smith',
		});
	});

	test('omits admin when showAdminStep is false', () => {
		const result = buildSetupPayload(defaultValues, false);
		expect(result).not.toHaveProperty('admin');
	});

	test('omits license_key when not set', () => {
		const result = buildSetupPayload(defaultValues, false);
		expect(result).not.toHaveProperty('license_key');
	});

	test('includes license_key when set', () => {
		const form = { ...defaultValues, license_key: 'ABCD-1234-EFGH-5678-IJKL' };
		const result = buildSetupPayload(form, false);
		expect(result.license_key).toBe('ABCD-1234-EFGH-5678-IJKL');
	});

	test('always includes owner with project_owner, project_usage, org_name, product_updates', () => {
		const form = {
			...defaultValues,
			owner: {
				project_owner: 'alice@example.com',
				project_usage: 'commercial' as const,
				org_name: 'Acme',
				product_updates: true,
			},
		};

		const result = buildSetupPayload(form, false);

		expect(result.owner).toEqual({
			project_owner: 'alice@example.com',
			project_usage: 'commercial',
			org_name: 'Acme',
			product_updates: true,
		});
	});

	test('mirrors admin email into owner.project_owner when owner.project_owner is unset', () => {
		const form = {
			...defaultValues,
			admin: { ...defaultValues.admin, email: 'alice@example.com' },
		};

		const result = buildSetupPayload(form, true);

		expect(result.owner.project_owner).toBe('alice@example.com');
	});

	test('omits first_name and last_name from admin when blank', () => {
		const form = {
			...defaultValues,
			admin: {
				email: 'alice@example.com',
				password: 'secret',
				first_name: null,
				last_name: null,
			},
		};

		const result = buildSetupPayload(form, true);

		expect(result.admin).not.toHaveProperty('first_name');
		expect(result.admin).not.toHaveProperty('last_name');
	});
});
