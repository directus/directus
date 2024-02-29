export const gettingStarted = [
	{ display: 'Quickstart Guide', path: '/getting-started/quickstart' },
	{ display: 'Self-Hosted Installation', path: '/self-hosted/quickstart' },
];

export const sections = {
	sdk: {
		title: 'SDK Guides',
		summary: 'Learn how to leverage our composable TypeScript SDK in your projects.',
		cols: 1,
		blocks: [
			{
				title: 'Getting Started',
				items: [
					{ display: 'SDK Quickstart', path: '/guides/sdk/getting-started' },
					{ display: 'SDK Authentication', path: '/guides/sdk/authentication' },
					{ display: 'SDK Types', path: '/guides/sdk/types' },
				],
			},
			{
				title: 'From the Blog',
				items: [
					{
						display: 'Advanced Filtering',
						path: '/blog/advanced-filtering-dates-aggregation-and-grouping-and-combining-filters',
					},
				],
			},
		],
	},
	frameworks: {
		title: 'Framework Guides',
		summary: 'Combine Directus with your favorite framework to create dynamic and efficient web applications.',
		cols: 2,
		blocks: [
			{
				title: 'Next.js',
				items: [
					{ display: 'Get Started with Next.js', path: '/guides/headless-cms/build-static-website/next' },
					{ display: 'Set Up Live Preview With Next.js', path: '/guides/headless-cms/live-preview/nextjs' },
				],
			},
			{
				title: 'Nuxt',
				items: [
					{ display: 'Get Started with Nuxt', path: '/guides/headless-cms/build-static-website/nuxt-3' },
					{ display: 'Set Up Live Preview With Nuxt', path: '/guides/headless-cms/live-preview/nuxt-3' },
				],
			},
			{
				title: 'From the Blog',
				items: [
					{ display: 'Get Started with SvelteKit', path: '/blog/getting-started-directus-sveltekit' },
					{ display: 'Get Started with Astro', path: '/blog/getting-started-directus-astro' },
					{ display: 'Get Started with Remix', path: '/blog/getting-started-with-directus-and-remix' },
					{ display: 'Get Started with Eleventy', path: '/blog/getting-started-directus-and-eleventy-11ty-3' },
					{ display: 'Get Started with SolidStart', path: '/blog/getting-started-solidstart' },
					{ display: 'Get Started with Gatsby', path: '/blog/getting-started-with-directus-and-gatsby' },
				],
			},
		],
	},
	'use-cases': {
		title: 'Use Case Guides',
		summary: 'Use Directus features to build various use cases in one project.',
		cols: 1,
		blocks: [
			{
				title: 'Headless CMS',
				items: [
					{ display: 'Build Content Approval Workflows', path: '/guides/headless-cms/approval-workflows' },
					{ display: 'Implement Content Versioning', path: '/guides/headless-cms/content-versioning' },
					{ display: 'Create Re-Usable Page Components', path: '/guides/headless-cms/reusable-components' },
					{ display: 'Create Content Translations', path: '/guides/headless-cms/content-translations' },
					{
						display: 'Schedule Future Content',
						paths: [
							{ label: 'Static Sites', path: '/guides/headless-cms/schedule-content/static-sites' },
							{ label: 'Dynamic Sites', path: '/guides/headless-cms/schedule-content/dynamic-sites' },
						],
					},
					{
						display: 'Trigger Site Builds',
						paths: [
							{ label: 'Netlify', path: '/guides/headless-cms/trigger-static-builds/netlify' },
							{ label: 'Vercel', path: '/guides/headless-cms/trigger-static-builds/vercel' },
						],
					},
				],
			},
			{
				title: 'From the Blog',
				items: [
					{
						display: 'SEO Tips & Tricks',
						path: '/blog/directus-seo-tips-tricks',
					},
				],
			},
		],
	},
	'real-time': {
		title: 'Realtime Guides',
		summary: 'Access real-time data in your project with WebSockets, backed by your database.',
		cols: 1,
		blocks: [
			{
				title: 'Concepts',
				items: [
					{
						display: 'Getting Started With Realtime',
						paths: [
							{ label: 'WebSockets', path: '/guides/real-time/getting-started/websockets' },
							{ label: 'GraphQL', path: '/guides/real-time/getting-started/graphql' },
						],
					},
					{ display: 'Authentication', path: '/guides/real-time/authentication' },
					{ display: 'Operations', path: '/guides/real-time/operations' },
					{
						display: 'Subscriptions',
						paths: [
							{ label: 'WebSockets', path: '/guides/real-time/subscriptions/websockets' },
							{ label: 'GraphQL', path: '/guides/real-time/subscriptions/graphql' },
						],
					},
				],
			},
			{
				title: 'Projects',
				items: [
					{
						display: 'Build a Multi-User Chat',
						paths: [
							{ label: 'JavaScript', path: '/guides/real-time/chat/javascript' },
							{ label: 'React', path: '/guides/real-time/chat/react' },
							{ label: 'Vue', path: '/guides/real-time/chat/vue' },
						],
					},
					{ display: 'Build a Live Poll Result', path: '/guides/real-time/live-poll' },
				],
			},
		],
	},
	extensions: {
		title: 'Extensions Guides',
		summary: 'Learn how to extend Directus with various custom extension types.',
		cols: 2,
		blocks: [
			{
				title: 'Displays',
				items: [
					{ display: 'Use Displays To Format Date As An Age', path: '/guides/extensions/displays-date-to-age' },
					{
						display: 'Use Displays To Summarize Relational Items',
						path: '/guides/extensions/displays-relational-summaries',
					},
				],
			},
			{
				title: 'Endpoints',
				items: [
					{
						display: 'Create a Public API Proxy',
						path: '/guides/extensions/endpoints-api-proxy',
					},
					{
						display: 'Create an Authenticated API Proxy (Twilio)',
						path: '/guides/extensions/endpoints-api-proxy-twilio',
					},
					{
						display: 'Create a Permissions-Based API Proxy (Stripe)',
						path: '/guides/extensions/endpoints-privileged-endpoint-stripe',
					},
				],
			},
			{
				title: 'Email Templates',
				items: [{ display: 'Create An Email Template With Dynamic Values', path: '/guides/extensions/email-template' }],
			},
			{
				title: 'Hooks',
				items: [
					{ display: 'Use Hooks to Create Stripe Customers', path: '/guides/extensions/hooks-add-stripe-customer' },
					{
						display: 'Use Hooks to Validate Phone Numbers With Twilio',
						path: '/guides/extensions/hooks-validate-number-twilio',
					},
				],
			},
			{
				title: 'Interfaces',
				items: [
					{
						display: 'Create A Radio Selector With Icons, SVG, or Images',
						path: '/guides/extensions/interfaces-radio-selector-icons',
					},
					{
						display: 'Create A Searchable Dropdown With Items From Another Collection',
						path: '/guides/extensions/interfaces-relational-dropdown',
					},
				],
			},
			{
				title: 'Layouts',
				items: [{ display: 'Create Your First Layout Extension', path: '/guides/extensions/layouts-getting-started' }],
			},
			{
				title: 'Operations',
				items: [
					{
						display: 'Exposing an npm Package as a Custom Operation',
						path: '/guides/extensions/operations-npm-package',
					},
					{
						display: 'Use Custom Operations to Send Bulk Email With SendGrid',
						path: '/guides/extensions/operations-bulk-email-sendgrid',
					},
					{
						display: 'Use Custom Operations to Add an Item Comment',
						path: '/guides/extensions/operations-add-record-comments',
					},
					{
						display: 'Use Custom Operations to Send SMS Notifications With Twilio',
						path: '/guides/extensions/operations-send-sms-twilio',
					},
				],
			},
			{
				title: 'Panels',
				items: [
					{
						display: 'Create An Interactive Panel To Create Items',
						path: '/guides/extensions/panels-create-items',
					},
					{
						display: 'Create A Panel To Display External API Data With Vonage',
						path: '/guides/extensions/panels-display-data-vonage',
					},
					{
						display: 'Create An Interactive Panel To Send SMS With Twilio',
						path: '/guides/extensions/panels-send-sms-twilio',
					},
				],
			},
			{
				title: 'Modules',
				items: [
					{
						display: 'Create a Custom Landing Page Module',
						path: '/guides/extensions/modules-build-landing-page',
					},
					{
						display: 'Use Native Layout Features In Your Modules',
						path: '/guides/extensions/modules-native-layout-features',
					},
				],
			},
			{
				title: 'From the Blog',
				items: [
					{
						display: 'Using Hooks To Monitor & Error Track With Sentry',
						path: '/blog/hooks-monitoring-error-tracking-sentry',
					},
				],
			},
		],
	},
	administration: {
		title: 'Administration Guides',
		summary: 'Learn key skills needed to successfully administer Directus in a real-world context.',
		cols: 1,
		blocks: [
			{
				title: 'Migrations',
				items: [
					{
						display: 'Migrate Your Data Model',
						paths: [
							{ label: 'Node.js', path: '/guides/migration/node' },
							{ label: 'Hoppscotch', path: '/guides/migration/hoppscotch' },
						],
					},
				],
			},
			{
				title: 'From the Blog',
				items: [
					{
						display: 'Configuring Okta SSO',
						path: '/blog/configuring-okta-sso',
					},
				],
			},
		],
	},
};
