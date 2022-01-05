import firaMono2 from '../../assets/fonts/FiraMono-Medium.woff2';
import firaMono from '../../assets/fonts/FiraMono-Medium.woff';
import merriweatherRegular2 from '../../assets/fonts/merriweather-regular.woff2';
import merriweatherRegular from '../../assets/fonts/merriweather-regular.woff';

function cssVar(name: string) {
	return getComputedStyle(document.body).getPropertyValue(name);
}

export default function getEditorStyles(font: 'sans-serif' | 'serif' | 'monospace'): string {
	return `
@font-face {
	font-family: 'Fira Mono';
	font-style: normal;
	src: url(${firaMono2}) format('woff2'),
	url(${firaMono}) format('woff');
}

@font-face {
	font-family: 'Merriweather';
	font-style: normal;
	src: url(${merriweatherRegular2}) format('woff2'),
	url(${merriweatherRegular}) format('woff');
}

::selection {
	background: ${cssVar('--background-normal-alt')};
}
body {
	color: ${cssVar('--foreground-normal')};
	background-color: ${cssVar('--background-input')};
	margin: 20px;
	font-family: ${cssVar('--family-sans-serif')};
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
	-moz-osx-font-smoothing: grayscale;
}
body.mce-content-readonly {
	color: ${cssVar('--foreground-subdued')};
	background-color: ${cssVar('--background-subdued')};
}
h1, h2, h3, h4, h5, h6 {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	color: ${cssVar('--foreground-normal-alt')};
	font-weight: 700;
	margin-bottom: 0;
}
h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
	margin-top: 0.5em;
}
h1 {
	font-size: 36px;
	line-height: 46px;
	margin-top: 1em;
}
h2 {
	font-size: 24px;
	line-height: 34px;
	margin-top: 1.25em;
}
h3 {
	font-size: 19px;
	line-height: 29px;
	margin-top: 1.25em;
}
h4 {
	font-size: 16px;
	line-height: 26px;
	margin-top: 1.5em;
}
h5 {
	font-size: 14px;
	line-height: 24px;
	margin-top: 2em;
}
h6 {
	font-size: 12px;
	line-height: 22px;
	margin-top: 2em;
}
p {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	margin: 1.5em 0;
}
a {
	color: ${cssVar('--primary-125')};
	text-decoration: none;
}
ul, ol {
	font-family: ${cssVar(`--family-${font}`)}, serif;
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
	font-family: ${cssVar('--family-monospace')}, monospace;
	background-color: ${cssVar('--background-normal')};
	border-radius: ${cssVar('--border-radius')};
	overflow-wrap: break-word;
}
pre {
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	padding: 1em;
	font-family: ${cssVar('--family-monospace')}, monospace;
	background-color: ${cssVar('--background-normal')};
	border-radius: ${cssVar('--border-radius')};
	overflow: auto;
}
blockquote {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
	border-left: 2px solid ${cssVar('--border-normal')};
	padding-left: 1em;
	margin-left: 0px;
}
video,
iframe,
img {
	max-width: 100%;
	border-radius: ${cssVar('--border-radius')};
	height: auto;
}
hr {
	background-color: ${cssVar('--border-normal')};
	height: 1px;
	border: none;
	margin-top: 2em;
	margin-bottom: 2em;
}
table {
	border-collapse: collapse;
	font-size: 15px;
	line-height: 24px;
	font-weight: 500;
}
table th,
table td {
	border: 1px solid ${cssVar('--border-normal')};
	padding: 0.4rem;
}
figure {
	display: table;
	margin: 1rem auto;
}
figure figcaption {
	color: #999;
	display: block;
	margin-top: 0.25rem;
	text-align: center;
}`;
}
