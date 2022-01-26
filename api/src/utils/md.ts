import { parse } from 'marked';
import sanitizeHTML from 'sanitize-html';

/**
 * Render and sanitize a markdown string
 */
export function md(str: string): string {
	return sanitizeHTML(parse(str));
}
