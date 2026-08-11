import { assertType, describe, expectTypeOf, test } from 'vitest';
import type {
	ApplyQueryFields,
	DirectusDeployment,
	DirectusSettings,
	NestedPartial,
	ReadWriteField,
} from '../src/index.js';
import { createDirectus, createItem, readItem, rest, updateItem } from '../src/index.js';

type Secret = {
	id: number;
	value: ReadWriteField<'**********' | null, { token: string }>;
};

type Schema = {
	secrets: Secret[];
};

const client = createDirectus<Schema>('https://directus.example.com').with(rest());

describe('ReadWriteField', () => {
	test('uses the read type in query output', () => {
		type Output = ApplyQueryFields<Schema, Secret, ['value']>;

		expectTypeOf<Output>().toEqualTypeOf<{ value: '**********' | null }>();
	});

	test('uses the write type in nested input', () => {
		type Input = NestedPartial<Secret>;

		assertType<Input>({ value: { token: 'secret' } });

		// @ts-expect-error redacted response values cannot be written
		assertType<Input>({ value: '**********' });
	});

	test('applies the types to generic item commands', () => {
		const _readSecret = () => client.request(readItem('secrets', 1, { fields: ['value'] }));
		const _createSecret = () => client.request(createItem('secrets', { value: { token: 'secret' } }));
		const _updateSecret = () => client.request(updateItem('secrets', 1, { value: { token: 'secret' } }));

		expectTypeOf<Awaited<ReturnType<typeof _readSecret>>>().toEqualTypeOf<{
			value: '**********' | null;
		}>();

		expectTypeOf<Awaited<ReturnType<typeof _createSecret>>>().toEqualTypeOf<{
			id: number;
			value: '**********' | null;
		}>();

		expectTypeOf<Awaited<ReturnType<typeof _updateSecret>>>().toEqualTypeOf<{
			id: number;
			value: '**********' | null;
		}>();
	});

	test('supports differing core collection field types', () => {
		type DeploymentOutput = ApplyQueryFields<Schema, DirectusDeployment<Schema>, ['credentials']>;
		type DeploymentInput = NestedPartial<DirectusDeployment<Schema>>;
		type SettingsOutput = ApplyQueryFields<Schema, DirectusSettings<Schema>, ['ai_openai_api_key', 'license_key']>;
		type SettingsInput = NestedPartial<DirectusSettings<Schema>>;

		expectTypeOf<DeploymentOutput>().toEqualTypeOf<{ credentials: '**********' | null }>();
		assertType<DeploymentInput>({ credentials: { access_token: 'secret' } });

		expectTypeOf<SettingsOutput>().toEqualTypeOf<{
			ai_openai_api_key: '**********' | null;
			license_key: '**********' | null;
		}>();

		assertType<SettingsInput>({ ai_openai_api_key: 'secret', license_key: null });
	});
});
