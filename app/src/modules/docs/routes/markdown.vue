<template>
	<div class="docs selectable">
		<div class="md" v-html="html" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, onMounted, onUpdated } from '@vue/composition-api';
import marked from 'marked';
import highlight from 'highlight.js';

export default defineComponent({
	setup(props, { slots }) {
		const html = ref('');

		onMounted(generateHTML);
		onUpdated(generateHTML);

		return { html };

		function generateHTML() {
			if (slots.default === null || !slots.default()?.[0]?.text) {
				html.value = '';
				return;
			}

			let htmlString = slots.default()[0].text!;
			const hintRegex = /<p>:::(.*?) (.*?)\r?\n((\s|.)*?):::<\/p>/gm;

			htmlString = marked(htmlString, {
				highlight: (code) => highlight.highlightAuto(code).value,
			});

			htmlString = htmlString.replaceAll(
				hintRegex,
				(match: string, type: string, title: string, body: string) => {
					return `<div class="hint ${type}"><p class="hint-title">${title}</p><p class="hint-body">${body}</p></div>`;
				}
			);

			html.value = htmlString;
		}
	},
});
</script>

<style lang="scss" scoped>
.error {
	padding: 20vh 0;
}

.docs {
	padding: 0 var(--content-padding) var(--content-padding-bottom);

	.md {
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
				margin: 0 2px;
				padding: 0 5px;
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
				}
			}

			blockquote {
				font-size: 18px;
				padding: 0 20px;
				color: var(--foreground-subdued);
				border-left: 2px solid var(--background-normal);
			}

			blockquote > :first-child {
				margin-top: 0;
			}

			blockquote > :last-child {
				margin-bottom: 0;
			}

			table {
				padding: 0;
				border-collapse: collapse;
				border-spacing: 0;
			}

			table tr {
				margin: 0;
				padding: 0;
				background-color: white;
				border-top: 1px solid var(--background-normal);
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
					box-shadow: 0px 5px 10px 0px rgba(23,41,64,0.1),
								0px 2px 40px 0px rgba(23,41,64,0.05);
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
				margin: 20px 0;
				padding: 0 20px;
				background-color: var(--background-subdued);
				border-left: 2px solid var(--primary);

				&-title {
					font-weight: bold;
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
}
</style>
