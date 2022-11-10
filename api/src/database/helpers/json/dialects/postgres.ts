import { Knex } from 'knex';
import { JsonHelperDefault } from './default';
import { JsonFieldNode } from '../../../../types';
import { getOperation } from '../../../../utils/apply-query';

export class JsonHelperPostgres extends JsonHelperDefault {
	static isSupported(version: string, _full = ''): boolean {
		if (version === '-') return false;
		const major = parseInt(version.split('.')[0]);
		// we're currently only supporting the 14+ version untill other exceptions have been added
		return major >= 14;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					const { dbType } = this.schema.collections[table].fields[node.name];
					const jsonPath = Object.keys(node.query).length === 0 ? node.jsonPath : this.buildFilterPath(node);
					return this.knex.raw(
						dbType === 'jsonb'
							? 'jsonb_path_query_array(??.??, ?) as ??'
							: 'jsonb_path_query_array(to_jsonb(??.??), ?) as ??',
						[table, node.name, jsonPath, node.fieldKey]
					);
				})
			)
			.from(table);
	}
	buildFilterPath(node: JsonFieldNode) {
		if (!node.query?.filter) return node.jsonPath;

		const conditions = [];
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			conditions.push(transformFilterJsonPath(jsonPath, filterOperator, filterValue));
		}

		return node.jsonPath + conditions.map((cond) => ` ? (${cond})`).join('');
	}
}

export function transformFilterJsonPath(jsonPath: string, filterOperator: string, filterValue: any): string {
	const path = '@' + (jsonPath[0] === '$' ? jsonPath.substring(1) : jsonPath);
	let value = JSON.stringify(filterValue),
		operator;
	switch (filterOperator) {
		case '_eq':
			operator = '==';
			break;
		case '_neq':
			operator = '!=';
			break;
		case '_gt':
			operator = '>';
			break;
		case '_gte':
			operator = '>=';
			break;
		case '_lt':
			operator = '<';
			break;
		case '_lte':
			operator = '<=';
			break;
		case '_ieq':
			operator = 'like_regex';
			value = `"^${filterValue}$" flag "i"`;
			break;
		case '_nieq':
			operator = '! like_regex';
			value = `"^${filterValue}$" flag "i"`;
			break;
		case '_contains':
			operator = 'like_regex';
			break;
		case '_ncontains':
			operator = '! like_regex';
			break;
		case '_icontains':
			operator = 'like_regex';
			value = value + ' flag "i"';
			break;
		case '_nicontains':
			operator = '! like_regex';
			value = value + ' flag "i"';
			break;
		case '_starts_with':
			operator = 'starts with';
			break;
		case '_nstarts_with':
			operator = '! starts with';
			break;
		case '_istarts_with':
			operator = 'like_regex';
			value = `"^${filterValue}" flag "i"`;
			break;
		case '_nistarts_with':
			operator = '! like_regex';
			value = `"^${filterValue}" flag "i"`;
			break;
		case '_ends_with':
			operator = 'like_regex';
			value = `"${filterValue}$"`;
			break;
		case '_nends_with':
			operator = '! like_regex';
			value = `"${filterValue}$"`;
			break;
		case '_iends_with':
			operator = 'like_regex';
			value = `"${filterValue}$" flag "i"`;
			break;
		case '_niends_with':
			operator = '! like_regex';
			value = `"${filterValue}$" flag "i"`;
			break;
		case '_in':
			return (filterValue as any[]).map((val) => transformFilterJsonPath(jsonPath, '_eq', val)).join(' && ');
		case '_nin':
			return (filterValue as any[]).map((val) => transformFilterJsonPath(jsonPath, '_neq', val)).join(' && ');
		case '_between': {
			const conditionA = transformFilterJsonPath(jsonPath, '_gt', filterValue[0]);
			const conditionB = transformFilterJsonPath(jsonPath, '_lt', filterValue[1]);
			return `${conditionA} && ${conditionB}`;
		}
		case '_nbetween': {
			const conditionA = transformFilterJsonPath(jsonPath, '_lt', filterValue[0]);
			const conditionB = transformFilterJsonPath(jsonPath, '_gt', filterValue[1]);
			return `${conditionA} || ${conditionB}`;
		}
	}
	return `${path} ${operator} ${value}`;
}
