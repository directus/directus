import type { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { describe, expect, test } from 'vite-plus/test';
import { replaceFragmentsInSelections } from './replace-fragments.js';

describe('replaceFragmentsInSelections', () => {
	test('returns null for undefined selections', () => {
		expect(replaceFragmentsInSelections(undefined, {})).toBeNull();
	});

	test('passes through regular fields unchanged', () => {
		const selections = [
			{ kind: 'Field', name: { value: 'id' } },
			{ kind: 'Field', name: { value: 'title' } },
		] as unknown as SelectionNode[];

		const result = replaceFragmentsInSelections(selections, {});
		expect(result).toHaveLength(2);
		expect((result![0] as any).name.value).toBe('id');
		expect((result![1] as any).name.value).toBe('title');
	});

	test('wraps FragmentSpread in InlineFragment preserving typeCondition', () => {
		const selections = [{ kind: 'FragmentSpread', name: { value: 'MyFragment' } }] as unknown as SelectionNode[];

		const fragments = {
			MyFragment: {
				kind: 'FragmentDefinition',
				name: { value: 'MyFragment' },
				typeCondition: { kind: 'NamedType', name: { value: 'Page' } },
				selectionSet: {
					kind: 'SelectionSet',
					selections: [
						{ kind: 'Field', name: { value: 'id' } },
						{ kind: 'Field', name: { value: 'title' } },
					] as unknown as SelectionNode[],
				},
			},
		} as unknown as Record<string, FragmentDefinitionNode>;

		const result = replaceFragmentsInSelections(selections, fragments);

		// Should produce a single InlineFragment
		expect(result).toHaveLength(1);
		expect((result![0] as any).kind).toBe('InlineFragment');
		expect((result![0] as any).typeCondition.name.value).toBe('Page');

		// Should contain the original fields
		const innerSelections = (result![0] as any).selectionSet.selections;
		expect(innerSelections).toHaveLength(2);
		expect(innerSelections[0].name.value).toBe('id');
		expect(innerSelections[1].name.value).toBe('title');
	});

	test('passes through InlineFragment with typeCondition (M2A inline)', () => {
		const selections = [
			{
				kind: 'InlineFragment',
				typeCondition: { kind: 'NamedType', name: { value: 'ComponentText' } },
				selectionSet: {
					kind: 'SelectionSet',
					selections: [{ kind: 'Field', name: { value: 'id' } }],
				},
			},
		] as unknown as SelectionNode[];

		const result = replaceFragmentsInSelections(selections, {});
		expect(result).toHaveLength(1);
		expect((result![0] as any).kind).toBe('InlineFragment');
		expect((result![0] as any).typeCondition.name.value).toBe('ComponentText');
	});

	test('named fragment in M2A context preserves typeCondition as InlineFragment', () => {
		const itemSelections = [{ kind: 'FragmentSpread', name: { value: 'ComponentText' } }] as unknown as SelectionNode[];

		const fragments = {
			ComponentText: {
				kind: 'FragmentDefinition',
				name: { value: 'ComponentText' },
				typeCondition: { kind: 'NamedType', name: { value: 'ComponentText' } },
				selectionSet: {
					kind: 'SelectionSet',
					selections: [
						{ kind: 'Field', name: { value: 'id' } },
						{
							kind: 'Field',
							name: { value: 'translations' },
							arguments: [
								{
									kind: 'Argument',
									name: { value: 'filter' },
									value: { kind: 'ObjectValue', fields: [] },
								},
							],
							selectionSet: {
								kind: 'SelectionSet',
								selections: [{ kind: 'Field', name: { value: 'id' } }] as unknown as SelectionNode[],
							},
						},
					] as unknown as SelectionNode[],
				},
			},
		} as unknown as Record<string, FragmentDefinitionNode>;

		const result = replaceFragmentsInSelections(itemSelections, fragments);

		expect(result).toHaveLength(1);
		expect((result![0] as any).kind).toBe('InlineFragment');
		expect((result![0] as any).typeCondition.name.value).toBe('ComponentText');

		// check arguments preserved
		const innerSelections = (result![0] as any).selectionSet.selections;
		expect(innerSelections).toHaveLength(2);
		expect(innerSelections[0].name.value).toBe('id');
		expect(innerSelections[1].name.value).toBe('translations');
		expect(innerSelections[1].arguments).toHaveLength(1);
	});

	test('handles nested fragments (fragment referencing another fragment)', () => {
		const selections = [{ kind: 'FragmentSpread', name: { value: 'Outer' } }] as unknown as SelectionNode[];

		const fragments = {
			Outer: {
				kind: 'FragmentDefinition',
				name: { value: 'Outer' },
				typeCondition: { kind: 'NamedType', name: { value: 'Page' } },
				selectionSet: {
					kind: 'SelectionSet',
					selections: [
						{ kind: 'Field', name: { value: 'id' } },
						{ kind: 'FragmentSpread', name: { value: 'Inner' } },
					] as unknown as SelectionNode[],
				},
			},
			Inner: {
				kind: 'FragmentDefinition',
				name: { value: 'Inner' },
				typeCondition: { kind: 'NamedType', name: { value: 'Author' } },
				selectionSet: {
					kind: 'SelectionSet',
					selections: [{ kind: 'Field', name: { value: 'name' } }] as unknown as SelectionNode[],
				},
			},
		} as unknown as Record<string, FragmentDefinitionNode>;

		const result = replaceFragmentsInSelections(selections, fragments);

		expect(result).toHaveLength(1);
		expect((result![0] as any).kind).toBe('InlineFragment');
		expect((result![0] as any).typeCondition.name.value).toBe('Page');

		const innerSelections = (result![0] as any).selectionSet.selections;
		expect(innerSelections).toHaveLength(2);
		expect(innerSelections[0].name.value).toBe('id');
		expect(innerSelections[1].kind).toBe('InlineFragment');
		expect(innerSelections[1].typeCondition.name.value).toBe('Author');
	});
});
