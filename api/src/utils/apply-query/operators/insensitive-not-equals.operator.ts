import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nieq',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereRaw(`LOWER(??) != ?`, [selectionRaw, `${compareValue?.toLowerCase()}`]);
	},
});
