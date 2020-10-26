<template>
	<div class="md" v-html="html" @click="onClick" />
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, onMounted, onUpdated } from '@vue/composition-api';
import marked, { Renderer } from 'marked';
import highlight from 'highlight.js';

export default defineComponent({
	setup(props, { slots }) {
		const html = ref('');

		onMounted(generateHTML);
		onUpdated(generateHTML);

		return { html, onClick };

		async function onClick($event: Event) {
			if ($event.target instanceof HTMLElement && $event.target.classList.contains('copy')) {
				await navigator.clipboard.writeText(
					window.location.href.split('#')[0] + $event.target.getAttribute('href')
				);
			}
		}

		function generateHTML() {
			if (slots.default === null || !slots.default()?.[0]?.text) {
				html.value = '';
				return;
			}

			let htmlString = slots.default()[0].text!;
			const hintRegex = /<p>:::(.*?) (.*?)\r?\n((\s|.)*?):::<\/p>/gm;

			const renderer: Partial<Renderer> = {
				heading(text, level) {
					const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

					return `
					<h${level} id="${escapedText}">
						<a class="heading-link copy" href="#${escapedText}">#</a>
						${text}
					</h${level}>`;
				},
			};

			// Marked merges it's default rendered with our extension. It's typed as a full rendered however
			marked.use({ renderer } as any);

			htmlString = marked(htmlString, {
				highlight: (code, lang) => {
					return highlight.highlightAuto(code, [lang]).value;
				},
			});

			htmlString = htmlString.replace(hintRegex, (match: string, type: string, title: string, body: string) => {
				return `<div class="hint ${type}"><p class="hint-title">${title}</p><p class="hint-body">${body}</p></div>`;
			});

			html.value = htmlString;
		}
	},
});
</script>

<style lang="scss" scoped>
.error {
	padding: 20vh 0;
}

.md {
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
			color: var(--primary);
			text-decoration: none;
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
			font-weight: 600;
			cursor: text;

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
			padding-bottom: 12px;
			font-size: 26px;
			line-height: 33px;
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
				color: var(--primary);
				text-decoration: none;
			}
		}

		pre {
			padding: 16px 20px;
			overflow: auto;
			font-size: 13px;
			line-height: 19px;
			background-color: var(--background-page);
			border: 1px solid var(--background-normal);
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
			padding: 0 20px;
			color: var(--foreground-subdued);
			font-size: 18px;
			border-left: 2px solid var(--background-normal);
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
		}

		table tr {
			margin: 0;
			padding: 0;
			background-color: var(--background-normal);
			border-top: 1px solid var(--background-normal);
		}

		table thead tr {
			background-color: var(--background-normal-alt);
		}

		table tr:nth-child(2n) {
			background-color: var(--background-page);
		}

		table tr th {
			margin: 0;
			padding: 8px 20px;
			font-weight: bold;
			text-align: left;
			border: 1px solid var(--background-normal);
		}

		table tr td {
			margin: 0;
			padding: 8px 20px;
			text-align: left;
			border: 1px solid var(--background-normal);
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
				margin-bottom: 0.5em;
				font-weight: bold;
			}

			&-body {
				margin-top: 0.5em;
			}

			&.tip {
				border-left: 2px solid var(--success);
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
	}
}
</style>
