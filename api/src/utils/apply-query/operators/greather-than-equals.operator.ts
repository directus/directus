import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_gte',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, '>=', compareValue);
	},
});
