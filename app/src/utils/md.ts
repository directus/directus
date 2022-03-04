import { marked } from 'marked';
import dompurify from 'dompurify';

const renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
	const link = marked.Renderer.prototype.link.apply(this, [href, title, text]);
	return link.replace('<a', "<a target='_blank'");
};

/**
 * Render and sanitize a markdown string
 */
export function md(str: string, newTab = false): string {
	dompurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});

	return dompurify.sanitize(
		marked(str, {
			renderer: newTab ? renderer : undefined,
		}),
		{ ADD_ATTR: ['target'] }
	);
}
