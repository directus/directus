import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nnull',
	apply: ({ query, selectionRaw, compareValue }) => {
		if (compareValue === true) {
			query.whereNotNull(selectionRaw);
		} else {
			query.whereNull(selectionRaw);
		}
	},
});
