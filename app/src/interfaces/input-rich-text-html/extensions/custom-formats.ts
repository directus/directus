import { type AnyExtension, Mark, mergeAttributes } from '@tiptap/vue-3';

/**
 * Legacy TinyMCE `customFormats` (a.k.a. `style_formats`) entry. Only inline formats are supported
 * on Tiptap — each becomes a dynamic mark. Block-level shapes (`block`, `selector`, `wrapper`, or a
 * missing `inline` tag) and nested `items` groups are unsupported and skipped with a warning; they
 * are recorded limitations, not silent failures.
 */
interface CustomFormatEntry {
	title: string;
	inline: string;
	classes?: string;
	styles?: Record<string, string>;
	attributes?: Record<string, string>;
}

export interface CustomFormat {
	/** Generated mark name, used for `toggleMark`/`isActive`. */
	name: string;
	/** Human label shown in the toolbar dropdown. */
	title: string;
	/** Serialized inline styles, applied to the dropdown item so it previews the format (TinyMCE parity). */
	previewStyle?: string;
}

export interface BuiltCustomFormats {
	extensions: AnyExtension[];
	formats: CustomFormat[];
}

/** `type: json` field meta may hand back an already-parsed array or a raw JSON string. */
function parseOption(raw: unknown): unknown[] {
	if (Array.isArray(raw)) return raw;

	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	return [];
}

function isSupported(entry: unknown): entry is CustomFormatEntry {
	if (typeof entry !== 'object' || entry === null) return false;
	const e = entry as Record<string, unknown>;
	// inline formats only: needs a title and an inline tag, and must not be a block/selector/wrapper shape
	if (typeof e['title'] !== 'string' || typeof e['inline'] !== 'string') return false;
	if ('block' in e || 'selector' in e || 'wrapper' in e || 'items' in e) return false;
	return true;
}

function serializeStyles(styles: Record<string, string> | undefined): string | undefined {
	if (!styles) return undefined;
	const decls = Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`);
	return decls.length > 0 ? decls.join('; ') : undefined;
}

/** Static HTML attributes a format renders, derived from its config (not from the parsed DOM). */
function formatAttributes(entry: CustomFormatEntry): Record<string, string> {
	const attrs: Record<string, string> = {};
	if (entry.classes) attrs['class'] = entry.classes;
	const style = serializeStyles(entry.styles);
	if (style) attrs['style'] = style;
	return { ...attrs, ...(entry.attributes ?? {}) };
}

/** A DOM element matches a format when it carries all of the format's configured classes. */
function matches(element: HTMLElement, entry: CustomFormatEntry): boolean {
	const wanted = (entry.classes ?? '').split(/\s+/).filter(Boolean);
	if (wanted.length > 0) return wanted.every((cls) => element.classList.contains(cls));
	// No class to key on: fall back to requiring every configured attribute so we don't grab plain tags.
	const attrs = Object.entries(entry.attributes ?? {});
	if (attrs.length > 0) return attrs.every(([key, value]) => element.getAttribute(key) === value);
	return false;
}

function buildMark(entry: CustomFormatEntry, name: string): AnyExtension {
	const attributes = formatAttributes(entry);

	return Mark.create({
		name,
		// win parse ordering over TextStyle, and stop TextStyle from also capturing overlapping
		// inline styles (color/font-size) on the same span — keeps the format a single element.
		priority: 200,
		excludes: 'textStyle',
		parseHTML() {
			return [
				{
					tag: entry.inline,
					getAttrs: (element) => (matches(element as HTMLElement, entry) ? {} : false),
				},
			];
		},
		renderHTML() {
			return [entry.inline, mergeAttributes(attributes), 0];
		},
	});
}

/**
 * Turn the stored `customFormats` option into a set of dynamic marks plus the toolbar's format list.
 * Existing option values keep working as-is — no field-meta migration.
 */
export function buildCustomFormats(raw: unknown): BuiltCustomFormats {
	const extensions: AnyExtension[] = [];
	const formats: CustomFormat[] = [];

	parseOption(raw).forEach((entry, index) => {
		if (!isSupported(entry)) {
			// eslint-disable-next-line no-console
			console.warn('[wysiwyg] Unsupported customFormats entry skipped (inline formats only):', entry);
			return;
		}

		const name = `customFormat_${index}`;
		extensions.push(buildMark(entry, name));
		formats.push({ name, title: entry.title, previewStyle: serializeStyles(entry.styles) });
	});

	return { extensions, formats };
}
