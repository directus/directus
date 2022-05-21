import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_neq',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.whereNot(selectionRaw, compareValue);
	},
});
