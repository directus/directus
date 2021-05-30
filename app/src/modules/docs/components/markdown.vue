<template>
	<div class="md" :class="pageClass" v-html="html" @click="onClick" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUpdated, inject } from 'vue';

import MarkdownIt from 'markdown-it';
import markdownItTableOfContents from 'markdown-it-table-of-contents';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItContainer from 'markdown-it-container';
import fm from 'front-matter';

import hljs from 'highlight.js';
import hljsGraphQL from '@/utils/hljs-graphql';

import { getRootPath } from '@/utils/get-root-path';

import { useRoute, useRouter } from 'vue-router';

hljs.registerLanguage('graphql', hljsGraphQL);

const md = new MarkdownIt({
	html: true,
	highlight(str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(str, { language: lang }).value;
			} catch {
				console.warn('There was an error highlighting in Markdown');
			}
		}

		return '';
	},
});

md.use(markdownItTableOfContents, { includeLevel: [2] });
md.use(markdownItAnchor, { permalink: true, permalinkSymbol: '#' });

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

md.use(markdownItContainer, 'tip', { render: hintRenderer('tip') });
md.use(markdownItContainer, 'warning', { render: hintRenderer('warning') });
md.use(markdownItContainer, 'danger', { render: hintRenderer('danger') });

export default defineComponent({
	setup(props, { slots }) {
		const router = useRouter();
		const route = useRoute();

		const html = ref('');
		const pageClass = ref<string>();

		onMounted(generateHTML);
		onUpdated(generateHTML);

		return { html, onClick, pageClass };

		function generateHTML() {
			const source = slots.default?.()[0].children;

			if (!source || typeof source !== 'string') {
				html.value = '';
				return;
			}

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

			if (route.hash) {
				const linkedEl = document.querySelector(route.hash) as HTMLElement;

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

<style scoped>
.error {
	padding: 20vh 0;
}

.md {
	max-width: 740px;
	color: var(--foreground-normal-alt);
	font-weight: 400;
	font-size: 16px;
	line-height: 27px;
}

.md > :deep(*:first-child) {
	margin-top: 0;
}

.md > :deep(*:last-child) {
	margin-bottom: 0;
}

.md :deep(a) {
	color: var(--primary-110);
	font-weight: 500;
	text-decoration: none;
}

.md :deep(h1) {
	margin-bottom: 40px;
	font-size: 35px;
	line-height: 44px;
}

.md :deep(h2) {
	margin-top: 60px;
	margin-bottom: 20px;
	padding-bottom: 4px;
	font-size: 24px;
	line-height: 34px;
	border-bottom: 2px solid var(--border-subdued);
}

.md :deep(h3) {
	margin-bottom: 0px;
	font-size: 19px;
	line-height: 24px;
}

.md :deep(h4) {
	font-size: 16px;
}

.md :deep(h5) {
	font-size: 14px;
}

.md :deep(h6) {
	color: var(--foreground-normal);
	font-size: 14px;
}

.md :deep(pre) {
	padding: 16px 20px;
	overflow: auto;
	font-size: 13px;
	line-height: 24px;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}

.md :deep(:is(code, tt)) {
	margin: 0 1px;
	padding: 0 4px;
	font-size: 15px;
	font-family: var(--family-monospace);
	white-space: nowrap;
	background-color: var(--background-page);
	border: 1px solid var(--background-normal);
	border-radius: var(--border-radius);
}

.md :deep(pre code) {
	margin: 0;
	padding: 0;
	white-space: pre;
	background: transparent;
	border: none;
}

.md :deep(p) {
	margin-block-start: 1em;
	margin-block-end: 1em;
	margin-inline-start: 0px;
	margin-inline-end: 0px;
}

.md :deep(h3 + p) {
	margin-block-start: 0.5em;
}

.md > :deep(h2:first-child) {
	margin-top: 0;
	padding-top: 0;
}

.md > :deep(h1:first-child) {
	margin-top: 0;
	padding-top: 0;
}

.md :deep(blockquote) {
	max-width: 740px;
	margin-bottom: 4rem;
	padding: 0.25rem 0 0.25rem 1rem;
	color: var(--foreground-subdued);
	font-size: 18px;
	border-left: 2px solid var(--background-normal);
}

.md :deep(blockquote > :first-child) {
	margin-top: 0;
}

.md :deep(blockquote > :last-child) {
	margin-bottom: 0;
}

.md :deep(table) {
	min-width: 100%;
	margin: 40px 0;
	padding: 0;
	border-collapse: collapse;
	border-spacing: 0;
}

.md :deep(img) {
	max-width: 100%;
	margin: 20px 0;
	border-radius: 6px;
}

.md :deep(table img) {
	margin: 0;
}

.md :deep(table tr) {
	margin: 0;
	padding: 0;
	border-top: 1px solid var(--border-normal);
}

.md :deep(table tr:nth-child(2n)) {
	background-color: var(--background-page);
}

.md :deep(table tr th) {
	margin: 0;
	padding: 8px 20px;
	font-weight: bold;
	text-align: left;
	border: 1px solid var(--border-normal);
}

.md :deep(table tr td) {
	margin: 0;
	padding: 8px 20px;
	text-align: left;
	border: 1px solid var(--border-normal);
}

.md :deep(img.no-margin) {
	margin: 0;
}

.md :deep(img.full) {
	width: 100%;
}

.md :deep(img.shadow) {
	box-shadow: 0px 5px 10px 0px rgba(23, 41, 64, 0.1), 0px 2px 40px 0px rgba(23, 41, 64, 0.05);
}

.md :deep(.heading-link) {
	color: var(--foreground-subdued);
	font-size: 16px;
}

.md :deep(.heading-link:hover) {
	color: var(--primary-110);
	text-decoration: none;
}

.md :deep(li p.first) {
	display: inline-block;
}

.md > :deep(:is(h3:first-child, h4:first-child, h5:first-child, h6:first-child)) {
	margin-top: 0;
	padding-top: 0;
}

.md
	:deep(:is(a:first-child h1, a:first-child h2, a:first-child h3, a:first-child h4, a:first-child h5, a:first-child
			h6)) {
	margin-top: 0;
	padding-top: 0;
}

.md :deep(:is(table tr th :first-child, table tr td :first-child)) {
	margin-top: 0;
}

.md :deep(:is(table tr th :last-child, table tr td :last-child)) {
	margin-bottom: 0;
}

.md :deep(:is(h1 a:hover, h2 a:hover, h3 a:hover, h4 a:hover, h5 a:hover, h6 a:hover)) {
	text-decoration: underline;
}

.md :deep(:is(h1:hover a, h2:hover a, h3:hover a, h4:hover a, h5:hover a, h6:hover a)) {
	opacity: 1;
}

.md :deep(:is(pre code, pre tt)) {
	background-color: transparent;
	border: none;
}

.md :deep(:is(h1 tt, h1 code)) {
	font-size: inherit;
}

.md :deep(:is(h2 tt, h2 code)) {
	font-size: inherit;
}

.md :deep(:is(h3 tt, h3 code)) {
	font-size: inherit;
}

.md :deep(:is(h4 tt, h4 code)) {
	font-size: inherit;
}

.md :deep(:is(h5 tt, h5 code)) {
	font-size: inherit;
}

.md :deep(:is(h6 tt, h6 code)) {
	font-size: inherit;
}

.md :deep(:is(p, blockquote, ul, ol, dl, li, table, pre)) {
	margin: 8px 0;
}

.md :deep(:is(h1 p, h2 p, h3 p, h4 p, h5 p, h6 p)) {
	margin-top: 0;
}

.md :deep(:is(ul, ol)) {
	margin: 20px 0;
	padding-left: 20px;
}

.md :deep(:is(ul li, ol li)) {
	margin: 8px 0;
	line-height: 24px;
}

.md :deep(:is(ul ul, ul ol, ol ul, ol ol)) {
	margin: 4px 0;
}

.md :deep(:is(ul ul li, ul ol li, ol ul li, ol ol li)) {
	margin: 4px 0;
	line-height: 24px;
}

.md :deep(:is(.table-of-contents ul, .table-of-contents ol)) {
	margin-top: 0;
}

.md :deep(:is(.table-of-contents ul li, .table-of-contents ol li)) {
	margin: 4px 0;
}

.md :deep(.hint) {
	display: inline-block;
	width: 100%;
	margin: 20px 0;
	padding: 0 20px;
	background-color: var(--background-subdued);
	border-left: 2px solid var(--primary);
}

.md :deep(.hint-title) {
	margin-block-start: 1em;
	margin-block-end: 1em;
	margin-inline-start: 0px;
	margin-inline-end: 0px;
	font-weight: bold;
}

.md :deep(.hint.tip) {
	border-left: 2px solid var(--primary);
}

.md :deep(.hint.warning) {
	background-color: var(--warning-10);
	border-left: 2px solid var(--warning);
}

.md :deep(.hint.danger) {
	background-color: var(--danger-10);
	border-left: 2px solid var(--danger);
}

.md :deep(.two-up) {
	margin-top: 3rem;
}

.md :deep(.two-up .right) {
	margin-top: 50px;
}

.md :deep(.two-up .right h5) {
	color: var(--foreground-subdued);
	margin-top: 20px;
}

.md :deep(.table-of-contents) {
	margin-top: -20px;
}

.md.page-reference {
	max-width: 1200px;
}

.md.page-reference :deep(hr) {
	width: calc(100% + 5rem);
	left: -2.5rem;
	position: relative;
	margin: 3rem 0;
}

.md.page-reference :deep(h2) {
	border-bottom: 0;
	margin-top: 3rem;
	font-size: 2rem;
}

.md.page-reference :deep(h3) {
	margin-top: 3rem;
	margin-bottom: 0.5rem;
	font-size: 1.2rem;
}

.md.page-reference :deep(h4) {
	margin-top: 2rem;
	margin-bottom: 0;
}

.md.page-reference :deep(.definitions) {
	font-size: 0.9rem;
	line-height: 1.5rem;
}

.md.page-reference :deep(.definitions > p) {
	border-bottom: 2px solid var(--border-subdued);
	padding: 0.8rem 0;
	margin: 0;
}

.md.page-reference :deep(.definitions > p:first-child) {
	border-top: 2px solid var(--border-subdued);
}

.md.page-reference :deep(.definitions > p > code:first-child) {
	background: transparent;
	padding: 0;
	margin-right: 0.2rem;
	font-weight: 700;
	font-size: 0.9rem;
	border: 0;
}

.md.page-reference :deep(.definitions > p > strong) {
	color: var(--foreground-subdued);
}

@media (min-width: 1000px) {
	.md :deep(.two-up) {
		display: grid;
		grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
		grid-gap: 40px;
		align-items: start;
	}
	.md :deep(.two-up .right) {
		margin-top: 0;
		position: sticky;
		top: 100px;
	}
	.md :deep(:is(.two-up .left > *:first-child, .two-up .right > *:first-child)) {
		margin-top: 0 !important;
	}
}
</style>
