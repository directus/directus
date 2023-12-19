import { marked } from 'marked';
import dompurify from 'dompurify';

type Options = {
	target: '_blank' | '_self' | '_parent' | '_top';
};

const renderer = new marked.Renderer();

/**
 * Render and sanitize a markdown string
 */
export function md(value: string, options: Options = { target: '_self' }): string {
	dompurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});

	renderer.link = function (href, title, text) {
		const link = marked.Renderer.prototype.link.apply(this, [href, title, text]);
		return link.replace('<a', `<a target="${options.target}"`);
	};

	const markdown = marked.parse(value, {
		renderer,
	}) as string; /* Would only be a promise if used with async extensions */

	return dompurify.sanitize(markdown, { ADD_ATTR: ['target'] });
}
