import { type AnyExtension, Mark, Node } from '@tiptap/vue-3';

/**
 * Parse/serialize fidelity extensions for semantic HTML tags the base schema doesn't model.
 * Without these, the tags are unwrapped or dropped on the first edit + save. No toolbar UI or
 * commands; only allowlisted attributes round-trip (`details[open]`, `abbr[title]`).
 */

/** Block container that wraps other block content (`<section>`, `<article>`, …). */
function blockContainer(name: string, tag: string, content = 'block+') {
	return Node.create({
		name,
		group: 'block',
		content,
		defining: true,

		parseHTML() {
			return [{ tag }];
		},

		renderHTML({ HTMLAttributes }) {
			return [tag, HTMLAttributes, 0];
		},
	});
}

/** Inline-content child node only valid inside its parent container (`<figcaption>`, `<dt>`, …). */
function inlineChild(name: string, tag: string) {
	return Node.create({
		name,
		content: 'inline*',
		defining: true,

		parseHTML() {
			return [{ tag }];
		},

		renderHTML({ HTMLAttributes }) {
			return [tag, HTMLAttributes, 0];
		},
	});
}

export const Section = blockContainer('section', 'section');

export const Article = blockContainer('article', 'article');

// `(block | figcaption)+` instead of the spec's caption-first-or-last so any authored order survives
export const Figure = blockContainer('figure', 'figure', '(block | figcaption)+');

export const Figcaption = inlineChild('figcaption', 'figcaption');

export const Details = Node.create({
	name: 'details',
	group: 'block',
	content: '(detailsSummary | block)+',
	defining: true,

	addAttributes() {
		return {
			open: {
				default: false,
				parseHTML: (element) => element.hasAttribute('open'),
				renderHTML: (attributes) => (attributes.open ? { open: '' } : {}),
			},
		};
	},

	parseHTML() {
		return [{ tag: 'details' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['details', HTMLAttributes, 0];
	},
});

export const DetailsSummary = inlineChild('detailsSummary', 'summary');

export const DescriptionList = blockContainer('descriptionList', 'dl', '(descriptionTerm | descriptionDetails)+');

export const DescriptionTerm = inlineChild('descriptionTerm', 'dt');

// block content (unlike `<dt>`) so multi-paragraph definitions keep their structure
export const DescriptionDetails = Node.create({
	name: 'descriptionDetails',
	content: 'block+',
	defining: true,

	parseHTML() {
		return [{ tag: 'dd' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['dd', HTMLAttributes, 0];
	},
});

export const Highlight = Mark.create({
	name: 'highlight',

	parseHTML() {
		return [{ tag: 'mark' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['mark', HTMLAttributes, 0];
	},
});

export const Abbreviation = Mark.create({
	name: 'abbreviation',

	addAttributes() {
		return {
			title: {
				default: null,
				parseHTML: (element) => element.getAttribute('title'),
				renderHTML: (attributes) => (attributes.title ? { title: attributes.title } : {}),
			},
		};
	},

	parseHTML() {
		return [{ tag: 'abbr' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['abbr', HTMLAttributes, 0];
	},
});

export const semanticHtml: AnyExtension[] = [
	Section,
	Article,
	Figure,
	Figcaption,
	Details,
	DetailsSummary,
	DescriptionList,
	DescriptionTerm,
	DescriptionDetails,
	Highlight,
	Abbreviation,
];
