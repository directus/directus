import type { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { buildSchema } from 'graphql';
import { describe, expect, test } from 'vitest';
import {
	buildField,
	buildFragmentDefinition,
	buildFragmentSpread,
	buildInlineFragment,
	buildResolveInfo,
} from '../../../test-utils/graphql.js';
import { buildSelections } from './build-selections.js';

// The GraphQL schema as get-types.ts generates it for a collection with an M2A field: `Page.contents`
// is a junction whose `item` resolves to a union of the allowed collections
const gqlSchema = buildSchema(`
	type Inner { id: ID, label: String }
	union component_text_items_item_union = Inner
	type component_text_items { id: ID, item: component_text_items_item_union }
	type ComponentText { id: ID, text: String, items: [component_text_items] }
	type ComponentImage { id: ID, src: String }
	union page_content_item_union = ComponentText | ComponentImage
	type page_content { id: ID, item: page_content_item_union }
	type author { id: ID, name: String }
	type count_functions { count: Int }
	type Page_aggregated_count { id: Int }
	type Page_aggregated { group: String, count: Page_aggregated_count }
	type Page {
		id: ID
		title: String
		author: author
		contents: [page_content]
		contents_func: count_functions
	}
	type Query { Page: [Page], Page_aggregated: [Page_aggregated] }
`);

const buildInfo = (selections: SelectionNode[], fragments?: Record<string, FragmentDefinitionNode>) =>
	buildResolveInfo({
		selections,
		...(fragments && { fragments }),
		schema: gqlSchema,
		returnType: gqlSchema.getQueryType()!.getFields()['Page']!.type,
	});

/** `... { children }`, the one fragment shape that carries no type condition */
const inlineFragmentWithoutCondition = (children: SelectionNode[]) =>
	({ kind: 'InlineFragment', selectionSet: { kind: 'SelectionSet', selections: children } }) as SelectionNode;

// `contents { item { … } }`, the path to an m2a item
const buildContentItem = (children: SelectionNode[]) => [
	buildField('contents', { children: [buildField('item', { children })] }),
];

type SelectionCase = {
	name: string;
	selections: SelectionNode[];
	fragments?: Record<string, FragmentDefinitionNode>;
	expected: SelectionNode[];
};

/** Selections without a fragment in them, which have to come back exactly as they went in */
const passthroughCases: SelectionCase[] = [
	{
		name: 'leaves plain scalar selections untouched',
		selections: [buildField('id'), buildField('title')],
		expected: [buildField('id'), buildField('title')],
	},
	{
		name: 'leaves a plain relational selection untouched',
		selections: [buildField('contents', { children: [buildField('id')] })],
		expected: [buildField('contents', { children: [buildField('id')] })],
	},
	{
		name: 'leaves aliases and arguments on a plain selection untouched',
		selections: [
			buildField('title', { alias: 'renamed' }),
			buildField('contents', { args: [], children: [buildField('id')] }),
		],
		expected: [
			buildField('title', { alias: 'renamed' }),
			buildField('contents', { args: [], children: [buildField('id')] }),
		],
	},
	{
		name: 'leaves an m2a member selection written inline untouched',
		selections: buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
		expected: buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
	},
];

/** Fragments that carry no collection, so only what they hold survives */
const inliningCases: SelectionCase[] = [
	{
		name: 'inlines a fragment spread on the collection type',
		selections: [buildFragmentSpread('Fields')],
		fragments: { Fields: buildFragmentDefinition('Fields', 'Page', [buildField('id'), buildField('title')]) },
		expected: [buildField('id'), buildField('title')],
	},
	{
		name: 'inlines nested fragment spreads',
		selections: [buildFragmentSpread('Outer')],
		fragments: {
			Outer: buildFragmentDefinition('Outer', 'Page', [buildField('id'), buildFragmentSpread('Inner')]),
			Inner: buildFragmentDefinition('Inner', 'Page', [buildField('title')]),
		},
		expected: [buildField('id'), buildField('title')],
	},
	{
		name: 'preserves aliases and arguments while inlining',
		selections: [buildFragmentSpread('Fields')],
		fragments: {
			Fields: buildFragmentDefinition('Fields', 'Page', [
				buildField('title', { alias: 'renamed' }),
				buildField('contents', { args: [], children: [buildField('id')] }),
			]),
		},
		expected: [
			buildField('title', { alias: 'renamed' }),
			buildField('contents', { args: [], children: [buildField('id')] }),
		],
	},
	{
		name: 'inlines a fragment spread inside a relational field',
		selections: [buildField('contents', { children: [buildFragmentSpread('Content')] })],
		fragments: { Content: buildFragmentDefinition('Content', 'page_content', [buildField('id')]) },
		expected: [buildField('contents', { children: [buildField('id')] })],
	},
	{
		name: 'inlines an inline fragment carrying no type condition',
		selections: [inlineFragmentWithoutCondition([buildField('id'), buildField('title')])],
		expected: [buildField('id'), buildField('title')],
	},
	{
		name: 'repeats the selections when the same fragment is spread twice',
		selections: [buildFragmentSpread('Fields'), buildFragmentSpread('Fields')],
		fragments: { Fields: buildFragmentDefinition('Fields', 'Page', [buildField('title')]) },
		expected: [buildField('title'), buildField('title')],
	},
	{
		name: 'inlines a fragment inside a function selection set',
		selections: [buildField('contents_func', { children: [buildFragmentSpread('Counted')] })],
		fragments: { Counted: buildFragmentDefinition('Counted', 'count_functions', [buildField('count')]) },
		expected: [buildField('contents_func', { children: [buildField('count')] })],
	},
];

/** Type conditions around an m2a union, where they name the collection to read */
const unionCases: SelectionCase[] = [
	{
		name: 'keeps the type condition of a fragment on an m2a union member',
		selections: buildContentItem([buildFragmentSpread('Text')]),
		fragments: { Text: buildFragmentDefinition('Text', 'ComponentText', [buildField('text')]) },
		expected: buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
	},
	{
		name: 'drops the type condition of a fragment on the m2a union itself',
		selections: buildContentItem([buildFragmentSpread('AnyBlock')]),
		fragments: {
			AnyBlock: buildFragmentDefinition('AnyBlock', 'page_content_item_union', [
				buildInlineFragment('ComponentText', [buildField('text')]),
			]),
		},
		expected: buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
	},
	{
		name: 'drops an inline fragment written on the m2a union itself',
		selections: buildContentItem([
			buildInlineFragment('page_content_item_union', [buildInlineFragment('ComponentText', [buildField('text')])]),
		]),
		expected: buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
	},
	{
		name: 'keeps every member of a multi-type union fragment',
		selections: buildContentItem([buildFragmentSpread('AnyBlock')]),
		fragments: {
			AnyBlock: buildFragmentDefinition('AnyBlock', 'page_content_item_union', [
				buildInlineFragment('ComponentText', [buildField('text')]),
				buildInlineFragment('ComponentImage', [buildField('id')]),
			]),
		},
		expected: buildContentItem([
			buildInlineFragment('ComponentText', [buildField('text')]),
			buildInlineFragment('ComponentImage', [buildField('id')]),
		]),
	},
	{
		name: 'keeps the condition of a union nested inside a union member',
		selections: buildContentItem([buildFragmentSpread('Text')]),
		fragments: {
			Text: buildFragmentDefinition('Text', 'ComponentText', [
				buildField('items', { children: [buildField('item', { children: [buildFragmentSpread('Inner')] })] }),
			]),
			Inner: buildFragmentDefinition('Inner', 'Inner', [buildField('label')]),
		},
		expected: buildContentItem([
			buildInlineFragment('ComponentText', [
				buildField('items', {
					children: [buildField('item', { children: [buildInlineFragment('Inner', [buildField('label')])] })],
				}),
			]),
		]),
	},
	{
		name: 'keeps the condition where the same fragment narrows, and drops it where it does not',
		selections: [
			...buildContentItem([buildFragmentSpread('Text')]),
			buildField('contents', {
				children: [
					buildField('item', {
						children: [buildInlineFragment('ComponentText', [buildFragmentSpread('Text')])],
					}),
				],
			}),
		],
		fragments: { Text: buildFragmentDefinition('Text', 'ComponentText', [buildField('text')]) },
		expected: [
			...buildContentItem([buildInlineFragment('ComponentText', [buildField('text')])]),
			buildField('contents', {
				children: [
					buildField('item', {
						children: [buildInlineFragment('ComponentText', [buildField('text')])],
					}),
				],
			}),
		],
	},
];

describe('buildSelections', () => {
	test.each(passthroughCases)('$name', ({ selections, fragments, expected }) => {
		expect(buildSelections(buildInfo(selections, fragments))).toEqual(expected);
	});

	test.each(inliningCases)('$name', ({ selections, fragments, expected }) => {
		expect(buildSelections(buildInfo(selections, fragments))).toEqual(expected);
	});

	test.each(unionCases)('$name', ({ selections, fragments, expected }) => {
		expect(buildSelections(buildInfo(selections, fragments))).toEqual(expected);
	});

	test('does not mutate the incoming selections', () => {
		const selections = buildContentItem([buildFragmentSpread('Text')]);
		const fragments = { Text: buildFragmentDefinition('Text', 'ComponentText', [buildField('text')]) };
		const before = structuredClone(selections);

		buildSelections(buildInfo(selections, fragments));

		expect(selections).toEqual(before);
	});

	test('returns null when the field has no selections', () => {
		expect(buildSelections({ fieldNodes: [{}], fragments: {}, schema: gqlSchema } as any)).toBeNull();
	});

	test('returns null when every merged field node lacks a selection set', () => {
		expect(buildSelections({ fieldNodes: [{}, {}], fragments: {}, schema: gqlSchema } as any)).toBeNull();
	});
});

describe('buildSelections with merged field nodes (#28133)', () => {
	const pageReturnType = gqlSchema.getQueryType()!.getFields()['Page']!.type;

	// graphql-js merges same-name fields from separate fragments into a single
	// resolver call and passes every AST node for the field in fieldNodes:
	//   fragment A on Query { page { id } }
	//   fragment B on Query { page { title } }
	// reaches the page resolver as TWO field nodes. Reading only the first
	// dropped everything the later fragments selected (#28133).
	test('merges fragment-spread selections from every merged field node', () => {
		const info = buildResolveInfo({
			selections: [],
			fieldNodes: [
				buildField('Page', { children: [buildFragmentSpread('A')] }),
				buildField('Page', { children: [buildFragmentSpread('B')] }),
			],
			fragments: {
				A: buildFragmentDefinition('A', 'Page', [buildField('id')]),
				B: buildFragmentDefinition('B', 'Page', [buildField('title')]),
			},
			schema: gqlSchema,
			returnType: pageReturnType,
		});

		expect(buildSelections(info)).toEqual([buildField('id'), buildField('title')]);
	});

	test('merges plain and fragment selections from different field nodes', () => {
		const info = buildResolveInfo({
			selections: [],
			fieldNodes: [
				buildField('Page', { children: [buildField('id')] }),
				buildField('Page', { children: [buildFragmentSpread('B')] }),
			],
			fragments: {
				B: buildFragmentDefinition('B', 'Page', [buildField('title')]),
			},
			schema: gqlSchema,
			returnType: pageReturnType,
		});

		expect(buildSelections(info)).toEqual([buildField('id'), buildField('title')]);
	});

	test('survives a merged field node that carries no selection set', () => {
		const info = buildResolveInfo({
			selections: [],
			fieldNodes: [
				buildField('Page', { children: [buildField('id')] }),
				{ kind: 'Field', name: { kind: 'Name', value: 'Page' } } as any,
			],
			fragments: {},
			schema: gqlSchema,
			returnType: pageReturnType,
		});

		expect(buildSelections(info)).toEqual([buildField('id')]);
	});
});
