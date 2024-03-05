import createDOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import { tasklist as tasklistPlugin } from '@mdit/plugin-tasklist';
import hljs from 'highlight.js';
import anchorPlugin from 'markdown-it-anchor';
// @ts-ignore
import { full as emojiPlugin } from 'markdown-it-emoji';

type Options = {
	target: '_blank' | '_self' | '_parent' | '_top';
	base?: {
		link?: string;
		image?: string;
	};
};

const markdownit = MarkdownIt({
	html: true,
	linkify: true,
	highlight: (value, language) => {
		if (language && hljs.getLanguage(language)) {
			try {
				return `<pre class="highlight language-${language}"><span class="lang">${language}</span><code class="hljs">${
					hljs.highlight(value, { language, ignoreIllegals: true }).value
				}</code></pre>`;
			} catch {
				// Ignore
			}
		}

		return `<pre><code>${value}</code></pre>`;
	},
})
	.use(emojiPlugin)
	.use(anchorPlugin)
	.use(tasklistPlugin);

/**
 * Render and sanitize a markdown string
 */
export function md(value: string, options: Options = { target: '_self' }): string {
	const dompurify = createDOMPurify();

	dompurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A') {
			sanitizeLink(node as HTMLAnchorElement, options);
		}

		if (node.tagName === 'IMG') {
			sanitizeImage(node as HTMLImageElement, options);
		}
	});

	const markdown = markdownit.render(value);

	return dompurify.sanitize(markdown);
}

function sanitizeLink(node: HTMLAnchorElement, options: Options) {
	const url = node.getAttribute('href');

	if (!url) return;

	try {
		new URL(url, 'http://example.com');
	} catch {
		node.removeAttribute('href');
		return;
	}

	let isAbsolute = true;

	try {
		new URL(url);
	} catch {
		isAbsolute = false;
	}

	if (!isAbsolute) {
		if (url.startsWith('#')) return;

		if (options.base?.link) node.setAttribute('href', new URL(url, options.base.link).toString());
	}

	node.setAttribute('target', options.target);

	if (options.target === '_blank') node.setAttribute('rel', 'noopener noreferrer');
}

function sanitizeImage(node: HTMLImageElement, options: Options) {
	node.setAttribute('loading', 'lazy');

	if (node.getAttribute('alt')?.trim() === '') node.removeAttribute('alt');

	const url = node.getAttribute('src');

	if (!url) return;

	try {
		new URL(url, 'http://example.com');
	} catch {
		node.removeAttribute('src');
		return;
	}

	let isAbsolute = true;

	try {
		new URL(url);
	} catch {
		isAbsolute = false;
	}

	if (!isAbsolute && options.base?.image) node.setAttribute('src', new URL(url, options.base.image).toString());
}
