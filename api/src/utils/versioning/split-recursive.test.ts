import { splitRecursive } from './split-recursive.js';
import { expect, test } from 'vitest';

test('split with no default overwrites', () => {
	const input = {
		id: 1,
		name: 'Test',
		related: {
			id: 2,
			name: 'Related',
		},
	};

	const { rawDelta, defaultOverwrites } = splitRecursive(input);

	expect(rawDelta).toEqual(input);

	expect(defaultOverwrites).toEqual({
		_date: undefined,
		_user: undefined,
		related: { _date: undefined, _user: undefined },
	});
});

test('split with default overwrites', () => {
	const input = {
		id: 1,
		name: 'Test',
		_user: 'admin',
		related: {
			id: 2,
			name: 'Related',
			_date: '2023-01-01T00:00:00Z',
		},
	};

	const { rawDelta, defaultOverwrites } = splitRecursive(input);

	expect(rawDelta).toEqual({
		id: 1,
		name: 'Test',
		related: {
			id: 2,
			name: 'Related',
		},
	});

	expect(defaultOverwrites).toEqual({
		_user: 'admin',
		_date: undefined,
		related: { _date: '2023-01-01T00:00:00Z', _user: undefined },
	});
});

test('split with arrays and nested objects', () => {
	const input = {
		id: 1,
		name: 'Test',
		items: [
			{
				id: 2,
				value: 'Item 1',
				details: {
					info: 'Detail 1',
					_user: 'editor',
				},
			},
			{
				id: 3,
				value: 'Item 2',
			},
		],
	};

	const { rawDelta, defaultOverwrites } = splitRecursive(input);

	expect(rawDelta).toEqual({
		id: 1,
		name: 'Test',
		items: [
			{
				id: 2,
				value: 'Item 1',
				details: {
					info: 'Detail 1',
				},
			},
			{
				id: 3,
				value: 'Item 2',
			},
		],
	});

	expect(defaultOverwrites).toEqual({
		_user: undefined,
		_date: undefined,
		items: [
			{
				details: {
					_user: 'editor',
					_date: undefined,
				},
				_user: undefined,
				_date: undefined,
			},
			{
				_user: undefined,
				_date: undefined,
			},
		],
	});
});
