import { getFilterPath } from './get-filter-path.js';
import { expect, test } from 'vitest';

test('path with empty object', () => {
	const result = getFilterPath('test', {});

	expect(result).toEqual(['test']);
});

test('path with flat object', () => {
	const result = getFilterPath('test', {
		layer2: 'Yo',
	});

	expect(result).toEqual(['test', 'layer2']);
});

test('path with _some', () => {
	const result = getFilterPath('test', {
		layer2: {
			_some: {
				layer3: 'Hi',
			},
		},
	});

	expect(result).toEqual(['test', 'layer2', '_some', 'layer3']);
});

test('path and _eq', () => {
	const result = getFilterPath('test', {
		layer2: {
			_eq: {
				layer3: 'Hi',
			},
		},
	});

	expect(result).toEqual(['test', 'layer2']);
});
