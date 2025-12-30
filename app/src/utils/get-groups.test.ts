import { getGroups } from '@/utils/get-groups';
import { expect, test } from 'vitest';

test('Returns correct groupings for given precision', () => {
	const testCases: ['year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second', string, string[]][] = [
		['year', 'date_created', ['year(date_created)']],
		['month', 'date_created', ['year(date_created)', 'month(date_created)']],
		['week', 'date_created', ['year(date_created)', 'month(date_created)', 'week(date_created)']],
		['day', 'date_created', ['year(date_created)', 'month(date_created)', 'day(date_created)']],
		['hour', 'date_created', ['year(date_created)', 'month(date_created)', 'day(date_created)', 'hour(date_created)']],
		[
			'minute',
			'date_created',
			['year(date_created)', 'month(date_created)', 'day(date_created)', 'hour(date_created)', 'minute(date_created)'],
		],
		[
			'second',
			'date_created',
			[
				'year(date_created)',
				'month(date_created)',
				'day(date_created)',
				'hour(date_created)',
				'minute(date_created)',
				'second(date_created)',
			],
		],
	];

	for (const [precision, dateField, output] of testCases) {
		expect(getGroups(precision, dateField)).toEqual(output);
	}
});

test('Defaults to hour if precision is undefined', () => {
	expect(getGroups(undefined, 'date_created')).toEqual([
		'year(date_created)',
		'month(date_created)',
		'day(date_created)',
		'hour(date_created)',
	]);
});
