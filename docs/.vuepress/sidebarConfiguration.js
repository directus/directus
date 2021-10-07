const section = '/configuration/';
module.exports = {
	title: 'Configuration',
	children: [
		{
			type: 'page',
			path: section + 'introduction',
			title: 'Introduction',
		},
		{
			type: 'group',
			title: 'Installation',
			children: [
				{
					type: 'page',
					path: section + 'installation/cli',
					title: 'Command Line Interface (CLI)',
				},
				{
					type: 'page',
					path: section + 'installation/docker',
					title: 'Docker',
				},

				{
					type: 'page',
					path: section + 'installation/manual',
					title: 'Manually',
				},
				{
					type: 'divider',
				},
				{
					type: 'page',
					path: section + 'installation/ubuntu',
					title: 'Generic Ubuntu',
				},
				{
					type: 'page',
					path: section + 'installation/iis',
					title: 'IIS',
				},
				{
					type: 'page',
					path: section + 'installation/aws',
					title: 'Amazon AWS',
				},
				{
					type: 'page',
					path: section + 'installation/digitalocean-app-platform',
					title: 'Digital Ocean App Platform',
				},
				{
					type: 'page',
					path: section + 'installation/plesk',
					title: 'Shared Hosting with Plesk',
				},

				{
					type: 'divider',
				},
				{
					type: 'page',
					path: 'https://marketplace.digitalocean.com/apps/directus?action=deploy&refcode=4c0b6062c16e',
					title: 'OneClick Digital Ocean',
				},
				{
					type: 'page',
					path: 'https://heroku.com/deploy?template=https://github.com/directus-community/heroku-template',
					title: 'OneClick Heroku',
				},
				{
					type: 'page',
					path: 'https://console.platform.sh/projects/create-project?template=https%3A%2F%2Fraw.githubusercontent.com%2Fplatformsh%2Ftemplate-builder%2Fmaster%2Ftemplates%2Fdirectus%2F.platform.template.yaml',
					title: 'OneClick Platform.sh',
				},
				{
					type: 'page',
					path: 'https://deploy.zeet.co/?url=https://github.com/directus-community/heroku-template',
					title: 'OneClick Zeet',
				},
				{
					type: 'divider',
				},
				{
					type: 'page',
					path: 'http://directus.cloud/',
					title: 'Directus Cloud',
				},
				{
					type: 'page',
					path: 'https://directus.io/on-demand-cloud/',
					title: 'On-Demand Cloud',
				},

				{
					type: 'page',
					path: 'https://directus.io/enterprise-cloud/',
					title: 'Enterprise Cloud',
				},
				{
					type: 'divider',
				},
			],
		},

		{
			type: 'page',
			path: '/reference/config-files',
			title: 'Config Files',
			children: [
				{
					type: 'page',
					path: '/reference/environment-variables',
					title: 'Environment Variables',
				},
				{
					type: 'page',
					path: '/reference/environment-variables#rate-limiting',
					title: 'Rate Limiting',
				},
				{
					type: 'page',
					path: '/reference/environment-variables#file-storage',
					title: 'File Storage',
				},
				{
					type: 'page',
					path: '/reference/environment-variables#cache',
					title: 'Cacheing',
				},
			],
		},
		{
			type: 'group',
			title: 'Project Settings',
			children: [
				{
					type: 'page',
					path: '/configuration/assets-transformations',
					title: 'Assets Transformations',
				},
			],
		},

		{
			type: 'group',
			title: 'Data Model',
			children: [
				{
					type: 'page',
					path: '/concepts/databases',
					title: 'Projects: Databases',
				},
				{
					type: 'page',
					path: '/concepts/collections',
					title: 'Collections: Tables',
				},

				{
					type: 'page',
					path: '/concepts/fields',
					title: 'Fields: Columns',
				},

				{
					type: 'page',
					path: '/concepts/types',
					title: 'Types: Datatypes',
				},
				{
					type: 'page',
					path: '/concepts/items',
					title: 'Items: Records',
				},
				{
					type: 'page',
					path: '/concepts/relationships',
					title: 'Relationships',
				},

				{
					type: 'page',
					path: '/reference/field-transforms',
					title: 'Field Transforms',
				},
			],
		},
		{
			type: 'group',
			title: 'Users, Permissions & Roles',
			children: [
				{
					type: 'page',
					path: '/guides/users',
					title: 'Users',
				},
				{
					type: 'page',
					path: '/guides/roles',
					title: 'Roles',
				},
				{
					type: 'page',
					path: '/guides/permissions',
					title: 'Permissions',
				},
			],
		},

		{
			type: 'page',
			path: '/guides/presets',
			title: 'Presets',
		},

		{
			type: 'page',
			path: '/guides/webhooks',
			title: 'Webhooks',
		},
		{
			type: 'page',
			path: '/concepts/translations',
			title: 'Translations',
		},
		{
			type: 'page',
			path: '/reference/filter-rules',
			title: 'Filter Rules',
		},
		{
			type: 'page',
			path: '/configuration/security',
			title: 'Security',
		},
	],
};
