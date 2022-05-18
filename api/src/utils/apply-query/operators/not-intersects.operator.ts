import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nintersects',
	apply: ({ helpers, query, selectionRaw, compareValue }) => {
		query.whereRaw(helpers.st.nintersects(selectionRaw, compareValue));
	},
});
