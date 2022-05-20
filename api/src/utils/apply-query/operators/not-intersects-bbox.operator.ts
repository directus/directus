import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_nintersects_bbox',
	apply: ({ helpers, query, selectionRaw, compareValue }) => {
		query.whereRaw(helpers.st.nintersects_bbox(selectionRaw, compareValue));
	},
});
