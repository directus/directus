import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_gt',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, '>', compareValue);
	},
});
