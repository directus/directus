import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nin',
	apply: ({ query, selectionRaw, compareValue }) => {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');
		if (!(value instanceof Array)) throw new Error('Invalid value for in operator');
		query.whereNotIn(selectionRaw, value as string[]);
	},
});
