import { TextStyle as BaseTextStyle, TextStyleKit } from '@tiptap/extension-text-style';
import type { AnyExtension } from '@tiptap/vue-3';
import { COMPARISON_DIFF_CLASS_PREFIX } from './comparison-diff';
import { hasPreservedAttributes } from './preserved-attributes';

/**
 * The base TextStyle mark only claims `<span>`s carrying a `style` attribute; other spans are
 * unwrapped, which would drop preserved attributes (class, id, data-*, aria-*). An extra parse rule
 * claims style-less spans that carry preserved attributes. Configured customFormats marks still
 * win: their priority (200) beats textStyle (101) and their rule consumes the span. Comparison
 * diff spans stay unclaimed: the ComparisonDiff mark parses them in comparison mode, and normal
 * editing must keep stripping them.
 */
const PreservingTextStyle = BaseTextStyle.extend({
	parseHTML() {
		return [
			...(this.parent?.() ?? []),
			{
				tag: 'span',
				getAttrs: (element) => {
					const el = element as HTMLElement;
					if (el.hasAttribute('style') || !hasPreservedAttributes(el)) return false;
					if (Array.from(el.classList).some((cls) => cls.startsWith(COMPARISON_DIFF_CLASS_PREFIX))) return false;
					return {};
				},
			},
		];
	},
});

export const TextStyle: AnyExtension[] = [
	TextStyleKit.configure({ lineHeight: false, textStyle: false }),
	PreservingTextStyle,
];
