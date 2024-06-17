import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitepress';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';
import sidebar from './data/sidebar.js';
import { useMaterialIconsNoTranslate } from './lib/markdown-plugins/material-icons-no-translate.js';

export default defineConfig({
	base: '/',
	lang: 'en-US',
	title: 'Directus Docs',
	description: 'Explore our resources and powerful data engine to build your projects confidently.',
	ignoreDeadLinks: true,
	markdown: {
		theme: {
			light: 'github-light',
			dark: 'github-dark',
		},
		toc: {
			level: [2],
		},
		config(md) {
			md.use(tabsMarkdownPlugin);
			useMaterialIconsNoTranslate(md);
		},
	},
	head: [
		[
			'script',
			{
				type: 'text/javascript',
				async: '',
				defer: '',
				src: 'https://js-na1.hs-scripts.com/20534155.js',
			},
		],
		[
			'script',
			{
				type: 'text/javascript',
				async: '',
				src: 'https://ws.zoominfo.com/pixel/636535e8d10f825332bbd795',
				'referrer-policy': 'unsafe-url',
			},
		],
		[
			'script',
			{
				type: 'text/javascript',
				async: '',
				src: 'https://www.googletagmanager.com/gtag/js?id=UA-24637628-7',
			},
		],
		[
			'script',
			{},
			`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
			new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
			j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
			'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
			})(window,document,'script','dataLayer','GTM-PTLT3GH');`,
		],
		[
			'script',
			{},
			`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'UA-24637628-7');
			`,
		],
		['link', { rel: 'shortcut icon', type: 'image/svg+xml', href: '/favicon.svg' }],
		[
			'link',
			{
				rel: 'apple-touch-icon',
				type: 'image/svg+xml',
				sizes: '180x180',
				href: '/favicon.svg',
			},
		],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/svg+xml',
				sizes: '32x32',
				href: '/favicon.svg',
			},
		],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/svg+xml',
				sizes: '16x16',
				href: '/favicon.svg',
			},
		],
		[
			'link',
			{
				rel: 'preconnect',
				href: 'https://fonts.googleapis.com',
				crossorigin: 'crossorigin',
			},
		],
		[
			'link',
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossorigin: 'crossorigin',
			},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
			},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
			},
		],
	],
	lastUpdated: true,
	themeConfig: {
		siteTitle: false,
		logo: {
			light: '/logo-light.svg',
			dark: '/logo-dark.svg',
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/directus/directus' },
			{ icon: 'twitter', link: 'https://twitter.com/directus' },
			{ icon: 'discord', link: 'https://directus.chat' },
		],
		nav: [
			{ text: 'Website', link: 'https://directus.io/' },
			{ text: 'Cloud Dashboard', link: 'https://directus.cloud/' },
			{ text: 'Directus TV', link: 'https://directus.io/tv' },
		],
		algolia: {
			appId: 'T5BDNEU205',
			apiKey: '76eb519cf1a4492777a6991f75c5252b',
			indexName: 'directus',
		},
		sidebar,
		editLink: {
			pattern: ({ filePath }) => {
				if (filePath.includes('blog/')) {
					return '/blog/guest-author';
				} else {
					return `https://github.com/directus/directus/edit/main/docs/${filePath}`;
				}
			},
		},
	},
	sitemap: {
		hostname: 'https://docs.directus.io',
	},
	transformPageData(pageData) {
		switch (pageData.frontmatter['type']) {
			case 'blog-post':
				pageData.title = pageData.params?.['title'];
				pageData.description = pageData.params?.['summary'];
				pageData.frontmatter['head'] = setOGImage(pageData.params?.['image']);
				break;
			case 'guides-index':
				pageData.title = pageData.params?.['title'];
				pageData.description = pageData.params?.['summary'];
				break;
			default:
				pageData.frontmatter['head'] = setOGImage('246e2f8a-98cd-4d54-9907-8927d1b9fb77');
		}

		function setOGImage(asset?: string) {
			if (!asset) return [];
			return [
				['meta', { name: 'og:image', content: `https://marketing.directus.app/assets/${asset}?key=card` }],
				['meta', { name: 'twitter:image', content: `https://marketing.directus.app/assets/${asset}?key=card` }],
				['meta', { name: 'twitter:card', content: 'summary_large_image' }],
			];
		}
	},
	vite: {
		resolve: {
			alias: [
				{
					find: '@',
					replacement: fileURLToPath(new URL('./', import.meta.url)),
				},
				{
					find: /^.*\/VPSidebarItem\.vue$/,
					replacement: fileURLToPath(new URL('./theme/components/VPSidebarItem.vue', import.meta.url)),
				},
			],
		},
	},
});
