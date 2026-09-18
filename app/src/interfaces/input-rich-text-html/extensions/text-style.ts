import { TextStyle as BaseTextStyle, TextStyleKit } from '@tiptap/extension-text-style';
import type { TagParseRule } from '@tiptap/pm/model';
import type { AnyExtension } from '@tiptap/vue-3';
import { COMPARISON_DIFF_CLASS_PREFIX } from './comparison-diff';
import { hasPreservedAttributes } from './preserved-attributes';

// style props the TextStyleKit below models; a span styled with anything else would parse to an
// empty mark that renders `<span>` and gets unwrapped on the next load, so the value never settles
const TEXT_STYLE_PROPERTIES = ['color', 'font-family', 'font-size', 'background-color'];

function hasTextStyleProperty(element: HTMLElement): boolean {
	return TEXT_STYLE_PROPERTIES.some((property) => element.style.getPropertyValue(property));
}

// customFormats marks (priority 200) still consume their spans first; comparison diff spans stay
// unclaimed so normal editing keeps stripping them
const PreservingTextStyle = BaseTextStyle.extend({
	parseHTML() {
		const [styledSpan] = (this.parent?.() ?? []) as TagParseRule[];

		const styledSpanRule: TagParseRule = {
			...styledSpan,
			tag: 'span',
			getAttrs: (element) => {
				if (!hasTextStyleProperty(element) && !hasPreservedAttributes(element)) return false;
				return styledSpan?.getAttrs?.(element) ?? {};
			},
		};

		const preservedSpanRule: TagParseRule = {
			tag: 'span',
			getAttrs: (element) => {
				if (element.hasAttribute('style') || !hasPreservedAttributes(element)) return false;
				if (Array.from(element.classList).some((cls) => cls.startsWith(COMPARISON_DIFF_CLASS_PREFIX))) return false;
				return {};
			},
		};

		return [styledSpanRule, preservedSpanRule];
	},
});

export const TextStyle: AnyExtension[] = [
	TextStyleKit.configure({ lineHeight: false, textStyle: false }),
	PreservingTextStyle,
];
