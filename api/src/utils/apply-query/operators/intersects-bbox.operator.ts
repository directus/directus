import { registerOperator } from './operator-register';

export default registerOperator({
	operator: '_intersects_bbox',
	apply: ({ helpers, query, selectionRaw, compareValue }) => {
		query.whereRaw(helpers.st.intersects_bbox(selectionRaw, compareValue));
	},
});
