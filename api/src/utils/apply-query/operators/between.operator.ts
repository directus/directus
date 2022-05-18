import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_between',
	apply: ({ query, selectionRaw, compareValue }) => {
		let value = compareValue;
		if (typeof value === 'string') value = value.split(',');
		if (!(value instanceof Array)) throw new Error('Invalid value for between operator');
		if (value.length !== 2) throw new Error('Expected two values for between operator');
		query.whereBetween(selectionRaw, value as [any, any]);
	},
});
