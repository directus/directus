import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nempty',
	apply: ({ query, selectionRaw, compareValue }) => {
		if (compareValue === true) {
			query.where(selectionRaw, '!=', '');
		} else {
			query.where(selectionRaw, '=', '');
		}
	},
});
