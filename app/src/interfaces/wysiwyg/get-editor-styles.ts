function cssVar(name: string) {
	return getComputedStyle(document.body).getPropertyValue(name);
}

export default function getEditorStyles(font: 'sans-serif' | 'serif' | 'monospace') {
	return `
body {
	color: ${cssVar('--foreground-normal')};
	background-color: ${cssVar('--background-page')};
	margin: 20px;
	font-family: 'Roboto', sans-serif;
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
	-moz-osx-font-smoothing: grayscale;
}
body.mce-content-readonly {
	color: ${cssVar('--foreground-subdued')};
	background-color: ${cssVar('--background-subdued')};
}
h1 {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 44px;
	line-height: 52px;
	font-weight: 300;
	margin-bottom: 0;
}
h2 {
	font-size: 34px;
	line-height: 38px;
	font-weight: 600;
	margin-top: 60px;
	margin-bottom: 0;
}
h3 {
	font-size: 26px;
	line-height: 31px;
	font-weight: 600;
	margin-top: 40px;
	margin-bottom: 0;
}
h4 {
	font-size: 22px;
	line-height: 28px;
	font-weight: 600;
	margin-top: 40px;
	margin-bottom: 0;
}
h5 {
	font-size: 18px;
	line-height: 26px;
	font-weight: 600;
	margin-top: 40px;
	margin-bottom: 0;
}
h6 {
	font-size: 16px;
	line-height: 24px;
	font-weight: 600;
	margin-top: 40px;
	margin-bottom: 0;
}
p {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 16px;
	line-height: 32px;
	margin-top: 20px;
	margin-bottom: 20px;
}
a {
	color: #546e7a;
}
ul, ol {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 18px;
	line-height: 34px;
	margin: 24px 0;
}
ul ul,
	ol ol,
		ul ol,
			ol ul {
	margin: 0;
}
b, strong {
	font-weight: 600;
}
code {
	font-size: 18px;
	line-height: 34px;
	padding: 2px 4px;
	font-family: ${cssVar('--family-monospace')}, monospace;
	background-color: #eceff1;
	border-radius: 4px;
	overflow-wrap: break-word;
}
pre {
	font-size: 18px;
	line-height: 24px;
	padding: 20px;
	font-family: ${cssVar('--family-monospace')}, monospace;
	background-color: #eceff1;
	border-radius: 4px;
	overflow: auto;
}
blockquote {
	font-family: ${cssVar(`--family-${font}`)}, serif;
	font-size: 18px;
	line-height: 34px;
	border-left: 2px solid #546e7a;
	padding-left: 10px;
	margin-left: -10px;
	font-style: italic;
}
video,
	iframe,
	img {
	max-width: 100%;
	border-radius: 4px;
	height: auto;
}
hr {
	border: 0;
	margin-top: 52px;
	margin-bottom: 56px;
	text-align: center;
}
hr:after {
	content: "...";
	font-size: 28px;
	letter-spacing: 16px;
	line-height: 0;
}
table {
	border-collapse: collapse;
}
table th,
	table td {
	border: 1px solid #cfd8dc;
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
