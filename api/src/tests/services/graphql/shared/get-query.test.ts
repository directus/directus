import { SelectionNode } from 'graphql';
import { cloneDeep } from 'lodash';
import { getQuery } from '../../../../services/graphql/shared/get-query';

describe('getQuery', () => {
	const accountability = { admin: true, role: 'admin' };
	const fields = [{ kind: 'Field', name: { kind: 'Name', value: 'A Name' } }] as SelectionNode[];

	it('gets the empty query', () => {
		expect(getQuery({}, fields, {}, accountability)).toStrictEqual({
			alias: {},
			fields: ['A Name'],
			filter: undefined,
		});
	});
	it('gets the aliases query', () => {
		const aliasFields = cloneDeep(fields);
		aliasFields[0] = {
			kind: 'Field',
			name: { kind: 'Name', value: 'A Name' },
			alias: { kind: 'Name', value: 'New Name' },
		};

		expect(getQuery({}, aliasFields, {}, accountability)).toStrictEqual({
			alias: { 'New Name': 'A Name' },
			fields: ['A Name'],
			filter: undefined,
		});
	});
	it('gets the aggregate query', () => {
		expect(getQuery({ aggregate: { avg: ['Name'] } }, fields, {}, accountability)).toStrictEqual({
			aggregate: { avg: ['Name'] },
			alias: {},
			fields: ['A Name'],
			filter: undefined,
		});
	});

	describe('parseFields', () => {
		describe('kind: Field', () => {
			it('removes fields starting with __', () => {
				const graphqlPointers = [{ kind: 'Field', name: { kind: 'Name', value: '__name' } }] as SelectionNode[];

				expect(getQuery({}, graphqlPointers, {}, accountability)).toStrictEqual({
					alias: {},
					fields: [],
					filter: undefined,
				});
			});

			it('formats the field to be "parent.child"', () => {
				const parentChildFields = [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'AValue' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [{ kind: 'Field', name: { kind: 'Name', value: 'Hello' } }],
						},
					},
				] as SelectionNode[];

				expect(getQuery({}, parentChildFields, {}, accountability)).toStrictEqual({
					alias: {},
					fields: ['AValue.Hello'],
					filter: undefined,
				});
			});

			it('if the field ends in "__func" it creates a function of the child field', () => {
				const funcFields = [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'date_func' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [{ kind: 'Field', name: { kind: 'Name', value: 'Hello' } }],
						},
					},
				] as SelectionNode[];

				expect(getQuery({}, funcFields, {}, accountability)).toStrictEqual({
					alias: {},
					fields: ['Hello(date)'],
					filter: undefined,
				});
			});

			it('if the field has arguments it adds them to the deep property.', () => {
				const funcFields = [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'parent' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'arg1' },
								value: { kind: 'StringValue', value: 'argumentValue' },
							},
						],
					},
				] as SelectionNode[];

				expect(getQuery({}, funcFields, {}, accountability)).toStrictEqual({
					alias: {},
					deep: { parent: {} },
					fields: ['parent'],
					filter: undefined,
				});
			});
		});
		describe('kind: InlineFragment', () => {
			const graphqlPointers = [
				{ kind: 'InlineFragment', typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: '__name' } } },
			] as SelectionNode[];

			it('removes fields starting with __', () => {
				expect(getQuery({}, graphqlPointers, {}, accountability)).toStrictEqual({
					alias: {},
					fields: [],
					filter: undefined,
				});
			});

			it('formats the field to be "parent:child"', () => {
				const parentChildFields = [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'AValue' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{
									kind: 'InlineFragment',
									typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Hello' } },
								},
							] as SelectionNode[],
						},
					},
				] as SelectionNode[];

				expect(getQuery({}, parentChildFields, {}, accountability)).toStrictEqual({
					alias: {},
					fields: ['AValue:Hello'],
					filter: undefined,
				});
			});

			it('if the field ends in "__func" it continues without pushing the field to fields: []', () => {
				const parentChildFields = [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'date_func' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{
									kind: 'InlineFragment',
									typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Hello' } },
								},
							] as SelectionNode[],
						},
					},
				] as SelectionNode[];

				expect(getQuery({}, parentChildFields, {}, accountability)).toStrictEqual({
					alias: {},
					fields: [],
					filter: undefined,
				});
			});
		});
	});
});
