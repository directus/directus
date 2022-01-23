import { parseArgs } from '../../../../services/graphql/shared/parse-args';

describe('parseArgs', () => {
	it('returns the name and value of the StringValue', () => {
		expect(
			parseArgs(
				[
					{
						kind: 'Argument',
						name: { kind: 'Name', value: 'arg1' },
						value: { kind: 'StringValue', value: 'argumentValue' },
					},
				],
				{}
			)
		).toStrictEqual({ arg1: 'argumentValue' });
	});

	it('returns the nested name and value of the ObjectValue', () => {
		expect(
			parseArgs(
				[
					{
						kind: 'Argument',
						name: { kind: 'Name', value: 'arg1' },
						value: {
							kind: 'ObjectValue',
							fields: [
								{
									kind: 'ObjectField',
									name: { kind: 'Name', value: 'aChildField' },
									value: { kind: 'ObjectValue', fields: [] },
								},
							],
							value: 'argumentValue',
						},
					},
				],
				{}
			)
		).toStrictEqual({ arg1: { aChildField: {} } });
	});

	it('returns the Variable', () => {
		expect(
			parseArgs(
				[
					{
						kind: 'Argument',
						name: { kind: 'Name', value: 'arg1' },
						value: { kind: 'Variable', name: { kind: 'Name', value: 'aVar' }, value: 'argumentValue' },
					},
				],
				{ aVar: 'hello' }
			)
		).toStrictEqual({ arg1: 'hello' });
	});

	it('returns the ListValue array', () => {
		expect(
			parseArgs(
				[
					{
						kind: 'Argument',
						name: { kind: 'Name', value: 'arg1' },
						value: {
							kind: 'ListValue',
							values: [
								{ kind: 'IntValue', value: '12' },
								{ kind: 'FloatValue', value: '0.12' },
							],
						},
					},
				],
				{}
			)
		).toStrictEqual({ arg1: ['12', '0.12'] });
	});

	it('returns the ListValue array with an ObjectField', () => {
		expect(
			parseArgs(
				[
					{
						kind: 'Argument',
						name: { kind: 'Name', value: 'arg1' },
						value: {
							kind: 'ListValue',
							values: [
								{ kind: 'IntValue', value: '12' },
								{
									kind: 'ObjectValue',
									fields: [
										{
											kind: 'ObjectField',
											name: { kind: 'Name', value: 'aChildField' },
											value: { kind: 'ObjectValue', fields: [] },
										},
									],
									value: 'argumentValue',
								},
							],
						},
					},
				],
				{}
			)
		).toStrictEqual({ arg1: ['12', { aChildField: {} }] });
	});
});
