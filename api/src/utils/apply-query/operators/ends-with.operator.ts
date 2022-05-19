import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_ends_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, 'like', `%${compareValue}`);
	},
});
