import { Image } from '@tiptap/extension-image';

/**
 * Image node extended with a `loading` attribute so the drawer's lazy-loading option and any
 * legacy `loading="lazy"` markup survive parse → serialize. The base node only models
 * src/alt/title/width/height and would otherwise strip `loading`.
 */
export const CustomImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			loading: {
				default: null,
				parseHTML: (element) => element.getAttribute('loading'),
				renderHTML: (attributes) => (attributes.loading ? { loading: attributes.loading } : {}),
			},
		};
	},
});
