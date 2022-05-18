import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_intersects',
	apply: ({ helpers, query, selectionRaw, compareValue }) => {
		query.whereRaw(helpers.st.intersects(selectionRaw, compareValue));
	},
});
