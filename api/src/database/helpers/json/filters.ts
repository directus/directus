import { Knex } from 'knex';

export function applyJsonFilterQuery(
	dbQuery: Knex.QueryBuilder,
	selection: string,
	operator: string,
	compareValue: any,
	logical: 'and' | 'or' = 'and'
) {
	if (operator === '_eq') {
		dbQuery[logical].where(selection, '=', compareValue);
	}

	if (operator === '_neq') {
		dbQuery[logical].whereNot(selection, compareValue);
	}

	if (operator === '_ieq') {
		dbQuery[logical].whereRaw(`LOWER(??) = ?`, [selection, `${compareValue.toLowerCase()}`]);
	}

	if (operator === '_nieq') {
		dbQuery[logical].whereRaw(`LOWER(??) <> ?`, [selection, `${compareValue.toLowerCase()}`]);
	}

	if (operator === '_contains') {
		dbQuery[logical].where(selection, 'like', `%${compareValue}%`);
	}

	if (operator === '_ncontains') {
		dbQuery[logical].whereNot(selection, 'like', `%${compareValue}%`);
	}

	if (operator === '_icontains') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selection, `%${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_nicontains') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selection, `%${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_starts_with') {
		dbQuery[logical].where(selection, 'like', `${compareValue}%`);
	}

	if (operator === '_nstarts_with') {
		dbQuery[logical].whereNot(selection, 'like', `${compareValue}%`);
	}

	if (operator === '_istarts_with') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selection, `${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_nistarts_with') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selection, `${compareValue.toLowerCase()}%`]);
	}

	if (operator === '_ends_with') {
		dbQuery[logical].where(selection, 'like', `%${compareValue}`);
	}

	if (operator === '_nends_with') {
		dbQuery[logical].whereNot(selection, 'like', `%${compareValue}`);
	}

	if (operator === '_iends_with') {
		dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selection, `%${compareValue.toLowerCase()}`]);
	}

	if (operator === '_niends_with') {
		dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selection, `%${compareValue.toLowerCase()}`]);
	}

	if (operator === '_gt') {
		dbQuery[logical].where(selection, '>', compareValue);
	}

	if (operator === '_gte') {
		dbQuery[logical].where(selection, '>=', compareValue);
	}

	if (operator === '_lt') {
		dbQuery[logical].where(selection, '<', compareValue);
	}

	if (operator === '_lte') {
		dbQuery[logical].where(selection, '<=', compareValue);
	}

	if (operator === '_in') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		dbQuery[logical].whereIn(selection, value as string[]);
	}

	if (operator === '_nin') {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		dbQuery[logical].whereNotIn(selection, value as string[]);
	}

	if (operator === '_between') {
		if (compareValue.length !== 2) return;

		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		dbQuery[logical].whereBetween(selection, value);
	}

	if (operator === '_nbetween') {
		if (compareValue.length !== 2) return;

		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');

		dbQuery[logical].whereNotBetween(selection, value);
	}
}
