import { describe, expect, test } from 'vitest';
import { mergeVersionSaves, mergeVersionsRaw } from './merge-version-saves.js';
import type { SchemaOverview } from '@directus/types';

describe('content versioning mergeVersionsRaw', () => {
	test('No versions available', () => {
		const result = mergeVersionsRaw(
			{ "test_field": "value" },
			[]
		);

		expect(result).toMatchObject({ "test_field": "value" });
	});

	test('Basic field versions', () => {
		const result = mergeVersionsRaw(
			{ "test_field": "value", "edited_field": "original" },
			[
				{ "edited_field": "updated" },
				{ "test_field": null },
			]
		);

		expect(result).toMatchObject({
			"test_field": null,
			"edited_field": "updated",
		});
	});

	test('Relational field versions', () => {
		const result = mergeVersionsRaw(
			{ "test_field": "value", "relation": null },
			[
				{ "relation": { "create": [ { "test": "value " }], "update": [], "delete": [] } },
			]
		);

		expect(result).toMatchObject({
			"test_field": "value",
			"relation": {
				"create": [ { "test": "value " }],
				"update": [],
				"delete": [],
			},
		});
	});
});

describe('content versioning mergeVersionSaves', () => {
	const testSchema: SchemaOverview = {
		collections: {
			"test_a": {
				"collection": "test_a",
				"primary": "id",
				"singleton": false,
				"note": null,
				"sortField": null,
				"accountability": "all",
				"fields": {
				  "id": {
					"field": "id",
					"defaultValue": "AUTO_INCREMENT",
					"nullable": false,
					"generated": false,
					"type": "integer",
					"dbType": "integer",
					"precision": null,
					"scale": null,
					"special": [],
					"note": null,
					"alias": false,
					"validation": null
				  },
				  "status": {
					"field": "status",
					"defaultValue": "draft",
					"nullable": false,
					"generated": false,
					"type": "string",
					"dbType": "character varying",
					"precision": null,
					"scale": null,
					"special": [],
					"note": null,
					"alias": false,
					"validation": null
				  },
				  "sort": {
					"field": "sort",
					"defaultValue": null,
					"nullable": true,
					"generated": false,
					"type": "integer",
					"dbType": "integer",
					"precision": null,
					"scale": null,
					"special": [],
					"note": null,
					"alias": false,
					"validation": null
				  },
				  "m2o": {
					"field": "m2o",
					"defaultValue": null,
					"nullable": true,
					"generated": false,
					"type": "integer",
					"dbType": "integer",
					"precision": null,
					"scale": null,
					"special": [
					  "m2o"
					],
					"note": null,
					"alias": false,
					"validation": null
				  },
				  "translations": {
					"field": "translations",
					"defaultValue": null,
					"nullable": true,
					"generated": false,
					"type": "alias",
					"dbType": null,
					"precision": null,
					"scale": null,
					"special": [
					  "translations"
					],
					"note": null,
					"alias": true,
					"validation": null
				  },
				  "o2m": {
					"field": "o2m",
					"defaultValue": null,
					"nullable": true,
					"generated": false,
					"type": "alias",
					"dbType": null,
					"precision": null,
					"scale": null,
					"special": [
					  "o2m"
					],
					"note": null,
					"alias": true,
					"validation": null
				  }
				}
			  }
		},
		"relations": [],
	}

	test('No versions available', () => {
		const result = mergeVersionSaves(
			{ "status": "draft" },
			[],
			'test_a',
			testSchema
		);

		expect(result).toMatchObject({ "status": "draft" });
	});

	describe('m2o field', () => {

	});

	describe('o2m field', () => {

	});

	describe('m2m field', () => {

	});

	describe('m2a field', () => {

	});

	describe('nested relations', () => {

	});
});
