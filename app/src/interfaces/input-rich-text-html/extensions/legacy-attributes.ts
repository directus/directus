import { type AnyExtension, Extension } from '@tiptap/core';
import { StyleAlignTable } from './table';

const CELL_ATTRIBUTES = ['align', 'valign', 'bgcolor', 'width', 'height', 'nowrap', 'scope', 'abbr', 'headers'];

/** The HTML attributes kept per node type. `media` is the iframe, video and audio node. */
export const LEGACY_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
	media: ['frameborder', 'allow', 'allowfullscreen', 'scrolling', 'marginwidth', 'marginheight'],
	table: ['border', 'cellpadding', 'cellspacing', 'width', 'height', 'align', 'bgcolor', 'summary', 'frame', 'rules'],
	tableRow: ['align', 'valign', 'bgcolor', 'height'],
	tableCell: CELL_ATTRIBUTES,
	tableHeader: CELL_ATTRIBUTES,
};

function legacyAttribute(names: readonly string[]) {
	const kept = new Set(names);
	const keptEntries = (entries: [string, string][]) => entries.filter(([name]) => kept.has(name));

	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const entries = keptEntries(Array.from(element.attributes, ({ name, value }) => [name, value]));
			return entries.length > 0 ? Object.fromEntries(entries) : null;
		},
		// re-check the names so programmatically set attrs can't smuggle arbitrary ones
		renderHTML: (attributes: Record<string, unknown>) => {
			const record = attributes['legacyAttributes'] as Record<string, string> | null;
			return record ? Object.fromEntries(keptEntries(Object.entries(record))) : {};
		},
	};
}

/** Keeps the presentational iframe and table attributes of legacy TinyMCE content, in source order. */
const LegacyAttributes = Extension.create({
	name: 'legacyAttributes',

	addGlobalAttributes() {
		return Object.entries(LEGACY_ATTRIBUTES).map(([type, names]) => ({
			types: [type],
			attributes: { legacyAttributes: legacyAttribute(names) },
		}));
	},
});

export function buildLegacyAttributeSchema(keep: unknown): { extensions: AnyExtension[]; key: string } {
	if (keep !== true) return { extensions: [], key: '' };

	return { extensions: [LegacyAttributes, ...StyleAlignTable], key: 'legacy-attributes' };
}
