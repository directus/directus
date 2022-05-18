import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_lte',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, '<=', compareValue);
	},
});
