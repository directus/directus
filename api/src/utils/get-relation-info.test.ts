import { getRelationInfo } from './get-relation-info.js';
import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';

describe('getRelationInfo', () => {
	test('Error on suspiciously long implicit $FOLLOW', () => {
		expect(() =>
			getRelationInfo(
				[],
				'related_test_collection',
				'$FOLLOW(test_collection, test_field, aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)',
			),
		).toThrowError(Error);
	});

	test('Generate a new relation object for an implicit o2m relation', () => {
		const result = getRelationInfo([], 'related_test_collection', '$FOLLOW(test_collection, test_field)');

		expect(result).toEqual({
			relation: {
				collection: 'test_collection',
				field: 'test_field',
				related_collection: 'related_test_collection',
				schema: null,
				meta: null,
			},
			relationType: 'o2m',
		});
	});

	test('Generate a new relation object for an implicit o2a relation', () => {
		const result = getRelationInfo(
			[],
			'related_test_collection',
			'$FOLLOW(test_collection, test_field, test_collection_field)',
		);

		expect(result).toEqual({
			relation: {
				collection: 'test_collection',
				field: 'test_field',
				related_collection: 'related_test_collection',
				schema: null,
				meta: {
					one_collection_field: 'test_collection_field',
				},
			},
			relationType: 'o2a',
		});
	});

	test('Returns the correct existing relation for the given collection/field', () => {
		const schema = new SchemaBuilder()
			.collection('collection', (c) => {
				c.field('id').id();
				c.field('o2m').o2m('related_o2m_collection', 'related_o2m_field');
				c.field('m2o').m2o('related_m2o_collection', 'related_m2o_field');
				c.field('a2o').a2o(['related_a2o_collection1', 'related_a2o_collection2']);
			})
			.build();

		const o2mResult = getRelationInfo(schema.relations, 'collection', 'o2m');

		expect(o2mResult).toMatchInlineSnapshot(`
			{
			  "relation": {
			    "collection": "related_o2m_collection",
			    "field": "related_o2m_field",
			    "meta": {
			      "id": 0,
			      "junction_field": null,
			      "many_collection": "related_o2m_collection",
			      "many_field": "related_o2m_field",
			      "one_allowed_collections": null,
			      "one_collection": "collection",
			      "one_collection_field": null,
			      "one_deselect_action": "nullify",
			      "one_field": "o2m",
			      "sort_field": null,
			    },
			    "related_collection": "collection",
			    "schema": {
			      "column": "o2m",
			      "constraint_name": "collection_o2m_foreign",
			      "foreign_key_schema": "public",
			      "foreign_key_table": "related_o2m_collection",
			      "on_delete": "SET NULL",
			      "on_update": "NO ACTION",
			      "table": "collection",
			    },
			  },
			  "relationType": "o2m",
			}
		`);

		const m2oResult = getRelationInfo(schema.relations, 'collection', 'm2o');

		expect(m2oResult).toMatchInlineSnapshot(`
			{
			  "relation": {
			    "collection": "collection",
			    "field": "m2o",
			    "meta": {
			      "id": 0,
			      "junction_field": null,
			      "many_collection": "collection",
			      "many_field": "m2o",
			      "one_allowed_collections": null,
			      "one_collection": "related_m2o_collection",
			      "one_collection_field": null,
			      "one_deselect_action": "nullify",
			      "one_field": "related_m2o_field",
			      "sort_field": null,
			    },
			    "related_collection": "related_m2o_collection",
			    "schema": {
			      "column": "m2o",
			      "constraint_name": "collection_m2o_foreign",
			      "foreign_key_schema": "public",
			      "foreign_key_table": "related_m2o_collection",
			      "on_delete": "SET NULL",
			      "on_update": "NO ACTION",
			      "table": "collection",
			    },
			  },
			  "relationType": "m2o",
			}
		`);

		const a2oResult = getRelationInfo(schema.relations, 'collection', 'a2o');

		expect(a2oResult).toMatchInlineSnapshot(`
			{
			  "relation": {
			    "collection": "collection",
			    "field": "a2o",
			    "meta": {
			      "id": 0,
			      "junction_field": null,
			      "many_collection": "collection",
			      "many_field": "a2o",
			      "one_allowed_collections": [
			        "related_a2o_collection1",
			        "related_a2o_collection2",
			      ],
			      "one_collection": null,
			      "one_collection_field": "collection",
			      "one_deselect_action": "nullify",
			      "one_field": null,
			      "sort_field": null,
			    },
			    "related_collection": null,
			    "schema": null,
			  },
			  "relationType": "a2o",
			}
		`);

		const noResult = getRelationInfo(schema.relations, 'does not exist', 'wrong field');

		expect(noResult).toEqual({
			relation: null,
			relationType: null,
		});
	});
});
