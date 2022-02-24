import { marked } from 'marked';
import dompurify from 'dompurify';

/**
 * Render and sanitize a markdown string
 */
export function md(str: string): string {
	return dompurify.sanitize(marked(str));
}
