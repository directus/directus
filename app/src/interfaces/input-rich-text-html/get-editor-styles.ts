import { cssVar } from '@directus/utils/browser';
import firaMono from '../../assets/fonts/FiraMono-Medium.woff2';
import merriweatherRegular from '../../assets/fonts/merriweather-regular.woff2';

export default function getEditorStyles(
	font: 'sans-serif' | 'serif' | 'monospace',
	includeDiffStyles?: boolean,
): string {
	const userFontFamily = cssVar(`--theme--fonts--${font}--font-family`);

	return `
@font-face {
	font-family: 'Fira Mono';
	font-style: normal;
	src: url(${firaMono}) format('woff2');
}

@font-face {
	font-family: 'Merriweather';
	font-style: normal;
	src: url(${merriweatherRegular}) format('woff2');
}

::selection {
	background: ${cssVar('--background-normal-alt')};
}
body {
	color: ${cssVar('--theme--form--field--input--foreground')};
	background-color: ${cssVar('--theme--form--field--input--background')};
	margin: 1.125rem;
	font-family: ${cssVar('--theme--fonts--sans--font-family')};
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
	-moz-osx-font-smoothing: grayscale;
}
body.mce-content-readonly:not(.non-editable) {
	color: ${cssVar('--theme--form--field--input--foreground-subdued')};
	background-color: ${cssVar('--theme--form--field--input--background-subdued')};
}
.mce-offscreen-selection {
	display: none;
}
h1, h2, h3, h4, h5, h6 {
	font-family: ${userFontFamily}, serif;
	color: ${cssVar('--theme--form--field--input--foreground-accent')};
	font-weight: 700;
	margin-block-end: 0;
}
h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
	margin-block-start: 0.5em;
}
h1 {
	font-size: 2rem;
	line-height: 1.2813;
	margin-block-start: 1em;
}
h2 {
	font-size: 1.375rem;
	line-height: 1.4091;
	margin-block-start: 1.25em;
}
h3 {
	font-size: 1.0625rem;
	line-height: 1.5294;
	margin-block-start: 1.25em;
}
h4 {
	font-size: 0.875rem;
	line-height: 1.6429;
	margin-block-start: 1.5em;
}
h5 {
	font-size: 0.8125rem;
	line-height: 1.6923;
	margin-block-start: 2em;
}
h6 {
	font-size: 0.6875rem;
	line-height: 1.8182;
	margin-block-start: 2em;
}
p {
	font-family: ${userFontFamily}, serif;
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	margin: 1.5em 0;
}
a {
	color: ${cssVar('--theme--primary-accent')};
	text-decoration: underline;
	cursor: pointer;
}
ul, ol {
	font-family: ${userFontFamily}, serif;
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	margin: 1.5em 0;
}
ul ul,
	ol ol,
		ul ol,
			ol ul {
	margin: 0;
}
b, strong {
	font-weight: 700;
}
code {
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	padding: 0.125rem 0.25rem;
	font-family: ${cssVar('--theme--fonts--monospace--font-family')}, monospace;
	background-color: ${cssVar('--theme--background-normal')};
	border-radius: ${cssVar('--theme--border-radius')};
	overflow-wrap: break-word;
}
pre {
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	padding: 1em;
	font-family: ${cssVar('--theme--fonts--monospace--font-family')}, monospace;
	background-color: ${cssVar('--theme--background-normal')};
	border-radius: ${cssVar('--theme--border-radius')};
	overflow: auto;
}
blockquote {
	font-family: ${userFontFamily}, serif;
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
	border-inline-start: 2px solid ${cssVar('--theme--form--field--input--border-color')};
	padding-inline-start: 1em;
	margin-inline-start: 0;
}
video,
img {
	max-inline-size: 100%;
	border-radius: ${cssVar('--theme--border-radius')};
	block-size: auto;
}
iframe {
	max-inline-size: 100%;
	border-radius: ${cssVar('--theme--border-radius')};
}
hr {
	background-color: ${cssVar('--theme--form--field--input--border-color')};
	block-size: 0.0625rem;
	border: none;
	margin-block-start: 2em;
	margin-block-end: 2em;
}
table {
	border-collapse: collapse;
	font-size: 0.875rem;
	line-height: 1.5714;
	font-weight: 500;
}
table th,
table td {
	border: 1px solid ${cssVar('--theme--form--field--input--border-color')};
	padding: 0.3125rem;
}
figure {
	display: table;
	margin: 0.8125rem auto;
}
figure figcaption {
	color: #999;
	display: block;
	margin-block-start: 0.1875rem;
	text-align: center;
}${
		includeDiffStyles
			? `
.comparison-diff--added {
	color: ${cssVar('--theme--success')};
	background-color: ${cssVar('--theme--success-background')};
	padding: 0.125rem;
	border-radius: ${cssVar('--theme--border-radius')};
}

.comparison-diff--removed {
	color: ${cssVar('--theme--danger')};
	background-color: ${cssVar('--theme--danger-background')};
	padding: 0.125rem;
	border-radius: ${cssVar('--theme--border-radius')};
}`
			: ''
	}`;
}
