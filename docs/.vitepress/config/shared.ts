import { defineConfig, DefaultTheme, HeadConfig } from 'vitepress';

export const searchConfig: DefaultTheme.Config['search'] = {
	provider: 'algolia',
	options: {
		appId: 'T5BDNEU205',
		apiKey: '76eb519cf1a4492777a6991f75c5252b',
		indexName: 'directus',
	}
};

export const headConfig: HeadConfig[] = [
	[
		'script',
		{
			type: 'text/javascript',
			async: 'true',
			defer: 'true',
			src: 'https://js-na1.hs-scripts.com/20534155.js',
		},
	],
	[
		'script',
		{
			type: 'text/javascript',
			async: 'true',
			src: 'https://ws.zoominfo.com/pixel/636535e8d10f825332bbd795',
			'referrer-policy': 'unsafe-url',
		},
	],
	[
		'script',
		{
			type: 'text/javascript',
			async: 'true',
			defer: 'false',
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
		gtag('config', 'UA-24637628-7');`,
	],
	[
		'link',
		{
			rel: 'shortcut icon',
			type: 'image/svg+xml',
			href: '/favicon.svg'
		}
	],
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
];

export const sharedConfig = defineConfig({
	ignoreDeadLinks: true,
	lastUpdated: true,
	head: headConfig,
	markdown: {
		theme: {
			light: 'github-light',
			dark: 'github-dark',
		},
		toc: {
			level: [2],
		},
	},
	themeConfig: {
		siteTitle: false,
		logo: {
			light: '/logo-light.svg',
			dark: '/logo-dark.svg',
		},
		search: searchConfig,
		editLink: {
			pattern: 'https://github.com/directus/directus/edit/main/docs/:path',
		},
	},
});
