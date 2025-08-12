import { expect, test } from 'vitest';
import type { FieldNode } from '../../types/ast.js';

/**
 * Test the synthetic field injection logic independently
 */
test('synthetic field injection logic', () => {
	// Simulate the children array with synthetic fields
	const children = [
		{ type: 'field', name: 'id' } as FieldNode,
		{ type: 'field', name: 'filename_download' } as FieldNode,
		{ type: 'field', name: '$thumbnail' } as FieldNode,
		{ type: 'field', name: '$custom' } as FieldNode,
	];

	// Extract synthetic fields (our logic from runAst)
	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	expect(syntheticFields).toEqual(['$thumbnail', '$custom']);

	// Test injection logic on array of items
	const itemsArray = [
		{ id: 1, filename_download: 'test.png' },
		{ id: 2, filename_download: 'test2.jpg' },
	];

	if (syntheticFields.length > 0 && itemsArray) {
		for (const item of itemsArray) {
			if (item && typeof item === 'object') {
				const missingFields: Record<string, null> = {};

				for (const fieldName of syntheticFields) {
					if (!(fieldName in item)) {
						missingFields[fieldName] = null;
					}
				}

				if (Object.keys(missingFields).length > 0) {
					Object.assign(item, missingFields);
				}
			}
		}
	}

	expect(itemsArray).toEqual([
		{ id: 1, filename_download: 'test.png', $thumbnail: null, $custom: null },
		{ id: 2, filename_download: 'test2.jpg', $thumbnail: null, $custom: null },
	]);
});

test('synthetic field injection - single item', () => {
	const children = [
		{ type: 'field', name: 'id' } as FieldNode,
		{ type: 'field', name: '$thumbnail' } as FieldNode,
	];

	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	let singleItem = { id: 1, filename_download: 'test.png' };
	const itemsArray = Array.isArray(singleItem) ? singleItem : [singleItem];

	if (syntheticFields.length > 0) {
		for (const item of itemsArray) {
			if (item && typeof item === 'object') {
				const missingFields: Record<string, null> = {};

				for (const fieldName of syntheticFields) {
					if (!(fieldName in item)) {
						missingFields[fieldName] = null;
					}
				}

				if (Object.keys(missingFields).length > 0) {
					Object.assign(item, missingFields);
				}
			}
		}
	}

	expect(singleItem).toEqual({ id: 1, filename_download: 'test.png', $thumbnail: null });
});

test('synthetic field injection - field already exists', () => {
	const children = [
		{ type: 'field', name: 'id' } as FieldNode,
		{ type: 'field', name: '$thumbnail' } as FieldNode,
	];

	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	const itemsArray = [{ id: 1, filename_download: 'test.png', $thumbnail: 'existing-value' }];

	if (syntheticFields.length > 0) {
		for (const item of itemsArray) {
			if (item && typeof item === 'object') {
				const missingFields: Record<string, null> = {};

				for (const fieldName of syntheticFields) {
					if (!(fieldName in item)) {
						missingFields[fieldName] = null;
					}
				}

				if (Object.keys(missingFields).length > 0) {
					Object.assign(item, missingFields);
				}
			}
		}
	}

	expect(itemsArray).toEqual([{ id: 1, filename_download: 'test.png', $thumbnail: 'existing-value' }]);
});

test('synthetic field injection - no synthetic fields', () => {
	const children = [
		{ type: 'field', name: 'id' } as FieldNode,
		{ type: 'field', name: 'filename_download' } as FieldNode,
	];

	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	expect(syntheticFields).toEqual([]);

	const itemsArray = [{ id: 1, filename_download: 'test.png' }];

	// No processing should occur when syntheticFields is empty
	if (syntheticFields.length > 0) {
		// This block shouldn't execute
		throw new Error('Should not execute when no synthetic fields');
	}

	expect(itemsArray).toEqual([{ id: 1, filename_download: 'test.png' }]);
});

test('synthetic field injection - empty items array', () => {
	const children = [
		{ type: 'field', name: '$thumbnail' } as FieldNode,
	];

	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	const itemsArray: any[] = [];

	if (syntheticFields.length > 0 && itemsArray) {
		for (const item of itemsArray) {
			// This loop shouldn't execute for empty array
			throw new Error('Should not execute for empty array');
		}
	}

	expect(itemsArray).toEqual([]);
});

test('synthetic field injection - null items', () => {
	const children = [
		{ type: 'field', name: '$thumbnail' } as FieldNode,
	];

	const syntheticFields = children
		.filter((child): child is FieldNode => child.type === 'field' && child.name.startsWith('$'))
		.map((child) => child.name);

	const items = null;

	if (syntheticFields.length > 0 && items) {
		// This block shouldn't execute when items is null
		throw new Error('Should not execute when items is null');
	}

	expect(items).toBeNull();
}); 