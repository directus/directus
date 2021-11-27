<template>
	<div class="dark-mode-widget">
		<input type="checkbox" id="theme-toggle" @click="toggleDarkTheme" />
		<label for="theme-toggle"><span></span></label>
	</div>
</template>

<script>
export default {
	mounted() {
	  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
		  this.toggle(e.matches)
	  });
	  this.$nextTick(() => {
	  	this.toggle(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
		})
	},
	methods: {
		toggle(on) {
			if (on) {
		  	document.documentElement.classList.add('dark-mode');
		  	document.getElementById('theme-toggle').checked = true;
			} else {
		  	document.documentElement.classList.remove('dark-mode');
		  	document.getElementById('theme-toggle').checked = false;
			}
		},
		toggleDarkTheme(e) {
			this.toggle(e.target.checked)
		},
	}
};
</script>

<style>
html.dark-mode, html.dark-mode body {
	color: #b3c4cc;
	background: #263238;
}
html.dark-mode h1, html.dark-mode h2, html.dark-mode h3 {
		color: #cfd8dc;
}

html.dark-mode hr {
	border-top: 2px solid #455a64;
}

html.dark-mode .navbar {
	background-color: #2d3a41;
}

html.dark-mode .sidebar {
	border-right: 1px solid #455a64;
	background: #2e3c43;
}

html.dark-mode th,
html.dark-mode td {
	border-color: #455a64;
}

html.dark-mode tr:nth-child(2n) {
		background: #3a4b53;
}

html.dark-mode p,
html.dark-mode .sidebar-heading,
html.dark-mode a.sidebar-link {
	color: #b3c4cc;
}

html.dark-mode .custom-block.tip,
html.dark-mode div[class*="language-"],
html.dark-mode .theme-default-content code {
	background-color: #2d3a41;
	color: #b3c4cc;
}

html.dark-mode .algolia-search-wrapper {
	filter: invert(1);
}

html.dark-mode .algolia-search-wrapper .algolia-autocomplete .algolia-docsearch-suggestion .algolia-docsearch-suggestion--category-header {
	background: #b32f66;
}

html.dark-mode .algolia-search-wrapper .algolia-autocomplete .algolia-docsearch-suggestion--highlight {
	color: #b32f66;
}

html.dark-mode .custom-block.success {
	background-color: #294a4b;
}

html.dark-mode .custom-block.warning {
		background-color: #43483c;
}

html.dark-mode .custom-block.danger {
	background-color: #403e47;
}

.dark-mode-widget {
	position: fixed;
	bottom: 1rem;
	left: 1rem;
	z-index: 10;
}
#theme-toggle {
	display: none;
}
#theme-toggle + label {
	font-size: 1rem;
	display: flex;
	width: 4em;
	border-radius: 2em;
	background-size: auto 8em;
	background-position: bottom;
	background-image: linear-gradient(180deg, #021037 0%, #2e3c43 19%, #4184B1 66%, #62E7F7 100%);
	transition: .2s;
	border: 0.125em solid #eef3f6;
	overflow: hidden;
}
#theme-toggle + label span {
	background: #fffad8;
	border-radius: 50%;
	height: 2em;
	width: 2em;
	transform: translateX(-.125em) scale(.65);
	transition: .2s;
	cursor: pointer;
	box-shadow: 0 0 .25em .0625em #fbee8d, 0 0 2em 0 #FFEB3B, inset -.25em -.25em 0 0 #fbee8e, inset -.3125em -.3125em 0 .625em #fff5b2;
	margin-top: -.125em;
}
#theme-toggle:checked {
	font-size: 10rem;
}
#theme-toggle:checked + label {
	background-position: top;
	border-color: #5983a6;
}
#theme-toggle:checked + label span {
	background: transparent;
	transform: translateX(calc(100%)) scale(.65);
	box-shadow: inset -.1875em -.1875em 0 0 #fbe7ef, inset -.5625em -.5625em 0 0 #fffff7;
}
</style>
