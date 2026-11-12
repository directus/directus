import { Mark } from '@tiptap/vue-3';

/** A `<label>` outside a `<form>`, kept as a mark so its text stays editable and a control inside it keeps its label. */
export const FormLabel = Mark.create({
	name: 'formLabel',
	inclusive: false,

	addAttributes() {
		return {
			for: {
				default: null,
				parseHTML: (element) => element.getAttribute('for'),
				renderHTML: (attributes) => (attributes['for'] ? { for: attributes['for'] } : {}),
			},
			form: {
				default: null,
				parseHTML: (element) => element.getAttribute('form'),
				renderHTML: (attributes) => (attributes['form'] ? { form: attributes['form'] } : {}),
			},
		};
	},

	parseHTML() {
		return [{ tag: 'label' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['label', HTMLAttributes, 0];
	},
});
