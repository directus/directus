import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nends_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereNot(selectionRaw, 'like', `%${compareValue}`);
	},
});
