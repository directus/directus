import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_iends_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereRaw(`LOWER(??) LIKE ?`, [selectionRaw, `%${compareValue?.toLowerCase()}`]);
	},
});
