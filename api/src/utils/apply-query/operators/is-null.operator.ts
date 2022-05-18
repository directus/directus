import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_null',
	apply: ({ query, selectionRaw, compareValue }) => {
		if (compareValue) {
			query.whereNull(selectionRaw);
		} else {
			query.whereNotNull(selectionRaw);
		}
	},
});
