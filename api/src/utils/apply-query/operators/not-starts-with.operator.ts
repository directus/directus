import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nstarts_with',
	apply: ({ query, selectionRaw, compareValue }) => {
		query.where(selectionRaw, 'like', `${compareValue}%`);
	},
});
