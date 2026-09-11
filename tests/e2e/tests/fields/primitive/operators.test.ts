import { createDirectus, createItems, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Fields, Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

type Field = keyof Omit<Fields, 'id'> | 'hash';

/** The operator groups a field type supports, mirroring `getFilterOperatorsForType`. */
const COMPARISON = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'null', 'nnull', 'in', 'nin'];
const TEXT = ['contains', 'ncontains', 'icontains', 'starts_with', 'nstarts_with', 'istarts_with', 'nistarts_with', 'ends_with', 'nends_with', 'iends_with', 'niends_with', 'eq', 'neq', 'empty', 'nempty', 'null', 'nnull', 'in', 'nin']; // prettier-ignore
const EXISTENCE = ['empty', 'nempty', 'null', 'nnull'];
const EQUALITY = ['eq', 'neq', 'null', 'nnull', 'in', 'nin'];

const FIELDS: { field: Field; operators: string[]; low: unknown; high: unknown; generated?: boolean }[] = [
	{ field: 'string', operators: TEXT, low: 'aaa-alpha', high: 'bbb-beta' },
	{ field: 'text', operators: TEXT, low: 'aaa-alpha', high: 'bbb-beta' },
	// A hash is not readable back, so only its presence can be filtered on
	{ field: 'hash', operators: EXISTENCE, low: 'aaa-alpha', high: 'bbb-beta' },
	// `uuid` carries the `uuid` special, so the row left blank still gets a generated value
	{ field: 'uuid', operators: EQUALITY, low: crypto.randomUUID(), high: crypto.randomUUID(), generated: true },
	{ field: 'boolean', operators: ['eq', 'neq', 'null', 'nnull'], low: false, high: true },
	{ field: 'integer', operators: COMPARISON, low: 1, high: 2 },
	{ field: 'big_integer', operators: COMPARISON, low: 1000000000000, high: 2000000000000 },
	{ field: 'float', operators: COMPARISON, low: 1.5, high: 2.5 },
	{ field: 'decimal', operators: COMPARISON, low: 1.5, high: 2.5 },
	{ field: 'date', operators: COMPARISON, low: '2020-01-01', high: '2021-01-01' },
	{ field: 'time', operators: COMPARISON, low: '01:00:00', high: '02:00:00' },
	{ field: 'date_time', operators: COMPARISON, low: '2020-01-01T01:00:00', high: '2021-01-01T01:00:00' },
	{ field: 'timestamp', operators: COMPARISON, low: '2020-01-01T01:00:00Z', high: '2021-01-01T01:00:00Z' },
];

const [low, high, blank] = await api.request(
	createItems(collections.fields, [
		Object.fromEntries(FIELDS.map(({ field, low }) => [field, low])),
		Object.fromEntries(FIELDS.map(({ field, high }) => [field, high])),
		{},
	] as any),
);

const scope = [low!.id, high!.id, blank!.id];

/** Values as the database returned them, so that filters compare against normalized values. */
const stored = Object.fromEntries(
	FIELDS.map(({ field }) => [field, { low: (low as any)[field], high: (high as any)[field] }]),
) as Record<Field, { low: unknown; high: unknown }>;

async function matches(field: Field, condition: Record<string, unknown>) {
	const result = await api.request(
		readItems(collections.fields, {
			filter: { _and: [{ id: { _in: scope } }, { [field]: condition }] } as any,
			fields: ['id'],
			sort: ['id'],
		}),
	);

	return result.map((item) => item.id);
}

/** Every operator maps to the rows it must select out of [low, high, blank]. */
function expectation(field: Field, operator: string, generated = false) {
	const { low: l, high: h } = stored[field];

	// A generated field is never blank, so it falls on the "has a value" side of every check
	const others = generated ? [high!.id, blank!.id] : [high!.id];
	const blanks = generated ? [] : [blank!.id];
	const filled = generated ? [low!.id, high!.id, blank!.id] : [low!.id, high!.id];

	switch (operator) {
		case 'eq':
			return { condition: { _eq: l }, expected: [low!.id] };
		case 'neq':
			return { condition: { _neq: l }, expected: others };
		case 'lt':
			return { condition: { _lt: h }, expected: [low!.id] };
		case 'lte':
			return { condition: { _lte: l }, expected: [low!.id] };
		case 'gt':
			return { condition: { _gt: l }, expected: [high!.id] };
		case 'gte':
			return { condition: { _gte: h }, expected: [high!.id] };
		case 'between':
			return { condition: { _between: [l, h] }, expected: [low!.id, high!.id] };
		case 'nbetween':
			return { condition: { _nbetween: [l, h] }, expected: [] };
		case 'in':
			return { condition: { _in: [l] }, expected: [low!.id] };
		case 'nin':
			return { condition: { _nin: [l] }, expected: others };
		case 'null':
			return { condition: { _null: true }, expected: blanks };
		case 'nnull':
			return { condition: { _nnull: true }, expected: filled };
		case 'empty':
			return { condition: { _empty: true }, expected: blanks };
		case 'nempty':
			return { condition: { _nempty: true }, expected: filled };
		case 'contains':
			return { condition: { _contains: 'alpha' }, expected: [low!.id] };
		case 'ncontains':
			return { condition: { _ncontains: 'alpha' }, expected: [high!.id] };
		case 'icontains':
			return { condition: { _icontains: 'ALPHA' }, expected: [low!.id] };
		case 'starts_with':
			return { condition: { _starts_with: 'aaa' }, expected: [low!.id] };
		case 'nstarts_with':
			return { condition: { _nstarts_with: 'aaa' }, expected: [high!.id] };
		case 'istarts_with':
			return { condition: { _istarts_with: 'AAA' }, expected: [low!.id] };
		case 'nistarts_with':
			return { condition: { _nistarts_with: 'AAA' }, expected: [high!.id] };
		case 'ends_with':
			return { condition: { _ends_with: 'alpha' }, expected: [low!.id] };
		case 'nends_with':
			return { condition: { _nends_with: 'alpha' }, expected: [high!.id] };
		case 'iends_with':
			return { condition: { _iends_with: 'ALPHA' }, expected: [low!.id] };
		case 'niends_with':
			return { condition: { _niends_with: 'ALPHA' }, expected: [high!.id] };
		default:
			throw new Error(`No expectation defined for operator ${operator}`);
	}
}

for (const { field, operators, generated } of FIELDS) {
	for (const operator of operators) {
		test(`_${operator} on a ${field} field`, async () => {
			const { condition, expected } = expectation(field, operator, generated);

			expect(await matches(field, condition)).toEqual(expected);
		});
	}
}
