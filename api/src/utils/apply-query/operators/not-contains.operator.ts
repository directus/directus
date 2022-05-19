import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_ncontains',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereNot(selectionRaw, 'like', `%${compareValue}%`);
	},
});
