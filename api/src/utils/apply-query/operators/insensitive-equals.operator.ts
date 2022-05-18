import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_ieq',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereRaw(`LOWER(??) = ?`, [selectionRaw, `${compareValue?.toLowerCase()}`]);
	},
});
