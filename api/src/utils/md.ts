import { marked } from 'marked';
import sanitizeHTML from 'sanitize-html';

/**
 * Render and sanitize a markdown string
 */
export function md(value: string): string {
	const markdown = marked.parse(value) as string; /* Would only be a promise if used with async extensions */

	return sanitizeHTML(markdown);
}
