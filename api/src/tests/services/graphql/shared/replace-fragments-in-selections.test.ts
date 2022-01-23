import { FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode, SelectionNode } from 'graphql';
import { cloneDeep } from 'lodash';
import { replaceFragmentsInSelections } from '../../../../services/graphql/shared/replace-fragments-in-selections';

describe('replaceFragmentsInSelections', () => {
	const fragmentSpread = {
		kind: 'FragmentSpread',
		name: { kind: 'Name', value: 'Spread' },
		directives: [{ kind: 'Directive', name: { kind: 'Name', value: 'directive' } }],
	} as FragmentSpreadNode;
	const inlineFragment = {
		kind: 'InlineFragment',
		typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'TheFirstInlineFragment' } },
	} as InlineFragmentNode;

	const fragment = {
		string: {
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'Fragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Hello' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [inlineFragment] as SelectionNode[],
			},
		},
	} as Record<string, FragmentDefinitionNode>;

	const parentChildFields = [
		{
			kind: 'Field',
			name: { kind: 'Name', value: 'date' },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					fragment,
					{
						kind: 'InlineFragment',
						typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WowAUniqueInlineFragment' } },
					},
				] as SelectionNode[],
			},
		},
	] as SelectionNode[];

	const result = [
		{
			kind: 'Field',
			name: { kind: 'Name', value: 'date' },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{
						string: {
							kind: 'FragmentDefinition',
							name: {
								kind: 'Name',
								value: 'Fragment',
							},
							selectionSet: {
								kind: 'SelectionSet',
								selections: [
									{
										kind: 'InlineFragment',
										typeCondition: {
											kind: 'NamedType',
											name: {
												kind: 'Name',
												value: 'TheFirstInlineFragment',
											},
										},
									},
								],
							},
							typeCondition: {
								kind: 'NamedType',
								name: {
									kind: 'Name',
									value: 'Hello',
								},
							},
						},
					},
					{
						kind: 'InlineFragment',
						typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WowAUniqueInlineFragment' } },
					},
				],
			},
		},
	] as any;

	it('Replace all fragments in a selectionset for the actual selection set as defined in the fragment', () => {
		expect(replaceFragmentsInSelections(parentChildFields, fragment)).toStrictEqual(result);
	});
});
