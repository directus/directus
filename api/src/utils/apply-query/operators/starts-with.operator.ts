import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_starts_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, 'like', `${compareValue}%`);
	},
});
