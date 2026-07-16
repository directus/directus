import { Mark } from '@tiptap/core';

/**
 * Comparison mode mark. The comparison view precomputes diff-marked HTML
 * (span.comparison-diff--added / --removed, see use-comparison-diff.ts) and feeds it as the
 * field value; this mark lets those spans survive schema parsing. Registered only when the
 * editor is in comparison mode — in normal editing the spans are intentionally stripped.
 */
/** Class prefix of diff spans; other extensions must never claim or preserve them. */
export const COMPARISON_DIFF_CLASS_PREFIX = 'comparison-diff--';

export const ComparisonDiff = Mark.create({
	name: 'comparisonDiff',

	addAttributes() {
		return {
			type: {
				default: 'added',
				parseHTML: (element: HTMLElement) =>
					element.classList.contains('comparison-diff--removed') ? 'removed' : 'added',
				renderHTML: (attributes: { type: 'added' | 'removed' }) => ({
					class: `comparison-diff--${attributes.type}`,
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: 'span.comparison-diff--added' }, { tag: 'span.comparison-diff--removed' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', HTMLAttributes, 0];
	},
});
