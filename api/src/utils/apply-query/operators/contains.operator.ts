import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_contains',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, 'like', `%${compareValue}%`);
	},
});
