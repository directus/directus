import { type AnyExtension, Mark, mergeAttributes } from '@tiptap/vue-3';

/**
 * Legacy TinyMCE `customFormats` (`style_formats`) entry. Only inline formats are supported — each
 * becomes a dynamic mark; block/selector/wrapper/`items` shapes and entries without a
 * `classes`/`attributes` anchor are skipped with a warning.
 */
interface CustomFormatEntry {
	title: string;
	inline: string;
	classes?: string;
	styles?: Record<string, string>;
	attributes?: Record<string, string>;
}

export interface CustomFormat {
	name: string;
	title: string;
	/** inline styles applied to the dropdown item so it previews the format (TinyMCE parity) */
	previewStyle?: string;
}

export interface BuiltCustomFormats {
	extensions: AnyExtension[];
	formats: CustomFormat[];
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

	// eslint-disable-next-line no-console
	console.warn('[wysiwyg] Could not parse the customFormats option (expected a JSON array of formats):', raw);
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
		renderHTML() {
			return [entry.inline, mergeAttributes(attributes), 0];
		},
	});
}

/** Turns the stored option into dynamic marks plus the toolbar's format list; no field-meta migration. */
export function buildCustomFormats(raw: unknown): BuiltCustomFormats {
	const extensions: AnyExtension[] = [];
	const formats: CustomFormat[] = [];

	parseOption(raw).forEach((entry, index) => {
		if (!isSupported(entry)) {
			// eslint-disable-next-line no-console
			console.warn('[wysiwyg] Unsupported customFormats entry skipped (inline formats only):', entry);
			return;
		}

		// no class/attribute anchor → the mark can't be recognized on reload, so reject upfront
		const hasAnchor = Boolean(entry.classes?.trim()) || Object.keys(entry.attributes ?? {}).length > 0;

		if (!hasAnchor) {
			// eslint-disable-next-line no-console
			console.warn('[wysiwyg] customFormats entry skipped — `classes` or `attributes` is required:', entry);
			return;
		}

		const name = `customFormat_${index}`;
		extensions.push(buildMark(entry, name));
		formats.push({ name, title: entry.title, previewStyle: serializeStyles(entry.styles) });
	});

	return { extensions, formats };
}
