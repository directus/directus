import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nicontains',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereRaw(`LOWER(??) NOT LIKE ?`, [selectionRaw, `%${compareValue?.toLowerCase()}%`]);
	},
});
