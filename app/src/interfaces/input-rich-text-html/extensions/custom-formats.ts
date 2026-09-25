import { type AnyExtension, Mark, mergeAttributes } from '@tiptap/vue-3';

/**
 * Legacy TinyMCE `customFormats` (`style_formats`) entries. `inline` becomes a dynamic mark;
 * `block`/`selector` become block formats applied as node attributes (no extension needed —
 * `preserved-attributes.ts` already round-trips them); `items` becomes a dropdown group. `wrapper`
 * and entries without a `classes`/`attributes` anchor are skipped with a warning.
 */
interface InlineFormatEntry {
	title: string;
	inline: string;
	classes?: string;
	styles?: Record<string, string>;
	attributes?: Record<string, string>;
}

interface BlockFormatEntry {
	title: string;
	/** tag to apply the format to, converting the block when the tag differs */
	block?: string;
	/** tag(s) to apply the format to without ever changing the block type */
	selector?: string;
	classes?: string;
	styles?: Record<string, string>;
	attributes?: Record<string, string>;
}

/** A node type a block format applies to. */
export interface BlockTarget {
	type: string;
	attrs?: Record<string, unknown>;
}

export interface InlineCustomFormat {
	kind: 'inline';
	name: string;
	title: string;
	/** inline styles applied to the dropdown item so it previews the format (TinyMCE parity) */
	previewStyle?: string;
}

export interface BlockCustomFormat {
	kind: 'block';
	name: string;
	title: string;
	previewStyle?: string;
	/** node types this format applies to; `block` entries have exactly one */
	targets: BlockTarget[];
	/** `block` entries convert a non-matching block to `targets[0]`; `selector` entries no-op */
	convert: boolean;
	classes: string[];
	attributes: Record<string, string>;
}

export interface GroupCustomFormat {
	kind: 'group';
	title: string;
	items: Array<InlineCustomFormat | BlockCustomFormat>;
}

export type CustomFormat = InlineCustomFormat | BlockCustomFormat | GroupCustomFormat;

export interface BuiltCustomFormats {
	extensions: AnyExtension[];
	formats: CustomFormat[];
	/** identifies the built schema; the generated mark names don't, they're positional */
	key: string;
}

/**
 * Every non-text node type the editor models, keyed by the tag a TinyMCE config names it with.
 * Tags absent here (`div`, `span`, …) can't carry a block format. `media` covers video/audio/iframe
 * as one node type, so the tag is pinned through its own attribute.
 */
const TAG_TARGETS: Record<string, BlockTarget> = {
	p: { type: 'paragraph' },
	pre: { type: 'codeBlock' },
	blockquote: { type: 'blockquote' },
	section: { type: 'section' },
	article: { type: 'article' },
	figure: { type: 'figure' },
	figcaption: { type: 'figcaption' },
	details: { type: 'details' },
	summary: { type: 'detailsSummary' },
	dl: { type: 'descriptionList' },
	dt: { type: 'descriptionTerm' },
	dd: { type: 'descriptionDetails' },
	hr: { type: 'horizontalRule' },
	img: { type: 'image' },
	ul: { type: 'bulletList' },
	ol: { type: 'orderedList' },
	li: { type: 'listItem' },
	table: { type: 'table' },
	tr: { type: 'tableRow' },
	td: { type: 'tableCell' },
	th: { type: 'tableHeader' },
	video: { type: 'media', attrs: { tag: 'video' } },
	audio: { type: 'media', attrs: { tag: 'audio' } },
	iframe: { type: 'media', attrs: { tag: 'iframe' } },
};

/** Block tags mapped to the node types the editor models. Anything else can't carry a format. */
function blockTarget(tag: string): BlockTarget | null {
	const name = tag.trim().toLowerCase();
	if (!/^[a-z][a-z0-9]*$/.test(name)) return null;

	const heading = /^h([1-6])$/.exec(name);
	if (heading) return { type: 'heading', attrs: { level: Number(heading[1]) } };

	return TAG_TARGETS[name] ?? null;
}

/**
 * The only node types a block format converts to. Both hold `inline*`, so re-typing one to the other
 * can never produce an invalid document; coercing into `blockquote`/`codeBlock` content models is
 * wrapper territory (out of scope), so those formats apply to already-matching blocks only.
 */
export const CONVERTIBLE_TYPES = new Set(['paragraph', 'heading']);

const PRESERVED_ATTRIBUTES = new Set(['id', 'title', 'role', 'lang', 'dir']);

/** Block formats can only carry attributes `preserved-attributes.ts` round-trips. */
function isPreservedAttribute(name: string): boolean {
	return PRESERVED_ATTRIBUTES.has(name) || name.startsWith('data-') || name.startsWith('aria-');
}

function warn(message: string, entry: unknown): void {
	// eslint-disable-next-line no-console
	console.warn(`[wysiwyg] ${message}`, entry);
}

/** `type: json` field meta may hand back an already-parsed array or a raw JSON string. */
function parseOption(raw: unknown): unknown[] {
	if (raw == null) return [];
	if (Array.isArray(raw)) return raw;

	if (typeof raw === 'string') {
		if (raw.trim() === '') return [];

		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			// fall through to the warning below
		}
	}

	warn('Could not parse the customFormats option (expected a JSON array of formats):', raw);
	return [];
}

function serializeStyles(styles: Record<string, string> | undefined): string | undefined {
	if (!styles) return undefined;
	const decls = Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`);
	return decls.length > 0 ? decls.join('; ') : undefined;
}

function classList(classes: string | undefined): string[] {
	return (classes ?? '').split(/\s+/).filter(Boolean);
}

/** A format needs a class or attribute anchor, or it can't be recognized again after a reload. */
function hasAnchor(entry: { classes?: string; attributes?: Record<string, string> }): boolean {
	return classList(entry.classes).length > 0 || Object.keys(entry.attributes ?? {}).length > 0;
}

/** What a block format ends up storing: `classes` merged with `attributes.class`, preserved attributes only. */
function blockAnchors(entry: BlockFormatEntry): {
	classes: string[];
	attributes: Record<string, string>;
	ignored: string[];
} {
	const attributes: Record<string, string> = {};
	const classes = classList(entry.classes);
	const ignored: string[] = [];

	for (const [attribute, value] of Object.entries(entry.attributes ?? {})) {
		// `attributes: { class }` is the same intent as `classes`; merge so toggling off strips it too
		if (attribute === 'class') classes.push(...classList(String(value)));
		else if (isPreservedAttribute(attribute)) attributes[attribute] = String(value);
		else ignored.push(attribute);
	}

	return { classes: [...new Set(classes)], attributes, ignored };
}

/** Static HTML attributes an inline format renders, derived from its config (not the parsed DOM). */
function formatAttributes(entry: InlineFormatEntry): Record<string, string> {
	const attrs: Record<string, string> = {};
	if (entry.classes) attrs['class'] = entry.classes;
	const style = serializeStyles(entry.styles);
	if (style) attrs['style'] = style;
	return { ...attrs, ...(entry.attributes ?? {}) };
}

/** A DOM element matches a format when it carries all of the format's configured classes. */
function matches(element: HTMLElement, entry: InlineFormatEntry): boolean {
	const wanted = classList(entry.classes);
	if (wanted.length > 0) return wanted.every((cls) => element.classList.contains(cls));
	// No class to key on: fall back to requiring every configured attribute so we don't grab plain tags.
	const attrs = Object.entries(entry.attributes ?? {});
	if (attrs.length > 0) return attrs.every(([key, value]) => element.getAttribute(key) === value);
	return false;
}

function buildMark(entry: InlineFormatEntry, name: string): AnyExtension {
	const attributes = formatAttributes(entry);

	return Mark.create({
		name,
		// win parse ordering over TextStyle so a stored format span is claimed by this mark
		priority: 200,
		parseHTML() {
			return [
				{
					tag: entry.inline,
					getAttrs: (element) => (matches(element as HTMLElement, entry) ? {} : false),
				},
			];
		},
		renderHTML({ HTMLAttributes }) {
			// preserved global attributes first (tiptap convention), then the format's static config;
			// the preserved `class` re-captures the format's own classes, so drop the duplicates
			const merged = mergeAttributes(HTMLAttributes, attributes);

			if (typeof merged['class'] === 'string') {
				merged['class'] = [...new Set(merged['class'].split(/\s+/).filter(Boolean))].join(' ');
			}

			return [entry.inline, merged, 0];
		},
	});
}

/** One built entry: a toolbar format plus the marks backing it (inline formats only). */
interface BuiltEntry {
	format: CustomFormat;
	extensions: AnyExtension[];
}

function buildInline(entry: InlineFormatEntry, name: string): BuiltEntry | null {
	if (!hasAnchor(entry)) {
		warn('customFormats entry skipped — `classes` or `attributes` is required:', entry);
		return null;
	}

	return {
		extensions: [buildMark(entry, name)],
		format: { kind: 'inline', name, title: entry.title, previewStyle: serializeStyles(entry.styles) },
	};
}

function buildBlock(entry: BlockFormatEntry, name: string): BuiltEntry | null {
	const convert = typeof entry.block === 'string';

	if (convert && entry.block!.includes(',')) {
		warn('customFormats entry skipped — `block` takes a single tag; use `selector` for a list of tags:', entry);
		return null;
	}

	// a `block` entry names the one tag it converts to; only `selector` takes a list
	const tags = convert ? [entry.block!] : entry.selector!.split(',');
	const targets: BlockTarget[] = [];

	for (const tag of tags) {
		const target = blockTarget(tag);

		if (!target) {
			// a `selector` list keeps its remaining tags; a single-tag `block` has nothing left to apply to
			warn(`customFormats: \`${tag.trim()}\` is not a block the editor models and was skipped:`, entry);
			continue;
		}

		targets.push(target);
	}

	if (targets.length === 0) {
		warn('customFormats entry skipped — none of its tags are blocks the editor models:', entry);
		return null;
	}

	// converting into these content models is wrapper work; apply to already-matching blocks instead
	const convertible = convert && CONVERTIBLE_TYPES.has(targets[0]!.type);

	if (convert && !convertible) {
		warn(
			`customFormats: \`block: '${entry.block}'\` cannot convert a block — the format applies only where the block already is a <${entry.block}>:`,
			entry,
		);
	}

	// anchors are checked on what actually lands on the node: unsupported attributes are dropped first,
	// so an entry anchored only on e.g. `style` would store nothing and could never read as active
	const { classes, attributes, ignored } = blockAnchors(entry);

	if (ignored.length > 0) {
		warn(`customFormats: attributes not stored on block nodes were ignored (${ignored.join(', ')}):`, entry);
	}

	if (classes.length === 0 && Object.keys(attributes).length === 0) {
		warn('customFormats entry skipped — `classes` or a preserved `attributes` entry is required:', entry);
		return null;
	}

	return {
		extensions: [],
		format: {
			kind: 'block',
			name,
			title: entry.title,
			previewStyle: serializeStyles(entry.styles),
			targets,
			convert: convertible,
			classes,
			attributes,
		},
	};
}

/** Builds one entry. `nested` entries are group children — they may not open another group. */
function buildEntry(raw: unknown, name: string, nested: boolean): BuiltEntry | null {
	if (typeof raw !== 'object' || raw === null || typeof (raw as Record<string, unknown>)['title'] !== 'string') {
		warn('Unsupported customFormats entry skipped:', raw);
		return null;
	}

	const entry = raw as Record<string, unknown>;

	if (Array.isArray(entry['items'])) {
		if (nested) {
			warn('customFormats group skipped — groups cannot be nested inside another group:', raw);
			return null;
		}

		return buildGroup(entry['title'] as string, entry['items'], name);
	}

	if (entry['wrapper']) {
		warn('Unsupported customFormats entry skipped (`wrapper` is not supported):', raw);
		return null;
	}

	if (typeof entry['inline'] === 'string') return buildInline(raw as InlineFormatEntry, name);

	if (typeof entry['block'] === 'string' || typeof entry['selector'] === 'string') {
		return buildBlock(raw as BlockFormatEntry, name);
	}

	warn('Unsupported customFormats entry skipped (needs `inline`, `block`, `selector` or `items`):', raw);
	return null;
}

function buildGroup(title: string, items: unknown[], name: string): BuiltEntry | null {
	const children: Array<InlineCustomFormat | BlockCustomFormat> = [];
	const extensions: AnyExtension[] = [];

	items.forEach((item, index) => {
		const built = buildEntry(item, `${name}_${index}`, true);
		if (!built || built.format.kind === 'group') return;
		children.push(built.format);
		extensions.push(...built.extensions);
	});

	if (children.length === 0) return null;

	return { extensions, format: { kind: 'group', title, items: children } };
}

/** Turns the stored option into the toolbar's format list plus any marks it needs; no field-meta migration. */
export function buildCustomFormats(raw: unknown): BuiltCustomFormats {
	const extensions: AnyExtension[] = [];
	const formats: CustomFormat[] = [];
	const parsed = parseOption(raw);

	parsed.forEach((entry, index) => {
		const built = buildEntry(entry, `customFormat_${index}`, false);
		if (!built) return;
		formats.push(built.format);
		extensions.push(...built.extensions);
	});

	// positional mark names don't identify the schema; the parsed config does. Only dynamic marks
	// (inline formats) alter the round-trip schema, so a config with none keys as the base schema.
	return { extensions, formats, key: extensions.length > 0 ? JSON.stringify(parsed) : '' };
}
