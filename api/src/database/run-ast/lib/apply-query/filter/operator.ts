import { InvalidQueryError } from '@directus/errors';
import type { FieldFunction, SchemaOverview } from '@directus/types';
import { getOutputTypeForFunction } from '@directus/utils';
import type { Knex } from 'knex';
import { parseJsonPath } from '../../../../helpers/fn/json/parse-function.js';
import type { Helpers } from '../../../../helpers/index.js';
import { getFunctions, getHelpers } from '../../../../helpers/index.js';
import { getColumn } from '../../../utils/get-column.js';
import { getOperation } from '../get-operation.js';

function castToNumber(value: any): any {
	if (Array.isArray(value)) {
		return value.map((val) => {
			const num = Number(val);
			if (Number.isNaN(num)) throw new InvalidQueryError({ reason: `Invalid numeric value` });
			return num;
		});
	}

	const num = Number(value);
	if (Number.isNaN(num)) throw new InvalidQueryError({ reason: `Invalid numeric value` });
	return num;
}

/**
 * Splits "table.column" into ["table", "column"], respecting dots inside parentheses.
 * Handles keys like "table.json(col,path.with.dots)" correctly.
 */
function splitTableColumn(key: string): [string, string] {
	let depth = 0;

	for (let i = 0; i < key.length; i++) {
		if (key[i] === '(') depth++;
		else if (key[i] === ')') depth--;
		else if (key[i] === '.' && depth === 0) {
			return [key.substring(0, i), key.substring(i + 1)];
		}
	}

	return ['', key];
}

export function applyOperator(
	knex: Knex,
	dbQuery: Knex.QueryBuilder,
	schema: SchemaOverview,
	key: string,
	operator: string,
	compareValue: any,
	logical: 'and' | 'or' = 'and',
	originalCollectionName?: string,
) {
	const helpers = getHelpers(knex);
	const [table, column] = splitTableColumn(key);

	if (operator === '_json') {
		const entries = Object.entries(compareValue as Record<string, unknown>);
		if (!entries.length) return;

		// Multiple path conditions in one _json object are ANDed together
		dbQuery[logical].andWhere((group) => {
			for (const [jsonPath, innerFilter] of entries) {
				const normalizedPath = parseJsonPath(jsonPath);

				const innerValue = (innerFilter as Record<string, unknown>)[Object.keys(innerFilter as object)[0]!];

				const castNumeric =
					typeof innerValue === 'number' ||
					(Array.isArray(innerValue) && innerValue.length > 0 && typeof innerValue[0] === 'number');

				const jsonExtractionRaw = getFunctions(knex, schema).json(table!, column!, {
					type: 'json',
					jsonPath: normalizedPath,
					originalCollectionName,
					relationalCountOptions: undefined,
					jsonFilter: true,
					castNumeric,
				});

				const innerOp = getOperation(
					Object.keys(innerFilter as object)[0]!,
					Object.values(innerFilter as object)[0],
				);

				if (!innerOp) continue;

				applyOperatorToRaw(group, helpers, jsonExtractionRaw, innerOp.operator, innerOp.value, 'and');
			}
		});

		return;
	}

	// Is processed through Knex.Raw, so should be safe to string-inject into these where queries
	const selectionRaw = getColumn(knex, table!, column!, false, schema, { originalCollectionName }) as any;

	// Knex supports "raw" in the columnName parameter, but isn't typed as such. Too bad..
	// See https://github.com/knex/knex/issues/4518 @TODO remove as any once knex is updated

	// These operators don't rely on a value, and can thus be used without one (eg `?filter[field][_null]`)
	if (
		(operator === '_null' && compareValue !== false) ||
		(operator === '_nnull' && compareValue === false) ||
		(operator === '_eq' && compareValue === null)
	) {
		dbQuery[logical].whereNull(selectionRaw);
		return;
	}

	if (
		(operator === '_nnull' && compareValue !== false) ||
		(operator === '_null' && compareValue === false) ||
		(operator === '_neq' && compareValue === null)
	) {
		dbQuery[logical].whereNotNull(selectionRaw);
		return;
	}

	if ((operator === '_empty' && compareValue !== false) || (operator === '_nempty' && compareValue === false)) {
		dbQuery[logical].andWhere((query) => {
			query.whereNull(selectionRaw).orWhere(selectionRaw, '=', '');
		});
	}

	if ((operator === '_nempty' && compareValue !== false) || (operator === '_empty' && compareValue === false)) {
		dbQuery[logical].andWhere((query) => {
			query.whereNotNull(selectionRaw).andWhere(selectionRaw, '!=', '');
		});
	}

	// The following fields however, require a value to be run. If no value is passed, we
	// ignore them. This allows easier use in GraphQL, where you wouldn't be able to
	// conditionally build out your filter structure (#4471)
	if (compareValue === undefined) return;

	if (Array.isArray(compareValue)) {
		// Tip: when using a `[Type]` type in GraphQL, but don't provide the variable, it'll be
		// reported as [undefined].
		// We need to remove any undefined values, as they are useless
		compareValue = compareValue.filter((val) => val !== undefined);
	}

	// Cast filter value (compareValue) based on function used
	if (column!.includes('(') && column!.includes(')')) {
		const functionName = column!.split('(')[0] as FieldFunction;
		const type = getOutputTypeForFunction(functionName);

		if (['integer', 'float', 'decimal'].includes(type)) {
			compareValue = castToNumber(compareValue);
		}
	}

	// Cast filter value (compareValue) based on type of field being filtered against
	const [collection, field] = splitTableColumn(key);
	const mappedCollection = (originalCollectionName || collection)!;

	if (mappedCollection! in schema.collections && field! in schema.collections[mappedCollection]!.fields) {
		const type = schema.collections[mappedCollection]!.fields[field!]!.type;

		if (['date', 'dateTime', 'time', 'timestamp'].includes(type)) {
			if (Array.isArray(compareValue)) {
				compareValue = compareValue.map((val) => helpers.date.parse(val));
			} else {
				compareValue = helpers.date.parse(compareValue);
			}
		}

		if (['integer', 'float', 'decimal'].includes(type)) {
			compareValue = castToNumber(compareValue);
		}
	}

	applyOperatorToRaw(dbQuery, helpers, selectionRaw, operator, compareValue, logical, key);
}

function applyOperatorToRaw(
	dbQuery: Knex.QueryBuilder,
	helpers: Helpers,
	raw: any,
	operator: string,
	compareValue: any,
	logical: 'and' | 'or',
	key?: string,
) {
	// These operators don't rely on a value, and can thus be used without one (eg `?filter[field][_null]`)
	if (
		(operator === '_null' && compareValue !== false) ||
		(operator === '_nnull' && compareValue === false) ||
		(operator === '_eq' && compareValue === null)
	) {
		dbQuery[logical].whereNull(raw);
		return;
	}

	if (
		(operator === '_nnull' && compareValue !== false) ||
		(operator === '_null' && compareValue === false) ||
		(operator === '_neq' && compareValue === null)
	) {
		dbQuery[logical].whereNotNull(raw);
		return;
	}

	if ((operator === '_empty' && compareValue !== false) || (operator === '_nempty' && compareValue === false)) {
		dbQuery[logical].andWhere((query) => {
			query.whereNull(raw).orWhere(raw, '=', '');
		});
	}

	if ((operator === '_nempty' && compareValue !== false) || (operator === '_empty' && compareValue === false)) {
		dbQuery[logical].andWhere((query) => {
			query.whereNotNull(raw).andWhere(raw, '!=', '');
		});
	}

	// The following fields however, require a value to be run. If no value is passed, we
	// ignore them. This allows easier use in GraphQL, where you wouldn't be able to
	// conditionally build out your filter structure (#4471)
	if (compareValue === undefined) return;

	if (Array.isArray(compareValue)) {
		// Tip: when using a `[Type]` type in GraphQL, but don't provide the variable, it'll be
		// reported as [undefined].
		// We need to remove any undefined values, as they are useless
		compareValue = compareValue.filter((val) => val !== undefined);
	}

	if (operator === '_eq') {
		dbQuery[logical].where(raw, '=', compareValue);
	}

	if (operator === '_neq') {
		dbQuery[logical].whereNot(raw, compareValue);
	}

	if (operator === '_ieq') {
		dbQuery[logical].whereRaw(`LOWER(??) = ?`, [raw, `${compareValue.toLowerCase()}`]);
	}

	if (operator === '_nieq') {
		dbQuery[logical].whereRaw(`LOWER(??) <> ?`, [raw, `${compareValue.toLowerCase()}`]);
	}

	if (operator === '_contains') {
		dbQuery[logical].where(raw, 'like', `%${compareValue}%`);
	}

	if (operator === '_ncontains') {
		dbQuery[logical].whereNot(raw, 'like', `%${compareValue}%`);
	}

	if (operator === '_icontains') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [raw, `%${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_nicontains') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [raw, `%${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_starts_with') {
		dbQuery[logical].where(raw, 'like', `${compareValue}%`);
	}

	if (operator === '_nstarts_with') {
		dbQuery[logical].whereNot(raw, 'like', `${compareValue}%`);
	}

	if (operator === '_istarts_with') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [raw, `${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_nistarts_with') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [raw, `${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_ends_with') {
		dbQuery[logical].where(raw, 'like', `%${compareValue}`);
	}

	if (operator === '_nends_with') {
		dbQuery[logical].whereNot(raw, 'like', `%${compareValue}`);
	}

	if (operator === '_iends_with') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [raw, `%${compareValue.toLowerCase()}`]);
	}

	if (operator === '_niends_with') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [raw, `%${compareValue.toLowerCase()}`]);
	}

	if (operator === '_gt') {
		dbQuery[logical].where(raw, '>', compareValue);
	}

	if (operator === '_gte') {
		dbQuery[logical].where(raw, '>=', compareValue);
	}

	if (operator === '_lt') {
		dbQuery[logical].where(raw, '<', compareValue);
	}

	if (operator === '_lte') {
		dbQuery[logical].where(raw, '<=', compareValue);
	}

	if (operator === '_in') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		if ((value as any[]).length === 0) {
			// Knex's whereIn(col, []) short-circuits to `1 = 0` before touching the column,
			// so passing the Raw here is safe and preserves that behaviour.
			dbQuery[logical].whereIn(raw, []);
		} else {
			// Use whereRaw with ?? to avoid a Knex binding-order bug: whereIn() evaluates
			// the value list before the column expression, so when the column is a Raw with
			// its own bindings (e.g. a JSON path extraction), the bindings end up in the
			// wrong positions. Using ?? ensures column bindings are resolved first.
			const placeholders = (value as any[]).map(() => '?').join(', ');
			dbQuery[logical].whereRaw(`?? in (${placeholders})`, [raw, ...(value as any[])]);
		}
	}

	if (operator === '_nin') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		if ((value as any[]).length === 0) {
			// Same reasoning as _in above — Knex short-circuits to `1 = 1` for empty NOT IN.
			dbQuery[logical].whereNotIn(raw, []);
		} else {
			// Same Knex binding-order workaround as _in above.
			const placeholders = (value as any[]).map(() => '?').join(', ');
			dbQuery[logical].whereRaw(`?? not in (${placeholders})`, [raw, ...(value as any[])]);
		}
	}

	if (operator === '_between') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		if (value.length !== 2) return;

		dbQuery[logical].whereBetween(raw, value);
	}

	if (operator === '_nbetween') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		if (value.length !== 2) return;

		dbQuery[logical].whereNotBetween(raw, value);
	}

	if (operator == '_intersects') {
		dbQuery[logical].whereRaw(helpers.st.intersects(key!, compareValue));
	}

	if (operator == '_nintersects') {
		dbQuery[logical].whereRaw(helpers.st.nintersects(key!, compareValue));
	}

	if (operator == '_intersects_bbox') {
		dbQuery[logical].whereRaw(helpers.st.intersects_bbox(key!, compareValue));
	}

	if (operator == '_nintersects_bbox') {
		dbQuery[logical].whereRaw(helpers.st.nintersects_bbox(key!, compareValue));
	}
}
