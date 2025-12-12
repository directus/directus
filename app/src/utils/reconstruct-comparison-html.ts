import type { Change } from '@/composables/use-comparison-diff';
import { isHtmlString } from '@/composables/use-comparison-diff';

export function reconstructComparisonHtml(
	changes: Change[],
	side: 'base' | 'incoming',
	updated?: boolean,
): string | null {
	const hasHtml = changes.some((change) => change.isHtml || isHtmlString(change.value));
	if (!hasHtml) return null;

	for (const part of changes) {
		if (part.isHtml) {
			if (side === 'incoming' && part.added) {
				return part.value;
			}

			if (side === 'base' && part.removed) {
				return part.value;
			}
		}
	}

	const htmlParts: string[] = [];

	for (const part of changes) {
		if (updated && part.updated) {
			htmlParts.push(part.value || '');
			continue;
		}

		if (side === 'incoming' && part.removed) continue;
		if (side === 'base' && part.added) continue;

		const value = part.value !== null && part.value !== undefined ? String(part.value) : '';
		const isChanged = part.added || part.removed;

		if (isChanged) {
			const highlightClass = side === 'incoming' ? 'diff-added' : 'diff-removed';
			htmlParts.push(`<span class="${highlightClass}">${value}</span>`);
		} else {
			htmlParts.push(value);
		}
	}

	return htmlParts.join('');
}
