import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_eq',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, '=', compareValue);
	},
});
