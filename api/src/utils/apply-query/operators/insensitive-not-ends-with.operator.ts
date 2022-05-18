import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_niends_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereRaw(`LOWER(??) NOT LIKE ?`, [selectionRaw, `%${compareValue?.toLowerCase()}`]);
	},
});
