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
	margin: 20px;
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
	font-size: 36px;
	line-height: 46px;
	margin-block-start: 1em;
}
h2 {
	font-size: 24px;
	line-height: 34px;
	margin-block-start: 1.25em;
}
h3 {
	font-size: 19px;
	line-height: 29px;
	margin-block-start: 1.25em;
}
h4 {
	font-size: 16px;
	line-height: 26px;
	margin-block-start: 1.5em;
}
h5 {
	font-size: 14px;
	line-height: 24px;
	margin-block-start: 2em;
}
h6 {
	font-size: 12px;
	line-height: 22px;
	margin-block-start: 2em;
}
p {
	font-family: ${userFontFamily}, serif;
	font-size: 15px;
	line-height: 24px;
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
	font-size: 15px;
	line-height: 24px;
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
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	padding: 2px 4px;
	font-family: ${cssVar('--theme--fonts--monospace--font-family')}, monospace;
	background-color: ${cssVar('--theme--background-normal')};
	border-radius: ${cssVar('--theme--border-radius')};
	overflow-wrap: break-word;
}
pre {
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	padding: 1em;
	font-family: ${cssVar('--theme--fonts--monospace--font-family')}, monospace;
	background-color: ${cssVar('--theme--background-normal')};
	border-radius: ${cssVar('--theme--border-radius')};
	overflow: auto;
}
blockquote {
	font-family: ${userFontFamily}, serif;
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	border-inline-start: 2px solid ${cssVar('--theme--form--field--input--border-color')};
	padding-inline-start: 1em;
	margin-inline-start: 0px;
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
	block-size: 1px;
	border: none;
	margin-block-start: 2em;
	margin-block-end: 2em;
}
table {
	border-collapse: collapse;
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
}
table th,
table td {
	border: 1px solid ${cssVar('--theme--form--field--input--border-color')};
	padding: 0.4rem;
}
figure {
	display: table;
	margin: 1rem auto;
}
figure figcaption {
	color: #999;
	display: block;
	margin-block-start: 0.25rem;
	text-align: center;
}${
		includeDiffStyles
			? `
.comparison-diff--added {
	color: ${cssVar('--theme--success')};
	background-color: ${cssVar('--theme--success-background')};
	padding: 2px;
	border-radius: ${cssVar('--theme--border-radius')};
}

.comparison-diff--removed {
	color: ${cssVar('--theme--danger')};
	background-color: ${cssVar('--theme--danger-background')};
	padding: 2px;
	border-radius: ${cssVar('--theme--border-radius')};
}`
			: ''
	}`;
}
