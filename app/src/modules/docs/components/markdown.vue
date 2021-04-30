<template>
	<div class="md" :class="pageClass" v-html="html" @click="onClick" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUpdated, inject } from '@vue/composition-api';

import MarkdownIt from 'markdown-it';
import fm from 'front-matter';

import hljs from 'highlight.js';
import hljsGraphQL from '@/utils/hljs-graphql';

import { getRootPath } from '@/utils/get-root-path';

import router from '@/router';

hljs.registerLanguage('graphql', hljsGraphQL);

const md = new MarkdownIt({
	html: true,
	highlight(str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(lang, str).value;
			} catch {
				console.warn('There was an error highlighting in Markdown');
			}
		}

		return '';
	},
});

md.use(require('markdown-it-table-of-contents'), { includeLevel: [2] });
md.use(require('markdown-it-anchor').default, { permalink: true, permalinkSymbol: '#' });

function hintRenderer(type: string) {
	return (tokens: any[], idx: number) => {
		const token = tokens[idx];
		let title = token.info.trim().slice(type.length).trim() || '';

		if (title) title = `<div class="hint-title">${title}</div>`;

		if (token.nesting === 1) {
			return `<div class="${type} hint">${title}\n`;
		} else {
			return '</div>\n';
		}
	};
}

md.use(require('markdown-it-container'), 'tip', { render: hintRenderer('tip') });
md.use(require('markdown-it-container'), 'warning', { render: hintRenderer('warning') });
md.use(require('markdown-it-container'), 'danger', { render: hintRenderer('danger') });

export default defineComponent({
	setup(props, { slots }) {
		const html = ref('');
		const pageClass = ref<string>();

		onMounted(generateHTML);
		onUpdated(generateHTML);

		return { html, onClick, pageClass };

		function generateHTML() {
			if (slots.default === null || !slots.default()?.[0]?.text) {
				html.value = '';
				return;
			}

			const source = slots.default()[0].text!;
			const { attributes, body } = fm<{ pageClass?: string }>(source);

			let markdown = body;

			const rawImages = body.matchAll(/!\[[^\]]*\]\((?<filename>.*?)(?="|\))(?<optionalpart>".*")?\)/g) ?? [];
			const rootPath = getRootPath();

			for (const rawImage of rawImages) {
				const filenameParts = rawImage.groups!.filename.split('/');

				while (filenameParts.includes('assets')) {
					filenameParts.shift();
				}

				const newFilename = `/admin${rootPath}img/docs/${filenameParts.join('/')}`;
				const newImage = rawImage[0].replace(rawImage.groups!.filename, newFilename);
				markdown = markdown.replace(rawImage[0], newImage);
			}

			pageClass.value = attributes?.pageClass;

			const htmlString = md.render(markdown);

			html.value = htmlString;

			// The Markdown is fetched async on page transition, which means the # link already exists before the markdown does
			// This will force the main el to scroll down to the targetted element on updates of the content
			const mainElement = inject('main-element', ref<Element | null>(null));

			if (router.currentRoute.hash) {
				const linkedEl = document.querySelector(router.currentRoute.hash) as HTMLElement;

				if (linkedEl) {
					mainElement.value?.scrollTo({ top: linkedEl.offsetTop - 100 });
				}
			}
		}

		function onClick(event: MouseEvent) {
			if (
				event.target &&
				(event.target as HTMLElement).tagName.toLowerCase() === 'a' &&
				(event.target as HTMLAnchorElement).href
			) {
				const link = (event.target as HTMLAnchorElement).getAttribute('href')!;

				if (link.startsWith('http') || link.startsWith('#')) return;

				event.preventDefault();
				const parts = link.split('#');
				parts[0] = parts[0].endsWith('/') ? parts[0].slice(0, -1) : parts[0];
				router.push({
					path: `/docs${parts[0]}`,
					hash: parts[1],
				});
			}
		}
	},
});
</script>

<style lang="scss" scoped>
// stylelint-disable

.error {
	padding: 20vh 0;
}

.md {
	color: var(--foreground-normal-alt);
	max-width: 740px;

	::v-deep {
		font-weight: 400;
		font-size: 16px;
		line-height: 27px;

		& > *:first-child {
			margin-top: 0;
		}

		& > *:last-child {
			margin-bottom: 0;
		}

		a {
			color: var(--primary-110);
			text-decoration: none;
			font-weight: 500;
		}

		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			position: relative;
			margin: 40px 0 8px;
			padding: 0;
			font-weight: 700;
			cursor: text;
			color: var(--foreground-normal-alt);

			a {
				position: absolute;
				right: 100%;
				padding-right: 4px;
				opacity: 0;

				&:hover {
					text-decoration: underline;
				}
			}

			&:hover a {
				opacity: 1;
			}
		}

		h1 {
			margin-bottom: 40px;
			font-size: 35px;
			line-height: 44px;
		}

		h2 {
			margin-top: 60px;
			margin-bottom: 20px;
			padding-bottom: 4px;
			font-size: 24px;
			line-height: 34px;
			border-bottom: 2px solid var(--border-subdued);
		}

		h3 {
			margin-bottom: 0px;
			font-size: 19px;
			line-height: 24px;
		}

		h4 {
			font-size: 16px;
		}

		h5 {
			font-size: 14px;
		}

		h6 {
			color: var(--foreground-normal);
			font-size: 14px;
		}

		.heading-link {
			color: var(--foreground-subdued);
			font-size: 16px;

			&:hover {
				color: var(--primary-110);
				text-decoration: none;
			}
		}

		pre {
			padding: 16px 20px;
			overflow: auto;
			font-size: 13px;
			line-height: 24px;
			background-color: var(--background-normal);
			border-radius: var(--border-radius);
		}

		code,
		tt {
			margin: 0 1px;
			padding: 0 4px;
			font-size: 15px;
			font-family: var(--family-monospace);
			white-space: nowrap;
			background-color: var(--background-page);
			border: 1px solid var(--background-normal);
			border-radius: var(--border-radius);
		}

		pre code {
			margin: 0;
			padding: 0;
			white-space: pre;
			background: transparent;
			border: none;
		}

		pre code,
		pre tt {
			background-color: transparent;
			border: none;
		}

		h1 tt,
		h1 code {
			font-size: inherit;
		}

		h2 tt,
		h2 code {
			font-size: inherit;
		}

		h3 tt,
		h3 code {
			font-size: inherit;
		}

		h4 tt,
		h4 code {
			font-size: inherit;
		}

		h5 tt,
		h5 code {
			font-size: inherit;
		}
		h6 tt,
		h6 code {
			font-size: inherit;
		}

		p,
		blockquote,
		ul,
		ol,
		dl,
		li,
		table,
		pre {
			margin: 8px 0;
		}

		p {
			margin-block-start: 1em;
			margin-block-end: 1em;
			margin-inline-start: 0px;
			margin-inline-end: 0px;
		}

		h3 + p {
			margin-block-start: 0.5em;
		}

		& > h2:first-child {
			margin-top: 0;
			padding-top: 0;
		}

		& > h1:first-child {
			margin-top: 0;
			padding-top: 0;
		}

		& > h3:first-child,
		& > h4:first-child,
		& > h5:first-child,
		& > h6:first-child {
			margin-top: 0;
			padding-top: 0;
		}

		a:first-child h1,
		a:first-child h2,
		a:first-child h3,
		a:first-child h4,
		a:first-child h5,
		a:first-child h6 {
			margin-top: 0;
			padding-top: 0;
		}

		h1 p,
		h2 p,
		h3 p,
		h4 p,
		h5 p,
		h6 p {
			margin-top: 0;
		}

		li p.first {
			display: inline-block;
		}

		ul,
		ol {
			margin: 20px 0;
			padding-left: 20px;

			li {
				margin: 8px 0;
				line-height: 24px;
			}

			ul,
			ol {
				margin: 4px 0;

				li {
					margin: 4px 0;
					line-height: 24px;
				}
			}
		}

		blockquote {
			margin-bottom: 4rem;
			padding: 0.25rem 0 0.25rem 1rem;
			color: var(--foreground-subdued);
			font-size: 18px;
			border-left: 2px solid var(--background-normal);
			max-width: 740px;
		}

		blockquote > :first-child {
			margin-top: 0;
		}

		blockquote > :last-child {
			margin-bottom: 0;
		}

		table {
			min-width: 100%;
			margin: 40px 0;
			padding: 0;
			border-collapse: collapse;
			border-spacing: 0;
			img {
				margin: 0;
			}
		}

		table tr {
			margin: 0;
			padding: 0;
			border-top: 1px solid var(--border-normal);
		}

		table tr:nth-child(2n) {
			background-color: var(--background-page);
		}

		table tr th {
			margin: 0;
			padding: 8px 20px;
			font-weight: bold;
			text-align: left;
			border: 1px solid var(--border-normal);
		}

		table tr td {
			margin: 0;
			padding: 8px 20px;
			text-align: left;
			border: 1px solid var(--border-normal);
		}

		table tr th :first-child,
		table tr td :first-child {
			margin-top: 0;
		}

		table tr th :last-child,
		table tr td :last-child {
			margin-bottom: 0;
		}

		img {
			max-width: 100%;
			margin: 20px 0;
			border-radius: 6px;

			&.no-margin {
				margin: 0;
			}

			&.full {
				width: 100%;
			}

			&.shadow {
				box-shadow: 0px 5px 10px 0px rgba(23, 41, 64, 0.1), 0px 2px 40px 0px rgba(23, 41, 64, 0.05);
			}
		}

		.highlight pre {
			padding: 8px 20px;
			overflow: auto;
			font-size: 13px;
			line-height: 19px;
			background-color: var(--background-page);
			border: 1px solid var(--background-normal);
			border-radius: var(--border-radius);
		}

		hr {
			margin: 40px auto;
			border: none;
			border-top: 2px solid var(--background-normal);
		}

		b,
		strong {
			font-weight: 600;
		}

		.hint {
			display: inline-block;
			width: 100%;
			margin: 20px 0;
			padding: 0 20px;
			background-color: var(--background-subdued);
			border-left: 2px solid var(--primary);

			&-title {
				margin-block-start: 1em;
				margin-block-end: 1em;
				margin-inline-start: 0px;
				margin-inline-end: 0px;
				font-weight: bold;
			}

			&.tip {
				border-left: 2px solid var(--primary);
			}

			&.warning {
				background-color: var(--warning-10);
				border-left: 2px solid var(--warning);
			}

			&.danger {
				background-color: var(--danger-10);
				border-left: 2px solid var(--danger);
			}
		}

		.two-up {
			margin-top: 3rem;
		}

		.two-up .right {
			margin-top: 50px;

			h5 {
				color: var(--foreground-subdued);
				margin-top: 20px;
			}
		}

		.table-of-contents {
			margin-top: -20px;
			ul,
			ol {
				margin-top: 0;
				li {
					margin: 4px 0;
				}
			}
		}

		// pre,
		// pre[class*='language-'] {
		// 	margin-top: 0;
		// }

		@media (min-width: 1000px) {
			.two-up {
				display: grid;
				grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
				grid-gap: 40px;
				align-items: start;
			}

			.two-up .left,
			.two-up .right {
				> *:first-child {
					margin-top: 0 !important;
				}
			}

			.two-up .right {
				margin-top: 0;
				position: sticky;
				top: 100px;
			}
		}
	}

	&.page-reference {
		max-width: 1200px;

		::v-deep {
			hr {
				width: calc(100% + 5rem);
				left: -2.5rem;
				position: relative;
				margin: 3rem 0;
			}

			h2 {
				border-bottom: 0;
				margin-top: 3rem;
				font-size: 2rem;
			}

			h3 {
				margin-top: 3rem;
				margin-bottom: 0.5rem;
				font-size: 1.2rem;
			}

			h4 {
				margin-top: 2rem;
				margin-bottom: 0;
			}

			.definitions {
				font-size: 0.9rem;
				line-height: 1.5rem;

				> p {
					border-bottom: 2px solid var(--border-subdued);
					padding: 0.8rem 0;
					margin: 0;

					&:first-child {
						border-top: 2px solid var(--border-subdued);
					}

					> code:first-child {
						background: transparent;
						padding: 0;
						margin-right: 0.2rem;
						font-weight: 700;
						font-size: 0.9rem;
						border: 0;
					}

					> strong {
						color: var(--foreground-subdued);
					}
				}
			}
		}
	}
}
</style>
