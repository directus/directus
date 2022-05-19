import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_lt',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, '<', compareValue);
	},
});
