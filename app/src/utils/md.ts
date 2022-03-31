import { marked } from 'marked';
import dompurify from 'dompurify';

/**
 * Render and sanitize a markdown string
 */
export function md(str: string): string {
	dompurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});

	return dompurify.sanitize(marked(str), { ADD_ATTR: ['target'] });
}
