import { type AnyExtension, type Attributes, Extension } from '@tiptap/core';
import { TableCell, TableHeader, TableKit } from '@tiptap/extension-table';
import { TABLE_OPTIONS } from './table';

interface LegacyAttributeRule {
	type: string;
	names: readonly string[];
	tag?: string;
}

const CELL_ATTRIBUTES = ['align', 'valign', 'bgcolor', 'width', 'height', 'nowrap', 'scope', 'abbr', 'headers'];

const RULES: readonly LegacyAttributeRule[] = [
	{
		type: 'media',
		tag: 'iframe',
		names: ['frameborder', 'allow', 'allowfullscreen', 'scrolling', 'marginwidth', 'marginheight'],
	},
	{
		type: 'table',
		names: ['border', 'cellpadding', 'cellspacing', 'width', 'height', 'align', 'bgcolor', 'summary', 'frame', 'rules'],
	},
	{ type: 'tableRow', names: ['align', 'valign', 'bgcolor', 'height'] },
	{ type: 'tableCell', names: CELL_ATTRIBUTES },
	{ type: 'tableHeader', names: CELL_ATTRIBUTES },
];

function legacyAttribute({ names, tag }: LegacyAttributeRule) {
	const kept = new Set(names);
	const keptEntries = (entries: [string, string][]) => entries.filter(([name]) => kept.has(name));

	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			if (tag && element.localName !== tag) return null;
			const entries = keptEntries(Array.from(element.attributes, ({ name, value }) => [name, value]));
			return entries.length > 0 ? Object.fromEntries(entries) : null;
		},
		// re-check tag and names so programmatically set attrs can't smuggle arbitrary ones
		renderHTML: (attributes: Record<string, unknown>) => {
			const record = attributes['legacyAttributes'] as Record<string, string> | null;
			if (!record || (tag && attributes['tag'] !== tag)) return {};
			return Object.fromEntries(keptEntries(Object.entries(record)));
		},
	};
}

/** Keeps the presentational iframe and table attributes of legacy TinyMCE content, in source order. */
const LegacyAttributes = Extension.create({
	name: 'legacyAttributes',

	addGlobalAttributes() {
		return RULES.map((rule) => ({
			types: [rule.type],
			attributes: { legacyAttributes: legacyAttribute(rule) },
		}));
	},
});

function styleAlign(element: HTMLElement): 'left' | 'right' | 'center' | null {
	const align = element.style.textAlign.trim().toLowerCase();
	return align === 'left' || align === 'right' || align === 'center' ? align : null;
}

// TableKit falls back to the `align` attribute and writes it back as `text-align`, which drops the attribute
function withStyleOnlyAlign(cell: typeof TableCell) {
	return cell.extend({
		addAttributes() {
			const parent: Attributes = this.parent?.() ?? {};
			return { ...parent, align: { ...parent['align'], parseHTML: styleAlign } };
		},
	});
}

// replaces the base `Table` kit by extension name
const StyleAlignTable = [
	TableKit.configure({ table: TABLE_OPTIONS, tableCell: false, tableHeader: false }),
	withStyleOnlyAlign(TableCell),
	withStyleOnlyAlign(TableHeader),
];

export function buildLegacyAttributeSchema(keep: unknown): { extensions: AnyExtension[]; key: string } {
	if (keep !== true) return { extensions: [], key: '' };

	return { extensions: [LegacyAttributes, ...StyleAlignTable], key: 'legacy-attributes' };
}
