import { Mark } from '@tiptap/vue-3';

/** A `<label>` outside a `<form>`, kept as a mark so its text stays editable and a control inside it keeps its label. */
export const FormLabel = Mark.create({
	name: 'formLabel',
	// Above link (1000) so the label stays the outer mark and is not split by bold, italic or a link inside it.
	priority: 1100,
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
