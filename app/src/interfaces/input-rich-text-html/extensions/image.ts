import Image from '@tiptap/extension-image';

export const DirectusImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			loading: {
				default: null,
			},
		};
	},
});
